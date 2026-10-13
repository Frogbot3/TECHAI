import { NextResponse } from "next/server";
import {
  getSessionFromCookie,
  ADMIN_SESSION_COOKIE,
  CUSTOMER_SESSION_COOKIE,
} from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getBusinessSettings } from "@/lib/server-business-settings";
import { invoiceDraft } from "@/lib/invoice-document";
import { invoicePdf } from "@/lib/server-invoice";
import { toClientOrder } from "@/lib/serializers";
import Order from "@/models/Order";
import Invoice from "@/models/Invoice";
export const runtime = "nodejs";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const [admin, customer] = await Promise.all([
    getSessionFromCookie(ADMIN_SESSION_COOKIE),
    getSessionFromCookie(CUSTOMER_SESSION_COOKIE),
  ]);
  if (admin?.role !== "admin" && customer?.role !== "customer")
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  try {
    const { id } = await params;
    await connectToDatabase();
    const order = await Order.findOne({
      orderId: id,
      ...(admin?.role === "admin" ? {} : { customerId: customer!.id }),
    });
    if (!order)
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 },
      );
    const issued = await Invoice.findOne({ orderId: id });
    const document =
      issued?.document ||
      invoiceDraft(toClientOrder(order), await getBusinessSettings());
    const pdf = issued
      ? new Uint8Array(issued.pdf.buffer ? Buffer.from(issued.pdf) : issued.pdf)
      : await invoicePdf(document);
    const disposition =
      new URL(req.url).searchParams.get("download") === "1"
        ? "attachment"
        : "inline";
    const filename =
      (issued?.number || "DRAFT-" + id).replace(/[^A-Za-z0-9-]/g, "-") + ".pdf";
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Invoice-State": issued ? "issued" : "draft",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { message: (e as Error).message },
      { status: 422 },
    );
  }
}
