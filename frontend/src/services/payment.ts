import { notify } from "./notifications";
import api from "./api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export type PaidPlan =
  | "Pro"
  | "Premium";

interface CreateOrderResponse {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  plan: PaidPlan;
  user: {
    name: string;
    email: string;
  };
}

export interface VerifyPaymentResponse {
  message: string;
  plan: string;
  status: string;
  expires_at: string;
  order_id?: string;
  payment_id?: string;
  amount?: number;
  currency?: string;
}


function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript =
      document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(true)
      );
      existingScript.addEventListener(
        "error",
        () => resolve(false)
      );
      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

async function createOrder(
  plan: PaidPlan
): Promise<CreateOrderResponse> {
  const response = await api.post<CreateOrderResponse>(
    "/payments/create-order",
    { plan },
  );
  return response.data;
}

async function verifyPayment(
  paymentId: string,
  orderId: string,
  signature: string
): Promise<VerifyPaymentResponse> {
  const response = await api.post<VerifyPaymentResponse>(
    "/payments/verify",
    {
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      razorpay_signature: signature,
    },
  );
  return response.data;
}

export async function startPayment(
  plan: PaidPlan,
  onSuccess?: (
    result: VerifyPaymentResponse
  ) => void | Promise<void>
): Promise<void> {
  if (!sessionStorage.getItem("token")) {
    throw new Error(
      "You must be logged in before making a payment."
    );
  }

  const loaded =
    await loadRazorpayScript();

  if (!loaded) {
    throw new Error(
      "Razorpay Checkout failed to load."
    );
  }

  const order =
    await createOrder(plan);

  const options = {
    key: order.key_id,
    amount: order.amount,
    currency: order.currency,
    name: "Critiqon",
    description:
      `${order.plan} Plan - Career Preparation`,
    order_id: order.order_id,

    prefill: {
      name: order.user.name,
      email: order.user.email,
    },

    theme: {
      color: "#2563eb",
    },

    handler: async (
      response: any
    ) => {
      try {
        const result =
          await verifyPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );

        localStorage.removeItem(
          "pendingPlan"
        );

        notify({
          type: "success",
          title: "Payment successful",
          message: `${result.plan} plan is active. Your payment receipt has been sent to your email.`,
        });

        if (onSuccess) {
          await onSuccess(result);
        }

      } catch (error) {
        console.error(
          "Payment verification error:",
          error
        );

        notify({
          type: "error",
          title: "Payment verification failed",
          message:
            error instanceof Error
              ? error.message
              : "Please try again or contact support.",
        });
      }
    },

    modal: {
      ondismiss: () => {
        localStorage.removeItem("pendingPlan");
        notify({ type: "info", title: "Payment cancelled", message: "No plan was changed." });
      },
    },
  };

  const razorpay =
    new window.Razorpay(
      options
    );

  razorpay.on(
    "payment.failed",
    (response: any) => {
      console.error(
        "Razorpay payment failed:",
        response
      );

      localStorage.removeItem("pendingPlan");
      notify({
        type: "error",
        title: "Payment failed",
        message:
          response?.error?.description ||
          "Please try again.",
      });
    }
  );

  razorpay.open();
}
