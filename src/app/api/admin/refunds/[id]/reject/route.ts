import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Refund from "@/models/Refund";
import { toClientRefund } from "@/lib/serializers";
import { sendRefundNotification } from "@/lib/refund-notifications";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (session?.role !== "admin") return NextResponse.json({ success: false, message: "Administrator access required." }, { status: 403 });
    const { id } = await params;
    const body = await req.json();
    const rejectionReason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1200) : "";
    if (!rejectionReason) return NextResponse.json({ success: false, message: "A rejection reason is required." }, { status: 400 });

    await connectToDatabase();
    const refund = await Refund.findOneAndUpdate(
      { refundId: id, status: { $in: ["REQUESTED", "UNDER_REVIEW"] } },
      {
        $set: { status: "REJECTED", adminRemarks: rejectionReason, reviewedBy: session.id, reviewedAt: new Date() },
        $push: { history: { status: "REJECTED", note: rejectionReason, actorType: "ADMIN", actorId: session.id, timestamp: new Date() } },
      },
      { new: true }
    );
    if (!refund) return NextResponse.json({ success: false, message: "This refund is no longer awaiting review." }, { status: 409 });
    void sendRefundNotification(refund, "REJECTED").catch((error) => console.error("Refund notification error:", error));
    return NextResponse.json({ success: true, refund: toClientRefund(refund) });
  } catch (error) {
    console.error("Admin refund rejection error:", error);
    return NextResponse.json({ success: false, message: "Could not reject the refund request." }, { status: 500 });
  }
}
