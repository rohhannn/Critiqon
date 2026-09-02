import "./DashboardPreview.css";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Gauge,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Upload,
} from "lucide-react";

function DashboardPreview() {
  return (
    <section className="dashboard-preview">
      {/* =====================================================
          SECTION HEADER
      ===================================================== */}

      <div className="dashboard-preview-header">
        <div className="dashboard-preview-eyebrow">
          <span className="dashboard-preview-eyebrow-dot" />
          YOUR CAREER COMMAND CENTER
        </div>

        <h2>
          Everything you need to
          <span> get hired.</span>
        </h2>

        <p>
          Track your resume performance, improve your ATS score,
          practice interviews and stay on top of every application
          from one focused workspace.
        </p>
      </div>

      {/* =====================================================
          DASHBOARD WINDOW
      ===================================================== */}

      <div className="dashboard-preview-shell">

        {/* BACKGROUND DECORATION */}

        <div
          className="dashboard-preview-glow dashboard-preview-glow--one"
          aria-hidden="true"
        />

        <div
          className="dashboard-preview-glow dashboard-preview-glow--two"
          aria-hidden="true"
        />

        {/* ===================================================
            MOCK APPLICATION HEADER
        =================================================== */}

        <div className="dashboard-preview-topbar">

          <div className="dashboard-preview-brand">
            <div className="dashboard-preview-brand-mark">
              <Sparkles size={15} />
            </div>

            <div>
              <strong>Critiqon</strong>
              <span>Career Dashboard</span>
            </div>
          </div>

          <div className="dashboard-preview-topbar-right">

            <div className="dashboard-preview-status">
              <span />
              All systems ready
            </div>

            <div className="dashboard-preview-avatar">
              R
            </div>

          </div>

        </div>

        {/* ===================================================
            DASHBOARD BODY
        =================================================== */}

        <div className="dashboard-preview-body">

          {/* SIDEBAR */}

          <aside className="dashboard-preview-sidebar">

            <div className="preview-sidebar-label">
              WORKSPACE
            </div>

            <div className="preview-sidebar-item active">
              <Gauge size={16} />
              Overview
            </div>

            <div className="preview-sidebar-item">
              <FileText size={16} />
              Resumes
            </div>

            <div className="preview-sidebar-item">
              <MessageSquare size={16} />
              Interviews
            </div>

            <div className="preview-sidebar-item">
              <BriefcaseBusiness size={16} />
              Applications
            </div>

            <div className="preview-sidebar-divider" />

            <div className="preview-sidebar-label">
              INSIGHTS
            </div>

            <div className="preview-sidebar-item">
              <TrendingUp size={16} />
              Reports
            </div>

          </aside>

          {/* MAIN CONTENT */}

          <div className="dashboard-preview-main">

            {/* =============================================
                WELCOME
            ============================================= */}

            <div className="preview-welcome">

              <div>

                <div className="preview-welcome-kicker">
                  <Sparkles size={13} />
                  CAREER OVERVIEW
                </div>

                <h3>
                  Your job search is moving forward.
                </h3>

                <p>
                  Your latest resume is performing well.
                  Keep improving your profile to stay ahead.
                </p>

              </div>

              <button
                type="button"
                className="preview-welcome-button"
              >
                View insights
                <ArrowUpRight size={15} />
              </button>

            </div>

            {/* =============================================
                KPI GRID
            ============================================= */}

            <div className="preview-kpi-grid">

              {/* RESUME */}

              <article className="preview-kpi-card preview-kpi-card--green">

                <div className="preview-kpi-top">

                  <div className="preview-kpi-icon">
                    <FileText size={17} />
                  </div>

                  <span className="preview-kpi-change">
                    +8.4%
                  </span>

                </div>

                <span className="preview-kpi-label">
                  Resume score
                </span>

                <div className="preview-kpi-value">
                  92<span>/100</span>
                </div>

                <div className="preview-progress">
                  <span style={{ width: "92%" }} />
                </div>

                <span className="preview-kpi-helper">
                  Excellent profile strength
                </span>

              </article>

              {/* ATS */}

              <article className="preview-kpi-card preview-kpi-card--purple">

                <div className="preview-kpi-top">

                  <div className="preview-kpi-icon">
                    <TrendingUp size={17} />
                  </div>

                  <span className="preview-kpi-change">
                    +12.1%
                  </span>

                </div>

                <span className="preview-kpi-label">
                  ATS compatibility
                </span>

                <div className="preview-kpi-value">
                  89<span>%</span>
                </div>

                <div className="preview-progress preview-progress--purple">
                  <span style={{ width: "89%" }} />
                </div>

                <span className="preview-kpi-helper">
                  Strong keyword alignment
                </span>

              </article>

              {/* APPLICATIONS */}

              <article className="preview-kpi-card preview-kpi-card--blue">

                <div className="preview-kpi-top">

                  <div className="preview-kpi-icon">
                    <BriefcaseBusiness size={17} />
                  </div>

                  <span className="preview-kpi-neutral">
                    This month
                  </span>

                </div>

                <span className="preview-kpi-label">
                  Applications
                </span>

                <div className="preview-kpi-value">
                  18
                </div>

                <div className="preview-mini-bars">
                  <span style={{ height: "35%" }} />
                  <span style={{ height: "52%" }} />
                  <span style={{ height: "42%" }} />
                  <span style={{ height: "68%" }} />
                  <span style={{ height: "58%" }} />
                  <span style={{ height: "82%" }} />
                  <span style={{ height: "74%" }} />
                </div>

                <span className="preview-kpi-helper">
                  6 interviews in progress
                </span>

              </article>

              {/* INTERVIEW */}

              <article className="preview-kpi-card preview-kpi-card--orange">

                <div className="preview-kpi-top">

                  <div className="preview-kpi-icon">
                    <MessageSquare size={17} />
                  </div>

                  <span className="preview-kpi-change">
                    +2 this week
                  </span>

                </div>

                <span className="preview-kpi-label">
                  Interview score
                </span>

                <div className="preview-kpi-value">
                  8.6<span>/10</span>
                </div>

                <div className="preview-rating">

                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>

                </div>

                <span className="preview-kpi-helper">
                  Interview readiness
                </span>

              </article>

            </div>

            {/* =============================================
                LOWER DASHBOARD GRID
            ============================================= */}

            <div className="preview-lower-grid">

              {/* ATS CHART */}

              <article className="preview-panel preview-panel--chart">

                <div className="preview-panel-header">

                  <div>

                    <span className="preview-panel-eyebrow">
                      PERFORMANCE
                    </span>

                    <h4>
                      ATS score trend
                    </h4>

                    <p>
                      Your resume performance over time
                    </p>

                  </div>

                  <div className="preview-chart-value">
                    <strong>89%</strong>
                    <span>
                      <TrendingUp size={12} />
                      +14 pts
                    </span>
                  </div>

                </div>

                <div className="preview-chart">

                  <div className="preview-chart-grid">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <div className="preview-chart-line">
                    <svg
                      viewBox="0 0 600 190"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <defs>

                        <linearGradient
                          id="previewChartFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#16735a"
                            stopOpacity="0.20"
                          />

                          <stop
                            offset="100%"
                            stopColor="#16735a"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>

                      <path
                        d="
                          M0 145
                          C45 137 60 140 92 125
                          C125 110 145 126 180 103
                          C218 79 240 98 272 86
                          C306 73 329 84 358 65
                          C391 43 413 58 445 48
                          C483 37 515 45 545 27
                          C566 17 583 19 600 10
                          L600 190
                          L0 190
                          Z
                        "
                        fill="url(#previewChartFill)"
                      />

                      <path
                        d="
                          M0 145
                          C45 137 60 140 92 125
                          C125 110 145 126 180 103
                          C218 79 240 98 272 86
                          C306 73 329 84 358 65
                          C391 43 413 58 445 48
                          C483 37 515 45 545 27
                          C566 17 583 19 600 10
                        "
                        fill="none"
                        stroke="#16735a"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />

                    </svg>

                    <span
                      className="preview-chart-point preview-chart-point--one"
                    />

                    <span
                      className="preview-chart-point preview-chart-point--two"
                    />

                    <span
                      className="preview-chart-point preview-chart-point--three"
                    />

                    <span
                      className="preview-chart-point preview-chart-point--four"
                    />

                    <span
                      className="preview-chart-point preview-chart-point--five"
                    />

                  </div>

                  <div className="preview-chart-labels">
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                  </div>

                </div>

              </article>

              {/* READINESS */}

              <article className="preview-panel preview-panel--readiness">

                <div className="preview-panel-header">

                  <div>

                    <span className="preview-panel-eyebrow">
                      READINESS
                    </span>

                    <h4>
                      Career readiness
                    </h4>

                  </div>

                  <div className="preview-readiness-score">
                    91
                    <small>/100</small>
                  </div>

                </div>

                <div className="preview-readiness-list">

                  <div className="preview-readiness-row">

                    <div>
                      <span>Resume quality</span>
                      <strong>92%</strong>
                    </div>

                    <div className="preview-readiness-track">
                      <span style={{ width: "92%" }} />
                    </div>

                  </div>

                  <div className="preview-readiness-row">

                    <div>
                      <span>ATS compatibility</span>
                      <strong>89%</strong>
                    </div>

                    <div className="preview-readiness-track">
                      <span style={{ width: "89%" }} />
                    </div>

                  </div>

                  <div className="preview-readiness-row">

                    <div>
                      <span>Interview confidence</span>
                      <strong>86%</strong>
                    </div>

                    <div className="preview-readiness-track">
                      <span style={{ width: "86%" }} />
                    </div>

                  </div>

                </div>

                <div className="preview-readiness-footer">

                  <CheckCircle2 size={15} />

                  <span>
                    You're ahead of 78% of candidates
                  </span>

                </div>

              </article>

            </div>

            {/* =============================================
                ACTIVITY
            ============================================= */}

            <article className="preview-activity-panel">

              <div className="preview-activity-header">

                <div>

                  <span className="preview-panel-eyebrow">
                    RECENT ACTIVITY
                  </span>

                  <h4>
                    Keep your momentum going
                  </h4>

                </div>

                <span className="preview-activity-view">
                  View all
                  <ArrowUpRight size={14} />
                </span>

              </div>

              <div className="preview-activity-list">

                <div className="preview-activity-item">

                  <div className="preview-activity-icon preview-activity-icon--green">
                    <CheckCircle2 size={15} />
                  </div>

                  <div>
                    <strong>
                      Resume analysis completed
                    </strong>

                    <span>
                      Your latest resume scored 92/100
                    </span>
                  </div>

                  <time>
                    12m ago
                  </time>

                </div>

                <div className="preview-activity-item">

                  <div className="preview-activity-icon preview-activity-icon--purple">
                    <TrendingUp size={15} />
                  </div>

                  <div>
                    <strong>
                      ATS score improved
                    </strong>

                    <span>
                      Your score increased by 7 points
                    </span>
                  </div>

                  <time>
                    2h ago
                  </time>

                </div>

                <div className="preview-activity-item">

                  <div className="preview-activity-icon preview-activity-icon--blue">
                    <Upload size={15} />
                  </div>

                  <div>
                    <strong>
                      Resume uploaded
                    </strong>

                    <span>
                      Frontend Developer Resume.pdf
                    </span>
                  </div>

                  <time>
                    Yesterday
                  </time>

                </div>

              </div>

            </article>

          </div>

        </div>

      </div>

      {/* =====================================================
          BOTTOM TRUST STRIP
      ===================================================== */}

      <div className="dashboard-preview-footer">

        <div>
          <CheckCircle2 size={16} />
          <strong>One focused workspace</strong>
          <span>
            Everything you need for your job search.
          </span>
        </div>

        <div>
          <TrendingUp size={16} />
          <strong>Built around progress</strong>
          <span>
            Turn every improvement into momentum.
          </span>
        </div>

      </div>

    </section>
  );
}

export default DashboardPreview;