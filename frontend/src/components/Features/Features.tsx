import "./Features.css";
import FeatureCard from "../FeatureCard/FeatureCard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Features() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLoggedIn = !!user;

  return (
    <section className="features" id="features">
      <div className="features-container">

        {/* SECTION HEADER */}
        <div className="features-header">
          <div className="features-label">
            <span className="features-label-dot" />
            POWERFUL TOOLS FOR YOUR CAREER
          </div>

          <h2>
            Everything you need
            <span className="features-title-accent"> to get hired.</span>
          </h2>

          <p className="subtitle">
            One platform for resume optimization, AI-powered interviews,
            and job tracking — built to help you move from application
            to offer with confidence.
          </p>
        </div>

        {/* FEATURE GRID */}
        <div className="feature-grid">
          <FeatureCard
            title="Resume Analyzer"
            description="Upload your resume and receive instant AI-powered feedback to improve clarity, impact and overall quality."
            metric={isLoggedIn ? "87/100" : undefined}
            metricLabel={isLoggedIn ? "Resume Score" : undefined}
            onClick={() => navigate("/resume-analysis")}
          />

          <FeatureCard
            title="ATS Optimization"
            description="Check your resume against ATS requirements and identify the keywords and sections you need to improve."
            metric={isLoggedIn ? "92%" : undefined}
            metricLabel={isLoggedIn ? "ATS Match" : undefined}
            onClick={() => navigate("/resume-analysis")}
          />

          <FeatureCard
            title="AI Mock Interviews"
            description="Practice realistic HR and technical interviews with AI and become more confident before the real interview."
            metric={isLoggedIn ? "8.6/10" : undefined}
            metricLabel={isLoggedIn ? "Interview Score" : undefined}
            onClick={() => navigate("/interview-prep")}
          />

          <FeatureCard
            title="Job Tracker"
            description="Keep your applications organized and track your progress from application to interview and offer."
            metric={isLoggedIn ? "12" : undefined}
            metricLabel={isLoggedIn ? "Active Applications" : undefined}
            onClick={() => navigate("/dashboard")}
          />
        </div>

        {/* BOTTOM NOTE */}
        <div className="features-footer">
          <span className="features-footer-line" />
          <span>Everything in one place. Built around your career.</span>
          <span className="features-footer-line" />
        </div>

      </div>
    </section>
  );
}

export default Features;