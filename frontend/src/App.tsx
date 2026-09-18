import { useEffect, useState } from "react";

import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";

import AIResumeAnalyzer
  from "./pages/AIResumeAnalyzer/AIResumeAnalyzer";

import AIJobMatcher
  from "./pages/AIJobMatcher/AIJobMatcher";

import Dashboard from "./pages/Dashboard/Dashboard";

import ResumeAnalysisPage
  from "./pages/ResumeAnalysisPage/ResumeAnalysisPage";

import JobMatch
  from "./pages/JobMatch/JobMatch";

import CoverLetter
  from "./pages/CoverLetter/CoverLetter";

import InterviewPrep
  from "./pages/InterviewPrep/InterviewPrep";

import InterviewHistory
  from "./pages/InterviewHistory/InterviewHistory";

import Reports
  from "./pages/Reports/Reports";

import Settings
  from "./pages/Settings/Settings";

import Pricing
  from "./components/Pricing/Pricing";

import ProtectedRoute
  from "./components/ProtectedRoute";

import FeatureRoute
  from "./components/FeatureRoute";

import LogoIntro
  from "./LogoIntro";

/* =========================================================
   LEGAL PAGES
========================================================= */

import PrivacyPolicy
  from "./pages/PrivacyPolicy/PrivacyPolicy";

import Terms
  from "./pages/Terms/Terms";

import RefundPolicy
  from "./pages/RefundPolicy/RefundPolicy";

import Contact
  from "./pages/Contact/Contact";

import "./App.css";


/* =========================================================
   PAGE SEO
========================================================= */

