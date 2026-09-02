import { useEffect, useRef, useState } from "react";
import "./HowItWorks.css";

interface Step {
  number: string;
  label: string;
  title: string;
  description: string;
  icon: string;
}

const steps: Step[] = [
  {
    number: "01",
    label: "START HERE",
    title: "Upload Your Resume",
    description:
      "Upload your resume securely and let Critiqon build a clear picture of your experience, skills and career profile.",
    icon: "↑",
  },
  {
    number: "02",
    label: "AI POWERED",
    title: "Get AI Analysis",
    description:
      "Our AI analyzes your resume for clarity, impact, ATS compatibility, missing keywords and areas that need improvement.",
    icon: "✦",
  },
  {
    number: "03",
    label: "PRACTICE",
    title: "Practice Interviews",
    description:
      "Take realistic HR and technical mock interviews and receive personalized feedback to improve your confidence.",
    icon: "◎",
  },
  {
    number: "04",
    label: "TAKE ACTION",
    title: "Apply With Confidence",
    description:
      "Track your applications, monitor your progress and use your improved resume and interview skills to apply smarter.",
    icon: "↗",
  },
];

function HowItWorks() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`how-it-works ${visible ? "is-visible" : ""}`}
      id="how-it-works"
    >
      <div className="how-background-glow how-glow-one" />
      <div className="how-background-glow how-glow-two" />

      <div className="how-container">

        {/* HEADER */}

        <div className="how-header">
          <div className="how-eyebrow">
            <span className="how-eyebrow-dot" />
            YOUR CAREER JOURNEY
          </div>

          <h2>
            From resume to{" "}
            <span>job-ready.</span>
          </h2>

          <p>
            Everything you need to prepare smarter, improve faster
            and approach your next opportunity with confidence.
          </p>
        </div>

        {/* STEPS */}

        <div className="steps-wrapper">

          <div className="steps-connector" />

          <div className="steps-grid">
            {steps.map((step, index) => (
              <article
                className="journey-card"
                key={step.number}
                style={
                  {
                    "--step-delay": `${index * 120}ms`,
                  } as React.CSSProperties
                }
              >
                <div className="journey-card-top">

                  <div className="step-number">
                    {step.number}
                  </div>

                  <div className="step-icon">
                    {step.icon}
                  </div>

                </div>

                <div className="step-content">

                  <div className="step-label">
                    {step.label}
                  </div>

                  <h3>
                    {step.title}
                  </h3>

                  <p>
                    {step.description}
                  </p>

                </div>

                <div className="step-progress">
                  <span />
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* BOTTOM MESSAGE */}

        <div className="journey-footer">
          <span className="footer-check">✓</span>

          <strong>
            One platform. One career journey.
          </strong>

          <span>
            Resume analysis, interview preparation and job tracking —
            all connected.
          </span>
        </div>

      </div>
    </section>
  );
}

export default HowItWorks;