import "./JobDescription.css";

interface Props {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}

function JobDescription({
  jobDescription,
  setJobDescription,
  onAnalyze,
  loading,
}: Props) {
  return (
    <div className="job-description-card">

      <h2>🎯 Job Description Match</h2>

      <p>
        Paste the job description below to see how well
        your selected resume matches the job.
      </p>

      <textarea
        value={jobDescription}
        onChange={(e) =>
          setJobDescription(e.target.value)
        }
        placeholder="Paste the job description here..."
        rows={10}
        disabled={loading}
      />

      <button
        type="button"
        onClick={onAnalyze}
        disabled={
          loading ||
          !jobDescription.trim()
        }
      >
        {loading
          ? "Analyzing..."
          : "🎯 Analyze Job Match"}
      </button>

    </div>
  );
}

export default JobDescription;