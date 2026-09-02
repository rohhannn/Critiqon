import "./ResumeAnalysisPage.css";

import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../../services/api";
import { notify } from "../../services/notifications";
import ResumeAnalysis from "../ResumeAnalysis/ResumeAnalysis";

interface ResumeAnalysisData {
  id: number;
  filename: string;
  uploaded_at: string | null;
  ats_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skills: string[];
  missing_skills: string[];
  suggestions: string[];
  recommended_roles: string[];
}

interface ApiError {
  response?: { data?: { detail?: unknown } };
  message?: string;
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((x) => x.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  return [];
}

function errorMessage(error: unknown, fallback: string): string {
  const candidate = error as ApiError;
  const detail = candidate.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (typeof candidate.message === "string" && candidate.message) return candidate.message;
  return fallback;
}

function ResumeAnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const stateResumeId = location.state?.resumeId ? Number(location.state.resumeId) : null;
  const storedResumeId = Number(localStorage.getItem("selectedResumeId")) || null;
  const [resumeId, setResumeId] = useState<number | null>(stateResumeId || storedResumeId);
  const [analysis, setAnalysis] = useState<ResumeAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState("");

  const normalize = useCallback((data: Record<string, unknown>, selectedId: number): ResumeAnalysisData => ({
    id: Number(data.id ?? selectedId),
    filename: typeof data.filename === "string" ? data.filename : "Resume",
    uploaded_at: typeof data.uploaded_at === "string" ? data.uploaded_at : null,
    ats_score: Number(data.ats_score ?? 0),
    summary: typeof data.summary === "string" ? data.summary : "",
    strengths: toList(data.strengths),
    weaknesses: toList(data.weaknesses),
    skills: toList(data.skills),
    missing_skills: toList(data.missing_skills),
    suggestions: toList(data.suggestions),
    recommended_roles: toList(data.recommended_roles),
  }), []);

  const loadResume = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      let selectedId = resumeId;
      if (!selectedId) {
        const response = await api.get<Array<{ id: number }>>("/resume/");
        selectedId = Number(response.data[0]?.id) || null;
        if (!selectedId) {
          setError("No resume found. Upload a resume first.");
          return;
        }
        setResumeId(selectedId);
      }

      localStorage.setItem("selectedResumeId", String(selectedId));
      const response = await api.get<Record<string, unknown>>(`/resume/${selectedId}`);
      setAnalysis(normalize(response.data, selectedId));
    } catch (err: unknown) {
      setAnalysis(null);
      setError(errorMessage(err, "Unable to load resume analysis."));
    } finally {
      setLoading(false);
    }
  }, [normalize, resumeId]);

  useEffect(() => {
    void loadResume();
  }, [loadResume]);

  async function handleReanalyze() {
    if (!resumeId || reanalyzing) return;
    try {
      setReanalyzing(true);
      setError("");
      const response = await api.post<Record<string, unknown>>(`/resume/${resumeId}/analyze`);
      setAnalysis(normalize(response.data, resumeId));
      notify({ type: "success", title: "Analysis updated", message: "Your resume has been analyzed successfully." });
    } catch (err: unknown) {
      const message = errorMessage(err, "AI analysis failed. Check your server configuration and try again.");
      setError(message);
      notify({ type: "error", title: "Analysis failed", message });
    } finally {
      setReanalyzing(false);
    }
  }

  if (loading) {
    return <div className="analysis-page-loading"><div className="analysis-loader"><span /> Loading your resume analysis…</div></div>;
  }

  if (error && !analysis) {
    return (
      <div className="analysis-page-error">
        <div className="analysis-error-card">
          <div className="analysis-error-icon">!</div>
          <h2>Analysis unavailable</h2>
          <p>{error}</p>
          <div className="analysis-error-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
            <button type="button" className="secondary" onClick={() => void loadResume()}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const hasAnalysis = Boolean(
    analysis.summary || analysis.ats_score || analysis.strengths.length || analysis.skills.length || analysis.suggestions.length
  );

  return (
    <div className="analysis-page">
      <div className="analysis-page-header">
        <button className="back-button" type="button" onClick={() => navigate("/dashboard")}>← Dashboard</button>
        <div className="analysis-heading-row">
          <div>
            <div className="eyebrow">RESUME INTELLIGENCE</div>
            <h1>AI Resume Analysis</h1>
            <p>{analysis.filename}</p>
          </div>
          <button type="button" className="reanalyze-button" onClick={() => void handleReanalyze()} disabled={reanalyzing}>
            {reanalyzing ? "Analyzing…" : "↻ Re-analyze"}
          </button>
        </div>
      </div>

      {error && <div className="analysis-inline-error">{error}</div>}

      {!hasAnalysis ? (
        <div className="analysis-empty-card">
          <div className="analysis-empty-icon">✦</div>
          <h2>Your analysis is ready to run</h2>
          <p>This resume was uploaded before the current analysis pipeline was enabled. Run the AI analysis to generate your ATS score, strengths, skills and role recommendations.</p>
          <button type="button" className="reanalyze-button primary" onClick={() => void handleReanalyze()} disabled={reanalyzing}>
            {reanalyzing ? "Analyzing your resume…" : "Run AI Analysis"}
          </button>
        </div>
      ) : (
        <ResumeAnalysis analysis={analysis} />
      )}
    </div>
  );
}

export default ResumeAnalysisPage;
