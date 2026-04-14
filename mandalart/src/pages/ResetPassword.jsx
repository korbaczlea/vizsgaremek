import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  const tokenFromUrl = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (!tokenFromUrl) {
      setErr("This reset link is missing a token. Request a new link from the sign-in screen.");
      return;
    }
    if (!isStrongPassword(password)) {
      setErr(
        "Password must be at least 8 characters and include lowercase, uppercase, and a special character."
      );
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/chpass_promise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenFromUrl,
          new_password: utf8ToBase64(password),
        }),
      });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setErr("Invalid response from server.");
        return;
      }
      if (data.status === "weak_password") {
        setErr(
          "Password must be at least 8 characters and include lowercase, uppercase, and a special character."
        );
        return;
      }
      if (data.status === "invalid_credentials") {
        setErr("This reset link is invalid or has expired. Request a new one.");
        return;
      }
      if (!res.ok || data.status !== "success") {
        setErr("Could not reset password. Please try again.");
        return;
      }
      setMsg("Your password has been updated. You can sign in with the new password.");
      setPassword("");
      setConfirm("");
    } catch {
      setErr("Cannot connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px" }}>
      <section
        style={{
          background: "white",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
      <h2 style={{ marginTop: 0 }}>Reset password</h2>
      {!tokenFromUrl ? (
        <p style={{ color: "#555", lineHeight: 1.7 }}>
          Open the link from your email, or go back to{" "}
          <Link to="/">Home</Link> and use &quot;Forgot password?&quot; from the sign-in dialog.
        </p>
      ) : (
        <form className="profile-form" onSubmit={onSubmit} style={{ maxWidth: 420 }}>
          <p style={{ color: "#555", lineHeight: 1.7 }}>Choose a new password for your account.</p>
          {err ? <p className="app-alert app-alert--error">{err}</p> : null}
          {msg ? <p className="app-alert app-alert--success">{msg}</p> : null}
          <div className="form-group">
            <label>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" className="profile-btn" disabled={loading}>
            {loading ? "Saving…" : "Save new password"}
          </button>
          <p style={{ marginTop: "1rem" }}>
            <Link to="/">Back to Home</Link>
          </p>
        </form>
      )}
      </section>
    </main>
  );
}
