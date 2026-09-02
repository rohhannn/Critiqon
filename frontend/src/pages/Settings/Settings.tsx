import "./Settings.css";

import {
  Settings as SettingsIcon,
  User,
  Mail,
  Shield,
  LogOut,
  Save,
  Lock,
  Loader2,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";


interface UserData {
  id: number;
  full_name: string;
  email: string;
}


function Settings() {
  const navigate = useNavigate();

  const { logout } = useAuth();


  const [user, setUser] =
    useState<UserData | null>(null);

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");


  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");


  const [loading, setLoading] =
    useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);


  const [profileMessage, setProfileMessage] =
    useState("");

  const [profileError, setProfileError] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");


  // =========================================================
  // LOAD USER
  // =========================================================

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);

        const response =
          await api.get<UserData>(
            "/me"
          );

        setUser(response.data);

        setFullName(
          response.data.full_name
        );

        setEmail(
          response.data.email
        );

      } catch (error: any) {
        console.error(
          "Unable to load user:",
          error
        );

        if (
          error?.response?.status === 401
        ) {
          logout();
          navigate("/login");
        }

      } finally {
        setLoading(false);
      }
    }

    loadUser();

  }, [logout, navigate]);


  // =========================================================
  // UPDATE PROFILE
  // =========================================================

  async function handleProfileSave() {
    setProfileMessage("");
    setProfileError("");

    if (!fullName.trim()) {
      setProfileError(
        "Full name cannot be empty."
      );
      return;
    }

    if (!email.trim()) {
      setProfileError(
        "Email cannot be empty."
      );
      return;
    }

    try {
      setSavingProfile(true);

      const response =
        await api.put<UserData>(
          "/profile",
          {
            full_name:
              fullName.trim(),

            email:
              email.trim(),
          }
        );

      setUser(response.data);

      setFullName(
        response.data.full_name
      );

      setEmail(
        response.data.email
      );

      setProfileMessage(
        "Profile updated successfully."
      );

    } catch (error: any) {
      console.error(error);

      setProfileError(
        error?.response?.data?.detail ||
        "Unable to update profile."
      );

    } finally {
      setSavingProfile(false);
    }
  }


  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  async function handlePasswordChange() {
    setPasswordMessage("");
    setPasswordError("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill in all password fields."
      );
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    try {
      setChangingPassword(true);

      await api.put(
        "/password",
        {
          current_password:
            currentPassword,

          new_password:
            newPassword,
        }
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Password changed successfully."
      );

    } catch (error: any) {
      console.error(error);

      setPasswordError(
        error?.response?.data?.detail ||
        "Unable to change password."
      );

    } finally {
      setChangingPassword(false);
    }
  }


  // =========================================================
  // LOGOUT
  // =========================================================

  function handleLogout() {
    logout();
    navigate("/login");
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="settings-page">

        <main className="settings-main">

          <div className="settings-loading">

            <Loader2
              size={30}
              className="settings-spin"
            />

            <p>
              Loading settings...
            </p>

          </div>

        </main>

      </div>
    );
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="settings-page">

      <main className="settings-main">


        {/* ================= HEADER ================= */}

        <section className="settings-header">

          <div className="settings-title-icon">
            <SettingsIcon size={26} />
          </div>

          <div>

            <h1>
              Settings
            </h1>

            <p>
              Manage your account and
              security preferences.
            </p>

          </div>

        </section>


        {/* ================= PROFILE ================= */}

        <section className="settings-card">

          <div className="settings-section-header">

            <User size={20} />

            <div>

              <h2>
                Profile
              </h2>

              <p>
                Update your personal
                account information.
              </p>

            </div>

          </div>


          <div className="settings-form">


            <div className="settings-form-group">

              <label>
                Full Name
              </label>

              <div className="settings-input-wrapper">

                <User size={18} />

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(
                      e.target.value
                    )
                  }
                  placeholder="Your full name"
                />

              </div>

            </div>


            <div className="settings-form-group">

              <label>
                Email
              </label>

              <div className="settings-input-wrapper">

                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="your@email.com"
                />

              </div>

            </div>


            {profileError && (
              <div className="settings-error">
                {profileError}
              </div>
            )}


            {profileMessage && (
              <div className="settings-success">
                {profileMessage}
              </div>
            )}


            <button
              className="settings-primary-button"
              onClick={
                handleProfileSave
              }
              disabled={
                savingProfile
              }
            >

              {savingProfile ? (
                <>
                  <Loader2
                    size={17}
                    className="settings-spin"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />

                  Save Profile
                </>
              )}

            </button>

          </div>

        </section>


        {/* ================= SECURITY ================= */}

        <section className="settings-card">

          <div className="settings-section-header">

            <Shield size={20} />

            <div>

              <h2>
                Security
              </h2>

              <p>
                Change your account password.
              </p>

            </div>

          </div>


          <div className="settings-form">


            <div className="settings-form-group">

              <label>
                Current Password
              </label>

              <div className="settings-input-wrapper">

                <Lock size={18} />

                <input
                  type="password"
                  value={
                    currentPassword
                  }
                  onChange={(e) =>
                    setCurrentPassword(
                      e.target.value
                    )
                  }
                  placeholder="Current password"
                />

              </div>

            </div>


            <div className="settings-form-group">

              <label>
                New Password
              </label>

              <div className="settings-input-wrapper">

                <Lock size={18} />

                <input
                  type="password"
                  value={
                    newPassword
                  }
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="At least 8 characters"
                />

              </div>

            </div>


            <div className="settings-form-group">

              <label>
                Confirm New Password
              </label>

              <div className="settings-input-wrapper">

                <Lock size={18} />

                <input
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Repeat new password"
                />

              </div>

            </div>


            {passwordError && (
              <div className="settings-error">
                {passwordError}
              </div>
            )}


            {passwordMessage && (
              <div className="settings-success">
                {passwordMessage}
              </div>
            )}


            <button
              className="settings-primary-button"
              onClick={
                handlePasswordChange
              }
              disabled={
                changingPassword
              }
            >

              {changingPassword ? (
                <>
                  <Loader2
                    size={17}
                    className="settings-spin"
                  />

                  Changing Password...
                </>
              ) : (
                <>
                  <Shield size={17} />

                  Change Password
                </>
              )}

            </button>

          </div>

        </section>


        {/* ================= ACCOUNT INFO ================= */}

        {user && (
          <section className="settings-card">

            <div className="settings-section-header">

              <User size={20} />

              <div>

                <h2>
                  Account Information
                </h2>

                <p>
                  Basic information associated
                  with your account.
                </p>

              </div>

            </div>


            <div className="account-info-grid">

              <div>
                <span>
                  Account ID
                </span>

                <strong>
                  #{user.id}
                </strong>
              </div>


              <div>
                <span>
                  Account Email
                </span>

                <strong>
                  {user.email}
                </strong>
              </div>

            </div>

          </section>
        )}


        {/* ================= LOGOUT ================= */}

        <section className="settings-card danger-card">

          <div className="settings-section-header danger">

            <LogOut size={20} />

            <div>

              <h2>
                Sign Out
              </h2>

              <p>
                Sign out of your Critiqon account.
              </p>

            </div>

          </div>


          <button
            className="logout-settings-button"
            onClick={handleLogout}
          >

            <LogOut size={18} />

            Logout

          </button>

        </section>


      </main>

    </div>
  );
}


export default Settings;