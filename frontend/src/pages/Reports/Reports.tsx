import "./Reports.css";

import { useEffect, useState } from "react";

import {
  Download,
  FileText,
  Target,
  Brain,
  Briefcase,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Loader2,
} from "lucide-react";

import api from "../../services/api";


interface ReportData {
  user?: string;

  total_resumes?: number;
  latest_ats_score?: number;
  average_ats_score?: number;
  skills_found?: number;

  total_interviews?: number;
  completed_interviews?: number;
  total_questions_answered?: number;
  average_interview_score?: number;
  latest_interview_score?: number;

  job_match_score?: number;

  strengths?: string[];
  weaknesses?: string[];
  missing_skills?: string[];
  recommendations?: string[];
}


function Reports() {

  const [report, setReport] =
    useState<ReportData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [downloading, setDownloading] =
    useState(false);

  const [error, setError] =
    useState("");


  // =====================================================
  // LOAD REPORT
  // =====================================================

  useEffect(() => {

    async function loadReport() {

      try {

        setLoading(true);
        setError("");

        /*
         * Uses the existing dashboard endpoint so this
         * page does not require a new backend endpoint.
         *
         * If you already have a dedicated /reports/ endpoint,
         * simply change this URL.
         */

        const response =
          await api.get<ReportData>(
            "/dashboard/"
          );

        setReport(response.data);

      } catch (err) {

        console.error(
          "Failed to load report:",
          err
        );

        setError(
          "Unable to load your career report."
        );

      } finally {

        setLoading(false);

      }

    }

    loadReport();

  }, []);


  // =====================================================
  // SAFE VALUES
  // =====================================================

  const atsScore =
    Number(
      report?.average_ats_score ??
      report?.latest_ats_score ??
      0
    );

  const interviewScore =
    Number(
      report?.average_interview_score ??
      report?.latest_interview_score ??
      0
    );

  const jobMatch =
    Number(
      report?.job_match_score ??
      0
    );

  const overallScore =
    Math.round(
      (
        atsScore +
        interviewScore +
        jobMatch
      ) /
      (
        jobMatch > 0
          ? 3
          : 2
      )
    );


  // =====================================================
  // DOWNLOAD PDF
  // =====================================================

  async function downloadReport() {

    if (downloading) {
      return;
    }

    try {

      setDownloading(true);

      /*
       * If your backend later provides a dedicated
       * PDF endpoint, replace this function with:
       *
       * api.get("/reports/pdf", { responseType: "blob" })
       *
       * For now we generate a clean printable report
       * directly from the browser.
       */

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=1000,height=900"
        );

      if (!printWindow) {

        throw new Error(
          "Please allow pop-ups to download your report."
        );

      }

      const username =
        report?.user || "Candidate";

      const today =
        new Date().toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }
        );


      const strengths =
        report?.strengths?.length
          ? report.strengths
          : [
              "Resume analysis completed",
              "Career profile created",
            ];


      const weaknesses =
        report?.weaknesses?.length
          ? report.weaknesses
          : [
              "Continue improving resume relevance",
              "Practice interview responses regularly",
            ];


      const missingSkills =
        report?.missing_skills?.length
          ? report.missing_skills
          : [
              "Use Job Match to identify missing skills",
            ];


      const recommendations =
        report?.recommendations?.length
          ? report.recommendations
          : [
              "Keep your resume tailored to each role.",
              "Continue practicing interview questions.",
              "Focus on skills missing from your target roles.",
            ];


      printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

          <title>Critiqon Career Report</title>

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />

          <style>

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 0;
              background: #f3f6f4;
              color: #18251f;
              font-family:
                Inter,
                Arial,
                Helvetica,
                sans-serif;
            }

            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 20px auto;
              padding: 34px;
              background: white;
            }

            .brand {
              font-size: 26px;
              font-weight: 900;
              letter-spacing: -0.04em;
              color: #244b3a;
            }

            .brand span {
              color: #4f7a65;
            }

            .cover {
              padding: 35px 0 42px;
              border-bottom: 1px solid #e3ebe6;
            }

            .eyebrow {
              margin-top: 35px;
              color: #4f7a65;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.14em;
            }

            h1 {
              margin: 10px 0 8px;
              font-size: 38px;
              line-height: 1.08;
              letter-spacing: -0.04em;
            }

            .subtitle {
              color: #6d7b74;
              font-size: 14px;
              line-height: 1.6;
            }

            .date {
              margin-top: 18px;
              color: #87938d;
              font-size: 12px;
            }

            .overall {
              margin: 28px 0;
              padding: 25px;
              border-radius: 18px;
              background: #edf5f0;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }

            .overall-label {
              color: #607068;
              font-size: 12px;
              font-weight: 700;
            }

            .overall-title {
              margin-top: 5px;
              font-size: 21px;
              font-weight: 800;
            }

            .overall-score {
              font-size: 42px;
              font-weight: 900;
              color: #4f7a65;
            }

            .scores {
              display: grid;
              grid-template-columns:
                repeat(3, 1fr);
              gap: 12px;
              margin-bottom: 35px;
            }

            .score {
              padding: 18px;
              border: 1px solid #e2e9e5;
              border-radius: 14px;
            }

            .score-label {
              color: #77847e;
              font-size: 11px;
              font-weight: 700;
            }

            .score-value {
              margin-top: 7px;
              font-size: 27px;
              font-weight: 900;
              color: #294337;
            }

            section {
              margin-top: 30px;
            }

            section h2 {
              margin: 0 0 14px;
              font-size: 19px;
            }

            .stats {
              display: grid;
              grid-template-columns:
                repeat(2, 1fr);
              gap: 12px;
            }

            .stat {
              padding: 15px;
              background: #f8faf9;
              border-radius: 11px;
            }

            .stat strong {
              display: block;
              font-size: 20px;
            }

            .stat span {
              color: #78857f;
              font-size: 11px;
            }

            ul {
              margin: 0;
              padding-left: 20px;
            }

            li {
              margin-bottom: 8px;
              color: #58675f;
              font-size: 13px;
              line-height: 1.5;
            }

            .footer {
              margin-top: 50px;
              padding-top: 16px;
              border-top: 1px solid #e5ebe7;
              color: #96a19c;
              font-size: 10px;
              text-align: center;
            }

            @media print {

              body {
                background: white;
              }

              .page {
                margin: 0;
                width: auto;
                min-height: auto;
              }

              @page {
                size: A4;
                margin: 0;
              }

            }

          </style>

        </head>

        <body>

          <div class="page">

            <div class="brand">
              Critiqon<span>.</span>
            </div>

            <div class="cover">

              <div class="eyebrow">
                Career Performance Report
              </div>

              <h1>
                ${username}'s Career Report
              </h1>

              <div class="subtitle">
                A personalized overview of your
                resume performance, interview
                readiness and career preparation.
              </div>

              <div class="date">
                Generated ${today}
              </div>

            </div>


            <div class="overall">

              <div>

                <div class="overall-label">
                  OVERALL CAREER SCORE
                </div>

                <div class="overall-title">
                  Career Readiness
                </div>

              </div>

              <div class="overall-score">
                ${overallScore || "—"}
                <small style="
                  font-size:14px;
                  color:#718078;
                ">
                  /100
                </small>
              </div>

            </div>


            <div class="scores">

              <div class="score">

                <div class="score-label">
                  ATS PERFORMANCE
                </div>

                <div class="score-value">
                  ${atsScore || "—"}
                  <small style="
                    font-size:12px;
                    color:#718078;
                  ">
                    /100
                  </small>
                </div>

              </div>


              <div class="score">

                <div class="score-label">
                  INTERVIEW READINESS
                </div>

                <div class="score-value">
                  ${interviewScore || "—"}
                  <small style="
                    font-size:12px;
                    color:#718078;
                  ">
                    /100
                  </small>
                </div>

              </div>


              <div class="score">

                <div class="score-label">
                  JOB MATCH
                </div>

                <div class="score-value">
                  ${
                    jobMatch
                      ? `${jobMatch}`
                      : "—"
                  }
                  ${
                    jobMatch
                      ? `<small style="
                          font-size:12px;
                          color:#718078;
                        ">/100</small>`
                      : ""
                  }
                </div>

              </div>

            </div>


            <section>

              <h2>
                Resume & Career Activity
              </h2>

              <div class="stats">

                <div class="stat">
                  <strong>
                    ${report?.total_resumes ?? 0}
                  </strong>
                  <span>
                    Resumes analyzed
                  </span>
                </div>

                <div class="stat">
                  <strong>
                    ${report?.skills_found ?? 0}
                  </strong>
                  <span>
                    Skills identified
                  </span>
                </div>

                <div class="stat">
                  <strong>
                    ${report?.total_interviews ?? 0}
                  </strong>
                  <span>
                    Interview sessions
                  </span>
                </div>

                <div class="stat">
                  <strong>
                    ${
                      report?.total_questions_answered ??
                      0
                    }
                  </strong>
                  <span>
                    Questions answered
                  </span>
                </div>

              </div>

            </section>


            <section>

              <h2>
                Key Strengths
              </h2>

              <ul>

                ${strengths
                  .map(
                    (item) =>
                      `<li>${item}</li>`
                  )
                  .join("")}

              </ul>

            </section>


            <section>

              <h2>
                Areas to Improve
              </h2>

              <ul>

                ${weaknesses
                  .map(
                    (item) =>
                      `<li>${item}</li>`
                  )
                  .join("")}

              </ul>

            </section>


            <section>

              <h2>
                Skills to Develop
              </h2>

              <ul>

                ${missingSkills
                  .map(
                    (item) =>
                      `<li>${item}</li>`
                  )
                  .join("")}

              </ul>

            </section>


            <section>

              <h2>
                Recommended Next Steps
              </h2>

              <ul>

                ${recommendations
                  .map(
                    (item) =>
                      `<li>${item}</li>`
                  )
                  .join("")}

              </ul>

            </section>


            <div class="footer">
              Generated by Critiqon •
              AI-powered career preparation
            </div>

          </div>

          <script>

            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 500);
            };

          </script>

        </body>

        </html>

      `);

      printWindow.document.close();

    } catch (err) {

      console.error(
        "Report download error:",
        err
      );

      setError(
        "Unable to create the report. Please try again."
      );

    } finally {

      setDownloading(false);

    }

  }


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="reports-page">

        <div className="reports-loading">

          <Loader2
            size={30}
            className="reports-spinner"
          />

          <span>
            Preparing your career report...
          </span>

        </div>

      </div>

    );

  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="reports-page">

      <main className="reports-main">


        {/* =================================================
            HERO
        ================================================= */}

        <section className="reports-hero">

          <div className="reports-hero-content">

            <div className="reports-eyebrow">

              <Sparkles size={15} />

              PREMIUM CAREER REPORT

            </div>


            <h1>
              Your career progress,
              <span> all in one report.</span>
            </h1>


            <p>
              Review your resume performance,
              interview readiness and career
              opportunities in one professional
              overview.
            </p>


            <div className="reports-actions">

              <button
                className="download-report-btn"
                onClick={downloadReport}
                disabled={downloading}
              >

                {downloading ? (

                  <>
                    <Loader2
                      size={18}
                      className="reports-spinner"
                    />

                    Preparing PDF...

                  </>

                ) : (

                  <>
                    <Download size={18} />

                    Download PDF Report

                  </>

                )}

              </button>


              <span className="report-format">

                A4 • PDF

              </span>

            </div>

          </div>


          <div className="hero-score">

            <div className="hero-score-ring">

              <div>

                <strong>
                  {overallScore || "—"}
                </strong>

                <span>
                  /100
                </span>

              </div>

            </div>

            <p>
              Overall Career Score
            </p>

          </div>

        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="reports-error">

            <AlertTriangle size={18} />

            {error}

          </div>

        )}


        {/* =================================================
            SCORE CARDS
        ================================================= */}

        <section className="report-score-grid">


          <article className="report-score-card">

            <div className="report-card-icon">

              <FileText size={20} />

            </div>

            <div>

              <span>
                ATS Performance
              </span>

              <strong>
                {atsScore || "—"}
                <small>/100</small>
              </strong>

              <p>
                Resume optimization
              </p>

            </div>

          </article>


          <article className="report-score-card">

            <div className="report-card-icon">

              <Brain size={20} />

            </div>

            <div>

              <span>
                Interview Readiness
              </span>

              <strong>
                {interviewScore || "—"}
                <small>/100</small>
              </strong>

              <p>
                Interview performance
              </p>

            </div>

          </article>


          <article className="report-score-card">

            <div className="report-card-icon">

              <Target size={20} />

            </div>

            <div>

              <span>
                Job Match
              </span>

              <strong>
                {jobMatch || "—"}
                <small>
                  {jobMatch ? "/100" : ""}
                </small>
              </strong>

              <p>
                Target role compatibility
              </p>

            </div>

          </article>


          <article className="report-score-card">

            <div className="report-card-icon">

              <TrendingUp size={20} />

            </div>

            <div>

              <span>
                Skills Found
              </span>

              <strong>
                {report?.skills_found ?? 0}
              </strong>

              <p>
                Identified in your resume
              </p>

            </div>

          </article>

        </section>


        {/* =================================================
            ACTIVITY
        ================================================= */}

        <section className="report-panel">

          <div className="panel-heading">

            <div>

              <span className="panel-kicker">
                YOUR ACTIVITY
              </span>

              <h2>
                Career preparation overview
              </h2>

            </div>

            <Briefcase size={22} />

          </div>


          <div className="activity-grid">

            <div className="activity-item">

              <strong>
                {report?.total_resumes ?? 0}
              </strong>

              <span>
                Resumes analyzed
              </span>

            </div>


            <div className="activity-item">

              <strong>
                {report?.total_interviews ?? 0}
              </strong>

              <span>
                Interview sessions
              </span>

            </div>


            <div className="activity-item">

              <strong>
                {
                  report?.completed_interviews ??
                  0
                }
              </strong>

              <span>
                Interviews completed
              </span>

            </div>


            <div className="activity-item">

              <strong>
                {
                  report?.total_questions_answered ??
                  0
                }
              </strong>

              <span>
                Questions answered
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            INSIGHTS
        ================================================= */}

        <section className="insights-grid">


          <article className="insight-panel">

            <div className="insight-heading">

              <CheckCircle size={20} />

              <h2>
                Strengths
              </h2>

            </div>


            <ul>

              {(
                report?.strengths?.length
                  ? report.strengths
                  : [
                      "Resume analysis completed",
                      "Career profile established",
                    ]
              ).map(
                (
                  item: string,
                  index: number
                ) => (

                  <li key={index}>

                    <span>
                      ✓
                    </span>

                    {item}

                  </li>

                )
              )}

            </ul>

          </article>


          <article className="insight-panel">

            <div className="insight-heading warning">

              <AlertTriangle size={20} />

              <h2>
                Areas to Improve
              </h2>

            </div>


            <ul>

              {(
                report?.weaknesses?.length
                  ? report.weaknesses
                  : [
                      "Continue optimizing your resume",
                      "Practice interview answers",
                    ]
              ).map(
                (
                  item: string,
                  index: number
                ) => (

                  <li key={index}>

                    <span>
                      !
                    </span>

                    {item}

                  </li>

                )
              )}

            </ul>

          </article>


        </section>


        {/* =================================================
            NEXT STEPS
        ================================================= */}

        <section className="next-steps-panel">

          <div>

            <div className="panel-kicker">
              RECOMMENDED NEXT STEPS
            </div>

            <h2>
              Keep improving your profile
            </h2>

            <p>
              Use your report as a roadmap for
              your next round of preparation.
            </p>

          </div>


          <div className="next-steps-list">

            {(
              report?.recommendations?.length
                ? report.recommendations
                : [
                    "Tailor your resume to every target role.",
                    "Practice interview questions regularly.",
                    "Identify and improve missing skills.",
                  ]
            ).map(
              (
                item: string,
                index: number
              ) => (

                <div
                  className="next-step"
                  key={index}
                >

                  <span>
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <p>
                    {item}
                  </p>

                </div>

              )
            )}

          </div>

        </section>


        {/* =================================================
            DOWNLOAD CTA
        ================================================= */}

        <section className="download-cta">

          <div>

            <div className="cta-icon">

              <Download size={21} />

            </div>

            <div>

              <h2>
                Take your report with you.
              </h2>

              <p>
                Save a professional PDF copy of
                your current career performance.
              </p>

            </div>

          </div>


          <button
            className="download-report-btn secondary"
            onClick={downloadReport}
            disabled={downloading}
          >

            <Download size={17} />

            Download Report

          </button>

        </section>


      </main>

    </div>

  );

}


export default Reports;