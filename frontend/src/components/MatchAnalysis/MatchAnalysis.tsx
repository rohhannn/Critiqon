import "./MatchAnalysis.css";

interface Props {
  result: {
    match_score: number;
    matched_skills: string[];
    missing_skills: string[];
    experience_match: number;
    education_match: number;
    suggestions: string[];
    recommendation: string;
  };
}

function MatchAnalysis({ result }: Props) {
  return (
    <div className="match-card">
      <h2>🎯 Resume vs Job Match</h2>

      <div className="match-score">
        <div className="score-circle">
          {result.match_score}%
        </div>

        <h3>{result.recommendation}</h3>
      </div>

      <div className="match-grid">

        <div className="match-section">
          <h3>✅ Matched Skills</h3>

          <div className="chips">
            {result.matched_skills.map((skill, index) => (
              <span
                key={index}
                className="match-chip green-chip"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="match-section">
          <h3>❌ Missing Skills</h3>

          <div className="chips">
            {result.missing_skills.map((skill, index) => (
              <span
                key={index}
                className="match-chip red-chip"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

      </div>

      <div className="progress-section">

        <p>Experience Match</p>

        <progress
          max="100"
          value={result.experience_match}
        />

        <p>{result.experience_match}%</p>

        <p>Education Match</p>

        <progress
          max="100"
          value={result.education_match}
        />

        <p>{result.education_match}%</p>

      </div>

      <div className="match-section">
        <h3>💡 AI Suggestions</h3>

        <ul>
          {result.suggestions.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default MatchAnalysis;