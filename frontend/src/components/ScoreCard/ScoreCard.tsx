import "./ScoreCard.css";

interface Props { score: number; }

function ScoreCard({ score }: Props) {
  const safeScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const meta = safeScore >= 90
    ? { status: "Outstanding", color: "#10b981" }
    : safeScore >= 75
      ? { status: "Strong", color: "#4f46e5" }
      : safeScore >= 60
        ? { status: "Developing", color: "#f59e0b" }
        : { status: "Needs work", color: "#ef4444" };

  return (
    <div className="score-card-container">
      <div className="score-title">ATS SCORE</div>
      <div className="score-number" style={{ color: meta.color }}>{safeScore}</div>
      <div className="score-status" style={{ color: meta.color }}>{meta.status}</div>
      <div className="progress-bar" aria-label={`ATS score ${safeScore} out of 100`}>
        <div className="progress-fill" style={{ width: `${safeScore}%`, background: meta.color }} />
      </div>
      <div className="progress-text">{safeScore}/100 readiness score</div>
    </div>
  );
}

export default ScoreCard;
