import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import Refund from "@/models/Refund";
import { toClientRefund } from "@/lib/serializers";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    const { id } = await params;
    await connectToDatabase();
    const refund = await Refund.findOne({ refundId: id, customerId: session.id });
    if (!refund) return NextResponse.json({ success: false, message: "Refund request not found." }, { status: 404 });
    return NextResponse.json({ success: true, refund: toClientRefund(refund) });
  } catch (error) {
    console.error("Refund detail error:", error);
    return NextResponse.json({ success: false, message: "Could not load the refund request." }, { status: 500 });
  }
}
