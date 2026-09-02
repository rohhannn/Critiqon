import "./Dashboard.css";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Brain,
  CheckCircle2,
  FileText,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import Sidebar from "../../components/Sidebar/Sidebar";
import Topbar from "../../components/Topbar/Topbar";
import WelcomeBanner from "../../components/WelcomeBanner/WelcomeBanner";
import DashboardStats from "../../components/DashboardStats/DashboardStats";
import ATSTrendChart from "../../components/ATSTrendChart/ATSTrendChart";
import RecentResume from "../../components/RecentResume/RecentResume";
import ResumeUpload from "../../components/ResumeUpload/ResumeUpload";

interface RecentResumeData {
  id: number;
  filename: string;
  ats_score: number;
  uploaded_at: string;
}

interface ATSHistoryItem {
  label: string;
  score: number;
}

interface DashboardData {
  user: string;
  total_resumes: number;
  latest_ats_score: number;
  average_ats_score: number;
  skills_found: number;
  recent_resume: RecentResumeData | null;
  ats_history: ATSHistoryItem[];
  total_interviews: number;
  completed_interviews: number;
  total_questions_answered: number;
  average_interview_score: number;
  latest_interview_score: number;
}

function Dashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] =
    useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [activeFocus, setActiveFocus] = useState<
    "overview" | "resume" | "interview"
  >("overview");

  async function loadDashboard(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(false);

      const response =
        await api.get<DashboardData>("/dashboard/");

      setDashboardData(response.data);
    } catch (requestError) {
      console.error("Failed to load dashboard", requestError);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    if (!dashboardData) {
      return {
        resumeScore: 0,
        averageATS: 0,
        interviewScore: 0,
        interviewProgress: 0,
        interviewCompletion: 0,
        readiness: 0,
        trend: 0,
      };
    }

    const resumeScore = Math.max(
      0,
      Math.min(100, Number(dashboardData.latest_ats_score) || 0)
    );

    const averageATS = Math.max(
      0,
      Math.min(100, Number(dashboardData.average_ats_score) || 0)
    );

    const interviewScore = Math.max(
      0,
      Math.min(
        10,
        Number(dashboardData.average_interview_score) || 0
      )
    );

    const interviewProgress = Math.round(interviewScore * 10);

    const interviewCompletion =
      dashboardData.total_interviews > 0
        ? Math.round(
            (dashboardData.completed_interviews /
              dashboardData.total_interviews) *
              100
          )
        : 0;

    const history = dashboardData.ats_history
      .map((item) => Number(item.score))
      .filter((score) => Number.isFinite(score));

    const previous =
      history.length > 1
        ? history[history.length - 2]
        : null;

    const trend =
      previous !== null
        ? Math.round(resumeScore - previous)
        : 0;

    const readiness = Math.round(
      resumeScore * 0.55 +
        averageATS * 0.2 +
        interviewProgress * 0.25
    );

    return {
      resumeScore,
      averageATS,
      interviewScore,
      interviewProgress,
      interviewCompletion,
      readiness: Math.max(0, Math.min(100, readiness)),
      trend,
    };
  }, [dashboardData]);

  const readinessLabel =
    metrics.readiness >= 80
      ? "Strong position"
      : metrics.readiness >= 60
        ? "Building momentum"
        : metrics.readiness >= 40
          ? "Room to improve"
          : "Let's get started";

  const readinessMessage =
    metrics.readiness >= 80
      ? "Your profile is in a strong position. Keep refining it and stay interview-ready."
      : metrics.readiness >= 60
        ? "You have a solid foundation. A few focused improvements can move your profile forward."
        : metrics.readiness >= 40
          ? "Your dashboard shows clear opportunities to improve your resume and interview performance."
          : "Start with a resume analysis, then use the insights to build a stronger profile.";

  const hasATSHistory =
    Boolean(dashboardData?.ats_history?.length);

  if (loading) {
    return (
      <div
        className="dashboard-route-state"
        role="status"
        aria-live="polite"
      >
        <div className="dashboard-loading-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div>
          <strong>Preparing your dashboard</strong>
          <p>Loading your latest career data…</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div
        className="dashboard-route-state dashboard-route-state--error"
        role="alert"
      >
        <div className="dashboard-state-icon" aria-hidden="true">
          <AlertCircle size={24} />
        </div>

        <div>
          <strong>We couldn’t load your dashboard</strong>
          <p>
            Check your connection and try again. Your saved data has not
            been changed.
          </p>

          <button
            type="button"
            className="dashboard-retry"
            onClick={() => void loadDashboard()}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Topbar />

        <main className="dashboard-content">
          <section className="dashboard-hero-section dashboard-reveal dashboard-reveal--1">
            <WelcomeBanner user={dashboardData.user || "User"} />

            <div className="dashboard-command-bar">
              <div className="dashboard-command-copy">
                <span className="dashboard-live-dot" />
                <span>
                  Dashboard overview
                  <strong>Live account data</strong>
                </span>
              </div>

              <div className="dashboard-command-actions">
                <button
                  type="button"
                  className="dashboard-refresh-button"
                  onClick={() => void loadDashboard(false)}
                  disabled={refreshing}
                  aria-label="Refresh dashboard"
                  title="Refresh dashboard"
                >
                  <RefreshCw
                    size={15}
                    className={refreshing ? "is-spinning" : ""}
                  />
                  {refreshing ? "Refreshing" : "Refresh"}
                </button>

                <button
                  type="button"
                  className="dashboard-primary-action"
                  onClick={() => navigate("/resume-analysis")}
                >
                  <Upload size={15} />
                  Analyze resume
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          </section>

          <section className="dashboard-focus-section dashboard-reveal dashboard-reveal--2">
            <div className="dashboard-focus-card">
              <div className="dashboard-focus-copy">
                <span className="dashboard-focus-eyebrow">
                  YOUR NEXT MOVE
                </span>
                <h2>{readinessLabel}</h2>
                <p>{readinessMessage}</p>
              </div>

              <div className="dashboard-focus-score">
                <div
                  className="dashboard-focus-ring"
                  style={{
                    "--readiness": `${metrics.readiness}%`,
                  } as React.CSSProperties}
                >
                  <div>
                    <strong>{metrics.readiness}</strong>
                    <span>/100</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-focus-progress">
                <div>
                  <span>Career readiness</span>
                  <strong>{metrics.readiness}%</strong>
                </div>
                <div className="dashboard-focus-track">
                  <span
                    style={{
                      width: `${metrics.readiness}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            className="dashboard-performance-section dashboard-reveal dashboard-reveal--3"
            aria-labelledby="dashboard-performance-title"
          >
            <div className="section-heading section-heading--compact">
              <div>
                <span className="section-eyebrow">AT A GLANCE</span>
                <h2 id="dashboard-performance-title">
                  Your career performance
                </h2>
              </div>

              <span className="section-meta">
                {dashboardData.total_resumes}{" "}
                {dashboardData.total_resumes === 1
                  ? "resume"
                  : "resumes"}{" "}
                · {dashboardData.total_interviews}{" "}
                {dashboardData.total_interviews === 1
                  ? "interview"
                  : "interviews"}
              </span>
            </div>

            <DashboardStats stats={dashboardData} />
          </section>

          <section className="dashboard-quick-actions dashboard-reveal dashboard-reveal--4">
            <div className="section-heading section-heading--compact">
              <div>
                <span className="section-eyebrow">QUICK ACTIONS</span>
                <h2>Move your profile forward</h2>
              </div>
            </div>

            <div className="dashboard-action-grid">
              <button
                type="button"
                className={`dashboard-action-card ${
                  activeFocus === "resume"
                    ? "dashboard-action-card--active"
                    : ""
                }`}
                onClick={() => {
                  setActiveFocus("resume");
                  navigate("/resume-analysis");
                }}
              >
                <span className="dashboard-action-icon dashboard-action-icon--green">
                  <FileText size={19} />
                </span>
                <span className="dashboard-action-content">
                  <strong>Improve your resume</strong>
                  <small>
                    Review ATS score and optimization insights
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>

              <button
                type="button"
                className={`dashboard-action-card ${
                  activeFocus === "interview"
                    ? "dashboard-action-card--active"
                    : ""
                }`}
                onClick={() => {
                  setActiveFocus("interview");
                  navigate("/interview-prep");
                }}
              >
                <span className="dashboard-action-icon dashboard-action-icon--purple">
                  <Brain size={19} />
                </span>
                <span className="dashboard-action-content">
                  <strong>Practice interviews</strong>
                  <small>
                    Build confidence with interview preparation
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>

              <button
                type="button"
                className={`dashboard-action-card ${
                  activeFocus === "overview"
                    ? "dashboard-action-card--active"
                    : ""
                }`}
                onClick={() => navigate("/job-match")}
              >
                <span className="dashboard-action-icon dashboard-action-icon--blue">
                  <Target size={19} />
                </span>
                <span className="dashboard-action-content">
                  <strong>Match a job</strong>
                  <small>
                    Compare your profile against a target role
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>

              <button
                type="button"
                className="dashboard-action-card"
                onClick={() => navigate("/reports")}
              >
                <span className="dashboard-action-icon dashboard-action-icon--amber">
                  <BarChart3 size={19} />
                </span>
                <span className="dashboard-action-content">
                  <strong>View insights</strong>
                  <small>
                    Explore your complete performance reports
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            </div>
          </section>

          <section className="dashboard-grid dashboard-reveal dashboard-reveal--5">
            <div className="dashboard-panel dashboard-panel--chart">
              <div className="dashboard-panel-topline">
                <div>
                  <span className="section-eyebrow">PROGRESS</span>
                  <h2>ATS score trend</h2>
                  <p>
                    Track how your resume performance changes over time.
                  </p>
                </div>

                <div className="dashboard-trend-badge">
                  {metrics.trend > 0 ? (
                    <TrendingUp size={15} />
                  ) : (
                    <BarChart3 size={15} />
                  )}
                  <span>
                    {metrics.trend > 0
                      ? `+${metrics.trend} pts`
                      : metrics.trend < 0
                        ? `${metrics.trend} pts`
                        : "Tracking"}
                  </span>
                </div>
              </div>

              <ATSTrendChart data={dashboardData.ats_history} />
            </div>

            <div className="dashboard-panel dashboard-panel--progress">
              <div className="progress-panel-header">
                <div>
                  <span className="section-eyebrow">READINESS</span>
                  <h2>Career readiness</h2>
                  <p>
                    A balanced view of resume and interview performance.
                  </p>
                </div>

                <div
                  className="readiness-orb"
                  aria-label={`Career readiness ${metrics.readiness} out of 100`}
                >
                  <span>{metrics.readiness}</span>
                  <small>/100</small>
                </div>
              </div>

              <div className="readiness-list">
                <div className="readiness-row">
                  <div className="readiness-label">
                    <span>Latest ATS score</span>
                    <strong>{Math.round(metrics.resumeScore)}%</strong>
                  </div>

                  <div className="readiness-track">
                    <span
                      style={{
                        width: `${metrics.resumeScore}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="readiness-row">
                  <div className="readiness-label">
                    <span>Average ATS score</span>
                    <strong>{Math.round(metrics.averageATS)}%</strong>
                  </div>

                  <div className="readiness-track">
                    <span
                      style={{
                        width: `${metrics.averageATS}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="readiness-row">
                  <div className="readiness-label">
                    <span>Interview performance</span>
                    <strong>
                      {metrics.interviewScore.toFixed(1)}/10
                    </strong>
                  </div>

                  <div className="readiness-track">
                    <span
                      style={{
                        width: `${metrics.interviewProgress}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="readiness-row">
                  <div className="readiness-label">
                    <span>Interview completion</span>
                    <strong>{metrics.interviewCompletion}%</strong>
                  </div>

                  <div className="readiness-track">
                    <span
                      style={{
                        width: `${metrics.interviewCompletion}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="readiness-footer">
                <div>
                  <span className="readiness-mini-icon">
                    <Sparkles size={13} />
                  </span>
                  <strong>{dashboardData.skills_found}</strong>
                  <span>skills detected</span>
                </div>

                <div>
                  <span className="readiness-mini-icon">
                    <FileText size={13} />
                  </span>
                  <strong>{dashboardData.total_resumes}</strong>
                  <span>resumes analyzed</span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/reports")}
                >
                  View insights
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          </section>

          <section className="dashboard-insight-strip dashboard-reveal dashboard-reveal--6">
            <div className="dashboard-insight-icon">
              <Sparkles size={18} />
            </div>

            <div className="dashboard-insight-copy">
              <span>PERSONALIZED SIGNAL</span>
              <strong>
                {metrics.trend > 0
                  ? `Your ATS score is up ${metrics.trend} points from the previous recorded score.`
                  : metrics.resumeScore >= 75
                    ? "Your resume is performing well. Focus next on interview consistency."
                    : "Your biggest opportunity is improving your resume ATS performance."}
              </strong>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  metrics.resumeScore < 75
                    ? "/resume-analysis"
                    : "/interview-prep"
                )
              }
            >
              Take action
              <ArrowUpRight size={15} />
            </button>
          </section>

          <section className="dashboard-recent-section dashboard-reveal dashboard-reveal--7">
            <div className="section-heading section-heading--compact">
              <div>
                <span className="section-eyebrow">LATEST DOCUMENT</span>
                <h2>Recent resume</h2>
              </div>

              <span className="section-meta">
                {hasATSHistory
                  ? `${dashboardData.ats_history.length} score${
                      dashboardData.ats_history.length === 1 ? "" : "s"
                    } recorded`
                  : "No score history yet"}
              </span>
            </div>

            <RecentResume
              resume={dashboardData.recent_resume}
            />
          </section>

          <section
            className="dashboard-library-section dashboard-reveal dashboard-reveal--8"
            aria-label="Resume library"
          >
            <div className="dashboard-library-heading">
              <div>
                <span className="section-eyebrow">YOUR LIBRARY</span>
                <h2>Resume workspace</h2>
                <p>
                  Keep your resume versions organized and ready for your
                  next application.
                </p>
              </div>

              <div className="dashboard-library-stats">
                <span>
                  <MessageSquare size={14} />
                  {dashboardData.total_questions_answered} questions
                </span>
                <span>
                  <CheckCircle2 size={14} />
                  {dashboardData.completed_interviews} completed
                </span>
              </div>
            </div>

            <ResumeUpload hideUpload={true} />
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
