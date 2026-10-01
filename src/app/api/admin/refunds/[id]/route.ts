import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Refund from "@/models/Refund";
import { toClientRefund } from "@/lib/serializers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (session?.role !== "admin") return NextResponse.json({ success: false, message: "Administrator access required." }, { status: 403 });
    const { id } = await params;
    const body = await req.json();
    const action = body.action === "under_review" ? "under_review" : "notes";
    const internalNotes = typeof body.internalNotes === "string" ? body.internalNotes.trim().slice(0, 2000) : undefined;
    const adminRemarks = typeof body.adminRemarks === "string" ? body.adminRemarks.trim().slice(0, 1200) : undefined;
    await connectToDatabase();

    if (action === "under_review") {
      const refund = await Refund.findOneAndUpdate(
        { refundId: id, status: "REQUESTED" },
        {
          $set: { status: "UNDER_REVIEW", reviewedBy: session.id, reviewedAt: new Date(), ...(internalNotes !== undefined ? { internalNotes } : {}), ...(adminRemarks !== undefined ? { adminRemarks } : {}) },
          $push: { history: { status: "UNDER_REVIEW", note: "Refund request moved under review.", actorType: "ADMIN", actorId: session.id, timestamp: new Date() } },
        },
        { new: true }
      );
      if (!refund) return NextResponse.json({ success: false, message: "Only a requested refund can be moved under review." }, { status: 409 });
      return NextResponse.json({ success: true, refund: toClientRefund(refund) });
    }

    const refund = await Refund.findOneAndUpdate(
      { refundId: id, status: { $in: ["REQUESTED", "UNDER_REVIEW"] } },
      { $set: { ...(internalNotes !== undefined ? { internalNotes } : {}), ...(adminRemarks !== undefined ? { adminRemarks } : {}) } },
      { new: true }
    );
    if (!refund) return NextResponse.json({ success: false, message: "This refund can no longer be edited." }, { status: 409 });
    return NextResponse.json({ success: true, refund: toClientRefund(refund) });
  } catch (error) {
    console.error("Admin refund update error:", error);
    return NextResponse.json({ success: false, message: "Could not update the refund request." }, { status: 500 });
  }
}
