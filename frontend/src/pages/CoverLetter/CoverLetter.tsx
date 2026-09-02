import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  FileText,
  Loader2,
  Mail,
  Printer,
  Send,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { notify } from "../../services/notifications";

import "./CoverLetter.css";

interface Resume {
  id: number;
  filename: string;
  uploaded_at: string;
  ats_score: number | null;
}

function CoverLetter() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] =
    useState<number | null>(null);

  const [jobDescription, setJobDescription] =
    useState("");

  const [coverLetter, setCoverLetter] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [loadingResumes, setLoadingResumes] =
    useState(true);

  const [error, setError] =
    useState("");

  const selectedResume = useMemo(
    () =>
      resumes.find(
        (resume) => resume.id === selectedResumeId
      ),
    [resumes, selectedResumeId]
  );

  const jobWordCount = useMemo(() => {
    return jobDescription.trim()
      ? jobDescription.trim().split(/\s+/).length
      : 0;
  }, [jobDescription]);

  const coverWordCount = useMemo(() => {
    return coverLetter.trim()
      ? coverLetter.trim().split(/\s+/).length
      : 0;
  }, [coverLetter]);

  useEffect(() => {
    async function loadResumes() {
      try {
        setLoadingResumes(true);
        setError("");

        const response =
          await api.get<Resume[]>("/resume/");

        const data = response.data;

        setResumes(data);

        if (data.length > 0) {
          setSelectedResumeId(data[0].id);
        }
      } catch (err: any) {
        console.error(
          "Resume loading error:",
          err
        );

        if (err.response?.status === 401) {
          logout();
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.detail ||
            "Unable to load your resumes."
        );
      } finally {
        setLoadingResumes(false);
      }
    }

    if (token) {
      loadResumes();
    }
  }, [token, logout, navigate]);

  async function generateCoverLetter() {
    if (!selectedResumeId) {
      setError("Please select a resume.");
      return;
    }

    if (!jobDescription.trim()) {
      setError(
        "Please enter the job description."
      );
      return;
    }

    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCoverLetter("");

      const response =
        await api.post(
          "/jobs/cover-letter",
          {
            resume_id:
              selectedResumeId,

            job_description:
              jobDescription.trim(),
          }
        );

      setCoverLetter(
        response.data.cover_letter
      );
    } catch (err: any) {
      console.error(
        "Cover letter generation error:",
        err
      );

      if (err.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }

      const detail =
        err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to generate cover letter."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyCoverLetter() {
    if (!coverLetter) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        coverLetter
      );

      notify({
        type: "success",
        title: "Copied",
        message:
          "Cover letter copied to your clipboard.",
      });
    } catch (copyError) {
      console.error(
        "Copy error:",
        copyError
      );

      notify({
        type: "error",
        title: "Copy failed",
        message:
          "Unable to copy the cover letter.",
      });
    }
  }

  function downloadCoverLetter() {
    if (!coverLetter) {
      return;
    }

    const blob = new Blob(
      [coverLetter],
      {
        type: "text/plain;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "cover-letter.txt";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    notify({
      type: "success",
      title: "Downloaded",
      message:
        "Your cover letter has been downloaded.",
    });
  }

  function printCoverLetter() {
    if (!coverLetter) {
      return;
    }

    window.print();
  }

  function clearResult() {
    setCoverLetter("");
    setError("");
  }

  return (
    <div className="cover-letter-page">

      {/* =====================================================
          TOP NAV
      ====================================================== */}

      <div className="cover-letter-topbar">

        <button
          className="cover-back-button"
          onClick={() =>
            navigate("/dashboard")
          }
          type="button"
        >
          <ArrowLeft size={17} />

          <span>
            Back to Dashboard
          </span>
        </button>

        <div className="cover-topbar-status">
          <span className="status-dot" />
          AI Career Tools
        </div>

      </div>


      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="cover-letter-header">

        <div className="cover-hero-icon">
          <Mail size={27} />
        </div>

        <div className="cover-header-content">

          <div className="cover-eyebrow">
            <Sparkles size={14} />
            AI POWERED
          </div>

          <h1>
            Cover Letter Generator
          </h1>

          <p>
            Turn your resume and target job into
            a tailored, professional cover letter
            in seconds.
          </p>

        </div>

      </header>


      {/* =====================================================
          MAIN WORKSPACE
      ====================================================== */}

      <main className="cover-letter-workspace">


        {/* ===================================================
            LEFT PANEL
        ==================================================== */}

        <section className="cover-input-panel">

          <div className="panel-heading">

            <div className="panel-heading-icon">
              <WandSparkles size={19} />
            </div>

            <div>
              <h2>
                Build your cover letter
              </h2>

              <p>
                Tell us about the role you're
                applying for.
              </p>
            </div>

          </div>


          {/* RESUME */}

          <div className="cover-form-section">

            <div className="cover-field-label">

              <div>
                <FileText size={15} />

                <span>
                  Resume
                </span>
              </div>

              {selectedResume && (
                <span className="field-ready">
                  <Check size={12} />
                  Selected
                </span>
              )}

            </div>


            {loadingResumes ? (

              <div className="resume-loading">
                <Loader2
                  size={17}
                  className="cover-spin"
                />

                Loading your resumes...
              </div>

            ) : resumes.length === 0 ? (

              <div className="no-resume-state">

                <div className="no-resume-icon">
                  <FileText size={21} />
                </div>

                <div>
                  <strong>
                    No resume found
                  </strong>

                  <p>
                    Upload a resume before
                    generating a cover letter.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/dashboard")
                  }
                >
                  Upload
                </button>

              </div>

            ) : (

              <div className="cover-select-wrapper">

                <FileText
                  size={17}
                  className="select-leading-icon"
                />

                <select
                  value={
                    selectedResumeId ?? ""
                  }
                  onChange={(e) =>
                    setSelectedResumeId(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  disabled={loading}
                >

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
                  size={17}
                  className="select-arrow"
                />

              </div>

            )}

          </div>


          {/* JOB DESCRIPTION */}

          <div className="cover-form-section job-description-section">

            <div className="cover-field-label">

              <div>
                <BriefcaseBusiness
                  size={15}
                />

                <span>
                  Job Description
                </span>
              </div>

              <span className="field-required">
                Required
              </span>

            </div>


            <div className="job-description-box">

              <textarea
                value={jobDescription}
                onChange={(e) =>
                  setJobDescription(
                    e.target.value
                  )
                }
                placeholder={
                  "Paste the job description here...\n\n" +
                  "Include responsibilities, required skills, " +
                  "qualifications, and anything else relevant " +
                  "to the position."
                }
                rows={14}
                disabled={loading}
              />

              <div className="textarea-footer">

                <span>
                  {jobWordCount}{" "}
                  {jobWordCount === 1
                    ? "word"
                    : "words"}
                </span>

                <span>
                  {jobDescription.length} characters
                </span>

              </div>

            </div>

          </div>


          {/* ERROR */}

          {error && (

            <div
              className="cover-error"
              role="alert"
            >
              <div className="error-mark">
                !
              </div>

              <span>
                {error}
              </span>
            </div>

          )}


          {/* GENERATE */}

          <button
            className="generate-cover-button"
            onClick={generateCoverLetter}
            disabled={
              loading ||
              loadingResumes ||
              resumes.length === 0 ||
              !selectedResumeId ||
              !jobDescription.trim()
            }
            type="button"
          >

            {loading ? (

              <>
                <Loader2
                  size={18}
                  className="cover-spin"
                />

                <span>
                  Creating your cover letter...
                </span>
              </>

            ) : (

              <>
                <Sparkles size={18} />

                <span>
                  Generate Cover Letter
                </span>

                <Send
                  size={16}
                />
              </>

            )}

          </button>


          <div className="generator-note">

            <Sparkles size={14} />

            <span>
              AI will tailor your letter to the
              selected role while using information
              from your resume.
            </span>

          </div>

        </section>


        {/* ===================================================
            RIGHT PANEL
        ==================================================== */}

        <section
          className={`cover-result-panel ${
            coverLetter
              ? "has-result"
              : ""
          }`}
        >

          {/* RESULT HEADER */}

          <div className="result-panel-header">

            <div className="result-title-group">

              <div className="result-icon">
                <FileText size={19} />
              </div>

              <div>

                <div className="result-title-row">

                  <h2>
                    Your Cover Letter
                  </h2>

                  {coverLetter && (
                    <span className="generated-badge">
                      <span className="badge-dot" />
                      Generated
                    </span>
                  )}

                </div>

                <p>
                  {coverLetter
                    ? `${coverWordCount} words · Tailored to your target role`
                    : "Your professionally tailored letter will appear here"}
                </p>

              </div>

            </div>


            {coverLetter && (

              <div className="result-actions">

                <button
                  type="button"
                  onClick={copyCoverLetter}
                  title="Copy cover letter"
                >
                  <Clipboard size={16} />
                  <span>
                    Copy
                  </span>
                </button>

                <button
                  type="button"
                  onClick={printCoverLetter}
                  title="Print or save as PDF"
                >
                  <Printer size={16} />
                  <span>
                    PDF
                  </span>
                </button>

                <button
                  type="button"
                  className="download-action"
                  onClick={
                    downloadCoverLetter
                  }
                  title="Download text file"
                >
                  <Download size={16} />
                  <span>
                    Download
                  </span>
                </button>

              </div>

            )}

          </div>


          {/* RESULT BODY */}

          <div className="cover-result-body">

            {loading ? (

              <div className="cover-generating-state">

                <div className="generating-orb">

                  <div className="orb-ring orb-ring-one" />
                  <div className="orb-ring orb-ring-two" />

                  <Sparkles
                    size={28}
                  />

                </div>

                <h3>
                  Writing your cover letter
                </h3>

                <p>
                  Analyzing your resume and
                  matching your experience with
                  the job description.
                </p>


                <div className="generation-steps">

                  <div className="generation-step active">
                    <div>
                      <Check size={12} />
                    </div>

                    <span>
                      Reading your resume
                    </span>
                  </div>

                  <div className="generation-step active">
                    <div>
                      <Check size={12} />
                    </div>

                    <span>
                      Matching role requirements
                    </span>
                  </div>

                  <div className="generation-step">
                    <div className="step-pulse" />
                    <span>
                      Writing personalized letter
                    </span>
                  </div>

                </div>

              </div>

            ) : coverLetter ? (

              <div className="document-stage">

                <div className="document-toolbar">

                  <span>
                    <FileText size={14} />
                    Cover Letter Preview
                  </span>

                  <button
                    type="button"
                    onClick={clearResult}
                  >
                    Start Over
                  </button>

                </div>


                <article className="cover-letter-document">

                  <div className="document-accent" />

                  <div className="document-inner">

                    <div className="document-top">

                      <div className="document-brand">
                        <div className="document-brand-mark">
                          <Mail size={17} />
                        </div>

                        <span>
                          COVER LETTER
                        </span>
                      </div>

                      <span className="document-date">
                        Prepared for application
                      </span>

                    </div>


                    <div className="document-divider" />


                    <div className="document-body">

                      {coverLetter}

                    </div>


                    <div className="document-footer">

                      <span>
                        Generated with Critiqon
                      </span>

                      <span>
                        {coverWordCount} words
                      </span>

                    </div>

                  </div>

                </article>

              </div>

            ) : (

              <div className="cover-empty-state">

                <div className="empty-illustration">

                  <div className="empty-paper">

                    <div className="empty-paper-line large" />
                    <div className="empty-paper-line" />
                    <div className="empty-paper-line short" />

                  </div>

                  <div className="empty-mail">
                    <Mail size={24} />
                  </div>

                  <div className="empty-sparkle sparkle-one">
                    <Sparkles size={14} />
                  </div>

                  <div className="empty-sparkle sparkle-two">
                    <Sparkles size={11} />
                  </div>

                </div>


                <h3>
                  Your cover letter starts here
                </h3>

                <p>
                  Select your resume, paste the
                  job description, and let AI create
                  a tailored application letter for you.
                </p>


                <div className="empty-features">

                  <div>
                    <Check size={14} />
                    Resume-aware
                  </div>

                  <div>
                    <Check size={14} />
                    Job-specific
                  </div>

                  <div>
                    <Check size={14} />
                    Professional tone
                  </div>

                </div>

              </div>

            )}

          </div>

        </section>

      </main>


      {/* =====================================================
          BOTTOM INFO
      ====================================================== */}

      <div className="cover-letter-footer-info">

        <div>
          <Sparkles size={15} />

          <span>
            AI-assisted career preparation
          </span>
        </div>

        <span>
          Always review generated content before submitting.
        </span>

      </div>

    </div>
  );
}

export default CoverLetter;