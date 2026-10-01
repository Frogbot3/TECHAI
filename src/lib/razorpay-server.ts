const RAZORPAY_API_URL = "https://api.razorpay.com/v1";

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
}

export interface RazorpayPaymentResponse {
  id: string;
  amount: number;
  amount_refunded?: number;
  currency: string;
  status: string;
  captured?: boolean;
}

export interface RazorpayRefundResponse {
  id: string;
  entity: "refund";
  amount: number;
  currency: string;
  payment_id: string;
  status: string;
  created_at?: number;
  receipt?: string;
  notes?: Record<string, string>;
}

export function getRazorpayConfig() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  return { keyId, keySecret };
}

export async function createRazorpayOrder(input: {
  amount: number;
  currency: string;
  receipt: string;
}): Promise<RazorpayOrderResponse> {
  const { keyId, keySecret } = getRazorpayConfig();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(`${RAZORPAY_API_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(input.amount),
      currency: input.currency,
      receipt: input.receipt,
      payment_capture: 1,
    }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as RazorpayOrderResponse & { error?: { description?: string } } | null;
  if (!response.ok || !data?.id) {
    throw new Error(data?.error?.description || "Razorpay order creation failed.");
  }

  return data;
}

async function razorpayRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { keyId, keySecret } = getRazorpayConfig();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`${RAZORPAY_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null) as T & { error?: { description?: string } } | null;
  if (!response.ok || !data) throw new Error(data?.error?.description || "Razorpay request failed.");
  return data;
}

export function getRazorpayPayment(paymentId: string) {
  return razorpayRequest<RazorpayPaymentResponse>(`/payments/${encodeURIComponent(paymentId)}`);
}

export function createRazorpayRefund(input: {
  paymentId: string;
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}) {
  return razorpayRequest<RazorpayRefundResponse>(`/payments/${encodeURIComponent(input.paymentId)}/refund`, {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(input.amountPaise),
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
      speed: "normal",
    }),
  });
}

export function getRazorpayRefund(refundId: string) {
  return razorpayRequest<RazorpayRefundResponse>(`/refunds/${encodeURIComponent(refundId)}`);
}

export function listRazorpayRefunds(paymentId: string) {
  return razorpayRequest<{ items: RazorpayRefundResponse[] }>(`/payments/${encodeURIComponent(paymentId)}/refunds`);
}
