import "./BrandLogo.css";

interface BrandLogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

function BrandLogo({
  className = "",
  size = "medium",
}: BrandLogoProps) {
  return (
    <div
      className={`brand-logo brand-logo--${size} ${className}`}
      aria-label="Critiqon"
    >
      CRITIQON
    </div>
  );
}

export default BrandLogo;