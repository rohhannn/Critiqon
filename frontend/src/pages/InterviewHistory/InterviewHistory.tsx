import "./InterviewHistory.css";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  Filter,
  Loader2,
  MessageSquare,
  Search,
  Target,
  Trophy,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import api from "../../services/api";

import Sidebar from "../../components/Sidebar/Sidebar";
import Topbar from "../../components/Topbar/Topbar";

interface InterviewAnswer {
  id: number;
  question: string;
  answer: string;
  score: number | null;
  technical_score: number | null;
  communication_score: number | null;
  relevance_score: number | null;
  feedback: string;
  strengths: string[];
  improvements: string[];
  missing_points: string[];
  improved_answer: string;
  created_at: string;
}

interface InterviewSession {
  session_id: number;
  resume_id: number;
  resume_filename: string | null;
  job_description: string;
  difficulty: string;
  question_count: number;
  completed_count: number;
  completion_percentage: number;
  completed: boolean;
  average_score: number | null;
  average_technical_score: number | null;
  average_communication_score: number | null;
  average_relevance_score: number | null;
  created_at: string;
  answers: InterviewAnswer[];
}

interface HistoryResponse {
  sessions: InterviewSession[];
  total_sessions: number;
}

type FilterStatus = "all" | "completed" | "in-progress";
type SortOption = "newest" | "oldest" | "highest" | "lowest";

