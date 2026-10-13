import type { Order } from "./types";
/** All downloads use the same protected, authoritative server PDF. */
export async function generateOrderInvoice(order: Order): Promise<void> {
  const response = await fetch(
    `/api/orders/${encodeURIComponent(order.id)}/invoice?download=1`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw Error(error?.message || "Unable to download invoice.");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download =
    response.headers
      .get("Content-Disposition")
      ?.match(/filename="([^"]+)"/)?.[1] || `TECHAI-${order.id}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