function PageSEO() {
  const location = useLocation();

  useEffect(() => {
    const seoByPath: Record<
      string,
      {
        title: string;
        description: string;
      }
    > = {
      "/": {
        title:
          "Critiqon – AI Resume Analyzer, Job Matching & Interview Prep",

        description:
          "Critiqon is an AI-powered career platform for resume analysis, ATS optimization, job matching, cover letters, and interview preparation.",
      },

      "/ai-resume-analyzer": {
        title:
          "AI Resume Analyzer – Improve Your Resume | Critiqon",

        description:
          "Analyze your resume with AI and get practical feedback on resume structure, skills, keywords, ATS compatibility, and areas for improvement with Critiqon.",
      },

      "/ai-job-matcher": {
        title:
          "AI Job Matcher – Match Your Resume to Jobs | Critiqon",

        description:
          "Compare your resume with job requirements using AI. Understand your skills, keywords, and job match before applying with Critiqon.",
      },

      "/pricing": {
        title:
          "Pricing – AI Resume & Career Tools | Critiqon",

        description:
          "Explore Critiqon's plans for AI resume analysis, ATS optimization, job matching, cover letters, and interview preparation.",
      },

      "/contact": {
        title:
          "Contact Critiqon – Career & Resume Support",

        description:
          "Contact Critiqon for questions, support, feedback, and general enquiries about our AI-powered career tools.",
      },

      "/privacy-policy": {
        title:
          "Privacy Policy | Critiqon",

        description:
          "Read the Critiqon Privacy Policy to understand how we collect, use, protect, and handle user information.",
      },

      "/terms": {
        title:
          "Terms of Service | Critiqon",

        description:
          "Read the Critiqon Terms of Service covering accounts, AI-generated content, subscriptions, payments, and platform usage.",
      },

      "/refund-policy": {
        title:
          "Refund Policy | Critiqon",

        description:
          "Read the Critiqon Refund Policy covering subscription cancellations, refund requests, duplicate charges, and failed payments.",
      },

      "/login": {
        title:
          "Log In | Critiqon",

        description:
          "Log in to Critiqon to analyze your resume, match with jobs, prepare for interviews, and access your career tools.",
      },

      "/register": {
        title:
          "Create Your Account | Critiqon",

        description:
          "Create a Critiqon account and start using AI-powered resume analysis, job matching, cover letters, and interview preparation.",
      },

      "/dashboard": {
        title:
          "Dashboard | Critiqon",

        description:
          "Your Critiqon career dashboard.",
      },

      "/resume-analysis": {
        title:
          "AI Resume Analysis & ATS Checker | Critiqon",

        description:
          "Analyze your resume with AI, identify improvement opportunities, and evaluate ATS compatibility with Critiqon.",
      },

      "/job-match": {
        title:
          "AI Job Matching | Critiqon",

        description:
          "Match your resume and skills with relevant job opportunities using Critiqon's AI-powered job matching tools.",
      },

      "/cover-letter": {
        title:
          "AI Cover Letter Generator | Critiqon",

        description:
          "Create tailored, professional cover letters with AI using Critiqon's career preparation tools.",
      },

      "/interview-prep": {
        title:
          "AI Interview Preparation | Critiqon",

        description:
          "Prepare for job interviews with AI-generated interview questions, answer evaluation, and personalized preparation tools.",
      },

      "/interview-history": {
        title:
          "Interview History | Critiqon",

        description:
          "Review your previous AI interview preparation sessions and performance.",
      },

      "/reports": {
        title:
          "Career Reports | Critiqon",

        description:
          "View detailed career and resume reports with Critiqon's AI-powered tools.",
      },

      "/settings": {
        title:
          "Account Settings | Critiqon",

        description:
          "Manage your Critiqon account settings and preferences.",
      },
    };

    const currentSEO =
      seoByPath[location.pathname] || {
        title:
          "Critiqon – AI Resume & Career Platform",

        description:
          "Critiqon provides AI-powered resume analysis, ATS optimization, job matching, cover letters, and interview preparation.",
      };


    /* =====================================================
       TITLE
    ===================================================== */

    document.title = currentSEO.title;


    /* =====================================================
       META DESCRIPTION
    ===================================================== */

    let descriptionTag =
      document.querySelector(
        'meta[name="description"]'
      ) as HTMLMetaElement | null;

    if (!descriptionTag) {
      descriptionTag =
        document.createElement("meta");

      descriptionTag.setAttribute(
        "name",
        "description"
      );

      document.head.appendChild(
        descriptionTag
      );
    }

    descriptionTag.setAttribute(
      "content",
      currentSEO.description
    );


    /* =====================================================
       CANONICAL URL
    ===================================================== */

    const canonicalURL =
      `https://critiqon.com${location.pathname}`;

    let canonicalTag =
      document.querySelector(
        'link[rel="canonical"]'
      ) as HTMLLinkElement | null;

    if (!canonicalTag) {
      canonicalTag =
        document.createElement("link");

      canonicalTag.setAttribute(
        "rel",
        "canonical"
      );

      document.head.appendChild(
        canonicalTag
      );
    }

    canonicalTag.setAttribute(
      "href",
      canonicalURL
    );


    /* =====================================================
       OPEN GRAPH TITLE
    ===================================================== */

    let ogTitle =
      document.querySelector(
        'meta[property="og:title"]'
      ) as HTMLMetaElement | null;

    if (!ogTitle) {
      ogTitle =
        document.createElement("meta");

      ogTitle.setAttribute(
        "property",
        "og:title"
      );

      document.head.appendChild(
        ogTitle
      );
    }

    ogTitle.setAttribute(
      "content",
      currentSEO.title
    );


    /* =====================================================
       OPEN GRAPH DESCRIPTION
    ===================================================== */

    let ogDescription =
      document.querySelector(
        'meta[property="og:description"]'
      ) as HTMLMetaElement | null;

    if (!ogDescription) {
      ogDescription =
        document.createElement("meta");

      ogDescription.setAttribute(
        "property",
        "og:description"
      );

      document.head.appendChild(
        ogDescription
      );
    }

    ogDescription.setAttribute(
      "content",
      currentSEO.description
    );


    /* =====================================================
       OPEN GRAPH URL
    ===================================================== */

    let ogURL =
      document.querySelector(
        'meta[property="og:url"]'
      ) as HTMLMetaElement | null;

    if (!ogURL) {
      ogURL =
        document.createElement("meta");

      ogURL.setAttribute(
        "property",
        "og:url"
      );

      document.head.appendChild(
        ogURL
      );
    }

    ogURL.setAttribute(
      "content",
      canonicalURL
    );


    /* =====================================================
       TWITTER TITLE
    ===================================================== */

    let twitterTitle =
      document.querySelector(
        'meta[name="twitter:title"]'
      ) as HTMLMetaElement | null;

    if (!twitterTitle) {
      twitterTitle =
        document.createElement("meta");

      twitterTitle.setAttribute(
        "name",
        "twitter:title"
      );

      document.head.appendChild(
        twitterTitle
      );
    }

    twitterTitle.setAttribute(
      "content",
      currentSEO.title
    );


    /* =====================================================
       TWITTER DESCRIPTION
    ===================================================== */

    let twitterDescription =
      document.querySelector(
        'meta[name="twitter:description"]'
      ) as HTMLMetaElement | null;

    if (!twitterDescription) {
      twitterDescription =
        document.createElement("meta");

      twitterDescription.setAttribute(
        "name",
        "twitter:description"
      );

      document.head.appendChild(
        twitterDescription
      );
    }

    twitterDescription.setAttribute(
      "content",
      currentSEO.description
    );

  }, [location.pathname]);


  return null;
}


/* =========================================================
   SCROLL TO TOP ON ROUTE CHANGE
========================================================= */

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [location.pathname]);

  return null;
}


/* =========================================================
   APP
========================================================= */