function InterviewHistory() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedSession, setExpandedSession] =
    useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("all");
  const [difficultyFilter, setDifficultyFilter] =
    useState("all");
  const [sortBy, setSortBy] =
    useState<SortOption>("newest");

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<HistoryResponse>(
          "/interview/history"
        );

        setSessions(response.data.sessions || []);
      } catch (err: any) {
        console.error(
          "Failed to load interview history:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load interview history."
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  function toggleSession(sessionId: number) {
    setExpandedSession((current) =>
      current === sessionId ? null : sessionId
    );
  }

  function formatDate(dateString: string) {
    if (!dateString) return "Unknown date";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(dateString: string) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getScoreClass(score: number | null) {
    if (score === null) return "score-none";
    if (score >= 80) return "score-excellent";
    if (score >= 60) return "score-good";
    if (score >= 40) return "score-average";

    return "score-low";
  }

  function getScoreLabel(score: number | null) {
    if (score === null) return "Not scored";
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs work";

    return "Needs improvement";
  }

  function getDifficultyClass(difficulty: string) {
    return (difficulty || "mixed")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  const difficulties = useMemo(() => {
    const values = sessions
      .map((session) => session.difficulty)
      .filter(Boolean);

    return Array.from(new Set(values));
  }, [sessions]);

  const totalSessions = sessions.length;

  const completedSessions = sessions.filter(
    (session) => session.completed
  ).length;

  const scoredSessions = sessions.filter(
    (session) => session.average_score !== null
  );

  const overallAverage =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce(
            (sum, session) =>
              sum + (session.average_score || 0),
            0
          ) / scoredSessions.length
        )
      : null;

  const totalAnswers = sessions.reduce(
    (sum, session) =>
      sum + session.completed_count,
    0
  );

  const completionRate =
    totalSessions > 0
      ? Math.round(
          (completedSessions / totalSessions) * 100
        )
      : 0;

  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = sessions.filter((session) => {
      const searchableText = [
        session.resume_filename || "",
        session.difficulty || "",
        session.job_description || "",
        ...session.answers.map(
          (answer) => answer.question
        ),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" &&
          session.completed) ||
        (statusFilter === "in-progress" &&
          !session.completed);

      const matchesDifficulty =
        difficultyFilter === "all" ||
        session.difficulty === difficultyFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDifficulty
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortBy === "highest") {
        return (
          (b.average_score ?? -1) -
          (a.average_score ?? -1)
        );
      }

      if (sortBy === "lowest") {
        return (
          (a.average_score ?? 101) -
          (b.average_score ?? 101)
        );
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    sessions,
    searchQuery,
    statusFilter,
    difficultyFilter,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    difficultyFilter !== "all";

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setDifficultyFilter("all");
    setSortBy("newest");
  }

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <div className="dashboard-main">
          <Topbar />

          <div className="interview-history-page">
            <main className="interview-history-main">
              <div className="history-loading">
                <div className="loading-orb">
                  <Loader2
                    size={28}
                    className="history-spinner"
                  />
                </div>

                <div>
                  <h3>Loading interview history</h3>
                  <p>
                    Preparing your interview performance
                    dashboard...
                  </p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-layout">
        <Sidebar />

        <div className="dashboard-main">
          <Topbar />

          <div className="interview-history-page">
            <main className="interview-history-main">
              <section className="history-error">
                <div className="error-icon">
                  <XCircle size={34} />
                </div>

                <h2>Unable to load history</h2>

                <p>{error}</p>

                <button
                  className="error-retry"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </section>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Topbar />

        <div className="interview-history-page">
          <main className="interview-history-main">

            {/* HEADER */}
            <section className="history-hero">
              <div className="history-hero-content">
                <div className="history-title-row">
                  <div className="history-icon">
                    <BarChart3 size={26} />
                  </div>

                  <div>
                    <div className="history-eyebrow">
                      PERFORMANCE CENTER
                    </div>

                    <h1>Interview History</h1>

                    <p>
                      Track your interview performance,
                      review AI feedback, and identify
                      where you can improve.
                    </p>
                  </div>
                </div>

                <a
                  href="/interview-prep"
                  className="start-interview-btn"
                >
                  <Zap size={17} />
                  Start New Interview
                  <ArrowRight size={17} />
                </a>
              </div>
            </section>

            {/* STATS */}
            <section className="history-stats">
              <div className="history-stat-card stat-purple">
                <div className="history-stat-icon">
                  <MessageSquare size={20} />
                </div>

                <div className="stat-content">
                  <span>Total Interviews</span>
                  <strong>{totalSessions}</strong>
                </div>

                <div className="stat-decoration" />
              </div>

              <div className="history-stat-card stat-green">
                <div className="history-stat-icon">
                  <CheckCircle2 size={20} />
                </div>

                <div className="stat-content">
                  <span>Completed</span>
                  <strong>{completedSessions}</strong>
                </div>

                <div className="stat-mini">
                  {completionRate}%
                </div>
              </div>

              <div className="history-stat-card stat-blue">
                <div className="history-stat-icon">
                  <Target size={20} />
                </div>

                <div className="stat-content">
                  <span>Questions Answered</span>
                  <strong>{totalAnswers}</strong>
                </div>
              </div>

              <div className="history-stat-card stat-orange">
                <div className="history-stat-icon">
                  <Trophy size={20} />
                </div>

                <div className="stat-content">
                  <span>Average Score</span>
                  <strong>
                    {overallAverage !== null
                      ? overallAverage
                      : "—"}
                  </strong>
                </div>

                {overallAverage !== null && (
                  <div
                    className={`stat-score-label ${getScoreClass(
                      overallAverage
                    )}`}
                  >
                    {getScoreLabel(overallAverage)}
                  </div>
                )}
              </div>
            </section>

            {/* EMPTY */}
            {sessions.length === 0 ? (
              <section className="history-empty">
                <div className="empty-visual">
                  <div className="empty-icon">
                    <MessageSquare size={30} />
                  </div>

                  <div className="empty-ring ring-one" />
                  <div className="empty-ring ring-two" />
                </div>

                <h2>No interview history yet</h2>

                <p>
                  Complete your first AI interview practice
                  session. Your scores, feedback, and answer
                  evaluations will appear here.
                </p>

                <a
                  href="/interview-prep"
                  className="empty-action"
                >
                  Start Your First Interview
                  <ArrowRight size={17} />
                </a>
              </section>
            ) : (
              <section className="history-section">

                {/* SECTION TOOLBAR */}
                <div className="history-section-header">
                  <div>
                    <div className="section-heading-line">
                      <h2>Your Interviews</h2>

                      <span className="session-count">
                        {filteredSessions.length}
                        {filteredSessions.length === 1
                          ? " session"
                          : " sessions"}
                      </span>
                    </div>

                    <p>
                      Review and compare your previous
                      interview sessions.
                    </p>
                  </div>

                  <div className="history-toolbar">
                    <div className="history-search">
                      <Search size={16} />

                      <input
                        value={searchQuery}
                        onChange={(event) =>
                          setSearchQuery(
                            event.target.value
                          )
                        }
                        placeholder="Search interviews..."
                      />

                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() =>
                            setSearchQuery("")
                          }
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`filter-toggle ${
                        showFilters ||
                        hasActiveFilters
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setShowFilters((value) => !value)
                      }
                    >
                      <Filter size={16} />
                      Filters

                      {hasActiveFilters && (
                        <span className="filter-dot" />
                      )}
                    </button>
                  </div>
                </div>

                {/* FILTER PANEL */}
                {showFilters && (
                  <div className="filter-panel">
                    <div className="filter-group">
                      <label>Status</label>

                      <div className="filter-options">
                        {(
                          [
                            ["all", "All"],
                            ["completed", "Completed"],
                            ["in-progress", "In progress"],
                          ] as [
                            FilterStatus,
                            string
                          ][]
                        ).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            className={
                              statusFilter === value
                                ? "selected"
                                : ""
                            }
                            onClick={() =>
                              setStatusFilter(value)
                            }
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="filter-group">
                      <label>Difficulty</label>

                      <div className="filter-options">
                        <button
                          type="button"
                          className={
                            difficultyFilter === "all"
                              ? "selected"
                              : ""
                          }
                          onClick={() =>
                            setDifficultyFilter("all")
                          }
                        >
                          All
                        </button>

                        {difficulties.map((difficulty) => (
                          <button
                            key={difficulty}
                            type="button"
                            className={
                              difficultyFilter ===
                              difficulty
                                ? "selected"
                                : ""
                            }
                            onClick={() =>
                              setDifficultyFilter(
                                difficulty
                              )
                            }
                          >
                            {difficulty}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="filter-group sort-group">
                      <label>Sort by</label>

                      <select
                        value={sortBy}
                        onChange={(event) =>
                          setSortBy(
                            event.target.value as SortOption
                          )
                        }
                      >
                        <option value="newest">
                          Newest first
                        </option>
                        <option value="oldest">
                          Oldest first
                        </option>
                        <option value="highest">
                          Highest score
                        </option>
                        <option value="lowest">
                          Lowest score
                        </option>
                      </select>
                    </div>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="clear-filters"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}

                {/* SESSION LIST */}
                {filteredSessions.length === 0 ? (
                  <div className="no-filter-results">
                    <Search size={28} />

                    <h3>No matching interviews</h3>

                    <p>
                      Try changing your search or filter
                      settings.
                    </p>

                    <button
                      onClick={clearFilters}
                      type="button"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="session-list">
                    {filteredSessions.map((session) => {
                      const isExpanded =
                        expandedSession ===
                        session.session_id;

                      const progress = Math.min(
                        100,
                        Math.max(
                          0,
                          session.completion_percentage || 0
                        )
                      );

                      return (
                        <article
                          className={`session-card ${
                            isExpanded ? "expanded" : ""
                          }`}
                          key={session.session_id}
                        >
                          <button
                            type="button"
                            className="session-main"
                            onClick={() =>
                              toggleSession(
                                session.session_id
                              )
                            }
                            aria-expanded={isExpanded}
                          >
                            <div
                              className={`session-status ${
                                session.completed
                                  ? "completed"
                                  : "pending"
                              }`}
                            >
                              {session.completed ? (
                                <CheckCircle2 size={21} />
                              ) : (
                                <Clock3 size={21} />
                              )}
                            </div>

                            <div className="session-info">
                              <div className="session-top-row">
                                <h3>
                                  {session.resume_filename ||
                                    "Interview Session"}
                                </h3>

                                <span
                                  className={`difficulty-badge ${getDifficultyClass(
                                    session.difficulty
                                  )}`}
                                >
                                  {session.difficulty ||
                                    "Mixed"}
                                </span>

                                {session.completed && (
                                  <span className="completed-badge">
                                    Completed
                                  </span>
                                )}
                              </div>

                              <div className="session-meta">
                                <span>
                                  <Calendar size={13} />
                                  {formatDate(
                                    session.created_at
                                  )}
                                </span>

                                <span>
                                  <Clock3 size={13} />
                                  {formatTime(
                                    session.created_at
                                  )}
                                </span>

                                <span>
                                  <MessageSquare size={13} />
                                  {session.completed_count}/
                                  {session.question_count}{" "}
                                  answered
                                </span>
                              </div>
                            </div>

                            <div className="session-score">
                              {session.average_score !==
                              null ? (
                                <>
                                  <div
                                    className={`history-score ${getScoreClass(
                                      session.average_score
                                    )}`}
                                  >
                                    <strong>
                                      {session.average_score}
                                    </strong>

                                    <span>/100</span>
                                  </div>

                                  <small>
                                    {getScoreLabel(
                                      session.average_score
                                    )}
                                  </small>
                                </>
                              ) : (
                                <span className="not-scored">
                                  Not scored
                                </span>
                              )}
                            </div>

                            <div className="session-expand">
                              {isExpanded ? (
                                <ChevronUp size={19} />
                              ) : (
                                <ChevronDown size={19} />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="session-details">

                              {/* OVERVIEW */}
                              <div className="details-top">
                                <div>
                                  <span className="details-label">
                                    SESSION OVERVIEW
                                  </span>

                                  <h3>
                                    {session.resume_filename ||
                                      "Interview Session"}
                                  </h3>
                                </div>

                                <div
                                  className={`large-score ${getScoreClass(
                                    session.average_score
                                  )}`}
                                >
                                  {session.average_score !==
                                  null ? (
                                    <>
                                      <strong>
                                        {
                                          session.average_score
                                        }
                                      </strong>
                                      <span>/100</span>
                                    </>
                                  ) : (
                                    <span>—</span>
                                  )}
                                </div>
                              </div>

                              {/* PROGRESS */}
                              <div className="completion-block">
                                <div className="completion-header">
                                  <div>
                                    <span>
                                      Interview completion
                                    </span>

                                    <small>
                                      {
                                        session.completed_count
                                      }{" "}
                                      of{" "}
                                      {
                                        session.question_count
                                      }{" "}
                                      questions
                                    </small>
                                  </div>

                                  <strong>
                                    {Math.round(progress)}%
                                  </strong>
                                </div>

                                <div className="progress-track">
                                  <div
                                    className={`progress-fill ${
                                      session.completed
                                        ? "complete"
                                        : ""
                                    }`}
                                    style={{
                                      width: `${progress}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* SCORE BREAKDOWN */}
                              <div className="score-breakdown">
                                <ScoreMetric
                                  label="Overall"
                                  score={
                                    session.average_score
                                  }
                                  primary
                                />

                                <ScoreMetric
                                  label="Technical"
                                  score={
                                    session.average_technical_score
                                  }
                                />

                                <ScoreMetric
                                  label="Communication"
                                  score={
                                    session.average_communication_score
                                  }
                                />

                                <ScoreMetric
                                  label="Relevance"
                                  score={
                                    session.average_relevance_score
                                  }
                                />
                              </div>

                              {/* JOB DESCRIPTION */}
                              {session.job_description?.trim() && (
                                <details className="history-job-description">
                                  <summary>
                                    <div>
                                      <FileText size={17} />

                                      <div>
                                        <strong>
                                          Target Job Description
                                        </strong>

                                        <span>
                                          View the job
                                          requirements used
                                          for this interview
                                        </span>
                                      </div>
                                    </div>

                                    <ChevronDown size={17} />
                                  </summary>

                                  <div className="job-description-content">
                                    <p>
                                      {
                                        session.job_description
                                      }
                                    </p>
                                  </div>
                                </details>
                              )}

                              {/* ANSWERS */}
                              {session.answers.length > 0 ? (
                                <div className="answer-history">
                                  <div className="answer-history-heading">
                                    <div>
                                      <span className="details-label">
                                        PERFORMANCE REVIEW
                                      </span>

                                      <h3>
                                        Answer Evaluations
                                      </h3>
                                    </div>

                                    <span>
                                      {
                                        session.answers.length
                                      }{" "}
                                      evaluated
                                    </span>
                                  </div>

                                  <div className="answer-history-list">
                                    {session.answers.map(
                                      (answer, index) => (
                                        <AnswerCard
                                          key={answer.id}
                                          answer={answer}
                                          index={index}
                                          getScoreClass={
                                            getScoreClass
                                          }
                                        />
                                      )
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="no-answers">
                                  <FileText size={21} />

                                  <div>
                                    <strong>
                                      No evaluated answers
                                    </strong>

                                    <span>
                                      No answers have been
                                      evaluated in this
                                      session yet.
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ScoreMetric({
  label,
  score,
  primary = false,
}: {
  label: string;
  score: number | null;
  primary?: boolean;
}) {
  const scoreClass =
    score === null
      ? "score-none"
      : score >= 80
      ? "score-excellent"
      : score >= 60
      ? "score-good"
      : score >= 40
      ? "score-average"
      : "score-low";

  return (
    <div className={`score-metric ${primary ? "primary" : ""}`}>
      <span>{label}</span>

      <div className={scoreClass}>
        <strong>{score ?? "—"}</strong>

        {score !== null && <small>/100</small>}
      </div>

      {score !== null && (
        <div className="metric-line">
          <span
            style={{
              width: `${Math.min(
                100,
                Math.max(0, score)
              )}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

function AnswerCard({
  answer,
  index,
  getScoreClass,
}: {
  answer: InterviewAnswer;
  index: number;
  getScoreClass: (
    score: number | null
  ) => string;
}) {
  const [showImproved, setShowImproved] =
    useState(false);

  return (
    <article className="answer-history-card">
      <div className="answer-number">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="answer-content">
        <div className="answer-history-header">
          <div className="question-block">
            <span className="answer-label">
              QUESTION {index + 1}
            </span>

            <h5>{answer.question}</h5>
          </div>

          <div
            className={`answer-history-score ${getScoreClass(
              answer.score
            )}`}
          >
            <strong>{answer.score ?? "—"}</strong>

            {answer.score !== null && (
              <span>/100</span>
            )}
          </div>
        </div>

        <div className="candidate-answer">
          <div className="answer-box-heading">
            <span>Your Answer</span>
          </div>

          <p>
            {answer.answer || "No answer recorded."}
          </p>
        </div>

        <div className="answer-score-grid">
          <MiniScore
            label="Technical"
            score={answer.technical_score}
          />

          <MiniScore
            label="Communication"
            score={answer.communication_score}
          />

          <MiniScore
            label="Relevance"
            score={answer.relevance_score}
          />
        </div>

        {answer.feedback && (
          <div className="feedback-block feedback-main">
            <div className="feedback-title">
              <span>AI Feedback</span>
            </div>

            <p>{answer.feedback}</p>
          </div>
        )}

        <div className="feedback-columns">
          {answer.strengths?.length > 0 && (
            <FeedbackList
              title="What you did well"
              items={answer.strengths}
              type="positive"
            />
          )}

          {answer.improvements?.length > 0 && (
            <FeedbackList
              title="What to improve"
              items={answer.improvements}
              type="improvement"
            />
          )}
        </div>

        {answer.missing_points?.length > 0 && (
          <FeedbackList
            title="Missing points"
            items={answer.missing_points}
            type="missing"
          />
        )}

        {answer.improved_answer && (
          <div className="improved-answer-wrapper">
            <button
              type="button"
              className="improved-answer-toggle"
              onClick={() =>
                setShowImproved((value) => !value)
              }
            >
              <div>
                <div className="improved-icon">
                  <Zap size={15} />
                </div>

                <div>
                  <strong>
                    Suggested improved answer
                  </strong>

                  <span>
                    See how this response could be
                    stronger
                  </span>
                </div>
              </div>

              {showImproved ? (
                <ChevronUp size={17} />
              ) : (
                <ChevronDown size={17} />
              )}
            </button>

            {showImproved && (
              <div className="improved-answer">
                <p>{answer.improved_answer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function MiniScore({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  const scoreClass =
    score === null
      ? "score-none"
      : score >= 80
      ? "score-excellent"
      : score >= 60
      ? "score-good"
      : score >= 40
      ? "score-average"
      : "score-low";

  return (
    <div className="mini-score">
      <span>{label}</span>

      <strong className={scoreClass}>
        {score ?? "—"}
      </strong>

      {score !== null && <small>/100</small>}
    </div>
  );
}

function FeedbackList({
  title,
  items,
  type,
}: {
  title: string;
  items: string[];
  type:
    | "positive"
    | "improvement"
    | "missing";
}) {
  return (
    <div
      className={`feedback-block feedback-list ${type}`}
    >
      <div className="feedback-title">
        <span>{title}</span>
      </div>

      <ul>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>
            <span className="feedback-bullet" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InterviewHistory;