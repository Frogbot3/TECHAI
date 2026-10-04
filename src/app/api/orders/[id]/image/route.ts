import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const customer = await getSessionFromCookie();
  const admin = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
  if (!customer && admin?.role !== "admin") return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const index = Number(new URL(req.url).searchParams.get("item") || 0);
  if (!Number.isInteger(index) || index < 0 || index > 999) return new NextResponse(null, { status: 400 });
  try {
    await connectToDatabase();
    const order = await Order.findOne({ orderId: id, ...(admin?.role === "admin" ? {} : { customerId: customer!.id }) })
      .select({ orderId: 1, items: { $slice: [index, 1] } }).lean();
    if (!order) return new NextResponse(null, { status: 404 });
    const item = (order as any).items?.[0];
    const source = item?.normalizedImage || item?.image || "/product-placeholder.svg";
    const data = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(source);
    if (data) return new NextResponse(Buffer.from(data[2], "base64"), {
      headers: { "Content-Type": `image/${data[1]}`, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" },
    });
    const safeSource = /^https:\/\//.test(source) || /^\/(?!\/)/.test(source) ? source : "/product-placeholder.svg";
    return NextResponse.redirect(new URL(safeSource, req.url));
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
