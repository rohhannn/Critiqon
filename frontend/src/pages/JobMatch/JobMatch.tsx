import "./JobMatch.css";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Target,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Briefcase,
  GraduationCap,
  ArrowRight,
  Sparkles,
  FileText,
  ChevronDown,
  RotateCcw,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";

import api from "../../services/api";

import Sidebar from "../../components/Sidebar/Sidebar";
import Topbar from "../../components/Topbar/Topbar";


interface Resume {
  id: number;
  filename: string;
  uploaded_at: string;
}


interface MatchResult {
  match_score: number;

  matched_skills: string[];

  missing_skills: string[];

  matched_required_skills?: string[];

  matched_preferred_skills?: string[];

  missing_required_skills?: string[];

  missing_preferred_skills?: string[];

  required_skills?: string[];

  preferred_skills?: string[];

  experience_match: number;

  education_match: number;

  suggestions: string[];

  recommendation: string;

  job_match_id?: number;

  resume_id?: number;

  resume_filename?: string;
}


function JobMatch() {
  const navigate = useNavigate();
  const location = useLocation();

  const passedResumeId =
    location.state?.resumeId ?? null;

  const [resumes, setResumes] =
    useState<Resume[]>([]);

  const [selectedResumeId, setSelectedResumeId] =
    useState<number | "">(
      passedResumeId || ""
    );

  const [jobDescription, setJobDescription] =
    useState("");

  const [loadingResumes, setLoadingResumes] =
    useState(true);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<MatchResult | null>(null);


  useEffect(() => {
    async function loadResumes() {
      try {
        setLoadingResumes(true);
        setError("");

        const response =
          await api.get<Resume[]>("/resume/");

        const data =
          response.data || [];

        setResumes(data);

        if (
          passedResumeId &&
          data.some(
            (resume) =>
              resume.id === passedResumeId
          )
        ) {
          setSelectedResumeId(
            passedResumeId
          );
        } else if (data.length > 0) {
          setSelectedResumeId(
            data[0].id
          );
        } else {
          setSelectedResumeId("");
        }

      } catch (err: any) {
        console.error(
          "Failed to load resumes:",
          err
        );

        setError(
          err?.response?.data?.detail ||
          "Unable to load your resumes."
        );
      } finally {
        setLoadingResumes(false);
      }
    }

    loadResumes();
  }, [passedResumeId]);


  async function handleAnalyze() {
    if (!selectedResumeId) {
      setError(
        "Please select a resume first."
      );
      return;
    }

    if (!jobDescription.trim()) {
      setError(
        "Please paste a job description."
      );
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setResult(null);

      const response =
        await api.post<MatchResult>(
          "/resume/match",
          {
            resume_id:
              selectedResumeId,

            job_description:
              jobDescription.trim(),
          }
        );

      setResult(response.data);

      setTimeout(() => {
        document
          .getElementById(
            "job-match-result"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);

    } catch (err: any) {
      console.error(
        "Job match error:",
        err
      );

      setError(
        err?.response?.data?.detail ||
        "Unable to analyze the job match."
      );
    } finally {
      setAnalyzing(false);
    }
  }


  function safeScore(
    score: number | undefined
  ) {
    if (
      typeof score !== "number" ||
      Number.isNaN(score)
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(score)
      )
    );
  }


  function getScoreClass(
    score: number
  ) {
    if (score >= 80) {
      return "score-high";
    }

    if (score >= 60) {
      return "score-medium";
    }

    return "score-low";
  }


  function getScoreLabel(
    score: number
  ) {
    if (score >= 85) {
      return "Excellent Match";
    }

    if (score >= 70) {
      return "Strong Match";
    }

    if (score >= 55) {
      return "Moderate Match";
    }

    return "Low Match";
  }


  function getScoreDescription(
    score: number
  ) {
    if (score >= 85) {
      return "Your resume aligns very closely with this position.";
    }

    if (score >= 70) {
      return "You have a strong alignment with the requirements of this role.";
    }

    if (score >= 55) {
      return "You meet several requirements, but there are meaningful gaps to address.";
    }

    return "There are significant gaps between your resume and this role.";
  }


  function resetAnalysis() {
    setResult(null);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  if (loadingResumes) {
    return (
      <div className="job-match-layout">
        <Sidebar />

        <main className="job-match-main">
          <Topbar />

          <div className="job-match-loading-page">
            <div className="loading-orb">
              <Loader2
                size={30}
                className="job-match-spinner"
              />
            </div>

            <h2>
              Loading Job Match
            </h2>

            <p>
              Preparing your resume workspace...
            </p>
          </div>
        </main>
      </div>
    );
  }


  const score =
    result
      ? safeScore(result.match_score)
      : 0;

  const matchedCount =
    result?.matched_skills?.length || 0;

  const missingCount =
    result?.missing_skills?.length || 0;


  return (
    <div className="job-match-layout">
      <Sidebar />

      <main className="job-match-main">
        <Topbar />

        <div className="job-match-content">

          {/* HERO */}

          <section className="job-match-hero">
            <div className="hero-icon">
              <Target size={28} />
            </div>

            <div className="hero-copy">
              <div className="hero-badge">
                <Sparkles size={13} />
                AI CAREER ANALYSIS
              </div>

              <h1>
                Job Match
              </h1>

              <p>
                See how closely your resume matches
                a specific job and discover what to
                improve before applying.
              </p>
            </div>
          </section>


          {/* ERROR */}

          {error && (
            <div className="job-match-error">
              <XCircle size={19} />

              <span>
                {error}
              </span>

              <button
                onClick={() =>
                  setError("")
                }
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}


          {/* INPUT AREA */}

          <section className="job-match-workspace">

            <div className="workspace-header">
              <div>
                <span className="section-kicker">
                  STEP 01
                </span>

                <h2>
                  Compare your resume
                </h2>

                <p>
                  Choose a resume and paste the
                  complete job description.
                </p>
              </div>

              <div className="workspace-step">
                <span>1</span>
                <span className="step-line" />
                <span className="step-muted">
                  2
                </span>
              </div>
            </div>


            <div className="form-grid">

              {/* RESUME */}

              <div className="form-section resume-section">
                <label>
                  <span className="label-icon">
                    <FileText size={16} />
                  </span>

                  Resume
                </label>

                {resumes.length === 0 ? (
                  <div className="no-resume">
                    <div className="no-resume-icon">
                      <FileText size={22} />
                    </div>

                    <div>
                      <h3>
                        No resume found
                      </h3>

                      <p>
                        Upload a resume before
                        running a job match.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        navigate("/dashboard")
                      }
                    >
                      Upload Resume
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="select-wrapper">
                    <select
                      value={
                        selectedResumeId
                      }
                      onChange={(event) => {
                        const value =
                          event.target.value;

                        setSelectedResumeId(
                          value
                            ? Number(value)
                            : ""
                        );

                        setResult(null);
                        setError("");
                      }}
                      disabled={analyzing}
                    >
                      <option value="">
                        Select a resume
                      </option>

                      {resumes.map(
                        (resume) => (
                          <option
                            key={resume.id}
                            value={resume.id}
                          >
                            {resume.filename}
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown
                      size={18}
                      className="select-arrow"
                    />
                  </div>
                )}
              </div>


              {/* JOB DESCRIPTION */}

              <div className="form-section job-description-section">
                <div className="label-row">
                  <label>
                    <span className="label-icon">
                      <Briefcase size={16} />
                    </span>

                    Job Description
                  </label>

                  <span className="required-label">
                    Required
                  </span>
                </div>

                <div
                  className={`textarea-wrapper ${
                    analyzing
                      ? "is-loading"
                      : ""
                  }`}
                >
                  <textarea
                    value={
                      jobDescription
                    }
                    onChange={(event) => {
                      setJobDescription(
                        event.target.value
                      );

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder={`Paste the complete job description here...

Example:
• Required skills
• Years of experience
• Responsibilities
• Education requirements
• Preferred qualifications`}
                    rows={12}
                    disabled={analyzing}
                  />

                  <div className="textarea-footer">
                    <span>
                      {jobDescription.length.toLocaleString()}
                      {" "}characters
                    </span>

                    {jobDescription.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setJobDescription("")
                        }
                        disabled={analyzing}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>


            {/* ACTION */}

            <div className="workspace-footer">
              <div className="privacy-note">
                <ClipboardCheck size={16} />

                <span>
                  Your resume is analyzed only
                  against this job description.
                </span>
              </div>

              <button
                className="analyze-match-btn"
                onClick={
                  handleAnalyze
                }
                disabled={
                  analyzing ||
                  resumes.length === 0 ||
                  !selectedResumeId ||
                  !jobDescription.trim()
                }
              >
                {analyzing ? (
                  <>
                    <Loader2
                      size={19}
                      className="job-match-spinner"
                    />

                    Analyzing Match...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />

                    Analyze Job Match

                    <ArrowRight
                      size={17}
                    />
                  </>
                )}
              </button>
            </div>

          </section>


          {/* ANALYZING STATE */}

          {analyzing && (
            <section className="analysis-progress-card">
              <div className="analysis-animation">
                <div className="analysis-ring ring-one" />
                <div className="analysis-ring ring-two" />

                <div className="analysis-center">
                  <Sparkles size={24} />
                </div>
              </div>

              <div className="analysis-progress-content">
                <span className="section-kicker">
                  AI ANALYSIS IN PROGRESS
                </span>

                <h3>
                  Comparing your resume with the role
                </h3>

                <p>
                  Identifying skills, experience,
                  education and requirement gaps...
                </p>

                <div className="fake-progress">
                  <div className="fake-progress-fill" />
                </div>
              </div>
            </section>
          )}


          {/* RESULT */}

          {result && !analyzing && (
            <section
              id="job-match-result"
              className="match-result-card"
            >

              {/* RESULT HEADER */}

              <div className="result-top">

                <div className="result-title-area">
                  <div className="result-badge">
                    <CheckCircle2 size={14} />
                    ANALYSIS COMPLETE
                  </div>

                  <h2>
                    Your Job Match Results
                  </h2>

                  <p>
                    Here's how your resume aligns
                    with this position.
                  </p>

                  {result.resume_filename && (
                    <div className="result-resume">
                      <FileText size={15} />

                      <span>
                        {result.resume_filename}
                      </span>
                    </div>
                  )}
                </div>


                {/* SCORE */}

                <div className="score-panel">
                  <div
                    className={`match-score ${getScoreClass(
                      score
                    )}`}
                  >
                    <div className="score-inner">
                      <span className="score-number">
                        {score}
                      </span>

                      <span className="score-percent">
                        %
                      </span>
                    </div>
                  </div>

                  <div
                    className={`score-label ${getScoreClass(
                      score
                    )}`}
                  >
                    {getScoreLabel(score)}
                  </div>
                </div>

              </div>


              {/* SCORE EXPLANATION */}

              <div
                className={`score-explanation ${getScoreClass(
                  score
                )}`}
              >
                <div className="score-explanation-icon">
                  <TrendingUp size={20} />
                </div>

                <div>
                  <strong>
                    {score}% resume alignment
                  </strong>

                  <p>
                    {getScoreDescription(score)}
                  </p>
                </div>
              </div>


              {/* QUICK STATS */}

              <div className="match-stats">

                <div className="match-stat">
                  <div className="stat-icon matched">
                    <CheckCircle2 size={19} />
                  </div>

                  <div>
                    <strong>
                      {matchedCount}
                    </strong>

                    <span>
                      Matched Skills
                    </span>
                  </div>
                </div>


                <div className="match-stat">
                  <div className="stat-icon missing">
                    <XCircle size={19} />
                  </div>

                  <div>
                    <strong>
                      {missingCount}
                    </strong>

                    <span>
                      Missing Skills
                    </span>
                  </div>
                </div>


                <div className="match-stat">
                  <div className="stat-icon experience">
                    <Briefcase size={19} />
                  </div>

                  <div>
                    <strong>
                      {safeScore(
                        result.experience_match
                      )}
                      %
                    </strong>

                    <span>
                      Experience
                    </span>
                  </div>
                </div>


                <div className="match-stat">
                  <div className="stat-icon education">
                    <GraduationCap size={19} />
                  </div>

                  <div>
                    <strong>
                      {safeScore(
                        result.education_match
                      )}
                      %
                    </strong>

                    <span>
                      Education
                    </span>
                  </div>
                </div>

              </div>


              {/* RECOMMENDATION */}

              {result.recommendation && (
                <div className="recommendation-box">

                  <div className="recommendation-icon">
                    <Target size={21} />
                  </div>

                  <div className="recommendation-content">
                    <span>
                      AI RECOMMENDATION
                    </span>

                    <h3>
                      What you should know
                    </h3>

                    <p>
                      {result.recommendation}
                    </p>
                  </div>

                </div>
              )}


              {/* MATCHED / MISSING */}

              <div className="skills-grid">

                <div className="skills-column matched-column">

                  <div className="skills-heading">
                    <div className="skills-heading-icon">
                      <CheckCircle2 size={18} />
                    </div>

                    <div>
                      <h3>
                        Matched Skills
                      </h3>

                      <span>
                        Skills your resume demonstrates
                      </span>
                    </div>
                  </div>

                  <div className="skill-list">
                    {result.matched_skills?.length > 0 ? (
                      result.matched_skills.map(
                        (
                          skill,
                          index
                        ) => (
                          <span
                            className="matched-skill"
                            key={`${skill}-${index}`}
                          >
                            <CheckCircle2
                              size={14}
                            />

                            {skill}
                          </span>
                        )
                      )
                    ) : (
                      <p className="empty-skill-text">
                        No matched skills found.
                      </p>
                    )}
                  </div>

                </div>


                <div className="skills-column missing-column">

                  <div className="skills-heading">
                    <div className="skills-heading-icon">
                      <XCircle size={18} />
                    </div>

                    <div>
                      <h3>
                        Missing Skills
                      </h3>

                      <span>
                        Skills not clearly demonstrated
                      </span>
                    </div>
                  </div>

                  <div className="skill-list">
                    {result.missing_skills?.length > 0 ? (
                      result.missing_skills.map(
                        (
                          skill,
                          index
                        ) => (
                          <span
                            className="missing-skill"
                            key={`${skill}-${index}`}
                          >
                            <XCircle
                              size={14}
                            />

                            {skill}
                          </span>
                        )
                      )
                    ) : (
                      <p className="empty-skill-text">
                        No major missing skills.
                      </p>
                    )}
                  </div>

                </div>

              </div>


              {/* REQUIRED GAPS */}

              {result.missing_required_skills &&
                result.missing_required_skills.length >
                  0 && (
                  <div className="required-gap-box">

                    <div className="required-gap-top">

                      <div className="required-gap-icon">
                        <AlertTriangle size={20} />
                      </div>

                      <div>
                        <span>
                          ATTENTION NEEDED
                        </span>

                        <h3>
                          Required Skill Gaps
                        </h3>

                        <p>
                          These requirements appear
                          in the job description but
                          aren't demonstrated by your
                          resume.
                        </p>
                      </div>

                    </div>

                    <div className="skill-list">
                      {result.missing_required_skills.map(
                        (
                          skill,
                          index
                        ) => (
                          <span
                            className="missing-skill"
                            key={`${skill}-${index}`}
                          >
                            <AlertTriangle
                              size={14}
                            />

                            {skill}
                          </span>
                        )
                      )}
                    </div>

                  </div>
                )}


              {/* MATCH BREAKDOWN */}

              <div className="breakdown-section">

                <div className="section-title-row">
                  <div>
                    <span className="section-kicker">
                      DEEPER ANALYSIS
                    </span>

                    <h3>
                      Match Breakdown
                    </h3>
                  </div>
                </div>


                <div className="breakdown-grid">

                  <div className="breakdown-item">

                    <div className="breakdown-label">
                      <span>
                        <Briefcase size={17} />
                        Experience Match
                      </span>

                      <strong>
                        {safeScore(
                          result.experience_match
                        )}
                        %
                      </strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${safeScore(
                            result.experience_match
                          )}%`,
                        }}
                      />
                    </div>

                  </div>


                  <div className="breakdown-item">

                    <div className="breakdown-label">
                      <span>
                        <GraduationCap size={17} />
                        Education Match
                      </span>

                      <strong>
                        {safeScore(
                          result.education_match
                        )}
                        %
                      </strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill education-fill"
                        style={{
                          width: `${safeScore(
                            result.education_match
                          )}%`,
                        }}
                      />
                    </div>

                  </div>

                </div>

              </div>


              {/* REQUIRED / PREFERRED */}

              {(
                result.required_skills?.length ||
                result.preferred_skills?.length
              ) ? (
                <div className="requirements-section">

                  <div className="section-title-row">
                    <div>
                      <span className="section-kicker">
                        JOB REQUIREMENTS
                      </span>

                      <h3>
                        What the employer is looking for
                      </h3>
                    </div>
                  </div>


                  <div className="skill-requirements-grid">

                    {result.required_skills &&
                      result.required_skills.length >
                        0 && (
                        <div className="requirement-box required-box">

                          <div className="requirement-title">
                            <div>
                              <AlertTriangle
                                size={17}
                              />
                            </div>

                            <div>
                              <h4>
                                Required
                              </h4>

                              <span>
                                Core qualifications
                              </span>
                            </div>
                          </div>

                          <div className="skill-list">
                            {result.required_skills.map(
                              (
                                skill,
                                index
                              ) => (
                                <span
                                  key={`${skill}-${index}`}
                                  className="requirement-skill"
                                >
                                  {skill}
                                </span>
                              )
                            )}
                          </div>

                        </div>
                      )}


                    {result.preferred_skills &&
                      result.preferred_skills.length >
                        0 && (
                        <div className="requirement-box preferred-box">

                          <div className="requirement-title">
                            <div>
                              <Sparkles
                                size={17}
                              />
                            </div>

                            <div>
                              <h4>
                                Preferred
                              </h4>

                              <span>
                                Additional advantages
                              </span>
                            </div>
                          </div>

                          <div className="skill-list">
                            {result.preferred_skills.map(
                              (
                                skill,
                                index
                              ) => (
                                <span
                                  key={`${skill}-${index}`}
                                  className="requirement-skill"
                                >
                                  {skill}
                                </span>
                              )
                            )}
                          </div>

                        </div>
                      )}

                  </div>

                </div>
              ) : null}


              {/* SUGGESTIONS */}

              {result.suggestions &&
                result.suggestions.length >
                  0 && (
                  <div className="suggestions-section">

                    <div className="section-title-row">
                      <div>
                        <span className="section-kicker">
                          ACTION PLAN
                        </span>

                        <h3>
                          How to improve your match
                        </h3>
                      </div>
                    </div>

                    <div className="suggestions-list">

                      {result.suggestions.map(
                        (
                          suggestion,
                          index
                        ) => (
                          <div
                            className="suggestion"
                            key={index}
                          >
                            <div className="suggestion-number">
                              {String(
                                index + 1
                              ).padStart(2, "0")}
                            </div>

                            <div className="suggestion-content">
                              <p>
                                {suggestion}
                              </p>
                            </div>

                            <ArrowRight
                              size={17}
                              className="suggestion-arrow"
                            />
                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}


              {/* FOOTER ACTIONS */}

              <div className="result-footer">

                <div>
                  <strong>
                    Want to test another role?
                  </strong>

                  <span>
                    Run another comparison using
                    the same or a different resume.
                  </span>
                </div>

                <button
                  className="analyze-again-btn"
                  onClick={resetAnalysis}
                >
                  <RotateCcw size={16} />

                  Analyze Another Job
                </button>

              </div>

            </section>
          )}

        </div>
      </main>
    </div>
  );
}


export default JobMatch;