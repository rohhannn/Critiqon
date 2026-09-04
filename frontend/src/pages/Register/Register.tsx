import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";

import "./Register.css";

import { notify } from "../../services/notifications";

import { useAuth } from "../../context/AuthContext";

import { useSubscription } from "../../context/SubscriptionContext";

import { startPayment } from "../../services/payment";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function Register() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const { refreshSubscription } =
    useSubscription();

  const [email, setEmail] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [step, setStep] =
    useState<"email" | "otp">("email");

  const [loading, setLoading] =
    useState(false);

  const [secondsLeft, setSecondsLeft] =
    useState(0);


  /*
   * =========================================================
   * RESEND COUNTDOWN
   * =========================================================
   */

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setSecondsLeft((current) =>
          Math.max(0, current - 1)
        );
      }, 1000);

    return () =>
      window.clearInterval(timer);

  }, [secondsLeft]);


  /*
   * =========================================================
   * NORMALISE EMAIL
   * =========================================================
   */

  function normaliseEmail(
    value: string
  ) {
    return value
      .trim()
      .toLowerCase();
  }


  /*
   * =========================================================
   * REQUEST REGISTRATION OTP
   *
   * IMPORTANT:
   *
   * Registration MUST use /register.
   *
   * Do NOT use /request-otp here because /request-otp
   * is also available to existing users for login.
   *
   * /register:
   *
   *   New email      -> sends OTP
   *   Existing email -> 409 Conflict
   *
   * This allows us to tell the user:
   *
   * "Email already registered. Please log in instead."
   * =========================================================
   */

  async function requestOtp(
    event?: React.FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault();

    if (loading) {
      return;
    }

    const cleanEmail =
      normaliseEmail(email);

    if (!cleanEmail) {
      notify({
        type: "error",
        title: "Email required",
        message:
          "Please enter your email address.",
      });

      return;
    }

    try {
      setLoading(true);

      /*
       * Registration endpoint.
       *
       * This is intentionally NOT /request-otp.
       */
      const response =
        await api.post(
          "/register",
          {
            email: cleanEmail,
          }
        );

      setEmail(cleanEmail);

      setOtp("");

      setStep("otp");

      setSecondsLeft(
        Number(
          response.data?.resend_after
        ) ||
          RESEND_COOLDOWN_SECONDS
      );

      notify({
        type: "success",
        title: "Verification code sent",
        message:
          `We sent a 6-digit verification code to ${cleanEmail}.`,
      });

    } catch (error: any) {

      console.error(
        "Registration OTP request error:",
        error
      );

      /*
       * =====================================================
       * EXISTING EMAIL
       *
       * Backend returns:
       *
       * 409 Conflict
       *
       * with:
       *
       * "This email is already registered.
       *  Please log in instead."
       *
       * Show a clear user-facing message.
       * =====================================================
       */

      if (
        error?.response?.status === 409
      ) {
        notify({
          type: "error",
          title: "Email already registered",
          message:
            "This email is already registered. Please log in instead.",
        });

        return;
      }

      /*
       * =====================================================
       * OTHER ERRORS
       * =====================================================
       */

      const message =
        error?.response?.data?.detail ||
        "We could not send the verification code.";

      notify({
        type: "error",
        title: "Unable to create account",
        message,
      });

    } finally {
      setLoading(false);
    }
  }


  /*
   * =========================================================
   * VERIFY OTP
   *
   * Successful verification:
   *
   * - creates the account if it does not exist
   * - signs the user in
   * - returns a JWT
   *
   * The backend remains responsible for deciding whether
   * the email can actually create an account.
   * =========================================================
   */

  async function verifyOtp(
    event?: React.FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault();

    if (loading) {
      return;
    }

    const cleanEmail =
      normaliseEmail(email);

    const cleanOtp =
      otp.replace(/\D/g, "");

    if (
      cleanOtp.length !==
      OTP_LENGTH
    ) {
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

      const response =
        await api.post(
          "/verify-otp",
          {
            email: cleanEmail,
            otp: cleanOtp,
          }
        );

      const data =
        response.data;


      /*
       * =====================================================
       * LOGIN USER
       * =====================================================
       */

      login(
        data.access_token,
        data.user
      );


      /*
       * =====================================================
       * HANDLE PENDING PLAN
       *
       * This keeps the existing Pricing flow working.
       * =====================================================
       */

      const pendingPlan =
        localStorage.getItem(
          "pendingPlan"
        );

      const currentPlan =
        await refreshSubscription();


      /*
       * =====================================================
       * NORMAL REGISTRATION
       *
       * No paid plan selected.
       * =====================================================
       */

      if (
        pendingPlan !== "Pro" &&
        pendingPlan !== "Premium"
      ) {
        localStorage.removeItem(
          "pendingPlan"
        );

        notify({
          type: "success",
          title: "Account created",
          message:
            "Your Critiqon account is ready.",
        });

        navigate("/dashboard");

        return;
      }


      /*
       * =====================================================
       * USER ALREADY HAS REQUESTED PLAN
       * =====================================================
       */

      const alreadyHasRequestedAccess =
        pendingPlan === "Premium"
          ? currentPlan === "Premium"
          : currentPlan === "Pro" ||
            currentPlan === "Premium";

      if (
        alreadyHasRequestedAccess
      ) {
        localStorage.removeItem(
          "pendingPlan"
        );

        navigate("/dashboard");

        return;
      }


      /*
       * =====================================================
       * START PAYMENT AFTER OTP
       * =====================================================
       */

      try {
        await startPayment(
          pendingPlan,
          async () => {

            await refreshSubscription();

            localStorage.removeItem(
              "pendingPlan"
            );

            navigate(
              "/dashboard"
            );
          }
        );

      } catch (paymentError) {

        console.error(
          "Unable to start payment:",
          paymentError
        );

        localStorage.removeItem(
          "pendingPlan"
        );

        notify({
          type: "error",
          title:
            "Payment unavailable",
          message:
            paymentError instanceof Error
              ? paymentError.message
              : "Unable to start payment.",
        });

        /*
         * Keep the user on the dashboard after a payment
         * initialization failure rather than leaving them
         * stuck on the registration screen.
         */
        navigate("/dashboard");
      }

    } catch (error: any) {

      console.error(
        "OTP verification error:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "The verification code is invalid or expired.";

      notify({
        type: "error",
        title:
          "Verification failed",
        message,
      });

    } finally {
      setLoading(false);
    }
  }


  /*
   * =========================================================
   * OTP INPUT
   * =========================================================
   */

  function handleOtpChange(
    value: string
  ) {
    setOtp(
      value
        .replace(/\D/g, "")
        .slice(0, OTP_LENGTH)
    );
  }


  /*
   * =========================================================
   * CHANGE EMAIL
   * =========================================================
   */

  function handleChangeEmail() {
    if (loading) {
      return;
    }

    setStep("email");

    setOtp("");

    setSecondsLeft(0);
  }


  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div className="register-page">

      <form
        className="register-card"
        onSubmit={
          step === "email"
            ? requestOtp
            : verifyOtp
        }
      >

        {/* =================================================
            HEADING
        ================================================= */}

        <h1>
          {step === "email"
            ? "Create your account"
            : "Check your email"}
        </h1>


        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <p>
          {step === "email"
            ? "Enter your email to create your Critiqon account."
            : `Enter the 6-digit verification code we sent to ${email}.`}
        </p>


        {/* =================================================
            EMAIL STEP
        ================================================= */}

        {step === "email" && (
          <>

            <label htmlFor="register-email">
              Email Address
            </label>

            <input
              id="register-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              required
              autoComplete="email"
              autoFocus
              disabled={loading}
            />


            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Checking email..."
                : "Continue"}
            </button>


            <div className="register-security-note">
              We'll send a secure verification code to your email.
            </div>

          </>
        )}


        {/* =================================================
            OTP STEP
        ================================================= */}

        {step === "otp" && (
          <>

            <label htmlFor="register-otp">
              Verification Code
            </label>

            <input
              id="register-otp"
              className="otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={otp}
              onChange={(event) =>
                handleOtpChange(
                  event.target.value
                )
              }
              maxLength={OTP_LENGTH}
              autoFocus
              required
              disabled={loading}
            />


            <button
              type="submit"
              disabled={
                loading ||
                otp.length !==
                  OTP_LENGTH
              }
            >
              {loading
                ? "Creating account..."
                : "Verify & Create Account"}
            </button>


            <button
              type="button"
              className="otp-secondary-btn"
              onClick={
                handleChangeEmail
              }
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


        {/* =================================================
            LOGIN
        ================================================= */}

        <div className="login-link">

          Already have an account?

          <Link to="/login">
            {" "}
            Sign In
          </Link>

        </div>

      </form>

    </div>
  );
}

export default Register;