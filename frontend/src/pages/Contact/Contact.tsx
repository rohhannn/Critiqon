import "./Contact.css";
import LegalPage from "../../components/LegalPage";

function Contact() {
  return (
    <LegalPage
      title="Contact Us"
      lastUpdated="August 22, 2026"
    >
      <p>
        Need help with Critiqon, your account,
        subscription, payment, or another issue?
        Contact our support team.
      </p>

      <h2>Customer Support</h2>

      <p>
        For account, subscription, payment, or technical
        support, you can contact us directly using the
        options below.
      </p>

      <div className="contact-details">

        <a
          href="mailto:rohanranga09@gmail.com"
          className="contact-link"
        >
          ✉&nbsp; rohanranga09@gmail.com
        </a>

        <a
          href="tel:+918850032829"
          className="contact-link"
        >
          ☎&nbsp; +91 88500 32829
        </a>

      </div>

      <h2>What to Include</h2>

      <p>
        To help us resolve your request faster, include:
      </p>

      <ul>
        <li>
          the email address associated with your account;
        </li>

        <li>
          a description of the issue;
        </li>

        <li>
          relevant payment information if applicable;
        </li>

        <li>
          screenshots or error messages when useful.
        </li>
      </ul>

      <h2>Business & General Enquiries</h2>

      <p>
        For general enquiries, partnerships, or other
        business-related questions, please contact the
        Critiqon team using the email address or phone
        number above.
      </p>
    </LegalPage>
  );
}

export default Contact;