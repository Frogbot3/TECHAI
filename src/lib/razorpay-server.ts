const RAZORPAY_API_URL = "https://api.razorpay.com/v1";

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  amount_paid?: number;
  amount_due?: number;
  currency: string;
  status: string;
  receipt?: string;
}

export interface RazorpayPaymentResponse {
  method?: string;
  id: string;
  amount: number;
  amount_refunded?: number;
  currency: string;
  status: string;
  captured?: boolean;
  order_id?: string;
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

export class RazorpayApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "RazorpayApiError";
    this.status = status;
    this.code = code;
  }
}

let configurationLogged = false;

export function getRazorpayConfig() {
  // The checkout key is public by Razorpay design, but this app sends it to
  // the browser only after the server has authenticated the customer/order.
  // Prefer a server-only name while retaining the existing local variable.
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!configurationLogged) {
    const mode = keyId?.startsWith("rzp_live_") ? "live" : keyId?.startsWith("rzp_test_") ? "test" : "unknown";
    console.info("Razorpay configuration check", {
      keyIdConfigured: Boolean(keyId),
      keySecretConfigured: Boolean(keySecret),
      mode,
      webhookSecretConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    });
    configurationLogged = true;
  }

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server environment.");
  }

  return { keyId, keySecret };
}

export async function createRazorpayOrder(input: {
  amount: number;
  currency: string;
  receipt: string;
}): Promise<RazorpayOrderResponse> {
  const { keyId, keySecret } = getRazorpayConfig();
  const amount = Math.round(Number(input.amount));
  if (!Number.isInteger(amount) || amount <= 0 || input.currency !== "INR") {
    throw new Error("Razorpay order amount or currency is invalid.");
  }
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(`${RAZORPAY_API_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: input.currency,
      receipt: input.receipt,
      payment_capture: 1,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  const data = (await response.json().catch(() => null)) as RazorpayOrderResponse & { error?: { description?: string; code?: string } } | null;
  if (!response.ok || !data?.id) {
    throw new RazorpayApiError(data?.error?.description || "Razorpay order creation failed.", response.status, data?.error?.code);
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
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => null) as T & { error?: { description?: string; code?: string } } | null;
  if (!response.ok || !data) {
    throw new RazorpayApiError(data?.error?.description || "Razorpay request failed.", response.status, data?.error?.code);
  }
  return data;
}

export function getRazorpayOrder(orderId: string) {
  return razorpayRequest<RazorpayOrderResponse>(`/orders/${encodeURIComponent(orderId)}`);
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
