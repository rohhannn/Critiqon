import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">

      <div className="footer-inner">

        {/* BRAND */}

        <div className="footer-brand">

          <Link
            to="/"
            className="footer-logo"
          >
            Critiqon
          </Link>

          <p>
            AI-powered tools to help you
            prepare, apply, and get hired.
          </p>

        </div>


        {/* LEGAL */}

        <div className="footer-column">

          <h3>Legal</h3>

          <Link to="/privacy-policy">
            Privacy Policy
          </Link>

          <Link to="/terms">
            Terms & Conditions
          </Link>

          <Link to="/refund-policy">
            Refund & Cancellation
          </Link>

        </div>


        {/* SUPPORT */}

        <div className="footer-column">

          <h3>Support</h3>

          <Link to="/contact">
            Contact Us
          </Link>

        </div>

      </div>


      {/* BOTTOM */}

      <div className="footer-bottom">

        <span>
          © {new Date().getFullYear()} Critiqon. All rights reserved.
        </span>

      </div>

    </footer>
  );
}

export default Footer;