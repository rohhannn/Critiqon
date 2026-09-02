import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { startPayment } from "../../services/payment";
import api from "../../services/api";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import BrandLogo from "../../components/BrandLogo";
import { notify } from "../../services/notifications";

import "./Login.css";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  function normaliseEmail(value: string) {
    return value.trim().toLowerCase();
  }

  async function requestOtp(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (loading) return;

    const cleanEmail = normaliseEmail(email);

    if (!cleanEmail) return;

    try {
      setLoading(true);

      const response = await api.post("/request-otp", {
        email: cleanEmail,
      });

      setEmail(cleanEmail);
      setOtp("");
      setStep("otp");

      setSecondsLeft(
        Number(response.data?.resend_after) ||
          RESEND_COOLDOWN_SECONDS,
      );

      notify({
        type: "success",
        title: "Verification code sent",
        message: `We sent a 6-digit code to ${cleanEmail}.`,
      });
    } catch (error: any) {
      console.error("OTP request error:", error);

      const message =
        error?.response?.data?.detail ||
        "We could not send the verification code.";

      notify({
        type: "error",
        title: "Unable to send code",
        message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(
    event?: React.FormEvent<HTMLFormElement>,
  ) {
    event?.preventDefault();

    if (loading) return;

    const cleanEmail = normaliseEmail(email);
    const cleanOtp = otp.replace(/\D/g, "");

    if (cleanOtp.length !== OTP_LENGTH) {
      notify({
        type: "error",
        title: "Invalid code",
        message:
          "Enter the complete 6-digit verification code.",
      });

      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/verify-otp", {
        email: cleanEmail,
        otp: cleanOtp,
      });

      const data = response.data;

      login(data.access_token, data.user);

      const pendingPlan = localStorage.getItem("pendingPlan");

      const currentPlan = await refreshSubscription();

      if (
        pendingPlan !== "Pro" &&
        pendingPlan !== "Premium"
      ) {
        localStorage.removeItem("pendingPlan");
        navigate("/dashboard");
        return;
      }

      const alreadyHasRequestedAccess =
        pendingPlan === "Premium"
          ? currentPlan === "Premium"
          : currentPlan === "Pro" ||
            currentPlan === "Premium";

      if (alreadyHasRequestedAccess) {
        localStorage.removeItem("pendingPlan");
        navigate("/dashboard");
        return;
      }

      try {
        await startPayment(pendingPlan, async () => {
          await refreshSubscription();

          localStorage.removeItem("pendingPlan");

          navigate("/dashboard");
        });
      } catch (error) {
        console.error(
          "Unable to start payment:",
          error,
        );

        localStorage.removeItem("pendingPlan");

        notify({
          type: "error",
          title: "Payment unavailable",
          message:
            error instanceof Error
              ? error.message
              : "Unable to start payment.",
        });
      }
    } catch (error: any) {
      console.error(
        "OTP verification error:",
        error,
      );

      const message =
        error?.response?.data?.detail ||
        "The verification code is invalid or expired.";

      notify({
        type: "error",
        title: "Verification failed",
        message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(
    credential: string,
  ) {
    if (loading) return;

    try {
      setLoading(true);

      const response = await api.post(
        "/google-login",
        {
          credential,
        },
      );

      const data = response.data;

      login(data.access_token, data.user);

      const pendingPlan =
        localStorage.getItem("pendingPlan");

      const currentPlan =
        await refreshSubscription();

      if (
        pendingPlan !== "Pro" &&
        pendingPlan !== "Premium"
      ) {
        localStorage.removeItem("pendingPlan");

        navigate("/dashboard");

        return;
      }

      const alreadyHasRequestedAccess =
        pendingPlan === "Premium"
          ? currentPlan === "Premium"
          : currentPlan === "Pro" ||
            currentPlan === "Premium";

      if (alreadyHasRequestedAccess) {
        localStorage.removeItem("pendingPlan");

        navigate("/dashboard");

        return;
      }

      await startPayment(
        pendingPlan,
        async () => {
          await refreshSubscription();

          localStorage.removeItem("pendingPlan");

          navigate("/dashboard");
        },
      );
    } catch (error: any) {
      localStorage.removeItem("pendingPlan");

      console.error(
        "Google login error:",
        error,
      );

      notify({
        type: "error",
        title: "Google Sign-In failed",
        message:
          error?.response?.data?.detail ||
          "Google Sign-In failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string) {
    setOtp(
      value
        .replace(/\D/g, "")
        .slice(0, OTP_LENGTH),
    );
  }

  return (
    <div className="login-page">
      <form
        className="login-card"
        onSubmit={
          step === "email"
            ? requestOtp
            : verifyOtp
        }
      >
        <BrandLogo
          size="medium"
          className="login-brand"
        />

        <h1>
          {step === "email"
            ? "Sign in to Critiqon"
            : "Check your email"}
        </h1>

        <p>
          {step === "email"
            ? "Enter your email and we’ll send you a secure one-time verification code. No password required."
            : `Enter the 6-digit code we sent to ${email}.`}
        </p>

        {step === "email" ? (
          <>
            <label htmlFor="login-email">
              Email Address
            </label>

            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="email"
              autoFocus
            />

            <button
              type="submit"
              className="sign-in-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Sending code...
                </>
              ) : (
                "Continue with email"
              )}
            </button>
          </>
        ) : (
          <>
            <label htmlFor="login-otp">
              Verification Code
            </label>

            <input
              id="login-otp"
              className="otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={otp}
              onChange={(event) =>
                handleOtpChange(
                  event.target.value,
                )
              }
              maxLength={OTP_LENGTH}
              autoFocus
              required
            />

            <button
              type="submit"
              className="sign-in-btn"
              disabled={
                loading ||
                otp.length !== OTP_LENGTH
              }
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Verifying...
                </>
              ) : (
                "Verify & Sign In"
              )}
            </button>

            <button
              type="button"
              className="otp-secondary-btn"
              onClick={() => {
                setStep("email");
                setOtp("");
              }}
              disabled={loading}
            >
              Use a different email
            </button>

            <button
              type="button"
              className="otp-resend-btn"
              onClick={() =>
                void requestOtp()
              }
              disabled={
                loading ||
                secondsLeft > 0
              }
            >
              {secondsLeft > 0
                ? `Resend code in ${secondsLeft}s`
                : "Resend verification code"}
            </button>
          </>
        )}

        <div className="login-divider">
          <span>OR</span>
        </div>

        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
        />

        <div className="register-link">
          <span>New to Critiqon? </span>

          <span>
            Just enter your email above — your
            account is created automatically
            after verification.
          </span>
        </div>
      </form>
    </div>
  );
}

export default Login;