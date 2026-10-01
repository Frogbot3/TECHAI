import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import Refund from "@/models/Refund";
import { toClientRefund } from "@/lib/serializers";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    const { id } = await params;
    await connectToDatabase();
    const refund = await Refund.findOneAndUpdate(
      { refundId: id, customerId: session.id, status: "REQUESTED" },
      {
        $set: { status: "CANCELLED" },
        $push: { history: { status: "CANCELLED", note: "Refund request cancelled by customer.", actorType: "CUSTOMER", actorId: session.id, timestamp: new Date() } },
      },
      { new: true }
    );
    if (!refund) return NextResponse.json({ success: false, message: "Only a pending refund request can be cancelled." }, { status: 409 });
    return NextResponse.json({ success: true, refund: toClientRefund(refund) });
  } catch (error) {
    console.error("Refund cancellation error:", error);
    return NextResponse.json({ success: false, message: "Could not cancel the refund request." }, { status: 500 });
  }
}
