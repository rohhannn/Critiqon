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

interface ResumeUploadResponse {
  resume_id?: number;
  id?: number;
  message?: string;
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
  } = useAuth();


  /* =======================================================
     SUBSCRIPTION
  ======================================================= */

  const {
    hasAccess,
  } = useSubscription();


  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigate = useNavigate();


  /* =======================================================
     UPLOAD STATE
  ======================================================= */

  const [
    file,
    setFile,
  ] = useState<File | null>(null);


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  /* =======================================================
     RESUMES
  ======================================================= */

  const [
    resumes,
    setResumes,
  ] = useState<Resume[]>([]);


  const [
    selectedResumeId,
    setSelectedResumeId,
  ] = useState<number | null>(null);


  /* =======================================================
     JOB MATCH
  ======================================================= */

  const [
    jobDescription,
    setJobDescription,
  ] = useState("");


  const [
    matchLoading,
    setMatchLoading,
  ] = useState(false);


  const [
    matchResult,
    setMatchResult,
  ] = useState<MatchResult | null>(null);


  /* =======================================================
     UPGRADE MODAL
  ======================================================= */

  const [
    showJobMatchUpgrade,
    setShowJobMatchUpgrade,
  ] = useState(false);


  /* =========================================================
     FETCH RESUMES
  ========================================================= */

  const fetchResumes = useCallback(async () => {

    if (!token) return;

    try {

      const response =
        await api.get<Resume[]>("/resume/");

      const resumeList =
        Array.isArray(response.data)
          ? response.data
          : [];

      setResumes(resumeList);

      setSelectedResumeId(
        resumeList[0]?.id ?? null
      );

    } catch (error: any) {

      console.error(
        "Failed to fetch resumes:",
        error
      );

      if (
        error?.response?.status === 401
      ) {

        logout();
        navigate("/login");

        return;
      }

    }

  }, [
    token,
    logout,
    navigate,
  ]);


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {

    fetchResumes();

  }, [fetchResumes]);


  /* =========================================================
     UPLOAD RESUME
  ========================================================= */

  const handleUpload = async () => {

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

      navigate("/login");

      return;
    }


    /* ================================================
       FILE VALIDATION
    ================================================ */

    const fileName =
      file.name.toLowerCase();

    if (!fileName.endsWith(".pdf")) {

      setMessage(
        "Only PDF files are allowed."
      );

      setFile(null);

      return;
    }


    /* ================================================
       SIZE VALIDATION
    ================================================ */

    const MAX_FILE_SIZE =
      10 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {

      setMessage(
        "PDF must be smaller than 10 MB."
      );

      setFile(null);

      return;
    }


    /* ================================================
       FORM DATA
    ================================================ */

    const formData =
      new FormData();

    formData.append(
      "file",
      file,
      file.name
    );


    /* ================================================
       DEBUG
    ================================================ */

    console.log(
      "Uploading resume:",
      {
        name: file.name,
        type: file.type,
        size: file.size,
        formDataHasFile:
          formData.has("file"),
      }
    );


    try {

      setLoading(true);

      setMessage("");


      /* ==============================================
         API REQUEST
      ============================================== */

      const response =
        await api.post<ResumeUploadResponse>(
          "/resume/upload",
          formData,
          {
            timeout: 120_000,

            /*
             * IMPORTANT:
             * Let the browser/Axios generate the multipart
             * boundary automatically.
             */
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );


      const data =
        response.data;


      console.log(
        "Resume upload response:",
        data
      );


      /* ==============================================
         VALIDATE RESPONSE
      ============================================== */

      const resumeId =
        data?.resume_id ??
        data?.id;


      if (!resumeId) {

        console.error(
          "Upload succeeded but no resume ID was returned:",
          data
        );

        notify({
          type: "error",
          title: "Upload incomplete",
          message:
            "The resume was uploaded, but the server did not return a resume ID.",
        });

        setMessage(
          "Upload completed, but analysis could not be opened."
        );

        await fetchResumes();

        return;
      }


      /* ==============================================
         SUCCESS
      ============================================== */

      notify({
        type: "success",
        title: "Resume analyzed",
        message:
          "Your resume analysis is ready.",
      });


      setMessage(
        "Resume uploaded successfully!"
      );


      setFile(null);


      /* ==============================================
         SAVE SELECTED RESUME
      ============================================== */

      localStorage.setItem(
        "selectedResumeId",
        String(resumeId)
      );


      /* ==============================================
         REFRESH RESUME LIST
      ============================================== */

      await fetchResumes();


      /* ==============================================
         OPEN ANALYSIS
      ============================================== */

      navigate(
        "/resume-analysis",
        {
          state: {
            resumeId,
          },
        }
      );

    } catch (error: any) {

      console.error(
        "Resume upload error:",
        error
      );


      let errorMessage =
        "Unable to upload your resume.";


      const detail =
        error?.response?.data?.detail;


      if (typeof detail === "string") {

        errorMessage =
          detail;

      } else if (
        Array.isArray(detail)
      ) {

        errorMessage =
          detail
            .map(
              (item: any) =>
                item?.msg || "Invalid upload."
            )
            .join(", ");

      } else if (
        error?.response?.status === 422
      ) {

        errorMessage =
          "The server did not receive the PDF file. Please try selecting the PDF again.";

      } else if (
        error?.response?.status === 401
      ) {

        logout();

        navigate("/login");

        return;

      } else if (
        !error?.response
      ) {

        errorMessage =
          "Unable to reach the server. Please check your connection and try again.";
      }


      notify({
        type: "error",
        title: "Upload failed",
        message: errorMessage,
      });


      setMessage(
        errorMessage
      );

    } finally {

      setLoading(false);

    }

  };


  /* =========================================================
     VIEW ANALYSIS
  ========================================================= */

  const viewAnalysis =
    (
      resumeId: number
    ) => {

      localStorage.setItem(
        "selectedResumeId",
        String(resumeId)
      );

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

      if (
        !hasAccess("Pro")
      ) {

        setShowJobMatchUpgrade(
          true
        );

        return;
      }


      if (
        !jobDescription.trim()
      ) {

        notify({
          type: "error",
          title: "Job description required",
          message:
            "Please enter a Job Description.",
        });

        return;
      }


      if (!selectedResumeId) {

        notify({
          type: "error",
          title: "Resume required",
          message:
            "Please select a resume first.",
        });

        return;
      }


      if (!token) {

        navigate("/login");

        return;
      }


      try {

        setMatchLoading(true);

        setMatchResult(null);


        const response =
          await api.post(
            "/resume/match",
            {
              resume_id:
                selectedResumeId,

              job_description:
                jobDescription,
            }
          );


        setMatchResult(
          response.data
        );

      } catch (error: any) {

        console.error(
          "Job match error:",
          error
        );


        const detail =
          error?.response?.data?.detail;


        const errorMessage =
          typeof detail === "string"
            ? detail
            : "Unable to analyze the job match.";


        notify({
          type: "error",
          title: "Job match failed",
          message:
            errorMessage,
        });

      } finally {

        setMatchLoading(false);

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

            <input
              type="file"
              accept=".pdf,application/pdf"
              className="file-input"
              onChange={(event) => {

                const selectedFile =
                  event.target.files?.[0];


                if (!selectedFile) {
                  return;
                }


                const name =
                  selectedFile.name.toLowerCase();


                if (
                  !name.endsWith(".pdf")
                ) {

                  setMessage(
                    "Only PDF files are allowed."
                  );

                  setFile(null);

                  event.target.value = "";

                  return;
                }


                if (
                  selectedFile.size >
                  10 * 1024 * 1024
                ) {

                  setMessage(
                    "PDF must be smaller than 10 MB."
                  );

                  setFile(null);

                  event.target.value = "";

                  return;
                }


                setFile(
                  selectedFile
                );

                setMessage("");

              }}
            />


            {file && (

              <div className="selected-file">

                📄 {file.name}

              </div>

            )}


            <button
              type="button"
              className="upload-btn"
              onClick={handleUpload}
              disabled={loading || !file}
            >

              {loading
                ? "Analyzing Resume..."
                : "Upload Resume"}

            </button>


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

      {uploadOnly && null}


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
                    key={resume.id}
                    className={
                      `resume-item ${
                        selectedResumeId ===
                        resume.id
                          ? "selected-resume"
                          : ""
                      }`
                    }
                    style={{
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      selectResume(
                        resume.id
                      )
                    }
                  >

                    <h3>

                      📄{" "}

                      {resume.filename}

                    </h3>


                    <p>

                      Uploaded{" "}

                      {new Date(
                        resume.uploaded_at
                      ).toLocaleString()}

                    </p>


                    {selectedResumeId ===
                      resume.id && (

                      <strong>

                        ✅ Selected for Job Match

                      </strong>

                    )}


                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "12px",
                        flexWrap: "wrap",
                      }}
                    >

                      <button
                        type="button"
                        className="recent-btn"
                        onClick={(event) => {

                          event.stopPropagation();

                          viewAnalysis(
                            resume.id
                          );

                        }}
                      >

                        📊 View Analysis

                      </button>


                      <button
                        type="button"
                        className="recent-btn"
                        onClick={(event) => {

                          event.stopPropagation();


                          if (
                            !hasAccess("Pro")
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