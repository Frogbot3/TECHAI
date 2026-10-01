import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie, CUSTOMER_SESSION_COOKIE, ADMIN_SESSION_COOKIE } from "@/lib/auth";
import { toClientOrder } from "@/lib/serializers";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { CartItem } from "@/lib/types";
import { randomUUID } from "crypto";

const createOrderId = () => `TECHAI-ORD-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
const createTrackingNumber = () => `TA-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;

const buildProductQuery = (id: string) => {
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
    return { $or: [{ productId: id }, { _id: id }] };
  }
  return { productId: id };
};

const normalizeProductTitle = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export async function POST(req: Request) {
  let decrementedProducts: { id: string; quantity: number }[] = [];

  try {
    const body = await req.json();
    const {
      items,
      shippingAddress,
      paymentMethod = "COD",
      discountCode,
      deliveryType = "standard",
      checkoutId,
    } = body;

    if (!items || items.length === 0 || !shippingAddress) {
      return NextResponse.json({ success: false, message: "Cart items and delivery address are required." }, { status: 400 });
    }

    if (!shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      return NextResponse.json({ success: false, message: "Complete delivery address is required." }, { status: 400 });
    }

    if (!["UPI", "Card", "NetBanking", "COD"].includes(paymentMethod)) {
      return NextResponse.json({ success: false, message: "Unsupported payment method." }, { status: 400 });
    }

    if (!["standard", "express"].includes(deliveryType)) {
      return NextResponse.json({ success: false, message: "Unsupported delivery option." }, { status: 400 });
    }

    const session = await getSessionFromCookie();
    const safeCheckoutId = typeof checkoutId === "string" ? checkoutId.trim().slice(0, 128) : "";
    const customerName = session?.name || shippingAddress.fullName;
    const customerEmail = session?.email || shippingAddress.email || "";
    const customerPhone = shippingAddress.phone || session?.phone || "";

    await connectToDatabase();

    // The checkout key makes a refresh or a repeated request return the same pending order.
    if (safeCheckoutId) {
      const ownerConditions = session?.id
        ? { customerId: session.id }
        : customerEmail
        ? { userEmail: customerEmail }
        : { userPhone: customerPhone };
      const existingOrder = await Order.findOne({ checkoutId: safeCheckoutId, ...ownerConditions });
      if (existingOrder) {
        return NextResponse.json({
          success: true,
          message: "Existing checkout order resumed.",
          order: toClientOrder(existingOrder),
        });
      }
    }

    const requestedItems = new Map<string, { quantity: number; title?: string; selectedColor?: string; selectedSize?: string }>();
    for (const item of items) {
      const productId = String(item?.product?.id || item?.productId || item?.id || "").trim();
      const productTitle = typeof item?.product?.title === "string" ? item.product.title.trim() : "";
      const quantity = Number(item?.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return NextResponse.json({ success: false, message: "Invalid cart item or quantity." }, { status: 400 });
      }
      const previous = requestedItems.get(productId);
      requestedItems.set(productId, {
        quantity: (previous?.quantity || 0) + quantity,
        title: previous?.title || productTitle,
        selectedColor: item?.selectedColor || previous?.selectedColor,
        selectedSize: item?.selectedSize || previous?.selectedSize,
      });
    }

    const trustedItems: CartItem[] = [];
    for (const [productId, requested] of requestedItems) {
      // A cached cart can contain an older productId. Resolve that legacy case
      // by exact title, while still taking every price and stock value from MongoDB.
      let product = await Product.findOne(buildProductQuery(productId));
      if (!product && requested.title) {
        product = await Product.findOne({ title: requested.title });
      }
      if (!product && requested.title) {
        const normalizedTitle = normalizeProductTitle(requested.title);
        const candidates = await Product.find({}, { title: 1 });
        const matchingCandidate = candidates.find(
          (candidate) => normalizeProductTitle(candidate.title) === normalizedTitle
        );
        product = matchingCandidate ? await Product.findById(matchingCandidate._id) : null;
      }
      if (!product) {
        const label = requested.title || productId;
        return NextResponse.json(
          { success: false, message: `${label.slice(0, 100)} is no longer available in our catalog. Remove it and add the current product again.` },
          { status: 409 }
        );
      }
      if (Number(product.stock) < requested.quantity) {
        return NextResponse.json(
          { success: false, message: `${product.title} has only ${product.stock} unit(s) left.` },
          { status: 409 }
        );
      }

      trustedItems.push({
        product: {
          id: product.productId,
          title: product.title,
          brand: product.brand,
          category: product.category,
          price: Number(product.price),
          originalPrice: Number(product.originalPrice),
          discountPercent: Number(product.discountPercent || 0),
          rating: Number(product.rating || 0),
          reviewCount: Number(product.reviewCount || 0),
          image: product.image,
          images: product.images,
          originalImage: product.originalImage,
          normalizedImage: product.normalizedImage,
          stock: Number(product.stock),
          description: product.description,
          features: product.features || [],
          specs: product.specs instanceof Map ? Object.fromEntries(product.specs.entries()) : product.specs || {},
        },
        quantity: requested.quantity,
        selectedColor: requested.selectedColor,
        selectedSize: requested.selectedSize,
      });
    }

    const subtotal = trustedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discountAmount = discountCode === "TECHAI10" ? Math.round(subtotal * 0.1) : 0;
    const shippingFee = deliveryType === "express" ? 99 : subtotal > 499 ? 0 : 49;
    const finalAmount = Math.max(0, subtotal - discountAmount + shippingFee);
    if (finalAmount <= 0) {
      return NextResponse.json({ success: false, message: "The order amount must be greater than zero." }, { status: 400 });
    }

    // Reserve stock using the trusted database quantity. Roll back reservations if creation fails.
    for (const item of trustedItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { $and: [buildProductQuery(item.product.id), { stock: { $gte: item.quantity } }] },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updatedProduct) {
        throw new Error(`${item.product.title} is no longer available in the requested quantity.`);
      }
      decrementedProducts.push({ id: item.product.id, quantity: item.quantity });
    }

    const orderId = createOrderId();
    const trackingNumber = createTrackingNumber();
    const formattedItems = trustedItems.map((item: CartItem) => ({
      productId: item.product.id,
      title: item.product.title,
      brand: item.product.brand,
      category: item.product.category,
      price: item.product.price,
      originalPrice: item.product.originalPrice,
      quantity: item.quantity,
      image: item.product.image,
      normalizedImage: item.product.normalizedImage,
      selectedColor: item.selectedColor || "",
      selectedSize: item.selectedSize || "",
    }));

    const newOrder = await Order.create({
      orderId,
      customerId: session?.id || "",
      userPhone: customerPhone,
      userEmail: customerEmail,
      userName: customerName,
      items: formattedItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: customerPhone,
        email: customerEmail,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        landmark: shippingAddress.landmark || "",
      },
      checkoutId: safeCheckoutId,
      totalAmount: subtotal,
      discountAmount,
      shippingFee,
      finalAmount,
      paymentMethod,
      paymentStatus: "Pending",
      paymentDetails: {
        provider: paymentMethod === "COD" ? "COD" : "Razorpay",
        gatewayStatus: paymentMethod === "COD" ? "Cash collection pending" : "Awaiting Razorpay checkout",
        paymentNote: paymentMethod === "COD" ? "Cash on delivery" : "Payment must be verified by Razorpay",
      },
      status: "Placed",
      trackingNumber,
      courierName: "Tech AI Logistics",
      estimatedDelivery: "3-5 business days",
      statusHistory: [
        {
          status: "Placed",
          timestamp: new Date(),
          note: `Order ${orderId} created and awaiting payment confirmation.`,
        },
      ],
    });

    // Save address to user profile
    if (session?.id || customerEmail || customerPhone) {
      const userQuery = session?.id
        ? { _id: session.id }
        : customerEmail
        ? { email: { $regex: `^${customerEmail}$`, $options: "i" } }
        : { phone: customerPhone };

      await User.findOneAndUpdate(
        userQuery,
        {
          $set: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            lastLoginAt: new Date(),
          },
          $addToSet: { addresses: shippingAddress },
        },
        { upsert: false }
      ).catch(() => null);
    }

    decrementedProducts = [];
    return NextResponse.json({
      success: true,
      message: "Order successfully saved to MongoDB.",
      order: toClientOrder(newOrder),
    });
  } catch (error) {
    for (const product of decrementedProducts) {
      await Product.findOneAndUpdate(buildProductQuery(product.id), { $inc: { stock: product.quantity } }).catch(() => null);
    }
    console.error("Order creation POST error:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const customerId = searchParams.get("customerId");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") || 200)));

    await connectToDatabase();

    // 1. Check server-side cookies for customer or admin session
    const customerSession = await getSessionFromCookie(CUSTOMER_SESSION_COOKIE);
    const adminSession = await getSessionFromCookie(ADMIN_SESSION_COOKIE);

    // If an authenticated admin is making this request, allow full access or admin query
    if (adminSession?.role === "admin") {
      let filter: any = {};
      if (query) {
        filter = {
          $or: [
            { orderId: { $regex: query, $options: "i" } },
            { userPhone: { $regex: query, $options: "i" } },
            { userEmail: { $regex: query, $options: "i" } },
            { trackingNumber: { $regex: query, $options: "i" } },
            { userName: { $regex: query, $options: "i" } },
          ],
        };
      } else if (customerId || email || phone) {
        const orConditions: any[] = [];
        if (customerId) orConditions.push({ customerId });
        if (email) orConditions.push({ userEmail: { $regex: `^${email}$`, $options: "i" } }, { "shippingAddress.email": { $regex: `^${email}$`, $options: "i" } });
        if (phone) orConditions.push({ userPhone: phone }, { "shippingAddress.phone": phone });
        filter = { $or: orConditions };
      }
      const orders = await Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
      return NextResponse.json({ success: true, count: orders.length, orders: orders.map(toClientOrder) });
    }

    // 2. Identify active customer (either via verified session cookie or validated params)
    const activeCustomerId = customerSession?.id || customerId;
    const activeEmail = customerSession?.email || email;
    const activePhone = customerSession?.phone || phone;

    // Build ownership filter conditions for this individual customer
    const userConditions: any[] = [];
    if (activeCustomerId) {
      userConditions.push({ customerId: activeCustomerId });
    }
    if (activeEmail && activeEmail.trim()) {
      const cleanEmail = activeEmail.trim();
      userConditions.push(
        { userEmail: { $regex: `^${cleanEmail}$`, $options: "i" } },
        { "shippingAddress.email": { $regex: `^${cleanEmail}$`, $options: "i" } }
      );
    }
    if (activePhone && activePhone.trim()) {
      const cleanPhone = activePhone.trim();
      userConditions.push(
        { userPhone: cleanPhone },
        { "shippingAddress.phone": cleanPhone }
      );
    }

    // 3. If customer is identified, return ONLY their individual orders
    if (userConditions.length > 0) {
      let filter: any = { $or: userConditions };

      // If they are filtering/searching within their own orders
      if (query && query.trim()) {
        const q = query.trim();
        const searchOr = [
          { orderId: { $regex: q, $options: "i" } },
          { trackingNumber: { $regex: q, $options: "i" } },
          { "items.title": { $regex: q, $options: "i" } },
        ];
        filter = { $and: [{ $or: userConditions }, { $or: searchOr }] };
      }

      const orders = await Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
      return NextResponse.json({ success: true, count: orders.length, orders: orders.map(toClientOrder) });
    }

    // 4. If user is a GUEST (not logged in) with a specific tracking query (e.g. tracking modal)
    if (query && query.trim()) {
      const q = query.trim();
      // Only allow exact or specific Order ID / Tracking Number lookup for guests
      const guestFilter = {
        $or: [
          { orderId: { $regex: `^${q}$`, $options: "i" } },
          { trackingNumber: { $regex: `^${q}$`, $options: "i" } },
        ],
      };
      const orders = await Order.find(guestFilter).sort({ createdAt: -1 }).limit(10);
      return NextResponse.json({ success: true, count: orders.length, orders: orders.map(toClientOrder) });
    }

    // 5. If no customer identity and no specific tracking query, RETURN EMPTY LIST
    // Never expose other customers' orders to the public!
    return NextResponse.json({ success: true, count: 0, orders: [] });
  } catch (error) {
    console.error("GET orders route error:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
