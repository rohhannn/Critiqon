import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./AIJobMatcher.css";

function AIJobMatcher() {
  return (
    <div className="seo-job-page">
      <Navbar />

      <main>
        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="seo-job-hero">
          <div className="seo-job-container">

            <div className="seo-job-hero-grid">

              <div className="seo-job-hero-copy">

                <div className="seo-job-eyebrow">
                  <span />
                  AI JOB MATCHING
                </div>

                <h1>
                  Find Jobs That
                  <span> Match Your Skills</span>
                </h1>

                <p className="seo-job-hero-description">
                  Compare your resume with job requirements using AI.
                  Understand how well your skills, experience, and
                  keywords match a role before you apply.
                </p>

                <div className="seo-job-actions">

                  <Link
                    to="/register"
                    className="seo-job-primary-button"
                  >
                    Match My Resume
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    to="/pricing"
                    className="seo-job-secondary-button"
                  >
                    View Pricing
                  </Link>

                </div>

                <div className="seo-job-trust-row">

                  <span>
                    <CheckCircle2 size={14} />
                    Resume-to-job matching
                  </span>

                  <span>
                    <CheckCircle2 size={14} />
                    Skill comparison
                  </span>

                  <span>
                    <CheckCircle2 size={14} />
                    AI-powered insights
                  </span>

                </div>

              </div>


              {/* =================================================
                  JOB MATCH PREVIEW
                  ================================================= */}

              <div className="seo-job-preview-wrapper">

                <div className="seo-job-preview-card">

                  <div className="seo-job-preview-glow" />

                  <div className="seo-job-preview-top">

                    <div className="seo-job-preview-title">

                      <div className="seo-job-preview-icon">
                        <BriefcaseBusiness size={18} />
                      </div>

                      <div>
                        <strong>Job Match Analysis</strong>
                        <span>Software Engineer</span>
                      </div>

                    </div>

                    <div className="seo-job-preview-ai">
                      <Sparkles size={12} />
                      Critiqon AI
                    </div>

                  </div>


                  <div className="seo-job-match-score">

                    <div className="seo-job-match-score-label">
                      <span>MATCH SCORE</span>

                      <strong>Strong match</strong>
                    </div>

                    <div className="seo-job-score-row">

                      <div className="seo-job-score-circle">
                        <div>
                          <strong>86</strong>
                          <span>%</span>
                        </div>
                      </div>

                      <div className="seo-job-score-copy">
                        <strong>Good role compatibility</strong>

                        <p>
                          Your resume aligns well with the
                          requirements of this example role.
                        </p>
                      </div>

                    </div>

                  </div>


                  <div className="seo-job-progress">

                    <span
                      className="seo-job-progress-fill"
                    />

                  </div>


                  <div className="seo-job-preview-divider" />


                  <div className="seo-job-signals-heading">

                    <span>MATCH INSIGHTS</span>

                    <span>Example analysis</span>

                  </div>


                  <div className="seo-job-signal-list">

                    <div className="seo-job-signal">

                      <div className="seo-job-signal-icon positive">
                        <CheckCircle2 size={13} />
                      </div>

                      <span>
                        Strong technical skills match
                      </span>

                    </div>


                    <div className="seo-job-signal">

                      <div className="seo-job-signal-icon positive">
                        <Target size={13} />
                      </div>

                      <span>
                        Relevant experience identified
                      </span>

                    </div>


                    <div className="seo-job-signal">

                      <div className="seo-job-signal-icon warning">
                        <Search size={13} />
                      </div>

                      <span>
                        Some job keywords could be added
                      </span>

                    </div>


                    <div className="seo-job-signal">

                      <div className="seo-job-signal-icon purple">
                        <TrendingUp size={13} />
                      </div>

                      <span>
                        Resume can be tailored further
                      </span>

                    </div>

                  </div>


                  <div className="seo-job-preview-footer">

                    <span>
                      <Sparkles size={12} />
                      Example output
                    </span>

                    <span>
                      AI-powered job insights
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>


        {/* =====================================================
            VALUE SECTION
        ===================================================== */}

        <section className="seo-job-section seo-job-value-section">

          <div className="seo-job-container">

            <div className="seo-job-section-heading">

              <div className="seo-job-section-eyebrow">
                <span />
                SMARTER JOB SEARCH
              </div>

              <h2>
                Understand how your resume
                <span> fits the role.</span>
              </h2>

              <p>
                Instead of applying blindly, use AI to compare
                your resume with the skills and requirements
                employers are looking for.
              </p>

            </div>


            <div className="seo-job-feature-grid">

              <article className="seo-job-feature-card">

                <div className="seo-job-feature-icon blue">
                  <Target size={20} />
                </div>

                <h3>
                  Resume-to-Job Matching
                </h3>

                <p>
                  Compare your resume with a job description
                  to understand how closely your background
                  aligns with the role.
                </p>

                <div className="seo-job-card-tag">
                  <BriefcaseBusiness size={13} />
                  Role compatibility
                </div>

              </article>


              <article className="seo-job-feature-card">

                <div className="seo-job-feature-icon green">
                  <Search size={20} />
                </div>

                <h3>
                  Skills & Keywords
                </h3>

                <p>
                  Identify relevant skills and keywords that
                  appear in the job description and see how
                  they compare with your resume.
                </p>

                <div className="seo-job-card-tag green">
                  <Zap size={13} />
                  Keyword signals
                </div>

              </article>


              <article className="seo-job-feature-card">

                <div className="seo-job-feature-icon purple">
                  <TrendingUp size={20} />
                </div>

                <h3>
                  Match Insights
                </h3>

                <p>
                  Get practical insights into strengths,
                  missing areas, and ways you can tailor
                  your application for a specific role.
                </p>

                <div className="seo-job-card-tag purple">
                  <Sparkles size={13} />
                  AI recommendations
                </div>

              </article>

            </div>

          </div>

        </section>


        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}

        <section className="seo-job-section seo-job-how-section">

          <div className="seo-job-container">

            <div className="seo-job-section-heading centered">

              <div className="seo-job-section-eyebrow">
                <span />
                HOW IT WORKS
              </div>

              <h2>
                See your job match
                <span> in three simple steps.</span>
              </h2>

              <p>
                Critiqon helps turn a job description and your
                resume into clear, useful matching insights.
              </p>

            </div>


            <div className="seo-job-steps">

              <div className="seo-job-step">

                <div className="seo-job-step-number">
                  01
                </div>

                <div className="seo-job-step-icon">
                  <FileText size={21} />
                </div>

                <h3>
                  Add your resume
                </h3>

                <p>
                  Upload your resume so Critiqon can understand
                  your skills, experience, education, and career
                  background.
                </p>

              </div>


              <div className="seo-job-step-line" />


              <div className="seo-job-step">

                <div className="seo-job-step-number">
                  02
                </div>

                <div className="seo-job-step-icon">
                  <BriefcaseBusiness size={21} />
                </div>

                <h3>
                  Add the job
                </h3>

                <p>
                  Provide the job description you want to
                  evaluate and let AI compare its requirements
                  with your background.
                </p>

              </div>


              <div className="seo-job-step-line" />


              <div className="seo-job-step">

                <div className="seo-job-step-number">
                  03
                </div>

                <div className="seo-job-step-icon">
                  <Target size={21} />
                </div>

                <h3>
                  Understand your match
                </h3>

                <p>
                  Review your match score, relevant skills,
                  missing areas, and practical insights before
                  applying.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="seo-job-cta">

          <div className="seo-job-container">

            <div className="seo-job-cta-card">

              <div className="seo-job-cta-decoration one" />
              <div className="seo-job-cta-decoration two" />

              <div className="seo-job-cta-content">

                <div className="seo-job-section-eyebrow">
                  <span />
                  READY TO FIND YOUR MATCH?
                </div>

                <h2>
                  Apply with more
                  <span> confidence.</span>
                </h2>

                <p>
                  Compare your resume with job requirements
                  using Critiqon's AI-powered job matching
                  tools and understand where you stand before
                  you apply.
                </p>

                <div className="seo-job-cta-actions">

                  <Link
                    to="/register"
                    className="seo-job-primary-button"
                  >
                    Start Matching
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    to="/pricing"
                    className="seo-job-cta-pricing-link"
                  >
                    Explore pricing
                  </Link>

                </div>

              </div>


              <div className="seo-job-cta-icon">
                <BriefcaseBusiness size={34} />
              </div>

            </div>

          </div>

        </section>

      </main>

      <Footer />

    </div>
  );
}

export default AIJobMatcher;