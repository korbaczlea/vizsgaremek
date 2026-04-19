import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PageHelmet from "../components/PageHelmet";
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
        "Use at least 8 characters with upper and lower case letters, a number, and a symbol."
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
          "Use at least 8 characters with upper and lower case letters, a number, and a symbol."
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
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "30px 20px" }}>
      <PageHelmet
        title="Reset password"
        description="Set a new Mandalart account password."
        path="/reset-password"
      />
      <section
        style={{
          background: "white",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: "1.5rem" }}>Reset password</h1>

      {done ? (
        <p className="info-message">
          Your password was updated. Redirecting to the home page…
        </p>
      ) : (
        <form onSubmit={onSubmit}>
          {!token ? (
            <p className="error-message">
              Missing reset token. Open the link from your email, or{" "}
              <Link to="/">go home</Link> and use &quot;Forgot password&quot; from sign in.
            </p>
          ) : null}

          <div className="form-group">
            <label htmlFor="reset-new-password">New password</label>
            <input
              id="reset-new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              disabled={!token}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reset-confirm-password">Confirm password</label>
            <input
              id="reset-confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              disabled={!token}
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading || !token}>
            {loading ? "Saving…" : "Save new password"}
          </button>
          {error ? <p className="error-message">{error}</p> : null}
          <p>
            <Link to="/">Back to home</Link>
          </p>
        </form>
      )}
      </section>
    </main>
  );
}
