import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import mongoose from "mongoose";
import Invoice from "@/models/Invoice";
import InvoiceSequence from "@/models/InvoiceSequence";
import OrderModel from "@/models/Order";
import { getBusinessSettings } from "./server-business-settings";
import { toClientOrder } from "./serializers";
import { financialYear, invoiceNumber, invoiceDraft } from "./invoice-document";
import { renderInvoicePdf } from "./invoice-pdf";
import type { InvoiceDocument } from "./tax-types";
export async function invoicePdf(document: InvoiceDocument) {
  const [font, logo] = await Promise.all([
    readFile(path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf")),
    document.seller.logo.startsWith("data:image/")
      ? Promise.resolve(document.seller.logo)
      : readFile(path.join(process.cwd(), "public/brand/techai-logo.png")).then(
          (bytes) => "data:image/png;base64," + bytes.toString("base64"),
        ),
  ]);
  return renderInvoicePdf(document, {
    fontBase64: font.toString("base64"),
    logoDataUrl: logo,
  });
}
export async function issueInvoice(
  orderId: string,
  issuedBy: string,
  codPaymentStatus?: "Pending" | "Paid" | "Failed",
) {
  // Unique indexes plus the transaction make retries and concurrent dispatch idempotent.
  await Promise.all([Invoice.init(), InvoiceSequence.init()]);
  const settings = await getBusinessSettings();
  for (let attempt = 0; attempt < 5; attempt++) {
    const session = await mongoose.startSession();
    try {
      let result: any;
      await session.withTransaction(async () => {
        const existing = await Invoice.findOne({ orderId }).session(session);
        if (existing) {
          result = existing;
          return;
        }
        const record = await OrderModel.findOne({ orderId }).session(session);
        if (!record) throw Error("Order not found.");
        const order = toClientOrder(record);
        if (codPaymentStatus) {
          if (
            order.paymentMethod !== "COD" ||
            !["Pending", "Paid", "Failed"].includes(codPaymentStatus)
          )
            throw Error(
              "Only a valid COD collection status can be recorded during dispatch.",
            );
          order.paymentStatus = codPaymentStatus;
        }
        if (!order.taxSnapshot)
          throw Error(
            "Legacy order has no tax snapshot. Review outside automatic issuance; recorded totals are preserved.",
          );
        if (
          !settings.enabled ||
          !settings.invoicePrefix ||
          settings.signatureMode === "unconfirmed"
        )
          throw Error("Invoice settings require approval.");
        if (order.taxSnapshot.total !== Math.round(order.finalAmount * 100))
          throw Error(
            "Tax snapshot and authorized order total differ. Issuance blocked.",
          );
        if (
          settings.einvoice === "required" &&
          order.taxSnapshot.buyer.kind !== "consumer"
        )
          throw Error(
            "IRP integration is required before issuing this registered-buyer invoice.",
          );
        if (order.paymentMethod !== "COD" && order.paymentStatus !== "Paid")
          throw Error(
            "Verify online payment before dispatch and invoice issuance.",
          );
        if (order.refundedAmountPaise)
          throw Error(
            "Refunded order requires accountant/credit-note review before first issuance.",
          );
        if (String(order.status) === "Cancelled")
          throw Error("Cancelled orders cannot be invoiced through dispatch.");
        const now = new Date(),
          fy = financialYear(now),
          key = settings.invoicePrefix + ":" + fy;
        const counter = await InvoiceSequence.findOneAndUpdate(
          { key },
          [
            {
              $set: {
                key,
                value: {
                  $add: [
                    { $ifNull: ["$value", settings.sequenceStart - 1] },
                    1,
                  ],
                },
              },
            },
          ],
          { new: true, upsert: true, session },
        );
        const number = invoiceNumber(settings.invoicePrefix, fy, counter.value);
        const document: InvoiceDocument = {
          ...invoiceDraft(order, settings),
          state: "issued",
          number,
          issuedAt: now.toISOString(),
        };
        const pdf = Buffer.from(await invoicePdf(document));
        const created = await Invoice.create(
          [
            {
              orderId,
              number,
              financialYear: fy,
              document,
              pdf,
              sha256: createHash("sha256").update(pdf).digest("hex"),
              issuedBy,
            },
          ],
          { session },
        );
        result = created[0];
        await OrderModel.updateOne(
          { orderId },
          {
            $set: {
              invoiceNumber: number,
              ...(codPaymentStatus ? { paymentStatus: codPaymentStatus } : {}),
            },
          },
          { session },
        );
      });
      return result;
    } catch (error) {
      // First-use sequence upserts can race on the unique index. A fresh transaction
      // reads the winning invoice, or obtains the next number for another order.
      if ((error as { code?: number }).code !== 11000 || attempt === 4)
        throw error;
    } finally {
      await session.endSession();
    }
  }
  throw Error("Invoice issuance could not be completed; retry dispatch.");
}
// Existing email senders can attach the same stored bytes; this helper never sends email.
export async function issuedInvoiceAttachment(orderId: string) {
  const invoice = await Invoice.findOne({ orderId });
  if (!invoice) throw Error("Invoice has not been issued.");
  return {
    filename: invoice.number.replaceAll("/", "-") + ".pdf",
    content: Buffer.from(invoice.pdf),
  };
}
