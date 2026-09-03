import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";

import "./Register.css";

import {
  notify,
} from "../../services/notifications";


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
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const cleanName =
      fullName.trim();

    const cleanEmail =
      email.trim().toLowerCase();


    if (!cleanName) {
      notify({
        type: "error",
        title: "Name required",
        message:
          "Please enter your full name.",
      });

      return;
    }


    if (
      password !==
      confirmPassword
    ) {
      notify({
        type: "error",
        title:
          "Check your password",
        message:
          "Passwords do not match.",
      });

      return;
    }


    if (password.length < 8) {
      notify({
        type: "error",
        title:
          "Password too short",
        message:
          "Password must be at least 8 characters.",
      });

      return;
    }


    try {
      setLoading(true);


      await api.post(
        "/register",
        {
          full_name: cleanName,
          email: cleanEmail,
          password,
        },
      );


      notify({
        type: "success",
        title:
          "Account created",
        message:
          "Your account has been created. You can now sign in.",
      });


      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");


      navigate("/login");


    } catch (error: any) {
      console.error(
        "Registration error:",
        error,
      );


      notify({
        type: "error",
        title:
          "Registration failed",
        message:
          error?.response?.data?.detail ||
          "Registration failed.",
      });


    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="register-page">
      <form
        className="register-card"
        onSubmit={
          handleSubmit
        }
      >

        <h1>
          Create Account
        </h1>


        <p>
          Join Critiqon and start
          preparing today.
        </p>


        <label htmlFor="register-name">
          Full Name
        </label>

        <input
          id="register-name"
          type="text"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(event) =>
            setFullName(
              event.target.value,
            )
          }
          required
          autoComplete="name"
          autoFocus
        />


        <label htmlFor="register-email">
          Email Address
        </label>

        <input
          id="register-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value,
            )
          }
          required
          autoComplete="email"
        />


        <label htmlFor="register-password">
          Password
        </label>

        <input
          id="register-password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(event) =>
            setPassword(
              event.target.value,
            )
          }
          required
          minLength={8}
          autoComplete="new-password"
        />


        <label htmlFor="register-confirm-password">
          Confirm Password
        </label>

        <input
          id="register-confirm-password"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(
              event.target.value,
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
          <span>
            Already have an account?
          </span>

          <Link to="/login">
            {" "}
            Sign In
          </Link>
        </div>

      </form>
    </div>
  );
}


export default Register;