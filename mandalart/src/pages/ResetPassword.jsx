import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PageHelmet from "../components/PageHelmet";
import { EyeIcon, EyeOffIcon } from "../components/AuthPasswordIcons";
import API_BASE_URL from "../config/api";

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function isStrongPassword(password) {
  if (typeof password !== "string") return false;
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is invalid or expired. Request a new one from the sign-in page.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError(
        "Password must be at least 8 characters and include lowercase, uppercase, and a special character."
      );
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/chpass_promise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password: utf8ToBase64(password),
        }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError("Unexpected server response. Please try again.");
        return;
      }

      if (data.status === "weak_password") {
        setError(
          "Password must be at least 8 characters and include lowercase, uppercase, and a special character."
        );
        return;
      }
      if (data.status === "invalid_credentials") {
        setError("This reset link is invalid or has expired. Request a new one.");
        return;
      }
      if (!res.ok || data.status !== "success") {
        setError("Could not update your password. Please try again.");
        return;
      }

      setDone(true);
      window.setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      console.error(err);
      setError("Cannot connect to backend. Please check that XAMPP Apache and MySQL are running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHelmet
        title="Reset password"
        description="Set a new Mandalart account password."
        path="/reset-password"
      />
      <div className="modal reset-password-layer" style={{ display: "block" }} role="presentation">
        <div
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-heading"
        >
          <Link to="/" className="close" aria-label="Close and return home">
            &times;
          </Link>
          <h2 id="reset-password-heading">Reset password</h2>

          {done ? (
            <p className="info-message">Your password was updated. Redirecting to the home page…</p>
          ) : (
            <form onSubmit={onSubmit}>
              {!token ? (
                <p className="error-message">
                  Missing reset token. Open the link from your email, or go home and use &quot;Forgot
                  password&quot; from sign in.
                </p>
              ) : null}

              <div className="form-group">
                <label>New password:</label>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    data-initial-focus="true"
                    required
                    disabled={!token}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={!token}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm password:</label>
                <div className="password-field">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={!token}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    disabled={!token}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <button type="submit" className="login-btn" disabled={loading || !token}>
                {loading ? "Saving..." : "Save new password"}
              </button>
              <Link to="/" className="text-link">
                Back to home
              </Link>
              {error ? <p className="error-message">{error}</p> : null}
            </form>
          )}
        </div>
      </div>
    </>
  );
}
