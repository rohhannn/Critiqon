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

const coverLetterFaqs = [
  {
    question: "What is an AI cover letter generator?",
    answer:
      "An AI cover letter generator creates a tailored cover letter using information such as your resume and the job description. Critiqon helps connect your experience and relevant skills to the requirements of the role.",
  },
  {
    question: "How does AI create a tailored cover letter?",
    answer:
      "AI can compare information from your resume with the requirements and keywords in a job description. Critiqon uses that information to help create a role-specific first draft rather than a generic cover letter.",
  },
  {
    question:
      "Can I generate a cover letter from my resume and job description?",
    answer:
      "Yes. Critiqon's cover letter workflow is designed to use your resume and the job description to create a draft that reflects your experience and the requirements of the specific role.",
  },
  {
    question: "Can I customize an AI-generated cover letter?",
    answer:
      "Yes. An AI-generated cover letter should be reviewed and personalized before you submit it. You can adjust the wording, examples, tone, and details so the final letter accurately represents your experience.",
  },
  {
    question: "How does Critiqon match a cover letter to a job?",
    answer:
      "Critiqon compares information from your resume with the job description and focuses the draft on relevant experience, skills, and role requirements. This helps make the application more specific to the position.",
  },
  {
    question:
      "Should I review an AI-generated cover letter before applying?",
    answer:
      "Yes. Always review an AI-generated cover letter before submitting it. Check that every statement is accurate, the examples reflect your real experience, and the final letter sounds appropriate for the role and company.",
  },
];

