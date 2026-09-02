import "./DashboardStats.css";

import {
  BarChart3,
  Brain,
  FileText,
  MessageSquare,
  Sparkles,
  Trophy,
} from "lucide-react";

import DashboardCard from "../DashboardCard/DashboardCard";

interface DashboardStatsData {
  total_resumes: number;
  latest_ats_score: number;
  average_ats_score: number;
  skills_found: number;
  total_interviews: number;
  completed_interviews: number;
  total_questions_answered: number;
  average_interview_score: number;
  latest_interview_score: number;
}

interface Props {
  stats: DashboardStatsData;
}

function DashboardStats({ stats }: Props) {
  const latestATS = Math.max(
    0,
    Math.min(100, Number(stats.latest_ats_score) || 0)
  );

  const averageATS = Math.max(
    0,
    Math.min(100, Number(stats.average_ats_score) || 0)
  );

  const interviewScore = Math.max(
    0,
    Math.min(10, Number(stats.average_interview_score) || 0)
  );

  const interviewPercentage = Math.round(
    interviewScore * 10
  );

  return (
    <div className="stats-grid">

      <DashboardCard
        title="Latest ATS"
        value={`${latestATS}%`}
        subtitle="Latest resume score"
        icon={<Sparkles size={21} strokeWidth={2.2} />}
        accent="blue"
        progress={latestATS}
      />

      <DashboardCard
        title="Average ATS"
        value={`${averageATS}%`}
        subtitle="Across your resumes"
        icon={<BarChart3 size={21} strokeWidth={2.2} />}
        accent="purple"
        progress={averageATS}
      />

      <DashboardCard
        title="Interviews"
        value={stats.total_interviews}
        subtitle={`${stats.completed_interviews} completed`}
        icon={<Brain size={21} strokeWidth={2.2} />}
        accent="green"
        progress={
          stats.total_interviews > 0
            ? Math.min(
                100,
                (stats.completed_interviews /
                  stats.total_interviews) *
                  100
              )
            : 0
        }
      />

      <DashboardCard
        title="Questions Answered"
        value={stats.total_questions_answered}
        subtitle="Interview practice"
        icon={<MessageSquare size={21} strokeWidth={2.2} />}
        accent="cyan"
        progress={
          stats.total_questions_answered > 0
            ? Math.min(
                100,
                stats.total_questions_answered
              )
            : 0
        }
      />

      <DashboardCard
        title="Interview Score"
        value={`${interviewScore.toFixed(1)}/10`}
        subtitle="Average performance"
        icon={<Trophy size={21} strokeWidth={2.2} />}
        accent="amber"
        progress={interviewPercentage}
      />

      <DashboardCard
        title="Skills Found"
        value={stats.skills_found}
        subtitle="Detected in latest resume"
        icon={<FileText size={21} strokeWidth={2.2} />}
        accent="indigo"
        progress={
          stats.skills_found > 0
            ? Math.min(
                100,
                stats.skills_found * 5
              )
            : 0
        }
      />

    </div>
  );
}

export default DashboardStats;