import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import { normalizeCartItem, toClientOrder } from "@/lib/serializers";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { CartItem } from "@/lib/types";

const createOrderId = () => `TECHAI-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
const createTrackingNumber = () => `TA-${Math.floor(10000000 + Math.random() * 90000000)}`;

const buildProductQuery = (id: string) => {
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
    return { $or: [{ productId: id }, { _id: id }] };
  }
  return { productId: id };
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, shippingAddress, totalAmount, discountAmount, shippingFee, finalAmount, paymentMethod, paymentDetails } = body;

    if (!items || items.length === 0 || !shippingAddress) {
      return NextResponse.json({ success: false, message: "Cart items and delivery address are required." }, { status: 400 });
    }

    if (!shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      return NextResponse.json({ success: false, message: "Complete delivery address is required." }, { status: 400 });
    }

    const session = await getSessionFromCookie();
    const normalizedItems = items.map(normalizeCartItem);
    const orderId = createOrderId();
    const trackingNumber = createTrackingNumber();
    const customerName = session?.name || shippingAddress.fullName;
    const customerEmail = session?.email || shippingAddress.email || "";
    const customerPhone = shippingAddress.phone || session?.phone || "";
    const safePaymentDetails = {
      provider: paymentMethod === "COD" ? "COD" : "Manual",
      gatewayStatus: paymentMethod === "COD" ? "Cash collection pending" : "Payment gateway completed",
      transactionId: paymentDetails?.transactionId || `TXN-${Date.now()}`,
      upiId: paymentMethod === "UPI" ? paymentDetails?.upiId || "techai@upi" : "",
      cardLast4: paymentMethod === "Card" ? paymentDetails?.cardLast4 || "8901" : "",
      cardHolder: paymentMethod === "Card" ? paymentDetails?.cardHolder || customerName : "",
      bankName: paymentMethod === "NetBanking" ? paymentDetails?.bankName || "HDFC Bank" : "",
      paymentNote: paymentDetails?.paymentNote || "",
    };

    await connectToDatabase();

    // Check stock safely for all items
    for (const item of normalizedItems) {
      const prodId = item.product.id;
      const product = await Product.findOne(buildProductQuery(prodId));
      if (product && Number(product.stock) < item.quantity) {
        return NextResponse.json(
          { success: false, message: `${product.title} has only ${product.stock} unit(s) left.` },
          { status: 409 }
        );
      }
    }

    // Deduct stock safely
    for (const item of normalizedItems) {
      const prodId = item.product.id;
      await Product.findOneAndUpdate(
        buildProductQuery(prodId),
        { $inc: { stock: -item.quantity } }
      );
    }

    const formattedItems = normalizedItems.map((item: CartItem) => ({
      productId: item.product.id,
      title: item.product.title,
      brand: item.product.brand,
      category: item.product.category,
      price: item.product.price,
      originalPrice: item.product.originalPrice,
      quantity: item.quantity,
      image: item.product.image,
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
      totalAmount: Number(totalAmount || 0),
      discountAmount: Number(discountAmount || 0),
      shippingFee: Number(shippingFee || 0),
      finalAmount: Number(finalAmount || 0),
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      paymentDetails: safePaymentDetails,
      status: "Placed",
      trackingNumber,
      courierName: "Tech AI Logistics",
      estimatedDelivery: "3-5 business days",
      statusHistory: [
        {
          status: "Placed",
          timestamp: new Date(),
          note: `Order ${orderId} placed successfully.`,
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

    return NextResponse.json({
      success: true,
      message: "Order successfully saved to MongoDB.",
      order: toClientOrder(newOrder),
    });
  } catch (error) {
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

    await connectToDatabase();
    let filter: any = {};

    if (customerId || email || phone) {
      const orConditions: any[] = [];
      if (customerId) orConditions.push({ customerId });
      if (email) orConditions.push({ userEmail: { $regex: `^${email}$`, $options: "i" } }, { "shippingAddress.email": { $regex: `^${email}$`, $options: "i" } });
      if (phone) orConditions.push({ userPhone: phone }, { "shippingAddress.phone": phone });
      filter = { $or: orConditions };
    } else if (query) {
      filter = {
        $or: [
          { orderId: { $regex: query, $options: "i" } },
          { userPhone: { $regex: query, $options: "i" } },
          { userEmail: { $regex: query, $options: "i" } },
          { trackingNumber: { $regex: query, $options: "i" } },
          { userName: { $regex: query, $options: "i" } },
        ],
      };
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(500);
    const clientOrders = orders.map(toClientOrder);

    return NextResponse.json({ success: true, count: clientOrders.length, orders: clientOrders });
  } catch (error) {
    console.error("GET orders route error:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
