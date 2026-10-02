import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import Order from "@/models/Order";
import Refund, { ACTIVE_REFUND_STATUSES, REFUND_REASONS } from "@/models/Refund";
import { toClientRefund } from "@/lib/serializers";
import {
  buildRefundRequestKey,
  createRefundId,
  formatRefundKey,
  getDeliveredAt,
  getRefundDeadline,
  getRefundableLineAmountPaise,
  getRefundableOrderAmountPaise,
  getReservedRefundAmountPaise,
  isRefundWindowOpen,
} from "@/lib/refunds";
import { sendRefundNotification } from "@/lib/refund-notifications";

function ownsOrder(order: { customerId?: string; userEmail?: string; userPhone?: string }, session: { id: string; email: string; phone: string }) {
  return Boolean(order.customerId && order.customerId === session.id);
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ success: false, message: "Please sign in to request a refund." }, { status: 401 });

    const body = await req.json();
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 1200) : "";
    const evidenceUrls = Array.isArray(body.evidenceUrls)
      ? body.evidenceUrls.filter((url: unknown): url is string => typeof url === "string" && /^https?:\/\//i.test(url.trim())).map((url: string) => url.trim()).slice(0, 5)
      : [];
    const requestedItems = Array.isArray(body.items) ? body.items : [];

    if (!orderId || !REFUND_REASONS.includes(reason as typeof REFUND_REASONS[number])) {
      return NextResponse.json({ success: false, message: "Select a valid order and refund reason." }, { status: 400 });
    }
    if (requestedItems.length === 0 || requestedItems.length > 20) {
      return NextResponse.json({ success: false, message: "Select at least one product to return." }, { status: 400 });
    }

    await connectToDatabase();
    const order = await Order.findOne({ orderId });
    if (!order || !ownsOrder(order, session)) return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    if (order.status !== "Delivered" || order.paymentStatus !== "Paid" || !order.razorpayPaymentId) {
      return NextResponse.json({ success: false, message: "Only successfully paid and delivered Razorpay orders are eligible." }, { status: 409 });
    }

    const deliveredAt = getDeliveredAt(order);
    const deadline = getRefundDeadline(order);
    if (!deliveredAt || !deadline || !isRefundWindowOpen(order)) {
      return NextResponse.json({
        success: false,
        message: deadline ? `The refund window closed on ${deadline.toLocaleDateString("en-IN")}.` : "A delivery date is required before a refund can be requested.",
        refundDeadline: deadline?.toISOString(),
      }, { status: 409 });
    }

    const itemMap = new Map<string, { quantity: number }>();
    for (const requested of requestedItems) {
      const productId = typeof requested?.productId === "string" ? requested.productId.trim() : "";
      const quantity = Number(requested?.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1) {
        return NextResponse.json({ success: false, message: "Invalid refund item or quantity." }, { status: 400 });
      }
      const previous = itemMap.get(productId);
      itemMap.set(productId, { quantity: (previous?.quantity || 0) + quantity });
    }

    const existingActive = await Refund.find({ orderId, status: { $in: ACTIVE_REFUND_STATUSES } });
    const existingKeys = new Set(existingActive.flatMap((refund: any) => refund.items.map((item: any) => item.itemKey)));
    const items: {
      itemKey: string;
      productId: string;
      title: string;
      quantity: number;
      unitAmountPaise: number;
      amountPaise: number;
    }[] = [];
    for (const [productId, selected] of itemMap) {
      const orderLines = order.items.filter((item: any) => String(item.productId) === productId);
      const orderedQuantity = orderLines.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
      if (!orderedQuantity || selected.quantity > orderedQuantity) {
        return NextResponse.json({ success: false, message: "Requested quantity exceeds the delivered order quantity." }, { status: 400 });
      }
      const itemKey = formatRefundKey(orderId, productId);
      if (existingKeys.has(itemKey)) {
        return NextResponse.json({ success: false, message: "An active refund request already exists for one of these products." }, { status: 409 });
      }
      const amountPaise = getRefundableLineAmountPaise(order, productId, selected.quantity);
      if (amountPaise <= 0) return NextResponse.json({ success: false, message: "This item has no refundable value." }, { status: 400 });
      const title = orderLines[0]?.title || "Product";
      items.push({ itemKey, productId, title, quantity: selected.quantity, unitAmountPaise: Math.floor(amountPaise / selected.quantity), amountPaise });
    }

    const requestedAmountPaise = items.reduce((sum, item) => sum + item.amountPaise, 0);
    const orderRefundableAmountPaise = getRefundableOrderAmountPaise(order);
    const reservedAmountPaise = getReservedRefundAmountPaise(existingActive);
    const availableAmountPaise = Math.max(0, orderRefundableAmountPaise - reservedAmountPaise);
    if (requestedAmountPaise > availableAmountPaise) {
      return NextResponse.json({ success: false, message: "The requested amount exceeds the remaining refundable balance." }, { status: 409 });
    }

    const refund = await Refund.create({
      refundId: createRefundId(),
      orderId,
      customerId: session.id,
      customerName: order.userName || session.name || "Customer",
      customerEmail: order.userEmail || session.email || "",
      customerPhone: order.userPhone || session.phone || "",
      paymentId: order.razorpayPaymentId,
      items,
      requestedAmountPaise,
      approvedAmountPaise: 0,
      refundedAmountPaise: 0,
      refundableAmountPaise: availableAmountPaise,
      currency: "INR",
      reason,
      description,
      evidenceUrls,
      status: "REQUESTED",
      deliveryDate: deliveredAt,
      history: [{ status: "REQUESTED", note: "Refund request submitted by customer.", actorType: "CUSTOMER", actorId: session.id, timestamp: new Date() }],
      requestKey: buildRefundRequestKey({ orderId, customerId: session.id, items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })) }),
    });

    void sendRefundNotification(refund, "REQUESTED").catch((error) => console.error("Refund notification error:", error));
    return NextResponse.json({ success: true, refund: toClientRefund(refund) }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) return NextResponse.json({ success: false, message: "An active refund request already exists for this product." }, { status: 409 });
    console.error("Refund request error:", error);
    return NextResponse.json({ success: false, message: "Could not submit the refund request." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ success: false, message: "Please sign in to view refunds." }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 100)));
    await connectToDatabase();
    const filter: Record<string, unknown> = { customerId: session.id };
    if (orderId) filter.orderId = orderId;
    const [total, refunds] = await Promise.all([
      Refund.countDocuments(filter),
      Refund.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    return NextResponse.json({ success: true, refunds: refunds.map(toClientRefund), total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Refund list error:", error);
    return NextResponse.json({ success: false, message: "Could not load refund requests." }, { status: 500 });
  }
}
