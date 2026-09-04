import "./Hero.css";
import Button from "../Button/Button";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  /*
   * =========================================================
   * GET STARTED
   * New users should go directly to registration.
   * =========================================================
   */
  const handleGetStarted = () => {
    navigate("/register");
  };

  /*
   * =========================================================
   * IMPROVE RESUME
   * Existing users can sign in first.
   * =========================================================
   */
  const handleImproveResume = () => {
    navigate("/login");
  };

  const handleSeeHowItWorks = () => {
    document
      .getElementById("features")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <main className="hero-container">

      <section className="hero">

        {/* =================================================
            HERO TITLE
        ================================================= */}

        <h1>
          Land Your Dream Job{" "}
          Faster
        </h1>


        {/* =================================================
            HERO DESCRIPTION
        ================================================= */}

        <p>
          AI-powered resume analysis, ATS optimization,
          interview preparation and job tracking —
          all in one platform.
        </p>


        {/* =================================================
            HERO ACTIONS
        ================================================= */}

        <div className="hero-actions">

          <Button
            text="Get Started"
            onClick={handleGetStarted}
          />

          <button
            className="hero-secondary-btn"
            onClick={handleSeeHowItWorks}
          >
            See How It Works →
          </button>

        </div>


        {/* =================================================
            PRODUCT PREVIEW
        ================================================= */}

        <div className="hero-product-preview">

          {/* =================================================
              TOP BAR
          ================================================= */}

          <div className="preview-topbar">

            <div className="preview-brand">
              Critiqon<span>.</span>
            </div>

            <div className="preview-status">

              <span className="status-dot"></span>

              AI Analysis Complete

            </div>

          </div>


          {/* =================================================
              DASHBOARD
          ================================================= */}

          <div className="preview-dashboard">


            {/* =================================================
                LEFT SIDE
            ================================================= */}

            <div className="preview-main">

              <div className="preview-heading">

                <div>

                  <span className="preview-eyebrow">
                    Resume Analysis
                  </span>

                  <h3>
                    Your Resume Score
                  </h3>

                </div>


                <div className="preview-score">

                  87

                  <span>
                    /100
                  </span>

                </div>

              </div>


              {/* =================================================
                  SCORE BAR
              ================================================= */}

              <div className="preview-score-bar">

                <div className="preview-score-fill"></div>

              </div>


              {/* =================================================
                  METRICS
              ================================================= */}

              <div className="preview-metrics">

                <div className="preview-metric">

                  <span>
                    ATS Compatibility
                  </span>

                  <strong>
                    92%
                  </strong>

                </div>


                <div className="preview-metric">

                  <span>
                    Skills Match
                  </span>

                  <strong>
                    89%
                  </strong>

                </div>


                <div className="preview-metric">

                  <span>
                    Interview Readiness
                  </span>

                  <strong>
                    84%
                  </strong>

                </div>

              </div>


              {/* =================================================
                  SKILLS
              ================================================= */}

              <div className="preview-skills">

                <span>
                  Python
                </span>

                <span>
                  React
                </span>

                <span>
                  Machine Learning
                </span>

                <span>
                  SQL
                </span>

                <span>
                  Data Analysis
                </span>

              </div>

            </div>


            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div className="preview-side">

              <div className="preview-side-header">

                <span>
                  AI Recommendations
                </span>

                <span className="preview-ai">
                  ✦ AI
                </span>

              </div>


              {/* =================================================
                  RECOMMENDATION 1
              ================================================= */}

              <div className="preview-recommendation">

                <div className="recommendation-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Strong ATS compatibility
                  </strong>

                  <p>
                    Your resume matches most
                    important keywords.
                  </p>

                </div>

              </div>


              {/* =================================================
                  RECOMMENDATION 2
              ================================================= */}

              <div className="preview-recommendation">

                <div className="recommendation-icon">
                  ↑
                </div>

                <div>

                  <strong>
                    Improve your summary
                  </strong>

                  <p>
                    Add measurable achievements
                    to increase impact.
                  </p>

                </div>

              </div>


              {/* =================================================
                  ACTION
              ================================================= */}

              <button
                className="preview-action"
                onClick={handleImproveResume}
              >
                Improve Resume →
              </button>

            </div>

          </div>

        </div>


        {/* =================================================
            TRUST / VALUE STRIP
        ================================================= */}

        <div className="hero-trust-strip">

          <span>
            <strong>
              AI-Powered
            </strong>
          </span>

          <span className="trust-dot">
            •
          </span>

          <span>
            Resume Analysis
          </span>

          <span className="trust-dot">
            •
          </span>

          <span>
            ATS Ready
          </span>

          <span className="trust-dot">
            •
          </span>

          <span>
            Interview Ready
          </span>

          <span className="trust-dot">
            •
          </span>

          <span>
            Job Matching
          </span>

        </div>

      </section>

    </main>
  );
}

export default Hero;