import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("your_resend")
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const labels: Record<string, string> = {
  REQUESTED: "Refund request received",
  REFUND_PROCESSING: "Refund is processing",
  REFUNDED: "Refund completed",
  REJECTED: "Refund request update",
  FAILED: "Refund needs attention",
};

const escapeHtml = (value: unknown) => String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));

/** Best-effort notification using the existing Resend setup; refund state never depends on email delivery. */
export async function sendRefundNotification(refund: { customerEmail?: string; customerName?: string; refundId: string; orderId: string; status: string; adminRemarks?: string; failureReason?: string }, status: string) {
  if (!resend || !refund.customerEmail) return;
  const subject = labels[status] || "Refund request update";
  await resend.emails.send({
    from: process.env.OTP_SENDER_EMAIL || "onboarding@resend.dev",
    to: refund.customerEmail,
    subject: `TECH AI · ${subject}`,
    html: `<div style="font-family:Arial,sans-serif;color:#0f172a;max-width:560px"><h2>${escapeHtml(subject)}</h2><p>Hello ${escapeHtml(refund.customerName || "Customer")},</p><p>Your refund request <b>${escapeHtml(refund.refundId)}</b> for order <b>${escapeHtml(refund.orderId)}</b> is now <b>${escapeHtml(status.replaceAll("_", " "))}</b>.</p>${refund.adminRemarks ? `<p><b>Store note:</b> ${escapeHtml(refund.adminRemarks)}</p>` : ""}${refund.failureReason ? `<p><b>Attention:</b> ${escapeHtml(refund.failureReason)}</p>` : ""}<p>Sign in to TECH AI to view the complete refund timeline.</p></div>`,
  });
}
