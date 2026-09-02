import "./ResumeAnalysis.css";

import { useMemo, useState, type ReactNode } from "react";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileCheck2,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";

import ScoreCard from "../../components/ScoreCard/ScoreCard";

interface Analysis {
  ats_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skills?: string[];
  missing_skills: string[];
  suggestions: string[];
  recommended_roles: string[];
}

interface Props {
  analysis: Analysis;
}

interface SectionProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  className?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  count?: number;
  collapsible?: boolean;
}

function Section({
  title,
  subtitle,
  icon,
  className = "",
  children,
  defaultOpen = true,
  count,
  collapsible = false,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`analysis-panel ${className} ${
        open ? "is-open" : "is-collapsed"
      }`}
    >
      <div
        className={`analysis-panel-heading ${
          collapsible ? "is-clickable" : ""
        }`}
        onClick={() => collapsible && setOpen((value) => !value)}
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={(event) => {
          if (
            collapsible &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
      >
        <div className="analysis-panel-icon">{icon}</div>

        <div className="analysis-panel-heading-copy">
          <div className="analysis-title-line">
            <h2>{title}</h2>

            {typeof count === "number" && (
              <span className="analysis-count">{count}</span>
            )}
          </div>

          {subtitle && <p>{subtitle}</p>}
        </div>

        {collapsible && (
          <button
            type="button"
            className="analysis-collapse-button"
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            onClick={(event) => {
              event.stopPropagation();
              setOpen((value) => !value);
            }}
          >
            <ChevronDown
              size={18}
              className={open ? "rotate-180" : ""}
            />
          </button>
        )}
      </div>

      <div className="analysis-section-content">{children}</div>
    </section>
  );
}

function List({
  items,
  empty,
  variant = "default",
}: {
  items: string[];
  empty: string;
  variant?: "default" | "warning" | "purple";
}) {
  if (!items?.length) {
    return (
      <div className="analysis-empty-line">
        <CircleAlert size={16} />
        <span>{empty}</span>
      </div>
    );
  }

  return (
    <div className={`analysis-list ${variant}`}>
      {items.map((item, index) => (
        <div
          className="analysis-list-item"
          key={`${item}-${index}`}
        >
          <span className="analysis-list-number">
            {index + 1}
          </span>

          <span className="analysis-list-text">{item}</span>
        </div>
      ))}
    </div>
  );
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Needs work";
  return "Needs attention";
}

function getScoreClass(score: number) {
  if (score >= 85) return "excellent";
  if (score >= 70) return "strong";
  if (score >= 55) return "average";
  return "weak";
}

function ResumeAnalysis({ analysis }: Props) {
  const [showAllSkills, setShowAllSkills] = useState(false);

  const skills = analysis.skills ?? [];

  const visibleSkills = showAllSkills
    ? skills
    : skills.slice(0, 12);

  const totalSignals = useMemo(
    () =>
      analysis.strengths.length +
      skills.length +
      analysis.recommended_roles.length,
    [analysis, skills.length]
  );

  const totalGaps = useMemo(
    () =>
      analysis.weaknesses.length +
      analysis.missing_skills.length +
      analysis.suggestions.length,
    [analysis]
  );

  const score = Math.max(
    0,
    Math.min(100, Number(analysis.ats_score) || 0)
  );

  return (
    <div className="analysis-dashboard">

      {/* =====================================================
          TOP SUMMARY
      ===================================================== */}

      <div className="analysis-hero">

        <div className="analysis-hero-content">

          <div className="analysis-eyebrow">
            <span className="analysis-eyebrow-icon">
              <Sparkles size={14} />
            </span>

            AI Resume Analysis

            <span className="analysis-live-dot" />
          </div>

          <h1>
            Your resume,
            <span> analyzed.</span>
          </h1>

          <p>
            A practical breakdown of how your resume performs,
            where it is strong, and what will make it more
            competitive.
          </p>

          <div className="analysis-hero-stats">

            <div className="hero-stat">
              <span className="hero-stat-icon">
                <FileCheck2 size={16} />
              </span>

              <div>
                <strong>{totalSignals}</strong>
                <span>positive signals</span>
              </div>
            </div>

            <div className="hero-stat">
              <span className="hero-stat-icon warning">
                <Target size={16} />
              </span>

              <div>
                <strong>{totalGaps}</strong>
                <span>areas to review</span>
              </div>
            </div>

            <div className="hero-stat">
              <span className="hero-stat-icon purple">
                <Zap size={16} />
              </span>

              <div>
                <strong>{skills.length}</strong>
                <span>skills detected</span>
              </div>
            </div>

          </div>
        </div>

        <div className="analysis-hero-decoration">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-orbit orbit-three" />

          <div className="hero-decoration-core">
            <Sparkles size={25} />
          </div>
        </div>

      </div>


      {/* =====================================================
          SCORE + SUMMARY
      ===================================================== */}

      <div className="analysis-overview-grid">

        <section className="analysis-panel score-panel">

          <div className="analysis-panel-heading compact">

            <div className="analysis-panel-icon blue">
              <TrendingUp size={19} />
            </div>

            <div className="analysis-panel-heading-copy">

              <div className="analysis-title-line">
                <h2>ATS readiness</h2>

                <span
                  className={`score-status ${getScoreClass(score)}`}
                >
                  {getScoreLabel(score)}
                </span>
              </div>

              <p>
                How well your resume is structured for screening.
              </p>

            </div>

          </div>

          <div className="score-area">
            <ScoreCard score={score} />

            <div className="score-explanation">

              <div className="score-explanation-header">
                <span>Current score</span>
                <strong>{score}/100</strong>
              </div>

              <div className="score-progress">
                <div
                  className={`score-progress-fill ${getScoreClass(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>

              <p>
                {score >= 85
                  ? "Your resume is well positioned for ATS screening. Focus on tailoring it to each role."
                  : score >= 70
                  ? "Your resume has a solid foundation. A few targeted improvements can increase its screening performance."
                  : score >= 55
                  ? "Your resume has useful content, but several areas may reduce its performance in automated screening."
                  : "Your resume needs substantial improvement before it will perform consistently well in automated screening."}
              </p>

            </div>
          </div>

        </section>


        <section className="analysis-panel summary-panel">

          <div className="analysis-panel-heading compact">

            <div className="analysis-panel-icon purple">
              <Sparkles size={19} />
            </div>

            <div className="analysis-panel-heading-copy">
              <h2>Executive summary</h2>
              <p>
                AI-generated view of your current positioning.
              </p>
            </div>

          </div>

          <div className="summary-highlight">
            <span className="summary-highlight-icon">
              <Lightbulb size={17} />
            </span>

            <span>
              The most important thing to improve is
              <strong> clarity and relevance</strong> for your target role.
            </span>
          </div>

          <p className="analysis-summary-text">
            {analysis.summary ||
              "No summary was generated yet."}
          </p>

        </section>

      </div>


      {/* =====================================================
          STRENGTHS / WEAKNESSES
      ===================================================== */}

      <div className="analysis-grid-two">

        <Section
          title="Strengths"
          subtitle="Signals already working in your favor."
          icon={<CheckCircle2 size={20} />}
          className="success-panel"
          count={analysis.strengths.length}
          collapsible
        >
          <List
            items={analysis.strengths}
            empty="No strengths were recorded."
          />
        </Section>


        <Section
          title="Areas to improve"
          subtitle="The highest-value weaknesses identified by the analysis."
          icon={<XCircle size={20} />}
          className="warning-panel"
          count={analysis.weaknesses.length}
          collapsible
        >
          <List
            items={analysis.weaknesses}
            empty="No weaknesses were recorded."
            variant="warning"
          />
        </Section>

      </div>


      {/* =====================================================
          SKILLS
      ===================================================== */}

      <div className="analysis-grid-two">

        <Section
          title="Skills detected"
          subtitle="Technologies and capabilities explicitly found in the resume."
          icon={<Target size={20} />}
          className="skills-panel"
          count={skills.length}
          collapsible
        >
          {skills.length ? (

            <>
              <div className="skill-pills">

                {visibleSkills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="skill-pill"
                  >
                    {skill}
                  </span>
                ))}

              </div>

              {skills.length > 12 && (
                <button
                  type="button"
                  className="show-more-button"
                  onClick={() =>
                    setShowAllSkills((value) => !value)
                  }
                >
                  {showAllSkills
                    ? "Show fewer skills"
                    : `Show ${skills.length - 12} more skills`}

                  {showAllSkills ? (
                    <ArrowUp size={15} />
                  ) : (
                    <ArrowDown size={15} />
                  )}
                </button>
              )}
            </>

          ) : (
            <div className="analysis-empty-line">
              <CircleAlert size={16} />
              <span>No skills were recorded.</span>
            </div>
          )}
        </Section>


        <Section
          title="Missing / recommended skills"
          subtitle="Useful additions based on the current resume profile."
          icon={<Target size={20} />}
          className="missing-panel"
          count={analysis.missing_skills.length}
          collapsible
        >
          {analysis.missing_skills.length ? (

            <div className="skill-pills missing">

              {analysis.missing_skills.map(
                (skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="skill-pill"
                  >
                    <span className="missing-skill-dot" />
                    {skill}
                  </span>
                )
              )}

            </div>

          ) : (
            <div className="analysis-empty-line">
              <CheckCircle2 size={16} />
              <span>
                No major missing skills were recorded.
              </span>
            </div>
          )}
        </Section>

      </div>


      {/* =====================================================
          ROLES
      ===================================================== */}

      <Section
        title="Recommended roles"
        subtitle="Roles that align with the evidence in this resume."
        icon={<UserRound size={20} />}
        className="roles-panel"
        count={analysis.recommended_roles.length}
        collapsible
      >
        {analysis.recommended_roles.length ? (

          <div className="role-grid">

            {analysis.recommended_roles.map(
              (role, index) => (
                <div
                  className="role-card"
                  key={`${role}-${index}`}
                >

                  <span className="role-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="role-content">
                    <strong>{role}</strong>
                    <span>
                      Recommended based on your resume
                    </span>
                  </div>

                  <TrendingUp
                    size={17}
                    className="role-arrow"
                  />

                </div>
              )
            )}

          </div>

        ) : (
          <div className="analysis-empty-line">
            <CircleAlert size={16} />
            <span>
              No recommended roles were recorded.
            </span>
          </div>
        )}
      </Section>


      {/* =====================================================
          RECOMMENDATIONS
      ===================================================== */}

      <Section
        title="AI recommendations"
        subtitle="Specific changes that can improve the next version of your resume."
        icon={<Lightbulb size={20} />}
        className="recommendations-panel"
        count={analysis.suggestions.length}
        collapsible
      >
        <List
          items={analysis.suggestions}
          empty="No recommendations were recorded."
          variant="purple"
        />
      </Section>


      {/* =====================================================
          FINAL ACTION CARD
      ===================================================== */}

      <div className="analysis-next-step">

        <div className="next-step-icon">
          <Zap size={21} />
        </div>

        <div className="next-step-content">
          <span className="next-step-label">
            NEXT STEP
          </span>

          <h3>
            Turn the analysis into a stronger resume
          </h3>

          <p>
            Prioritize the weaknesses and missing skills
            above, then tailor your resume to the role you
            are applying for.
          </p>
        </div>

        <div className="next-step-score">
          <span>ATS</span>
          <strong>{score}</strong>
        </div>

      </div>

    </div>
  );
}

export default ResumeAnalysis;