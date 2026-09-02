import "./Pricing.css";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  startPayment,
} from "../../services/payment";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useSubscription,
} from "../../context/SubscriptionContext";

import { notify } from "../../services/notifications";

type Plan =
  | "Free"
  | "Pro"
  | "Premium";

function Pricing() {
  const navigate =
    useNavigate();

  const {
    user,
  } = useAuth();

  const {
    plan: currentPlan,
    refreshSubscription,
  } = useSubscription();

  const [
    selectedPlan,
    setSelectedPlan,
  ] = useState<Plan>(
    currentPlan
  );

  const [
    paying,
    setPaying,
  ] = useState(false);

  async function handlePlanSelect(
    plan: Plan
  ) {
    setSelectedPlan(plan);

    // =================================================
    // FREE
    // =================================================

    if (plan === "Free") {
      if (!user) {
        localStorage.setItem(
          "selectedPlan",
          "Free"
        );

        localStorage.removeItem(
          "pendingPlan"
        );

        navigate("/login");

        return;
      }

      notify({
        type: "info",
        title: "Free plan",
        message:
          "The Free plan is already available without payment.",
      });

      return;
    }

    // =================================================
    // USER NOT LOGGED IN
    // =================================================

    if (!user) {
      localStorage.setItem(
        "pendingPlan",
        plan
      );

      navigate("/login");

      return;
    }

    // =================================================
    // ALREADY ON SAME OR HIGHER PLAN
    // =================================================

    if (
      currentPlan === "Premium"
    ) {
      notify({
        type: "info",
        title: "Already subscribed",
        message:
          "You already have the Premium plan.",
      });

      return;
    }

    if (
      currentPlan === "Pro" &&
      plan === "Pro"
    ) {
      notify({
        type: "info",
        title: "Already subscribed",
        message:
          "You already have the Pro plan.",
      });

      return;
    }

    // =================================================
    // PAYMENT
    // =================================================

    try {
      setPaying(true);

      await startPayment(
        plan,
        async () => {
          await refreshSubscription();

          navigate(
            "/dashboard"
          );
        }
      );
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      notify({
        type: "error",
        title: "Payment unavailable",
        message:
          error instanceof Error
            ? error.message
            : "Unable to start payment.",
      });
    } finally {
      setPaying(false);
    }
  }

  return (
    <section
      className="pricing-section"
      id="pricing"
    >
      <div className="pricing-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="pricing-header">
          <div className="pricing-eyebrow">
            <span className="pricing-eyebrow-dot" />
            SIMPLE, TRANSPARENT PRICING
          </div>

          <h2>
            Choose the plan that
            <span> fits your career.</span>
          </h2>

          <p className="pricing-subtitle">
            Start with the essentials and upgrade when
            you need more powerful tools for resumes,
            ATS optimization, job matching and interview
            preparation.
          </p>

          <div className="pricing-trust">
            <div>
              <span className="pricing-trust-icon">✓</span>
              No complicated plans
            </div>

            <div>
              <span className="pricing-trust-icon">✓</span>
              Clear monthly pricing
            </div>

            <div>
              <span className="pricing-trust-icon">✓</span>
              Upgrade when you need
            </div>
          </div>
        </div>


        {/* =================================================
            PRICING CARDS
        ================================================= */}

        <div className="pricing-cards">

          {/* =================================================
              FREE
          ================================================= */}

          <article
            className={`pricing-card ${
              selectedPlan === "Free"
                ? "selected"
                : ""
            }`}
          >
            <div className="pricing-card-top">
              <div>
                <div className="pricing-plan-icon">
                  ✦
                </div>

                <div className="pricing-plan-heading">
                  <h3>
                    Free
                  </h3>

                  <p>
                    Get started with the essentials.
                  </p>
                </div>
              </div>

              {currentPlan === "Free" && (
                <span className="current-badge">
                  CURRENT
                </span>
              )}
            </div>

            <div className="pricing-price">
              <span className="currency">
                ₹
              </span>

              <span className="amount">
                0
              </span>
            </div>

            <div className="pricing-period">
              Forever
            </div>

            <div className="pricing-best-for">
              <span>
                BEST FOR
              </span>

              <strong>
                Trying Critiqon for the first time
              </strong>
            </div>

            <div className="pricing-divider" />

            <div className="pricing-feature-heading">
              What's included
            </div>

            <ul className="pricing-features">
              <li>
                <span>✓</span>
                <div>
                  <strong>
                    AI resume analysis
                  </strong>
                  <small>
                    Get AI-powered feedback on your resume.
                  </small>
                </div>
              </li>

              <li>
                <span>✓</span>
                <div>
                  <strong>
                    ATS readiness score
                  </strong>
                  <small>
                    Understand how prepared your resume is for ATS systems.
                  </small>
                </div>
              </li>

              <li>
                <span>✓</span>
                <div>
                  <strong>
                    Basic dashboard
                  </strong>
                  <small>
                    Keep your career preparation organized in one place.
                  </small>
                </div>
              </li>

              <li>
                <span>✓</span>
                <div>
                  <strong>
                    Resume upload
                  </strong>
                  <small>
                    Upload your resume for analysis and feedback.
                  </small>
                </div>
              </li>
            </ul>

            <button
              type="button"
              className="pricing-button secondary"
              onClick={() =>
                handlePlanSelect(
                  "Free"
                )
              }
            >
              <span>
                {currentPlan === "Free"
                  ? "Current Plan"
                  : "Get Started"}
              </span>

              <span className="button-arrow">
                →
              </span>
            </button>
          </article>


          {/* =================================================
              PRO
          ================================================= */}

          <article
            className={`pricing-card pricing-card-pro ${
              selectedPlan === "Pro"
                ? "selected"
                : ""
            }`}
          >
            <div className="popular-ribbon">
              <span>
                MOST POPULAR
              </span>
            </div>

            <div className="pricing-card-top">
              <div>
                <div className="pricing-plan-icon pro-icon">
                  ◆
                </div>

                <div className="pricing-plan-heading">
                  <h3>
                    Pro
                  </h3>

                  <p>
                    More tools for serious job seekers.
                  </p>
                </div>
              </div>

              {currentPlan === "Pro" && (
                <span className="current-badge">
                  CURRENT
                </span>
              )}
            </div>

            <div className="pricing-price">
              <span className="currency">
                ₹
              </span>

              <span className="amount">
                99
              </span>

              <span className="price-suffix">
                / month
              </span>
            </div>

            <div className="pricing-period">
              Billed monthly
            </div>

            <div className="pricing-best-for">
              <span>
                BEST FOR
              </span>

              <strong>
                Active job seekers preparing applications
              </strong>
            </div>

            <div className="pricing-divider" />

            <div className="pricing-feature-heading">
              What's included
            </div>

            <ul className="pricing-features">
              <li>
                <span>✓</span>
                <div>
                  <strong>
                    ATS optimization
                  </strong>
                  <small>
                    Improve your resume against ATS requirements.
                  </small>
                </div>
              </li>

              <li>
                <span>✓</span>
                <div>
                  <strong>
                    AI job matching
                  </strong>
                  <small>
                    Use AI-powered matching to evaluate job fit.
                  </small>
                </div>
              </li>

              <li>
                <span>✓</span>
                <div>
                  <strong>
                    Cover letter generation
                  </strong>
                  <small>
                    Generate tailored cover letters with AI assistance.
                  </small>
                </div>
              </li>

              <li>
                <span>✓</span>
                <div>
                  <strong>
                    Up to 10 interview questions
                  </strong>
                  <small>
                    Practice up to 10 AI interview questions per session.
                  </small>
                </div>
              </li>

              <li>
                <span>✓</span>
                <div>
                  <strong>
                    Interview history
                  </strong>
                  <small>
                    Keep a record of your previous interview sessions.
                  </small>
                </div>
              </li>
            </ul>

            <button
              type="button"
              className="pricing-button primary"
              disabled={
                paying ||
                currentPlan === "Pro" ||
                currentPlan === "Premium"
              }
              onClick={() =>
                handlePlanSelect(
                  "Pro"
                )
              }
            >
              <span>
                {paying
                  ? "Processing..."
                  : currentPlan === "Premium"
                  ? "Included in Premium"
                  : currentPlan === "Pro"
                  ? "Current Plan"
                  : "Choose Pro"}
              </span>

              {!paying &&
                currentPlan !== "Pro" &&
                currentPlan !== "Premium" && (
                  <span className="button-arrow">
                    →
                  </span>
                )}
            </button>
          </article>


          {/* =================================================
              PREMIUM
          ================================================= */}

          <article
            className={`pricing-card pricing-card-premium ${
              selectedPlan === "Premium"
                ? "selected"
                : ""
            }`}
          >
            <div className="pricing-card-top">
              <div>
                <div className="pricing-plan-icon premium-icon">
                  ✦
                </div>

                <div className="pricing-plan-heading">
                  <h3>
                    Premium
                  </h3>

                  <p>
                    Maximum access for intensive preparation.
                  </p>
                </div>
              </div>

              {currentPlan === "Premium" && (
                <span className="current-badge">
                  CURRENT
                </span>
              )}
            </div>

            <div className="pricing-price">
              <span className="currency">
                ₹
              </span>

              <span className="amount">
                149
              </span>

              <span className="price-suffix">
                / month
              </span>
            </div>

            <div className="pricing-period">
              Billed monthly
            </div>

            <div className="pricing-best-for">
              <span>
                BEST FOR
              </span>

              <strong>
                Intensive job preparation
              </strong>
            </div>

            <div className="pricing-divider" />

            <div className="pricing-feature-heading">
              What's included
            </div>

            <ul className="pricing-features">
              <li>
                <span>✓</span>
                <div>
                  <strong>
                    Unlimited resume analysis
                  </strong>
                  <small>
                    Analyze your resume without the Free plan limitation.
                  </small>
                </div>
              </li>

              <li>
                <span>✓</span>
                <div>
                  <strong>
                    Advanced AI matching
                  </strong>
                  <small>
                    Get more advanced AI-powered job matching.
                  </small>
                </div>
              </li>

              <li>
                <span>✓</span>
                <div>
                  <strong>
                    Up to 20 interview questions
                  </strong>
                  <small>
                    Practice longer AI interview sessions.
                  </small>
                </div>
              </li>

              <li>
                <span>✓</span>
                <div>
                  <strong>
                    Advanced reports
                  </strong>
                  <small>
                    Get deeper reporting from your preparation activity.
                  </small>
                </div>
              </li>

              <li>
                <span>✓</span>
                <div>
                  <strong>
                    All Pro features
                  </strong>
                  <small>
                    Includes the functionality available in the Pro plan.
                  </small>
                </div>
              </li>
            </ul>

            <button
              type="button"
              className="pricing-button secondary premium-button"
              disabled={
                paying ||
                currentPlan === "Premium"
              }
              onClick={() =>
                handlePlanSelect(
                  "Premium"
                )
              }
            >
              <span>
                {paying
                  ? "Processing..."
                  : currentPlan === "Premium"
                  ? "Current Plan"
                  : "Choose Premium"}
              </span>

              {!paying &&
                currentPlan !== "Premium" && (
                  <span className="button-arrow">
                    →
                  </span>
                )}
            </button>
          </article>

        </div>


        {/* =================================================
            BOTTOM NOTE
        ================================================= */}

        <div className="pricing-footer">
          <div className="pricing-footer-icon">
            ✓
          </div>

          <div>
            <strong>
              Start where you are.
            </strong>

            <span>
              You can choose a different plan whenever your
              preparation needs change.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Pricing;