import React, { useState } from "react";
import API_BASE_URL from "../config/api";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const maxChars = 300;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", text: "" });

    try {
      const token = localStorage.getItem("mandalart_token");
      if (!token) {
        setFeedback({ type: "error", text: "Please sign in to contact Support." });
        return;
      }

      setLoading(true);
      const payload = {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      };

      const res = await fetch(`${API_BASE_URL}/api/contact_request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setFeedback({
          type: "error",
          text: "Backend response is not valid JSON. Please check that XAMPP Apache is running.",
        });
        return;
      }

      if (!res.ok || data.status !== "success") {
        setFeedback({ type: "error", text: "Could not send your message. Please try again." });
        return;
      }

      setForm({ name: "", email: "", subject: "", message: "" });
      setFeedback({
        type: "success",
        text: "Thank you for your message. We will contact you on the Profile tab.",
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        text: "Cannot connect to backend. Please check that XAMPP Apache and MySQL are running.",
      });
    } finally {
      setLoading(false);
    }
  };

  const token = localStorage.getItem("mandalart_token");
  if (!token) {
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
          <h2 style={{ marginTop: 0 }}>Contact Support</h2>
          <p style={{ color: "#555", lineHeight: 1.7, marginBottom: 0 }}>
            Please sign in to send a message.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px" }}>
      <section style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <h2 style={{ marginTop: 0 }}>Get in touch with us</h2>
        <p style={{ color: "#555", lineHeight: 1.7 }}>
          Contact us regarding your order or anything else.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 18 }}>
          <div className="form-group">
            <label>Name*</label>
            <input name="name" value={form.name} onChange={onChange} required />
          </div>

          <div className="form-group">
            <label>Email*</label>
            <input type="email" name="email" value={form.email} onChange={onChange} required />
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input name="subject" value={form.subject} onChange={onChange} />
          </div>

          <div className="form-group">
            <label>Message*</label>
            <textarea
              name="message"
              value={form.message}
              onChange={onChange}
              placeholder="Write your message here"
              required
              maxLength={maxChars}
              rows={4}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              {form.message.length}/{maxChars}
            </div>
          </div>

          {feedback.text ? (
            <p style={{ color: feedback.type === "success" ? "#2e7d32" : "#b00020" }}>{feedback.text}</p>
          ) : null}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Sending..." : "Submit"}
          </button>
        </form>
      </section>
    </main>
  );
}