function AICoverLetterGenerator() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: coverLetterFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="seo-cover-page">
      {/* =====================================================
          FAQ STRUCTURED DATA
      ===================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

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

      <main>
        {/* =====================================================
            HERO
        ===================================================== */}

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
                      <strong>Cover Letter Draft</strong>
                      <span>Software Engineer</span>
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
                      <span>ROLE ALIGNED</span>
                      <strong>Strong application fit</strong>
                    </div>
                  </div>

                  <div className="seo-cover-letter-paper">
                    <div className="seo-cover-letter-heading">
                      Dear Hiring Manager,
                    </div>

                    <p>
                      I am excited to apply for the Software Engineer
                      position. My experience building web applications
                      with React, TypeScript, and REST APIs closely aligns
                      with the requirements of this role.
                    </p>

                    <p>
                      Through my previous projects, I have developed
                      practical experience solving technical problems,
                      working with modern development tools, and building
                      reliable user-focused applications.
                    </p>

                    <p>
                      I would welcome the opportunity to bring my technical
                      skills and enthusiasm to your team.
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
                  <span>Example output</span>
                  <span>AI-assisted draft</span>
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
              <div className="seo-cover-section-eyebrow">
                <span />
                SMARTER APPLICATIONS
              </div>

              <h2>
                Write a cover letter
                <span> that fits the job.</span>
              </h2>

              <p>
                A strong cover letter should connect your experience to
                the role instead of repeating your resume. Critiqon helps
                you create a more relevant first draft using your resume
                and the job description.
              </p>
            </div>

            <div className="seo-cover-value-grid">
              <article className="seo-cover-value-card">
                <div className="seo-cover-value-icon blue">
                  <Target size={20} />
                </div>

                <h3>Resume-to-Job Alignment</h3>

                <p>
                  Connect your existing experience with the requirements
                  and responsibilities described in the job posting.
                </p>

                <div className="seo-cover-card-tag">
                  <BriefcaseBusiness size={13} />
                  Role relevance
                </div>
              </article>

              <article className="seo-cover-value-card">
                <div className="seo-cover-value-icon green">
                  <SearchCheck size={20} />
                </div>

                <h3>Skills &amp; Keywords</h3>

                <p>
                  Highlight relevant skills and keywords from the role
                  while keeping the content connected to your actual
                  background.
                </p>

                <div className="seo-cover-card-tag green">
                  <Zap size={13} />
                  Job-specific signals
                </div>
              </article>

              <article className="seo-cover-value-card">
                <div className="seo-cover-value-icon purple">
                  <PenLine size={20} />
                </div>

                <h3>Professional Draft</h3>

                <p>
                  Start with a structured professional draft that you can
                  review, personalize, and refine before submitting your
                  application.
                </p>

                <div className="seo-cover-card-tag purple">
                  <Sparkles size={13} />
                  AI-assisted writing
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}

        <section className="seo-cover-how-section">
          <div className="seo-cover-container">
            <div className="seo-cover-section-heading seo-cover-section-heading-centered">
              <div className="seo-cover-section-eyebrow">
                <span />
                HOW IT WORKS
              </div>

              <h2>
                Create a tailored cover letter
                <span> in three simple steps.</span>
              </h2>

              <p>
                Give Critiqon the information it needs and use AI to
                create a role-specific starting point for your application.
              </p>
            </div>

            <div className="seo-cover-steps">
              <div className="seo-cover-step">
                <div className="seo-cover-step-number">
                  01
                </div>

                <div className="seo-cover-step-icon">
                  <FileText size={21} />
                </div>

                <h3>Add your resume</h3>

                <p>
                  Provide your resume so Critiqon can understand your
                  experience, skills, projects, and career background.
                </p>
              </div>

              <div className="seo-cover-step-line" />

              <div className="seo-cover-step">
                <div className="seo-cover-step-number">
                  02
                </div>

                <div className="seo-cover-step-icon">
                  <BriefcaseBusiness size={21} />
                </div>

                <h3>Add the job description</h3>

                <p>
                  Add the job description so the generated content can
                  focus on the role's requirements and relevant keywords.
                </p>
              </div>

              <div className="seo-cover-step-line" />

              <div className="seo-cover-step">
                <div className="seo-cover-step-number">
                  03
                </div>

                <div className="seo-cover-step-icon">
                  <PenLine size={21} />
                </div>

                <h3>Generate and personalize</h3>

                <p>
                  Create your AI-assisted draft, then review and
                  personalize it before submitting your application.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            FAQ
        ===================================================== */}

        <section
          className="seo-cover-section seo-cover-faq-section"
          aria-labelledby="cover-letter-faq-heading"
        >
          <div className="seo-cover-container">
            <div className="seo-cover-section-heading seo-cover-section-heading-centered">
              <div className="seo-cover-section-eyebrow">
                <span />
                FREQUENTLY ASKED QUESTIONS
              </div>

              <h2 id="cover-letter-faq-heading">
                Questions about AI cover letter
                <span> generation and tailoring.</span>
              </h2>

              <p>
                Learn how AI cover letter generation works, how resumes
                and job descriptions are used, and why reviewing your
                final application matters.
              </p>
            </div>

            <div className="seo-cover-faq-list">
              {coverLetterFaqs.map((faq) => (
                <details
                  className="seo-cover-faq-item"
                  key={faq.question}
                >
                  <summary>
                    <span className="seo-cover-faq-question">
                      {faq.question}
                    </span>

                    <span
                      className="seo-cover-faq-toggle"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>

                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="seo-cover-cta-section">
          <div className="seo-cover-container">
            <div className="seo-cover-cta-card">
              <div className="seo-cover-cta-decoration one" />
              <div className="seo-cover-cta-decoration two" />

              <div className="seo-cover-cta-content">
                <div className="seo-cover-section-eyebrow">
                  <span />
                  READY TO WRITE A BETTER APPLICATION?
                </div>

                <h2>
                  Write a more relevant
                  <span> cover letter.</span>
                </h2>

                <p>
                  Use your resume and job description to create an
                  AI-assisted cover letter draft tailored to the role.
                </p>

                <div className="seo-cover-cta-actions">
                  <Link
                    to="/register"
                    className="seo-cover-primary-button"
                  >
                    Create My Cover Letter
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    to="/pricing"
                    className="seo-cover-cta-pricing-link"
                  >
                    Explore pricing
                  </Link>
                </div>
              </div>

              <div className="seo-cover-cta-icon">
                <PenLine size={31} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="seo-cover-footer">
        <div className="seo-cover-container">
          <div className="seo-cover-footer-grid">
            <div className="seo-cover-footer-brand">
              <Link
                to="/"
                className="seo-cover-brand"
              >
                <img
                  src="/favicon.svg"
                  alt="Critiqon"
                  className="seo-cover-brand-logo"
                />

                <span>CRITIQON</span>
              </Link>

              <p>
                AI-powered tools to help you improve your resume,
                understand job fit, create tailored applications, and
                prepare for your career.
              </p>
            </div>

            <div className="seo-cover-footer-column">
              <h4>AI Career Tools</h4>

              <Link to="/ai-resume-analyzer">
                AI Resume Analyzer
              </Link>

              <Link to="/ai-job-matcher">
                AI Job Matcher
              </Link>

              <Link to="/ai-cover-letter-generator">
                AI Cover Letter Generator
              </Link>

              <Link to="/pricing">
                Pricing
              </Link>
            </div>

            <div className="seo-cover-footer-column">
              <h4>Support</h4>

              <Link to="/contact">
                Contact Us
              </Link>

              <Link to="/privacy-policy">
                Privacy Policy
              </Link>

              <Link to="/terms">
                Terms of Service
              </Link>

              <Link to="/refund-policy">
                Refund Policy
              </Link>
            </div>
          </div>

          <div className="seo-cover-footer-bottom">
            <span>
              © {new Date().getFullYear()} Critiqon. All rights
              reserved.
            </span>

            <span>
              AI-powered career tools
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AICoverLetterGenerator;