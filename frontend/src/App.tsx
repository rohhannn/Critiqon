import { useState } from "react";

import {
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";

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


function App() {

  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem("critiqon:intro-seen") !== "1";
    } catch {
      return true;
    }
  });

  const completeIntro = () => {
    try {
      sessionStorage.setItem("critiqon:intro-seen", "1");
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

      <Route
        path="*"
        element={
          <div className="route-not-found">
            <div>
              <span className="route-not-found__code">404</span>
              <h1>Page not found</h1>
              <p>The page you requested does not exist or has moved.</p>
              <a href="/">Return to Critiqon</a>
            </div>
          </div>
        }
      />

    </Routes>

  );

}


export default App;