import "./Contact.css";
import LegalPage from "../../components/LegalPage";

function Contact() {
  return (
    <LegalPage
      title="Contact Critiqon"
      lastUpdated="August 22, 2026"
    >
      <p>
        Need help with Critiqon, your account, subscription,
        payment, resume analysis, job matching, or interview
        preparation tools? Contact the Critiqon support team
        for assistance.
      </p>

      <h2>Critiqon Customer Support</h2>

      <p>
        For account, subscription, payment, or technical
        support, you can contact us directly using the
        options below. We can also help with questions
        about Critiqon's AI-powered career tools.
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
        To help us understand and resolve your request faster,
        include:
      </p>

      <ul>
        <li>
          the email address associated with your account;
        </li>

        <li>
          a clear description of the issue;
        </li>

        <li>
          relevant payment information if applicable;
        </li>

        <li>
          screenshots or error messages when useful.
        </li>
      </ul>

      <h2>Business, Partnership & General Enquiries</h2>

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