import { escapeRegex, pagination } from "./query";
import type { OrderStatus, PaymentStatus, PaymentMethod } from "./types";
import type { PipelineStage } from "mongoose";

export const ORDER_STATUSES: OrderStatus[] = [
  "Placed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];
export const PAYMENT_STATUSES: PaymentStatus[] = ["Pending", "Paid", "Failed"];
export const PAYMENT_METHODS: PaymentMethod[] = [
  "UPI",
  "Card",
  "NetBanking",
  "COD",
];
export function adminOrderQuery(params: URLSearchParams) {
  const { page, limit } = pagination(params, 20, 100);
  const base: Record<string, unknown> = {};
  const q = (params.get("q") || "").trim().slice(0, 100);
  if (q)
    base.$or = [
      "orderId",
      "userName",
      "userPhone",
      "shippingAddress.fullName",
      "shippingAddress.phone",
    ].map((field) => ({ [field]: { $regex: escapeRegex(q), $options: "i" } }));
  for (const [key, values] of [
    ["status", ORDER_STATUSES],
    ["paymentStatus", PAYMENT_STATUSES],
    ["paymentMethod", PAYMENT_METHODS],
  ] as const) {
    const value = params.get(key);
    if (value && !(values as readonly string[]).includes(value))
      throw new Error(`Invalid ${key} filter.`);
    if (value && key !== "status") base[key] = value;
  }
  const from = params.get("from"),
    to = params.get("to");
  for (const value of [from, to])
    if (
      value &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) ||
        new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value)
    )
      throw new Error("Enter valid date filters.");
  if (from && to && from > to)
    throw new Error("Start date must be on or before end date.");
  // The store operates in India; inclusive calendar dates use IST, not the server timezone.
  if (from || to)
    base.createdAt = {
      ...(from ? { $gte: new Date(`${from}T00:00:00+05:30`) } : {}),
      ...(to ? { $lte: new Date(`${to}T23:59:59.999+05:30`) } : {}),
    };
  const asOf = params.get("asOf");
  if (asOf) {
    if (!Number.isFinite(Date.parse(asOf)))
      throw new Error("Invalid export cutoff.");
    const dates = (base.createdAt || {}) as { $gte?: Date; $lte?: Date };
    const cutoff = new Date(asOf);
    base.createdAt = {
      ...dates,
      $lte: dates.$lte && dates.$lte < cutoff ? dates.$lte : cutoff,
    };
  }
  const status = params.get("status");
  return { base, selected: status ? { status } : {}, page, limit };
}

export function adminOrdersPipeline(params: URLSearchParams): {
  page: number;
  limit: number;
  pipeline: PipelineStage[];
} {
  const { base, selected, page, limit } = adminOrderQuery(params);
  return {
    page,
    limit,
    pipeline: [
      { $match: base },
      { $project: { "items.image": 0, "items.normalizedImage": 0 } },
      {
        $facet: {
          orders: [
            { $match: selected },
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          total: [{ $match: selected }, { $count: "count" }],
          summary: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        },
      },
    ],
  };
}
