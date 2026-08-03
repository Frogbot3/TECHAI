import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentMethod, amount, orderId } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid payment amount." }, { status: 400 });
    }

    const transactionId = `MANUAL-${String(paymentMethod || "PAY").toUpperCase()}-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    return NextResponse.json({
      success: true,
      message: `Payment reference recorded for Rs. ${Number(amount).toLocaleString("en-IN")}. Gateway capture can be connected later.`,
      transactionId,
      paymentStatus: "Pending",
      orderId: orderId || `TECHAI-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Payment reference failed." }, { status: 500 });
  }
}
