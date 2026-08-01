import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentMethod, amount, orderId } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid payment amount" }, { status: 400 });
    }

    // Simulate instant payment verification & transaction ID generation
    const transactionId = `TXN-${paymentMethod.toUpperCase()}-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${amount.toLocaleString("en-IN")} verified successfully via ${paymentMethod}`,
      transactionId,
      paymentStatus: "Paid",
      orderId: orderId || `TECHAI-ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Payment verification failed" }, { status: 500 });
  }
}
