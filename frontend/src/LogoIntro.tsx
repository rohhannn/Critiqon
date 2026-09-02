import { useEffect, useState } from "react";
import "./styles/LogoIntro.css";

interface LogoIntroProps {
  onComplete?: () => void;
}

function LogoIntro({ onComplete }: LogoIntroProps) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const closeTimer = setTimeout(() => {
      setClosing(true);
    }, 1250);

    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 1550);

    return () => {
      clearTimeout(closeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`logo-intro ${
        closing ? "logo-intro--closing" : ""
      }`}
    >
      {/* Subtle background texture */}
      <div className="logo-intro__noise" />

      {/* Ambient light */}
      <div className="logo-intro__orb logo-intro__orb--one" />
      <div className="logo-intro__orb logo-intro__orb--two" />

      {/* Center light sweep */}
      <div className="logo-intro__line" />

      {/* Brand */}
      <div className="logo-intro__brand">
        <span>C</span>
        <span>R</span>
        <span>I</span>
        <span>T</span>
        <span>I</span>
        <span>Q</span>
        <span>O</span>
        <span>N</span>
      </div>

      {/* Small brand descriptor */}
      <div className="logo-intro__caption">
        AI CAREER INTELLIGENCE
      </div>
    </div>
  );
}

export default LogoIntro;