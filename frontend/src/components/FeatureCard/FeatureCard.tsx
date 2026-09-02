import "./FeatureCard.css";

type FeatureCardProps = {
  title: string;
  description: string;
  metric?: string;
  metricLabel?: string;
  onClick?: () => void;
};

function FeatureCard({
  title,
  description,
  metric,
  metricLabel,
  onClick,
}: FeatureCardProps) {
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (!onClick) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="feature-card"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* DECORATIVE BACKGROUND */}
      <div className="feature-card-glow" />
      <div className="feature-card-number" aria-hidden="true">
        {title === "Resume Analyzer" && "01"}
        {title === "ATS Optimization" && "02"}
        {title === "AI Mock Interviews" && "03"}
        {title === "Job Tracker" && "04"}
      </div>

      {/* TOP ROW */}
      <div className="feature-card-top">
        <div className="feature-icon" aria-hidden="true">
          ✦
        </div>

        {metric && (
          <div className="feature-metric">
            <strong>{metric}</strong>

            {metricLabel && (
              <span>{metricLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="feature-card-content">
        <h3>{title}</h3>

        <p>{description}</p>
      </div>

      {/* ACTION */}
      <div className="feature-action">
        <span>Explore feature</span>

        <span
          className="feature-action-arrow"
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </div>
  );
}

export default FeatureCard;