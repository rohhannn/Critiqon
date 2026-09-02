import "./ATSTrendChart.css";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ATSHistoryItem {
  label: string;
  score: number;
}

interface Props {
  data: ATSHistoryItem[];
}

function ATSTrendChart({ data }: Props) {
  const validData = data
    .filter(
      (item) =>
        item &&
        typeof item.score === "number" &&
        Number.isFinite(item.score)
    )
    .map((item) => ({
      ...item,
      score: Math.max(
        0,
        Math.min(100, item.score)
      ),
    }));

  const latestScore =
    validData.length > 0
      ? validData[validData.length - 1].score
      : null;

  const previousScore =
    validData.length > 1
      ? validData[validData.length - 2].score
      : null;

  const scoreChange =
    latestScore !== null &&
    previousScore !== null
      ? latestScore - previousScore
      : null;

  const average =
    validData.length > 0
      ? Math.round(
          validData.reduce(
            (sum, item) =>
              sum + item.score,
            0
          ) / validData.length
        )
      : null;

  return (
    <div className="chart-card">

      <div className="chart-header">

        <div className="chart-title-area">

          <div className="chart-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 3v18h18" />
              <path d="m7 15 4-5 3 3 5-7" />
            </svg>
          </div>

          <div>
            <span className="chart-eyebrow">
              PERFORMANCE
            </span>

            <h2>
              ATS score trend
            </h2>
          </div>

        </div>


        <div className="chart-summary">

          {latestScore !== null && (
            <div className="chart-current-score">

              <strong>
                {latestScore}%
              </strong>

              <span>
                Latest
              </span>

            </div>
          )}

          {scoreChange !== null && (
            <div
              className={`chart-change ${
                scoreChange > 0
                  ? "chart-change--positive"
                  : scoreChange < 0
                  ? "chart-change--negative"
                  : "chart-change--neutral"
              }`}
            >
              <span>
                {scoreChange > 0
                  ? "↑"
                  : scoreChange < 0
                  ? "↓"
                  : "→"}
              </span>

              {Math.abs(scoreChange)} pts
            </div>
          )}

        </div>

      </div>


      {validData.length === 0 ? (
        <div className="chart-empty-state">

          <div className="chart-empty-icon">
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19V5" />
              <path d="M4 19h16" />
              <path d="m8 15 3-4 3 2 4-5" />
            </svg>
          </div>

          <strong>
            No ATS history yet
          </strong>

          <p>
            Analyze a resume to start
            tracking your improvement.
          </p>

        </div>
      ) : (
        <>

          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={validData}
                margin={{
                  top: 12,
                  right: 6,
                  left: -20,
                  bottom: 0,
                }}
              >

                <defs>

                  <linearGradient
                    id="atsAreaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#16735a"
                      stopOpacity={0.24}
                    />

                    <stop
                      offset="100%"
                      stopColor="#16735a"
                      stopOpacity={0.015}
                    />
                  </linearGradient>

                </defs>


                <CartesianGrid
                  vertical={false}
                  stroke="#e9efec"
                  strokeDasharray="3 5"
                />


                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#89968f",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                  dy={8}
                />


                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#89968f",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                  ticks={[0, 25, 50, 75, 100]}
                  width={42}
                />


                <Tooltip
                  cursor={{
                    stroke: "#b8d5c8",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  contentStyle={{
                    border:
                      "1px solid #dfe9e4",
                    borderRadius: "12px",
                    background:
                      "rgba(255,255,255,.97)",
                    boxShadow:
                      "0 12px 30px rgba(16,39,30,.12)",
                    padding:
                      "9px 12px",
                  }}
                  labelStyle={{
                    color: "#6e7d75",
                    fontSize: 10,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                  itemStyle={{
                    color: "#16735a",
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                  formatter={(value) => [
                    `${value}%`,
                    "ATS Score",
                  ]}
                />


                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#16735a"
                  strokeWidth={3}
                  fill="url(#atsAreaGradient)"
                  activeDot={{
                    r: 6,
                    fill: "#ffffff",
                    stroke: "#16735a",
                    strokeWidth: 3,
                  }}
                  dot={{
                    r: 3,
                    fill: "#ffffff",
                    stroke: "#16735a",
                    strokeWidth: 2,
                  }}
                  animationDuration={1100}
                  animationEasing="ease-out"
                />

              </AreaChart>
            </ResponsiveContainer>

          </div>


          <div className="chart-footer">

            <div className="chart-footer-stat">
              <span>
                Average
              </span>

              <strong>
                {average}%
              </strong>
            </div>

            <div className="chart-footer-divider" />

            <div className="chart-footer-stat">
              <span>
                Analyses
              </span>

              <strong>
                {validData.length}
              </strong>
            </div>

            <div className="chart-footer-divider" />

            <div className="chart-footer-stat">
              <span>
                Best score
              </span>

              <strong>
                {Math.max(
                  ...validData.map(
                    (item) =>
                      item.score
                  )
                )}%
              </strong>
            </div>

          </div>

        </>
      )}

    </div>
  );
}

export default ATSTrendChart;