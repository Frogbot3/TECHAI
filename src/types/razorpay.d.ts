declare global {
  interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  interface RazorpayFailureResponse {
    error?: {
      metadata?: { payment_id?: string; order_id?: string };
      code?: string;
      description?: string;
      reason?: string;
      source?: string;
      step?: string;
    };
  }

  interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string>;
    theme?: { color?: string };
    modal?: {
      ondismiss?: () => void;
      confirm_close?: boolean;
      escape?: boolean;
    };
  }

  interface RazorpayInstance {
    open: () => void;
    on: (event: "payment.failed", callback: (response: RazorpayFailureResponse) => void) => void;
  }

  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export {};