function App() {

  const [showIntro, setShowIntro] = useState(() => {
    try {
      return (
        sessionStorage.getItem(
          "critiqon:intro-seen"
        ) !== "1"
      );
    } catch {
      return true;
    }
  });


  const completeIntro = () => {
    try {
      sessionStorage.setItem(
        "critiqon:intro-seen",
        "1"
      );
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }

    setShowIntro(false);
  };


  /* =======================================================
     INTRO
  ======================================================= */

  if (showIntro) {

    return (
      <LogoIntro
        onComplete={completeIntro}
      />
    );

  }


  return (
    <>
      <PageSEO />

      <ScrollToTop />

      <Routes>

        {/* =====================================================
            PUBLIC
        ===================================================== */}

        <Route
          path="/"
          element={
            <Home />
          }
        />


        <Route
          path="/login"
          element={
            <Login />
          }
        />


        <Route
          path="/register"
          element={
            <Register />
          }
        />


        {/* =====================================================
            PUBLIC SEO LANDING PAGE
            AI RESUME ANALYZER
        ===================================================== */}

        <Route
          path="/ai-resume-analyzer"
          element={
            <AIResumeAnalyzer />
          }
        />


        {/* =====================================================
            PUBLIC SEO LANDING PAGE
            AI JOB MATCHER
        ===================================================== */}

        <Route
          path="/ai-job-matcher"
          element={
            <AIJobMatcher />
          }
        />


        <Route
          path="/pricing"
          element={
            <Pricing />
          }
        />


        {/* =====================================================
            LEGAL / PUBLIC
        ===================================================== */}

        <Route
          path="/privacy-policy"
          element={
            <PrivacyPolicy />
          }
        />


        <Route
          path="/terms"
          element={
            <Terms />
          }
        />


        <Route
          path="/refund-policy"
          element={
            <RefundPolicy />
          }
        />


        <Route
          path="/contact"
          element={
            <Contact />
          }
        />


        {/* =====================================================
            DASHBOARD
            FREE+
        ===================================================== */}

        <Route
          path="/dashboard"
          element={

            <ProtectedRoute>

              <FeatureRoute
                requiredPlan="Free"
                featureName="Dashboard"
              >

                <Dashboard />

              </FeatureRoute>

            </ProtectedRoute>

          }
        />


        {/* =====================================================
            RESUME ANALYSIS
            FREE+
        ===================================================== */}

        <Route
          path="/resume-analysis"
          element={

            <ProtectedRoute>

              <FeatureRoute
                requiredPlan="Free"
                featureName="Resume Analysis"
              >

                <ResumeAnalysisPage />

              </FeatureRoute>

            </ProtectedRoute>

          }
        />


        {/* =====================================================
            JOB MATCH
            PRO+
        ===================================================== */}

        <Route
          path="/job-match"
          element={

            <ProtectedRoute>

              <FeatureRoute
                requiredPlan="Pro"
                featureName="Job Match"
              >

                <JobMatch />

              </FeatureRoute>

            </ProtectedRoute>

          }
        />


        {/* =====================================================
            COVER LETTER
            PRO+
        ===================================================== */}

        <Route
          path="/cover-letter"
          element={

            <ProtectedRoute>

              <FeatureRoute
                requiredPlan="Pro"
                featureName="Cover Letter"
              >

                <CoverLetter />

              </FeatureRoute>

            </ProtectedRoute>

          }
        />


        {/* =====================================================
            INTERVIEW PREP
            PRO+
        ===================================================== */}

        <Route
          path="/interview-prep"
          element={

            <ProtectedRoute>

              <FeatureRoute
                requiredPlan="Pro"
                featureName="Interview Preparation"
              >

                <InterviewPrep />

              </FeatureRoute>

            </ProtectedRoute>

          }
        />


        {/* =====================================================
            INTERVIEW HISTORY
            PRO+
        ===================================================== */}

        <Route
          path="/interview-history"
          element={

            <ProtectedRoute>

              <FeatureRoute
                requiredPlan="Pro"
                featureName="Interview History"
              >

                <InterviewHistory />

              </FeatureRoute>

            </ProtectedRoute>

          }
        />


        {/* =====================================================
            REPORTS
            PREMIUM ONLY
        ===================================================== */}

        <Route
          path="/reports"
          element={

            <ProtectedRoute>

              <FeatureRoute
                requiredPlan="Premium"
                featureName="Career Reports"
              >

                <Reports />

              </FeatureRoute>

            </ProtectedRoute>

          }
        />


        {/* =====================================================
            SETTINGS
            FREE+
        ===================================================== */}

        <Route
          path="/settings"
          element={

            <ProtectedRoute>

              <FeatureRoute
                requiredPlan="Free"
                featureName="Settings"
              >

                <Settings />

              </FeatureRoute>

            </ProtectedRoute>

          }
        />


        {/* =====================================================
            404
        ===================================================== */}

        <Route
          path="*"
          element={
            <div className="route-not-found">
              <div>

                <span className="route-not-found__code">
                  404
                </span>

                <h1>
                  Page not found
                </h1>

                <p>
                  The page you requested does not
                  exist or has moved.
                </p>

                <a href="/">
                  Return to Critiqon
                </a>

              </div>
            </div>
          }
        />

      </Routes>
    </>
  );
}


export default App;