import "./AIResumeAnalyzer.css";

import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  Lightbulb,
  SearchCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Link } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

function AIResumeAnalyzer() {
  return (
    <div className="seo-resume-page">
      <Navbar />

      <main>

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="seo-resume-hero">

          <div className="seo-resume-container">

            <div className="seo-resume-hero-grid">

              <div className="seo-resume-hero-copy">

                <div className="seo-resume-eyebrow">
                  <span className="seo-eyebrow-icon">
                    <Sparkles size={14} />
                  </span>

                  AI RESUME ANALYSIS

                  <span className="seo-eyebrow-line" />
                </div>

                <h1>
                  AI Resume Analyzer
                  <span>
                    to Improve Your Resume
                  </span>
                </h1>

                <p className="seo-resume-hero-description">
                  Analyze your resume with AI and get practical
                  feedback on content, skills, structure, and ATS
                  compatibility. Critiqon helps you identify areas
                  to improve before applying for jobs.
                </p>

                <div className="seo-resume-actions">

                  <Link
                    to="/register"
                    className="seo-primary-button"
                  >
                    Analyze Your Resume
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    to="/pricing"
                    className="seo-secondary-button"
                  >
                    View Pricing
                  </Link>

                </div>

                <div className="seo-trust-row">

                  <span>
                    <CheckCircle2 size={15} />
                    AI-powered analysis
                  </span>

                  <span>
                    <CheckCircle2 size={15} />
                    ATS-focused feedback
                  </span>

                  <span>
                    <CheckCircle2 size={15} />
                    Practical suggestions
                  </span>

                </div>

              </div>


              {/* =================================================
                  ANALYSIS PREVIEW
              ================================================= */}

              <div className="seo-analysis-preview">

                <div className="seo-preview-glow" />

                <div className="seo-preview-card">

                  <div className="seo-preview-top">

                    <div className="seo-preview-title">

                      <div className="seo-preview-icon">
                        <FileCheck2 size={18} />
                      </div>

                      <div>
                        <strong>
                          Resume Intelligence
                        </strong>

                        <span>
                          Example analysis
                        </span>
                      </div>

                    </div>

                    <span className="seo-preview-ai">
                      <Sparkles size={13} />
                      AI Powered
                    </span>

                  </div>


                  <div className="seo-score-section">

                    <div className="seo-score-label">
                      <span>ATS READINESS</span>
                      <span className="seo-score-status">
                        Strong
                      </span>
                    </div>

                    <div className="seo-score-row">

                      <div className="seo-score-number">
                        78
                        <span>/100</span>
                      </div>

                      <div className="seo-score-info">
                        <strong>
                          Good foundation
                        </strong>

                        <p>
                          A few targeted improvements can
                          strengthen screening performance.
                        </p>
                      </div>

                    </div>

                    <div className="seo-score-progress">
                      <div
                        className="seo-score-progress-fill"
                        style={{ width: "78%" }}
                      />
                    </div>

                  </div>


                  <div className="seo-preview-divider" />


                  <div className="seo-preview-signals">

                    <div className="seo-signal-heading">
                      <span>ANALYSIS AREAS</span>
                      <span>5 checks</span>
                    </div>

                    <div className="seo-signal-list">

                      <div className="seo-signal">
                        <span className="seo-signal-icon positive">
                          <CheckCircle2 size={14} />
                        </span>

                        <span>
                          Resume structure
                        </span>
                      </div>

                      <div className="seo-signal">
                        <span className="seo-signal-icon positive">
                          <CheckCircle2 size={14} />
                        </span>

                        <span>
                          Skills and keywords
                        </span>
                      </div>

                      <div className="seo-signal">
                        <span className="seo-signal-icon positive">
                          <CheckCircle2 size={14} />
                        </span>

                        <span>
                          ATS compatibility
                        </span>
                      </div>

                      <div className="seo-signal">
                        <span className="seo-signal-icon warning">
                          <Lightbulb size={14} />
                        </span>

                        <span>
                          Improvement suggestions
                        </span>
                      </div>

                      <div className="seo-signal">
                        <span className="seo-signal-icon purple">
                          <Target size={14} />
                        </span>

                        <span>
                          Recommended roles
                        </span>
                      </div>

                    </div>

                  </div>


                  <div className="seo-preview-footer">

                    <span>
                      <Sparkles size={13} />
                      Example output
                    </span>

                    <span>
                      Critiqon AI
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            INTRO / VALUE
        ===================================================== */}

        <section className="seo-resume-section seo-value-section">

          <div className="seo-resume-container">

            <div className="seo-section-heading">

              <div className="seo-section-eyebrow">
                <span />
                RESUME INTELLIGENCE
              </div>

              <h2>
                Understand what your resume is doing well
                <span> and what needs improvement.</span>
              </h2>

              <p>
                A strong resume is more than a list of experience.
                Critiqon analyzes the information that matters when
                preparing your resume for modern job applications.
              </p>

            </div>


            <div className="seo-analysis-grid">

              <article className="seo-feature-card">

                <div className="seo-feature-icon blue">
                  <TrendingUp size={20} />
                </div>

                <h3>
                  ATS Compatibility
                </h3>

                <p>
                  Review your resume structure and formatting
                  for compatibility with automated screening
                  systems.
                </p>

                <div className="seo-card-tag">
                  <SearchCheck size={13} />
                  Screening readiness
                </div>

              </article>


              <article className="seo-feature-card">

                <div className="seo-feature-icon green">
                  <Zap size={20} />
                </div>

                <h3>
                  Skills & Keywords
                </h3>

                <p>
                  Identify skills and keywords already present
                  in your resume and areas where relevant skills
                  may be missing.
                </p>

                <div className="seo-card-tag green">
                  <Target size={13} />
                  Skill signals
                </div>

              </article>


              <article className="seo-feature-card">

                <div className="seo-feature-icon purple">
                  <Lightbulb size={20} />
                </div>

                <h3>
                  Actionable Suggestions
                </h3>

                <p>
                  Get practical recommendations that help you
                  improve resume content, clarity, structure,
                  and job relevance.
                </p>

                <div className="seo-card-tag purple">
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

        <section className="seo-resume-section seo-how-section">

          <div className="seo-resume-container">

            <div className="seo-section-heading centered">

              <div className="seo-section-eyebrow">
                <span />
                HOW IT WORKS
              </div>

              <h2>
                Get AI-powered resume feedback
                <span> in a few simple steps.</span>
              </h2>

              <p>
                Critiqon turns your resume into practical,
                easy-to-understand insights you can use before
                applying for your next role.
              </p>

            </div>


            <div className="seo-steps">

              <div className="seo-step">

                <div className="seo-step-number">
                  01
                </div>

                <div className="seo-step-icon">
                  <FileText size={21} />
                </div>

                <h3>
                  Upload your resume
                </h3>

                <p>
                  Provide your resume so Critiqon can analyze
                  its content, structure, skills, and experience.
                </p>

              </div>


              <div className="seo-step-line" />


              <div className="seo-step">

                <div className="seo-step-number">
                  02
                </div>

                <div className="seo-step-icon">
                  <Sparkles size={21} />
                </div>

                <h3>
                  Let AI analyze it
                </h3>

                <p>
                  Critiqon processes your resume and organizes
                  the results into useful career insights.
                </p>

              </div>


              <div className="seo-step-line" />


              <div className="seo-step">

                <div className="seo-step-number">
                  03
                </div>

                <div className="seo-step-icon">
                  <Target size={21} />
                </div>

                <h3>
                  Improve and apply
                </h3>

                <p>
                  Use the feedback to strengthen your resume
                  before moving forward with job applications.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="seo-resume-cta">

          <div className="seo-resume-container">

            <div className="seo-cta-card">

              <div className="seo-cta-decoration one" />
              <div className="seo-cta-decoration two" />

              <div className="seo-cta-content">

                <div className="seo-section-eyebrow">
                  <span />
                  READY TO IMPROVE YOUR RESUME?
                </div>

                <h2>
                  Turn your resume into
                  <span> a stronger application.</span>
                </h2>

                <p>
                  Analyze your resume with Critiqon and get
                  practical AI-powered feedback before applying
                  for your next opportunity.
                </p>

                <div className="seo-cta-actions">

                  <Link
                    to="/register"
                    className="seo-primary-button"
                  >
                    Analyze Your Resume
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    to="/pricing"
                    className="seo-cta-pricing-link"
                  >
                    Explore plans
                  </Link>

                </div>

              </div>

              <div className="seo-cta-icon">
                <Sparkles size={30} />
              </div>

            </div>

          </div>

        </section>

      </main>

      <Footer />

    </div>
  );
}

export default AIResumeAnalyzer;