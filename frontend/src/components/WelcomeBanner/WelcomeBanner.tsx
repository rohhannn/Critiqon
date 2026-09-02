import "./WelcomeBanner.css";

interface Props {
  user: string;
}

function WelcomeBanner({ user }: Props) {
  return (
    <div className="welcome-banner">
      <div>
        <h1>
          Welcome back, {user} 👋
        </h1>

        <p>
          Analyze resumes, improve ATS scores,
          match jobs with AI, and prepare for
          interviews—all from one dashboard.
        </p>
      </div>
    </div>
  );
}

export default WelcomeBanner;