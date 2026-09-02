import "./DashboardCard.css";

import type { ReactNode } from "react";

interface Props {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  accent:
    | "blue"
    | "purple"
    | "green"
    | "cyan"
    | "amber"
    | "indigo";
  progress?: number;
}

function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  progress,
}: Props) {
  const safeProgress =
    typeof progress === "number"
      ? Math.max(0, Math.min(100, progress))
      : undefined;

  return (
    <article
      className={`dashboard-stat-card dashboard-stat-card--${accent}`}
    >

      <div className="stat-card-top">

        <div
          className="stat-icon"
          aria-hidden="true"
        >
          {icon}
        </div>

        <span className="stat-card-label">
          {title}
        </span>

      </div>


      <div className="stat-content">

        <div className="stat-value-row">

          <h3 className="stat-value">
            {value}
          </h3>

          <span
            className="stat-status-dot"
            aria-hidden="true"
          />

        </div>

        <p className="stat-subtitle">
          {subtitle}
        </p>

      </div>


      {safeProgress !== undefined && (
        <div className="stat-progress">

          <div
            className="stat-progress-track"
            aria-hidden="true"
          >
            <span
              style={{
                width: `${safeProgress}%`,
              }}
            />
          </div>

        </div>
      )}

    </article>
  );
}

export default DashboardCard;