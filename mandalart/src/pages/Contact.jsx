import React, { useState } from "react";
import PageHelmet from "../components/PageHelmet";
import API_BASE_URL from "../config/api";

export default function Contact({ loggedIn = false }) {
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
      setLoading(true);

      if (loggedIn) {
        const token = localStorage.getItem("mandalart_token");
        if (!token) {
          setFeedback({ type: "error", text: "Please sign in again." });
          return;
        }

        const payload = {
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

        setForm((f) => ({ ...f, subject: "", message: "" }));
        setFeedback({
          type: "success",
          text: "Thank you for your message. We will contact you on the Profile tab.",
        });
        window.dispatchEvent(new Event("mandalart:contactUnreadRefresh"));
        return;
      }

      const payload = {
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      };

      const res = await fetch(`${API_BASE_URL}/api/contact_guest_request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      if (data.status === "rate_limited") {
        setFeedback({
          type: "error",
          text: "Too many messages from this network. Please try again later.",
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
        text: "Thank you. We will get in touch with you by email.",
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

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px" }}>
      <PageHelmet
        title="Contact"
        description="Contact MandalArt about orders, workshops, or custom mandalas. We reply by email."
        path="/Contact"
      />
      <section
        style={{
          background: "white",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Get in touch with us</h2>
        <p style={{ color: "#555", lineHeight: 1.7 }}>
          {loggedIn
            ? "Contact us regarding your order or anything else."
            : "Send us a message — we will get back to you by email."}
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 18 }}>
          {!loggedIn ? (
            <>
              <div className="form-group">
                <label htmlFor="contact-name">Name*</label>
                <input
                  id="contact-name"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-email">Email*</label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  autoComplete="email"
                />
              </div>
            </>
          ) : null}

          <div className="form-group">
            <label htmlFor="contact-subject">Subject</label>
            <input id="contact-subject" name="subject" value={form.subject} onChange={onChange} />
          </div>

          <div className="form-group">
            <label htmlFor="contact-message">Message*</label>
            <textarea
              id="contact-message"
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
