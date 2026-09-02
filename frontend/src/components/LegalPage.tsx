import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";

import "./LegalPage.css";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

function LegalPage({
  title,
  lastUpdated,
  children,
}: LegalPageProps) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="legal-logo">
          Critiqon
        </Link>

        <Link to="/" className="legal-back">
          Back to Critiqon
        </Link>
      </header>

      <main className="legal-container">
        <article className="legal-card">
          <h1>{title}</h1>

          <p className="legal-updated">
            Last updated: {lastUpdated}
          </p>

          <div className="legal-content">
            {children}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}

export default LegalPage;