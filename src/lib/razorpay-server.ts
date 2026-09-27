const RAZORPAY_API_URL = "https://api.razorpay.com/v1";

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
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
