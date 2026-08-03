import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import { normalizeCartItem, toClientOrder } from "@/lib/serializers";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

const createOrderId = () => `TECHAI-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
const createTrackingNumber = () => `TA-${Math.floor(10000000 + Math.random() * 90000000)}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, shippingAddress, totalAmount, discountAmount, shippingFee, finalAmount, paymentMethod, paymentDetails } = body;

    if (!items || items.length === 0 || !shippingAddress) {
      return NextResponse.json({ success: false, message: "Cart items and delivery address are required." }, { status: 400 });
    }

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
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
      gatewayStatus: paymentMethod === "COD" ? "Cash collection pending" : "Payment gateway pending",
      transactionId: paymentDetails?.transactionId || "",
      upiId: paymentMethod === "UPI" ? paymentDetails?.upiId || "" : "",
      cardLast4: paymentMethod === "Card" ? paymentDetails?.cardLast4 || "" : "",
      cardHolder: paymentMethod === "Card" ? paymentDetails?.cardHolder || "" : "",
      bankName: paymentMethod === "NetBanking" ? paymentDetails?.bankName || "" : "",
      paymentNote: paymentDetails?.paymentNote || "",
    };

    await connectToDatabase();

    for (const item of normalizedItems) {
      const product = await Product.findOne({ $or: [{ productId: item.product.id }, { _id: item.product.id }] });
      if (product && Number(product.stock) < item.quantity) {
        return NextResponse.json(
          { success: false, message: `${product.title} has only ${product.stock} unit(s) left.` },
          { status: 409 }
        );
      }
    }

    for (const item of normalizedItems) {
      await Product.findOneAndUpdate(
        { $or: [{ productId: item.product.id }, { _id: item.product.id }] },
        { $inc: { stock: -item.quantity } }
      );
    }

    const formattedItems = normalizedItems.map((item) => ({
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
      shippingAddress: { ...shippingAddress, email: customerEmail },
      totalAmount: Number(totalAmount || 0),
      discountAmount: Number(discountAmount || 0),
      shippingFee: Number(shippingFee || 0),
      finalAmount: Number(finalAmount || 0),
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "Pending",
      paymentDetails: safePaymentDetails,
      status: "Placed",
      trackingNumber,
      courierName: "Tech AI Logistics",
      estimatedDelivery: "3-5 business days",
      statusHistory: [
        {
          status: "Placed",
          timestamp: new Date(),
          note: `Order ${orderId} was placed and is awaiting confirmation.`,
        },
      ],
    });

    const userFilter = session?.id ? { _id: session.id } : { phone: customerPhone };
    await User.findOneAndUpdate(
      userFilter,
      {
        $set: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          lastLoginAt: new Date(),
        },
        $addToSet: { addresses: shippingAddress },
      },
      { upsert: !session?.id, new: true }
    ).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Order saved to MongoDB.",
      order: toClientOrder(newOrder),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || searchParams.get("phone");

    await connectToDatabase();
    let filter: any = {};
    if (query) {
      filter = {
        $or: [
          { orderId: { $regex: query, $options: "i" } },
          { userPhone: { $regex: query, $options: "i" } },
          { userEmail: { $regex: query, $options: "i" } },
          { trackingNumber: { $regex: query, $options: "i" } },
        ],
      };
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(query ? 25 : 500);
    const clientOrders = orders.map(toClientOrder);

    return NextResponse.json({ success: true, count: clientOrders.length, orders: clientOrders });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
