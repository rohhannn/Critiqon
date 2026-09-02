import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "./ResumeUpload.css";

import JobDescription from "../JobDescription/JobDescription";
import MatchAnalysis from "../MatchAnalysis/MatchAnalysis";
import UpgradeModal from "../UpgradeModal/UpgradeModal";
import api from "../../services/api";
import { notify } from "../../services/notifications";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useSubscription,
} from "../../context/SubscriptionContext";



/* =========================================================
   TYPES
========================================================= */

interface Resume {

  id: number;

  filename: string;

  filepath: string;

  uploaded_at: string;

  user_id: number;

}


interface MatchResult {

  match_score: number;

  matched_skills: string[];

  missing_skills: string[];

  experience_match: number;

  education_match: number;

  suggestions: string[];

  recommendation: string;

}


interface ResumeUploadProps {

  uploadOnly?: boolean;

  hideUpload?: boolean;

}


/* =========================================================
   COMPONENT
========================================================= */

function ResumeUpload({
  uploadOnly = false,
  hideUpload = false,
}: ResumeUploadProps) {


  /* =======================================================
     AUTH
  ======================================================= */

  const {
    token,
    logout,
  } =
    useAuth();


  /* =======================================================
     SUBSCRIPTION
  ======================================================= */

  const {
    hasAccess,
  } =
    useSubscription();


  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigate =
    useNavigate();


  /* =======================================================
     UPLOAD STATE
  ======================================================= */

  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null
    );


  const [
    message,
    setMessage,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  /* =======================================================
     RESUMES
  ======================================================= */

  const [
    resumes,
    setResumes,
  ] =
    useState<Resume[]>(
      []
    );


  const [
    selectedResumeId,
    setSelectedResumeId,
  ] =
    useState<number | null>(
      null
    );


  /* =======================================================
     JOB MATCH
  ======================================================= */

  const [
    jobDescription,
    setJobDescription,
  ] =
    useState("");


  const [
    matchLoading,
    setMatchLoading,
  ] =
    useState(false);


  const [
    matchResult,
    setMatchResult,
  ] =
    useState<MatchResult | null>(
      null
    );


  /* =======================================================
     UPGRADE MODAL
  ======================================================= */

  const [
    showJobMatchUpgrade,
    setShowJobMatchUpgrade,
  ] =
    useState(false);


  /* =========================================================
     FETCH RESUMES
  ========================================================= */

  const fetchResumes = useCallback(async () => {
    if (!token) return;

    try {
      const response = await api.get<Resume[]>("/resume/");
      setResumes(response.data);
      setSelectedResumeId(response.data[0]?.id ?? null);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      console.error("Failed to fetch resumes:", error);
    }
  }, [token, logout, navigate]);


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {

    fetchResumes();

  }, [fetchResumes]);


  /* =========================================================
     UPLOAD RESUME
  ========================================================= */

  const handleUpload =
    async () => {


      /* ================================================
         FILE REQUIRED
      ================================================ */

      if (!file) {

        setMessage(
          "Please select a PDF."
        );

        return;

      }


      /* ================================================
         AUTH REQUIRED
      ================================================ */

      if (!token) {

        navigate(
          "/login"
        );

        return;

      }


      /* ================================================
         FORM DATA
      ================================================ */

      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      try {

        setLoading(
          true
        );


        setMessage(
          ""
        );


        /* ==============================================
           API REQUEST
        ============================================== */

        const response = await api.post("/resume/upload", formData);
        const data = response.data;


        /* ==============================================
           SUCCESS
        ============================================== */

        notify({ type: "success", title: "Resume analyzed", message: "Your resume analysis is ready." });
        setMessage("Resume uploaded successfully!");


        setFile(
          null
        );


        /* ==============================================
           OPEN ANALYSIS
        ============================================== */

        navigate(
          "/resume-analysis",
          {
            state: {
              resumeId:
                data.resume_id,
            },
          }
        );


        /* ==============================================
           REFRESH RESUME LIST
        ============================================== */

        await fetchResumes();

      } catch (error: any) {

        console.error(
          "Resume upload error:",
          error
        );


        const errorMessage =
          error?.response?.data?.detail ||
          "Unable to connect to the server.";

        notify({ type: "error", title: "Upload failed", message: errorMessage });
        setMessage(errorMessage);

      } finally {

        setLoading(
          false
        );

      }

    };


  /* =========================================================
     VIEW ANALYSIS
  ========================================================= */

  const viewAnalysis =
    (
      resumeId: number
    ) => {

      /* ================================================
         SAVE SELECTED RESUME
      ================================================ */

      localStorage.setItem(
        "selectedResumeId",
        String(resumeId)
      );


      /* ================================================
         NAVIGATE
      ================================================ */

      navigate(
        "/resume-analysis",
        {
          state: {
            resumeId,
          },
        }
      );

    };


  /* =========================================================
     SELECT RESUME
  ========================================================= */

  const selectResume =
    (
      resumeId: number
    ) => {

      setSelectedResumeId(
        resumeId
      );


      setMatchResult(
        null
      );

    };


  /* =========================================================
     JOB MATCH
  ========================================================= */

  const handleAnalyzeMatch =
    async () => {


      /* ================================================
         PLAN CHECK
      ================================================ */

      if (
        !hasAccess("Pro")
      ) {

        setShowJobMatchUpgrade(
          true
        );

        return;

      }


      /* ================================================
         JOB DESCRIPTION REQUIRED
      ================================================ */

      if (
        !jobDescription.trim()
      ) {

        notify({ type: "error", title: "Job description required", message: "Please enter a Job Description." });

        return;

      }


      /* ================================================
         RESUME REQUIRED
      ================================================ */

      if (!selectedResumeId) {

        notify({ type: "error", title: "Resume required", message: "Please select a resume first." });

        return;

      }


      /* ================================================
         AUTH REQUIRED
      ================================================ */

      if (!token) {

        navigate(
          "/login"
        );

        return;

      }


      try {

        setMatchLoading(
          true
        );


        setMatchResult(
          null
        );


        /* ==============================================
           API REQUEST
        ============================================== */

        const response = await api.post("/resume/match", {
          resume_id: selectedResumeId,
          job_description: jobDescription,
        });

        const data = response.data;

        /* ==============================================
           SUCCESS
        ============================================== */

        setMatchResult(
          data
        );

      } catch (error: any) {

        console.error(
          "Job match error:",
          error
        );


        const errorMessage =
          typeof error?.response?.data?.detail === "string"
            ? error.response.data.detail
            : "Unable to connect to the server.";

        notify({ type: "error", title: "Job match failed", message: errorMessage });

      } finally {

        setMatchLoading(
          false
        );

      }

    };


  /* =========================================================
     HANDLE JOB MATCH CLICK
  ========================================================= */

  const handleJobMatchClick =
    () => {

      if (
        !hasAccess("Pro")
      ) {

        setShowJobMatchUpgrade(
          true
        );

        return;

      }

    };


  /* =========================================================
     RETURN
  ========================================================= */

  return (

    <>

      {/* =====================================================
          UPLOAD SECTION
      ===================================================== */}

      {!hideUpload && (

        <div
          className={
            `resume-upload-card ${
              uploadOnly
                ? "upload-only-card"
                : ""
            }`
          }
        >

          <h2>
            📄 Upload Resume
          </h2>


          <div className="upload-box">

            {/* ==========================================
                FILE INPUT
            ========================================== */}

            <input
              type="file"
              accept=".pdf"
              className="file-input"
              onChange={(event) => {

                if (
                  event.target.files?.length
                ) {

                  setFile(
                    event.target.files[0]
                  );


                  setMessage(
                    ""
                  );

                }

              }}
            />


            {/* ==========================================
                SELECTED FILE
            ========================================== */}

            {file && (

              <div className="selected-file">

                📄 {file.name}

              </div>

            )}


            {/* ==========================================
                UPLOAD BUTTON
            ========================================== */}

            <button
              className="upload-btn"
              onClick={
                handleUpload
              }
              disabled={
                loading
              }
            >

              {loading
                ? "Analyzing Resume..."
                : "Upload Resume"}

            </button>


            {/* ==========================================
                MESSAGE
            ========================================== */}

            {message && (

              <p className="message">

                {message}

              </p>

            )}

          </div>

        </div>

      )}


      {/* =====================================================
          UPLOAD ONLY MODE
      ===================================================== */}

      {uploadOnly && (
        null
      )}


      {/* =====================================================
          UPLOADED RESUMES
      ===================================================== */}

      {!uploadOnly && (

        <>

          <div className="resume-upload-card">

            <h2>
              📚 Uploaded Resumes
            </h2>


            {resumes.length === 0 ? (

              <p>
                No resumes uploaded yet.
              </p>

            ) : (

              resumes.map(
                (resume) => (

                  <div
                    key={
                      resume.id
                    }

                    className={
                      `resume-item ${
                        selectedResumeId ===
                        resume.id
                          ? "selected-resume"
                          : ""
                      }`
                    }

                    style={{
                      cursor:
                        "pointer",
                    }}

                    onClick={() =>
                      selectResume(
                        resume.id
                      )
                    }
                  >

                    {/* ==================================
                        RESUME NAME
                    ================================== */}

                    <h3>

                      📄{" "}

                      {resume.filename}

                    </h3>


                    {/* ==================================
                        UPLOAD DATE
                    ================================== */}

                    <p>

                      Uploaded{" "}

                      {new Date(
                        resume.uploaded_at
                      ).toLocaleString()}

                    </p>


                    {/* ==================================
                        SELECTED
                    ================================== */}

                    {selectedResumeId ===
                      resume.id && (

                      <strong>

                        ✅ Selected for Job Match

                      </strong>

                    )}


                    {/* ==================================
                        ACTION BUTTONS
                    ================================== */}

                    <div
                      style={{
                        display:
                          "flex",

                        gap:
                          "10px",

                        marginTop:
                          "12px",

                        flexWrap:
                          "wrap",
                      }}
                    >

                      {/* VIEW ANALYSIS */}

                      <button
                        className="recent-btn"

                        onClick={(
                          event
                        ) => {

                          event.stopPropagation();


                          viewAnalysis(
                            resume.id
                          );

                        }}
                      >

                        📊 View Analysis

                      </button>


                      {/* JOB MATCH */}

                      <button
                        className="recent-btn"

                        onClick={(
                          event
                        ) => {

                          event.stopPropagation();


                          if (
                            !hasAccess(
                              "Pro"
                            )
                          ) {

                            setShowJobMatchUpgrade(
                              true
                            );

                            return;

                          }


                          selectResume(
                            resume.id
                          );


                        }}
                      >

                        🎯 Use for Job Match

                      </button>

                    </div>

                  </div>

                )
              )

            )}

          </div>


          {/* =================================================
              JOB MATCH SECTION
          ================================================= */}

          {selectedResumeId && (

            hasAccess("Pro") ? (

              <JobDescription

                jobDescription={
                  jobDescription
                }

                setJobDescription={
                  setJobDescription
                }

                onAnalyze={
                  handleAnalyzeMatch
                }

                loading={
                  matchLoading
                }

              />

            ) : (

              <div
                className="locked-feature-card"
              >

                <div className="locked-feature-icon">
                  🔒
                </div>


                <h3>
                  AI Job Matching
                </h3>


                <p>

                  Compare your resume
                  against job descriptions
                  using AI.

                  This feature is available
                  on the Pro plan.

                </p>


                <button
                  type="button"
                  className="recent-btn"
                  onClick={
                    handleJobMatchClick
                  }
                >

                  🔓 Upgrade to Pro

                </button>

              </div>

            )

          )}


          {/* =================================================
              MATCH RESULT
          ================================================= */}

          {matchResult && (

            <MatchAnalysis
              result={
                matchResult
              }
            />

          )}

        </>

      )}


      {/* =====================================================
          UPGRADE MODAL
      ===================================================== */}

      {showJobMatchUpgrade && (

        <UpgradeModal

          requiredPlan="Pro"

          featureName="AI Job Matching"

          onClose={() =>
            setShowJobMatchUpgrade(
              false
            )
          }

        />

      )}

    </>

  );

}


export default ResumeUpload;