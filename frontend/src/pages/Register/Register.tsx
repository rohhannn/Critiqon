import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";

import "./Register.css";
import { notify } from "../../services/notifications";

function Register() {
  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const navigate =
    useNavigate();

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (password !== confirmPassword) {
      notify({ type: "error", title: "Check your password", message: "Passwords do not match." });
      return;
    }

    if (password.length < 8) {
      notify({ type: "error", title: "Password too short", message: "Password must be at least 8 characters." });
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/register",
        {
          full_name:
            fullName.trim(),
          email:
            email.trim().toLowerCase(),
          password,
        }
      );

      notify({ type: "success", title: "Account created", message: "Check your email for the welcome message." });

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      navigate("/login");

    } catch (error: any) {
      console.error(
        "Registration error:",
        error
      );

      notify({ type: "error", title: "Registration failed", message: error?.response?.data?.detail || "Registration failed." });

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <form
        className="register-card"
        onSubmit={handleSubmit}
      >
        <h1>
          Create Account
        </h1>

        <p>
          Join Critiqon and start preparing today.
        </p>

        <label>
          Full Name
        </label>

        <input
          type="text"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(event) =>
            setFullName(
              event.target.value
            )
          }
          required
          autoComplete="name"
        />

        <label>
          Email Address
        </label>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value
            )
          }
          required
          autoComplete="email"
        />

        <label>
          Password
        </label>

        <input
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value
            )
          }
          required
          minLength={8}
          autoComplete="new-password"
        />

        <label>
          Confirm Password
        </label>

        <input
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(
              event.target.value
            )
          }
          required
          minLength={8}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>

        <div className="login-link">
          Already have an account?

          <Link to="/login">
            {" "}Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Register;
