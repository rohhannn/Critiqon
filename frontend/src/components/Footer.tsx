import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            Critiqon
          </Link>

          <p>
            AI-powered tools to help you prepare for
            your next career opportunity.
          </p>
        </div>

        <div className="footer-column">
          <h3>Product</h3>

          <Link to="/#features">
            Features
          </Link>

          <Link to="/pricing">
            Pricing
          </Link>

          <Link to="/#about">
            About
          </Link>
        </div>

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

        <div className="footer-column">
          <h3>Support</h3>

          <Link to="/contact">
            Contact Us
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Critiqon. All rights reserved.
        </span>
      </div>
    </footer>
  );
}

export default Footer;