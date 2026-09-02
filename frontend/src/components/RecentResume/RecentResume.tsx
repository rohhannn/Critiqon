import "./RecentResume.css";
import { notify } from "../../services/notifications";

import api from "../../services/api";
import { useNavigate } from "react-router-dom";

interface Props {
  resume: {
    id: number;
    filename: string;
    ats_score: number;
    uploaded_at: string;
  } | null;
}

function RecentResume({ resume }: Props) {
  const navigate = useNavigate();

  if (!resume) {
    return (
      <div className="recent-card">
        <h3>📄 Recent Resume</h3>
        <p>No resume uploaded yet.</p>
      </div>
    );
  }

  const date = new Date(resume.uploaded_at);

  const resumeId = resume.id;
  const resumeFilename = resume.filename;
  const atsScore = resume.ats_score;


  // =====================================================
  // PREVIEW
  // =====================================================

  async function previewResume() {
    try {
      const response = await api.get(
        `/resume/${resumeId}/file`,
        {
          responseType: "blob",
        }
      );

      const fileURL =
        URL.createObjectURL(
          response.data
        );

      window.open(
        fileURL,
        "_blank"
      );

    } catch (error) {
      console.error(error);

      notify({ type: "error", title: "Unable to open resume", message: "The resume file could not be opened." });
    }
  }


  // =====================================================
  // DOWNLOAD
  // =====================================================

  async function downloadResume() {
    try {
      const response = await api.get(
        `/resume/${resumeId}/file`,
        {
          responseType: "blob",
        }
      );

      const url =
        URL.createObjectURL(
          response.data
        );

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        resumeFilename;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);

      notify({ type: "error", title: "Download failed", message: "The resume could not be downloaded." });
    }
  }


  // =====================================================
  // VIEW ANALYSIS
  // =====================================================

  function viewAnalysis() {

    // Save selected resume so
    // refresh/direct navigation
    // still works.

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
  }


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="recent-card">

      <div className="recent-top">

        <div className="file-icon">
          📄
        </div>

        <div>

          <h3>
            {resumeFilename}
          </h3>

          <span>
            Latest Uploaded Resume
          </span>

        </div>

      </div>


      <div className="recent-stats">

        <div>

          <p>
            ATS Score
          </p>

          <h2>
            {atsScore}
          </h2>

        </div>


        <div>

          <p>
            Uploaded
          </p>

          <h4>
            {date.toLocaleDateString()}
          </h4>

        </div>

      </div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr 1fr",
          gap: "12px",
          marginTop: "20px",
        }}
      >

        <button
          className="recent-btn"
          onClick={
            viewAnalysis
          }
        >
          📊 View Analysis
        </button>


        <button
          className="recent-btn"
          onClick={
            previewResume
          }
        >
          👁 Preview PDF
        </button>


        <button
          className="recent-btn"
          onClick={
            downloadResume
          }
        >
          ⬇ Download
        </button>

      </div>

    </div>
  );
}

export default RecentResume;