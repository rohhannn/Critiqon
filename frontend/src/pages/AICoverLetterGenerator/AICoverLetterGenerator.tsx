import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  PenLine,
  SearchCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { Link } from "react-router-dom";

import "./AICoverLetterGenerator.css";

function AICoverLetterGenerator() {
  return (
    <div className="seo-cover-page">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="seo-cover-navbar">
        <div className="seo-cover-container seo-cover-nav-inner">

          <Link
            to="/"
            className="seo-cover-brand"
            aria-label="Critiqon home"
          >
            <img
              src="/favicon.svg"
              alt="Critiqon"
              className="seo-cover-brand-logo"
            />

            <span>CRITIQON</span>
          </Link>

          <nav className="seo-cover-nav-links">

            <Link to="/ai-resume-analyzer">
              Resume Analyzer
            </Link>

            <Link to="/ai-job-matcher">
              Job Matcher
            </Link>

            <Link to="/pricing">
              Pricing
            </Link>

          </nav>

          <div className="seo-cover-nav-actions">

            <Link
              to="/login"
              className="seo-cover-login"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="seo-cover-nav-button"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>

          </div>

        </div>
      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <main>

        <section className="seo-cover-hero">

          <div className="seo-cover-container seo-cover-hero-grid">

            <div className="seo-cover-hero-content">

              <div className="seo-cover-eyebrow">
                <Sparkles size={15} />
                AI COVER LETTER GENERATOR
              </div>

              <h1>
                AI Cover Letter Generator for Tailored Job Applications
              </h1>

              <p className="seo-cover-hero-description">
                Create a tailored cover letter with AI using your resume
                and the job description. Align your experience with the
                role, highlight relevant skills, and create a professional
                first draft faster with Critiqon.
              </p>

              <div className="seo-cover-hero-actions">

                <Link
                  to="/register"
                  className="seo-cover-primary-button"
                >
                  Create My Cover Letter
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/pricing"
                  className="seo-cover-secondary-button"
                >
                  View Pricing
                </Link>

              </div>

              <div className="seo-cover-trust-row">

                <span>
                  <CheckCircle2 size={16} />
                  AI-powered writing
                </span>

                <span>
                  <CheckCircle2 size={16} />
                  Job-specific content
                </span>

                <span>
                  <CheckCircle2 size={16} />
                  Resume-aligned suggestions
                </span>

              </div>

            </div>


            {/* =================================================
                COVER LETTER PREVIEW
            ================================================= */}

            <div className="seo-cover-preview-wrapper">

              <div className="seo-cover-preview-glow" />

              <div className="seo-cover-preview">

                <div className="seo-cover-preview-header">

                  <div className="seo-cover-preview-title">

                    <div className="seo-cover-preview-icon">
                      <FileText size={18} />
                    </div>

                    <div>
                      <strong>
                        Cover Letter Draft
                      </strong>

                      <span>
                        Software Engineer
                      </span>
                    </div>

                  </div>

                  <div className="seo-cover-ai-badge">
                    <Sparkles size={13} />
                    Critiqon AI
                  </div>

                </div>


                <div className="seo-cover-preview-body">

                  <div className="seo-cover-preview-status">

                    <div className="seo-cover-status-icon">
                      <CheckCircle2 size={18} />
                    </div>

                    <div>
                      <span>
                        ROLE ALIGNED
                      </span>

                      <strong>
                        Strong application fit
                      </strong>
                    </div>

                  </div>


                  <div className="seo-cover-letter-paper">

                    <div className="seo-cover-letter-heading">
                      Dear Hiring Manager,
                    </div>

                    <p>
                      I am excited to apply for the Software Engineer
                      position. My experience building web applications
                      with React, TypeScript, and REST APIs closely
                      aligns with the requirements of this role.
                    </p>

                    <p>
                      Through my previous projects, I have developed
                      practical experience solving technical problems,
                      working with modern development tools, and building
                      reliable user-focused applications.
                    </p>

                    <p>
                      I would welcome the opportunity to bring my
                      technical skills and enthusiasm to your team.
                    </p>

                    <div className="seo-cover-letter-signoff">
                      Sincerely,
                      <br />
                      <strong>Your Name</strong>
                    </div>

                  </div>


                  <div className="seo-cover-matched-section">

                    <div className="seo-cover-section-label">
                      <Target size={15} />
                      MATCHED SKILLS
                    </div>

                    <div className="seo-cover-skill-tags">

                      <span>React</span>
                      <span>TypeScript</span>
                      <span>REST APIs</span>
                      <span>Problem Solving</span>

                    </div>

                  </div>

                </div>


                <div className="seo-cover-preview-footer">

                  <span>
                    Example output
                  </span>

                  <span>
                    AI-assisted draft
                  </span>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            VALUE SECTION
        ===================================================== */}

        <section className="seo-cover-value-section">

          <div className="seo-cover-container">

            <div className="seo-cover-section-heading">

              <span>
                SMARTER APPLICATIONS
              </span>

              <h2>
                Write a cover letter that fits the job.
              </h2>

              <p>
                Critiqon helps turn your resume and a job description
                into a more relevant starting point for your application.
              </p>

            </div>


            <div className="seo-cover-feature-grid">

              <article className="seo-cover-feature-card">

                <div className="seo-cover-feature-icon">
                  <Target size={21} />
                </div>

                <h3>
                  Resume-to-Job Alignment
                </h3>

                <p>
                  Connect your experience and skills with the requirements
                  of the position instead of starting with a generic
                  cover letter.
                </p>

              </article>


              <article className="seo-cover-feature-card">

                <div className="seo-cover-feature-icon">
                  <SearchCheck size={21} />
                </div>

                <h3>
                  Skills & Keywords
                </h3>

                <p>
                  Identify relevant skills and job-specific keywords that
                  can help make your application more aligned with the
                  role you are targeting.
                </p>

              </article>


              <article className="seo-cover-feature-card">

                <div className="seo-cover-feature-icon">
                  <PenLine size={21} />
                </div>

                <h3>
                  Professional Draft
                </h3>

                <p>
                  Generate a structured first draft that you can review,
                  personalize, and refine before submitting your application.
                </p>

              </article>

            </div>

          </div>

        </section>


        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}

        <section className="seo-cover-how-section">

          <div className="seo-cover-container">

            <div className="seo-cover-section-heading seo-cover-centered-heading">

              <span>
                HOW IT WORKS
              </span>

              <h2>
                Create your cover letter in three simple steps.
              </h2>

              <p>
                Give Critiqon the information it needs and start with
                a job-specific draft you can make your own.
              </p>

            </div>


            <div className="seo-cover-steps">

              <div className="seo-cover-step">

                <div className="seo-cover-step-number">
                  01
                </div>

                <div className="seo-cover-step-icon">
                  <FileText size={22} />
                </div>

                <h3>
                  Add your resume
                </h3>

                <p>
                  Provide your resume so Critiqon can understand your
                  experience, skills, projects, and background.
                </p>

              </div>


              <div className="seo-cover-step">

                <div className="seo-cover-step-number">
                  02
                </div>

                <div className="seo-cover-step-icon">
                  <BriefcaseBusiness size={22} />
                </div>

                <h3>
                  Add the job description
                </h3>

                <p>
                  Add the role you are applying for so the content can
                  be aligned with the employer's requirements.
                </p>

              </div>


              <div className="seo-cover-step">

                <div className="seo-cover-step-number">
                  03
                </div>

                <div className="seo-cover-step-icon">
                  <Zap size={22} />
                </div>

                <h3>
                  Generate and personalize
                </h3>

                <p>
                  Get an AI-assisted draft, review the content, and
                  personalize it before sending your application.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="seo-cover-cta-section">

          <div className="seo-cover-container">

            <div className="seo-cover-cta">

              <div className="seo-cover-cta-icon">
                <Sparkles size={23} />
              </div>

              <span>
                READY TO WRITE A BETTER APPLICATION?
              </span>

              <h2>
                Write a more relevant cover letter.
              </h2>

              <p>
                Start with your resume and the job description,
                then create a tailored draft with Critiqon.
              </p>

              <div className="seo-cover-cta-actions">

                <Link
                  to="/register"
                  className="seo-cover-primary-button"
                >
                  Generate My Cover Letter
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/pricing"
                  className="seo-cover-secondary-button"
                >
                  Explore Plans
                </Link>

              </div>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="seo-cover-footer">

        <div className="seo-cover-container seo-cover-footer-inner">

          <Link
            to="/"
            className="seo-cover-footer-brand"
          >
            <img
              src="/favicon.svg"
              alt="Critiqon"
            />

            <span>
              CRITIQON
            </span>
          </Link>

          <div className="seo-cover-footer-links">

            <Link to="/ai-resume-analyzer">
              Resume Analyzer
            </Link>

            <Link to="/ai-job-matcher">
              Job Matcher
            </Link>

            <Link to="/ai-cover-letter-generator">
              Cover Letter Generator
            </Link>

            <Link to="/pricing">
              Pricing
            </Link>

            <Link to="/contact">
              Contact
            </Link>

          </div>

          <div className="seo-cover-footer-legal">

            <Link to="/privacy-policy">
              Privacy
            </Link>

            <Link to="/terms">
              Terms
            </Link>

            <Link to="/refund-policy">
              Refunds
            </Link>

          </div>

          <p>
            © {new Date().getFullYear()} Critiqon. All rights reserved.
          </p>

        </div>

      </footer>

    </div>
  );
}

export default AICoverLetterGenerator;