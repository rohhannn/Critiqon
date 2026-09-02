import "./InterviewPrep.css";

import { useEffect, useState } from "react";

import {
  Brain,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

import api from "../../services/api";

// =====================================================
// TYPES
// =====================================================

interface Resume {
  id: number;
  filename: string;
  filepath: string;
  uploaded_at: string;
  user_id: number;
}

interface InterviewQuestion {
  question: string;
  category: string;
  difficulty: string;
  why_asked: string;
  key_points: string[];
}

interface InterviewResponse {
  session_id: number;
  resume_id: number;
  resume_filename: string;
  questions: InterviewQuestion[];
}

interface EvaluationResult {
  id?: number;
  session_id?: number;
  score: number;
  technical_score: number;
  communication_score: number;
  relevance_score: number;
  strengths: string[];
  improvements: string[];
  missing_points: string[];
  feedback: string;
  improved_answer: string;
}

// =====================================================
// SAFE API ERROR MESSAGE
// =====================================================

function getApiErrorMessage(
  err: any,
  fallback: string
): string {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const detail = data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (detail && typeof detail === "object") {
    if (typeof detail.message === "string") {
      return detail.message;
    }

    if (detail.code === "QUESTION_LIMIT") {
      const plan = detail.current_plan || "current";
      const limit = detail.limit || 10;

      return (
        `Your ${plan} plan allows up to ` +
        `${limit} interview questions per session.`
      );
    }

    if (typeof detail.error === "string") {
      return detail.error;
    }

    if (typeof detail.detail === "string") {
      return detail.detail;
    }
  }

  if (typeof data === "string") {
    return data;
  }

  if (status === 400) {
    return (
      "The interview request is invalid. " +
      "Please check your resume and job description."
    );
  }

  if (status === 401) {
    return (
      "Your session has expired. " +
      "Please log in again."
    );
  }

  if (status === 403) {
    return (
      "Your current plan does not allow " +
      "this interview request."
    );
  }

  if (status === 404) {
    return (
      "The interview service could not be found. " +
      "Please check that the backend is running correctly."
    );
  }

  if (status === 422) {
    return (
      "Some interview information is invalid. " +
      "Please check the selected resume and try again."
    );
  }

  if (status === 429) {
    return (
      "You have reached your current usage limit. " +
      "Please try again later."
    );
  }

  if (status >= 500) {
    return (
      "The interview service is temporarily unavailable. " +
      "Please try again."
    );
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}

// =====================================================
// NORMALIZE QUESTION
// =====================================================

function normalizeQuestion(
  question: any
): InterviewQuestion {
  return {
    question:
      typeof question?.question === "string"
        ? question.question
        : "",

    category:
      typeof question?.category === "string"
        ? question.category
        : "General",

    difficulty:
      typeof question?.difficulty === "string"
        ? question.difficulty
        : "Mixed",

    why_asked:
      typeof question?.why_asked === "string"
        ? question.why_asked
        : "This question helps evaluate your preparation for the target role.",

    key_points:
      Array.isArray(question?.key_points)
        ? question.key_points.filter(
            (point: any) =>
              typeof point === "string"
          )
        : [],
  };
}

// =====================================================
// COMPONENT
// =====================================================

function InterviewPrep() {
  const [resumes, setResumes] =
    useState<Resume[]>([]);

  const [selectedResumeId, setSelectedResumeId] =
    useState<number | "">("");

  const [sessionId, setSessionId] =
    useState<number | null>(null);

  const [jobDescription, setJobDescription] =
    useState("");

  const [difficulty, setDifficulty] =
    useState("Mixed");

  const [questionCount, setQuestionCount] =
    useState(10);

  const [questions, setQuestions] =
    useState<InterviewQuestion[]>([]);

  const [loadingResumes, setLoadingResumes] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [evaluating, setEvaluating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [expandedQuestion, setExpandedQuestion] =
    useState<number | null>(null);

  const [activeQuestion, setActiveQuestion] =
    useState<number | null>(null);

  const [answer, setAnswer] =
    useState("");

  const [evaluation, setEvaluation] =
    useState<EvaluationResult | null>(null);

  const [completedScores, setCompletedScores] =
    useState<number[]>([]);

  // =====================================================
  // LOAD RESUMES
  // =====================================================

  useEffect(() => {
    let mounted = true;

    async function loadResumes() {
      try {
        setLoadingResumes(true);
        setError("");

        const response =
          await api.get<Resume[]>("/resume/");

        if (!mounted) {
          return;
        }

        const loadedResumes =
          Array.isArray(response.data)
            ? response.data
            : [];

        setResumes(loadedResumes);

        if (loadedResumes.length > 0) {
          setSelectedResumeId(
            loadedResumes[0].id
          );
        }
      } catch (err: any) {
        console.error(
          "Resume loading error:",
          err
        );

        if (mounted) {
          setError(
            getApiErrorMessage(
              err,
              "Unable to load your resumes."
            )
          );
        }
      } finally {
        if (mounted) {
          setLoadingResumes(false);
        }
      }
    }

    loadResumes();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // GENERATE INTERVIEW
  // =====================================================

  async function handleGenerate() {
    if (!selectedResumeId) {
      setError(
        "Please select a resume first."
      );
      return;
    }

    if (generating) {
      return;
    }

    try {
      setGenerating(true);
      setError("");

      setSessionId(null);
      setQuestions([]);
      setExpandedQuestion(null);
      setActiveQuestion(null);
      setAnswer("");
      setEvaluation(null);
      setCompletedScores([]);

      const response =
        await api.post<InterviewResponse>(
          "/interview/generate",
          {
            resume_id: selectedResumeId,
            job_description:
              jobDescription.trim(),
            difficulty,
            question_count:
              questionCount,
          }
        );

      if (!response?.data) {
        throw new Error(
          "The server returned an empty response."
        );
      }

      const responseData =
        response.data as any;

      const newSessionId =
        Number(responseData.session_id);

      if (!Number.isFinite(newSessionId)) {
        throw new Error(
          "The interview session could not be created."
        );
      }

      const rawQuestions =
        Array.isArray(responseData.questions)
          ? responseData.questions
          : [];

      const generatedQuestions =
        rawQuestions
          .map(normalizeQuestion)
          .filter(
            (item: InterviewQuestion) =>
              item.question.trim().length > 0
          );

      if (
        generatedQuestions.length === 0
      ) {
        throw new Error(
          "The AI did not return any interview questions. Please try again."
        );
      }

      setSessionId(newSessionId);
      setQuestions(generatedQuestions);
      setExpandedQuestion(null);
    } catch (err: any) {
      console.error(
        "Interview generation error:",
        err
      );

      const message =
        getApiErrorMessage(
          err,
          "Unable to generate interview questions."
        );

      setError(message);

      setSessionId(null);
      setQuestions([]);
      setExpandedQuestion(null);
      setActiveQuestion(null);
      setAnswer("");
      setEvaluation(null);
      setCompletedScores([]);
    } finally {
      setGenerating(false);
    }
  }

  // =====================================================
  // TOGGLE QUESTION
  // =====================================================

  function toggleQuestion(index: number) {
    setExpandedQuestion(
      (previous) =>
        previous === index
          ? null
          : index
    );
  }

  // =====================================================
  // START PRACTICE
  // =====================================================

  function startPractice(index: number) {
    if (!sessionId) {
      setError(
        "Interview session not found. Please generate the interview again."
      );
      return;
    }

    if (!questions[index]) {
      setError(
        "Interview question not found."
      );
      return;
    }

    setActiveQuestion(index);
    setAnswer("");
    setEvaluation(null);
    setError("");

    setTimeout(() => {
      const practiceSection =
        document.querySelector(
          ".practice-section"
        );

      if (practiceSection) {
        practiceSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);
  }

  // =====================================================
  // EVALUATE ANSWER
  // =====================================================

  async function evaluateAnswer() {
    if (activeQuestion === null) {
      return;
    }

    if (!answer.trim()) {
      setError(
        "Please write your answer first."
      );
      return;
    }

    if (!selectedResumeId) {
      setError(
        "Please select a resume."
      );
      return;
    }

    if (!sessionId) {
      setError(
        "Interview session not found. Please generate the interview again."
      );
      return;
    }

    const question =
      questions[activeQuestion];

    if (!question) {
      setError(
        "Interview question not found."
      );
      return;
    }

    if (evaluating) {
      return;
    }

    try {
      setEvaluating(true);
      setError("");

      const response =
        await api.post<EvaluationResult>(
          "/interview/evaluate",
          {
            resume_id: selectedResumeId,
            session_id: sessionId,
            question: question.question,
            answer: answer.trim(),
            job_description:
              jobDescription.trim(),
          }
        );

      if (!response?.data) {
        throw new Error(
          "The server returned an empty evaluation."
        );
      }

      const result =
        response.data as any;

      const normalizedEvaluation:
        EvaluationResult = {
        id: result.id,

        session_id:
          result.session_id,

        score:
          Number(result.score) || 0,

        technical_score:
          Number(
            result.technical_score
          ) || 0,

        communication_score:
          Number(
            result.communication_score
          ) || 0,

        relevance_score:
          Number(
            result.relevance_score
          ) || 0,

        strengths:
          Array.isArray(
            result.strengths
          )
            ? result.strengths
            : [],

        improvements:
          Array.isArray(
            result.improvements
          )
            ? result.improvements
            : [],

        missing_points:
          Array.isArray(
            result.missing_points
          )
            ? result.missing_points
            : [],

        feedback:
          typeof result.feedback ===
          "string"
            ? result.feedback
            : "",

        improved_answer:
          typeof result.improved_answer ===
          "string"
            ? result.improved_answer
            : "",
      };

      setEvaluation(
        normalizedEvaluation
      );

      setCompletedScores(
        (previous) => {
          const updated = [...previous];

          updated[activeQuestion] =
            normalizedEvaluation.score;

          return updated;
        }
      );
    } catch (err: any) {
      console.error(
        "Answer evaluation error:",
        err
      );

      const message =
        getApiErrorMessage(
          err,
          "Unable to evaluate your answer."
        );

      setError(message);
    } finally {
      setEvaluating(false);
    }
  }

  // =====================================================
  // NEXT QUESTION
  // =====================================================

  function nextQuestion() {
    if (activeQuestion === null) {
      return;
    }

    const next =
      activeQuestion + 1;

    if (next >= questions.length) {
      setActiveQuestion(null);
      setAnswer("");
      setEvaluation(null);
      return;
    }

    setActiveQuestion(next);
    setAnswer("");
    setEvaluation(null);
    setError("");

    setTimeout(() => {
      const practiceSection =
        document.querySelector(
          ".practice-section"
        );

      if (practiceSection) {
        practiceSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);
  }

  // =====================================================
  // COMPLETED QUESTIONS
  // =====================================================

  const completedCount =
    completedScores.filter(
      (score) =>
        typeof score === "number" &&
        Number.isFinite(score)
    ).length;

  // =====================================================
  // READINESS SCORE
  // =====================================================

  const readinessScore =
    completedCount > 0
      ? Math.round(
          completedScores
            .filter(
              (score) =>
                typeof score === "number" &&
                Number.isFinite(score)
            )
            .reduce(
              (sum, score) =>
                sum + score,
              0
            ) / completedCount
        )
      : null;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="interview-page">
      <main className="interview-main">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="interview-header">
          <div className="interview-title-row">

            <div className="interview-icon">
              <Brain size={26} />
            </div>

            <div>
              <h1>
                Interview Prep
              </h1>

              <p>
                Prepare for interviews using
                questions tailored to your resume
                and target role.
              </p>
            </div>

          </div>
        </section>

        {/* =================================================
            GENERATOR
        ================================================= */}

        <section className="interview-generator">

          <div className="generator-heading">
            <h2>
              <Sparkles size={20} />
              Generate Interview Questions
            </h2>

            <p>
              AI will analyze your resume and
              create realistic interview questions.
            </p>
          </div>

          <div className="generator-grid">

            {/* RESUME */}

            <div className="form-group">
              <label>
                Select Resume
              </label>

              <div className="select-wrapper">
                <FileText size={18} />

                <select
                  value={selectedResumeId}
                  onChange={(e) =>
                    setSelectedResumeId(
                      e.target.value
                        ? Number(
                            e.target.value
                          )
                        : ""
                    )
                  }
                  disabled={
                    loadingResumes ||
                    generating
                  }
                >
                  <option value="">
                    {loadingResumes
                      ? "Loading resumes..."
                      : resumes.length === 0
                      ? "No resumes available"
                      : "Select a resume"}
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
              </div>
            </div>

            {/* DIFFICULTY */}

            <div className="form-group">
              <label>
                Difficulty
              </label>

              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(
                    e.target.value
                  )
                }
                disabled={generating}
              >
                <option value="Mixed">
                  Mixed
                </option>

                <option value="Easy">
                  Easy
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="Hard">
                  Hard
                </option>
              </select>
            </div>

            {/* QUESTION COUNT */}

            <div className="form-group">
              <label>
                Number of Questions
              </label>

              <select
                value={questionCount}
                onChange={(e) =>
                  setQuestionCount(
                    Number(
                      e.target.value
                    )
                  )
                }
                disabled={generating}
              >
                <option value={5}>
                  5 Questions
                </option>

                <option value={10}>
                  10 Questions
                </option>

                <option value={15}>
                  15 Questions
                </option>

                <option value={20}>
                  20 Questions
                </option>
              </select>
            </div>

          </div>

          {/* JOB DESCRIPTION */}

          <div className="form-group full-width">

            <label>
              Job Description

              <span>
                Optional
              </span>
            </label>

            <textarea
              value={jobDescription}
              onChange={(e) =>
                setJobDescription(
                  e.target.value
                )
              }
              placeholder="Paste the job description here..."
              rows={7}
              disabled={generating}
            />

          </div>

          {/* ERROR */}

          {error && (
            <div
              className="interview-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* GENERATE BUTTON */}

          <button
            type="button"
            className="generate-btn"
            onClick={handleGenerate}
            disabled={
              generating ||
              loadingResumes ||
              !selectedResumeId
            }
          >
            {generating ? (
              <>
                <Loader2
                  size={19}
                  className="spin"
                />

                Generating Questions...
              </>
            ) : (
              <>
                <Sparkles size={19} />

                Generate Interview Questions
              </>
            )}
          </button>

        </section>

        {/* =================================================
            READINESS
        ================================================= */}

        {readinessScore !== null && (
          <section className="readiness-card">

            <div>
              <h2>
                Interview Readiness
              </h2>

              <p>
                {completedCount} of{" "}
                {questions.length}{" "}
                questions evaluated.
              </p>
            </div>

            <div className="readiness-score">
              {readinessScore}

              <span>
                /100
              </span>
            </div>

          </section>
        )}

        {/* =================================================
            QUESTIONS
        ================================================= */}

        {questions.length > 0 && (
          <section className="questions-section">

            <div className="questions-header">

              <div>
                <h2>
                  Your Interview Questions
                </h2>

                <p>
                  {questions.length}{" "}
                  questions generated from your resume
                  {jobDescription.trim()
                    ? " and job description."
                    : "."}
                </p>
              </div>

              <div className="questions-badge">
                AI Generated
              </div>

            </div>

            <div className="questions-list">

              {questions.map(
                (item, index) => {

                  const isExpanded =
                    expandedQuestion === index;

                  const isCompleted =
                    typeof completedScores[
                      index
                    ] === "number";

                  return (
                    <article
                      className={`question-card ${
                        isExpanded
                          ? "expanded"
                          : ""
                      } ${
                        isCompleted
                          ? "completed"
                          : ""
                      }`}
                      key={`${index}-${item.question}`}
                    >

                      {/* QUESTION HEADER */}

                      <button
                        type="button"
                        className="question-main"
                        onClick={() =>
                          toggleQuestion(
                            index
                          )
                        }
                      >

                        <div className="question-number">

                          {isCompleted ? (
                            <CheckCircle
                              size={20}
                            />
                          ) : (
                            index + 1
                          )}

                        </div>

                        <div className="question-content">

                          <div className="question-meta">

                            <span
                              className={`category ${
                                item.category
                                  ?.toLowerCase()
                                  .replace(
                                    /\s+/g,
                                    "-"
                                  ) ||
                                "general"
                              }`}
                            >
                              {item.category ||
                                "General"}
                            </span>

                            <span
                              className={`difficulty ${
                                item.difficulty
                                  ?.toLowerCase() ||
                                "mixed"
                              }`}
                            >
                              {item.difficulty ||
                                "Mixed"}
                            </span>

                            {isCompleted && (
                              <span className="score-badge">
                                {completedScores[
                                  index
                                ]}
                                /100
                              </span>
                            )}

                          </div>

                          <h3>
                            {item.question}
                          </h3>

                        </div>

                        <div className="expand-icon">

                          {isExpanded ? (
                            <ChevronUp
                              size={20}
                            />
                          ) : (
                            <ChevronDown
                              size={20}
                            />
                          )}

                        </div>

                      </button>

                      {/* QUESTION DETAILS */}

                      {isExpanded && (
                        <div className="question-details">

                          <div className="detail-block">

                            <h4>
                              Why they may ask
                            </h4>

                            <p>
                              {item.why_asked}
                            </p>

                          </div>

                          <div className="detail-block">

                            <h4>
                              Key points to cover
                            </h4>

                            {item.key_points.length >
                            0 ? (
                              <ul>
                                {item.key_points.map(
                                  (
                                    point,
                                    pointIndex
                                  ) => (
                                    <li
                                      key={
                                        pointIndex
                                      }
                                    >
                                      {point}
                                    </li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <p>
                                Focus on answering
                                clearly with specific
                                examples from your
                                experience.
                              </p>
                            )}

                          </div>

                          <button
                            type="button"
                            className="practice-btn"
                            onClick={() =>
                              startPractice(
                                index
                              )
                            }
                          >
                            Practice This Question

                            <ArrowRight
                              size={17}
                            />
                          </button>

                        </div>
                      )}

                    </article>
                  );
                }
              )}

            </div>

          </section>
        )}

        {/* =================================================
            PRACTICE
        ================================================= */}

        {activeQuestion !== null && (
          <section className="practice-section">

            <div className="practice-header">

              <div>
                <span>
                  Question{" "}
                  {activeQuestion + 1}{" "}
                  of{" "}
                  {questions.length}
                </span>

                <h2>
                  Practice Interview
                </h2>
              </div>

              {evaluation && (
                <div className="answer-score">
                  {evaluation.score}

                  <span>
                    /100
                  </span>
                </div>
              )}

            </div>

            {/* PRACTICE QUESTION */}

            <div className="practice-question">

              <div className="practice-label">
                Interview Question
              </div>

              <h3>
                {
                  questions[
                    activeQuestion
                  ]?.question
                }
              </h3>

            </div>

            {/* ANSWER */}

            <div className="answer-section">

              <label>
                Your Answer
              </label>

              <textarea
                value={answer}
                onChange={(e) =>
                  setAnswer(
                    e.target.value
                  )
                }
                placeholder="Type how you would answer this question in an actual interview..."
                rows={9}
                disabled={
                  !!evaluation ||
                  evaluating
                }
              />

            </div>

            {/* EVALUATE / RESULT */}

            {!evaluation ? (
              <button
                type="button"
                className="evaluate-btn"
                onClick={
                  evaluateAnswer
                }
                disabled={
                  evaluating ||
                  !answer.trim() ||
                  !sessionId
                }
              >
                {evaluating ? (
                  <>
                    <Loader2
                      size={18}
                      className="spin"
                    />

                    Evaluating Answer...
                  </>
                ) : (
                  <>
                    <Sparkles
                      size={18}
                    />

                    Evaluate My Answer
                  </>
                )}
              </button>
            ) : (
              <div className="evaluation-result">

                <h3>
                  AI Evaluation
                </h3>

                {/* SCORES */}

                <div className="evaluation-scores">

                  <div>
                    <span>
                      Technical
                    </span>

                    <strong>
                      {
                        evaluation.technical_score
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Communication
                    </span>

                    <strong>
                      {
                        evaluation.communication_score
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Relevance
                    </span>

                    <strong>
                      {
                        evaluation.relevance_score
                      }
                    </strong>
                  </div>

                </div>

                {/* FEEDBACK */}

                <div className="feedback-block">

                  <h4>
                    Feedback
                  </h4>

                  <p>
                    {evaluation.feedback ||
                      "No additional feedback was provided."}
                  </p>

                </div>

                {/* STRENGTHS / IMPROVEMENTS */}

                <div className="feedback-columns">

                  <div>

                    <h4>
                      What you did well
                    </h4>

                    {evaluation.strengths.length >
                    0 ? (
                      <ul>
                        {evaluation.strengths.map(
                          (
                            item,
                            index
                          ) => (
                            <li
                              key={index}
                            >
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p>
                        No specific strengths
                        were returned.
                      </p>
                    )}

                  </div>

                  <div>

                    <h4>
                      What to improve
                    </h4>

                    {evaluation.improvements.length >
                    0 ? (
                      <ul>
                        {evaluation.improvements.map(
                          (
                            item,
                            index
                          ) => (
                            <li
                              key={index}
                            >
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p>
                        No specific improvements
                        were returned.
                      </p>
                    )}

                  </div>

                </div>

                {/* MISSING POINTS */}

                {evaluation.missing_points.length >
                  0 && (
                  <div className="feedback-block">

                    <h4>
                      Missing points
                    </h4>

                    <ul>
                      {evaluation.missing_points.map(
                        (
                          item,
                          index
                        ) => (
                          <li
                            key={index}
                          >
                            {item}
                          </li>
                        )
                      )}
                    </ul>

                  </div>
                )}

                {/* IMPROVED ANSWER */}

                {evaluation.improved_answer && (
                  <div className="improved-answer">

                    <h4>
                      Suggested Improved Answer
                    </h4>

                    <p>
                      {
                        evaluation.improved_answer
                      }
                    </p>

                  </div>
                )}

                {/* NEXT / FINISH */}

                {activeQuestion <
                questions.length - 1 ? (
                  <button
                    type="button"
                    className="next-question-btn"
                    onClick={
                      nextQuestion
                    }
                  >
                    Next Question

                    <ArrowRight
                      size={18}
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="next-question-btn"
                    onClick={() => {
                      setActiveQuestion(
                        null
                      );

                      setAnswer("");

                      setEvaluation(
                        null
                      );
                    }}
                  >
                    Finish Interview

                    <CheckCircle
                      size={18}
                    />
                  </button>
                )}

              </div>
            )}

          </section>
        )}

      </main>
    </div>
  );
}

export default InterviewPrep;