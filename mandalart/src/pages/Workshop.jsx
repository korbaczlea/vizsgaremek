import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config/api";

export default function Workshop() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await fetch(`${API_BASE_URL}/api/get_workshop_sessions`);
        const text = await res.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          if (!cancelled) {
            setError(
              "Backend response is not valid JSON. Please check that XAMPP Apache is running."
            );
          }
          return;
        }

        if (!res.ok || data.status !== "success") {
          if (!cancelled) setError("Failed to load workshop sessions.");
          return;
        }

        const list = Array.isArray(data.sessions) ? data.sessions : [];
        if (!cancelled) {
          setSessions(list);
          const dates = Array.from(new Set(list.map((s) => s.booking_date))).sort();
          const firstDate = dates[0] || "";
          setSelectedDate(firstDate);
          const firstSession = list.find((s) => s.booking_date === firstDate);
          setSelectedSessionId(firstSession ? String(firstSession.id) : "");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(
            "Cannot connect to backend. Please check that XAMPP Apache and MySQL are running."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  const dateOptions = useMemo(() => {
    const dates = Array.from(new Set(sessions.map((s) => s.booking_date))).sort();
    return dates;
  }, [sessions]);

  const sessionsForSelectedDate = useMemo(() => {
    return sessions.filter((s) => s.booking_date === selectedDate);
  }, [sessions, selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    if (!selectedSessionId) {
      const first = sessionsForSelectedDate[0];
      setSelectedSessionId(first ? String(first.id) : "");
    }
  }, [selectedDate, sessionsForSelectedDate, selectedSessionId]);

  const validate = () => {
    if (!selectedDate) return "Please choose a Saturday date.";
    if (!selectedSessionId) return "Please choose a time slot.";
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.lastName.trim()) return "Last name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email address.";
    if (!/^[0-9+\s()-]{6,}$/.test(form.phone)) return "Please enter a valid phone number.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");

    try {
      const payload = {
        session_id: selectedSessionId,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
      };

      const res = await fetch(`${API_BASE_URL}/api/workshop_booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(
          "Backend response is not valid JSON. Please check that XAMPP Apache is running."
        );
        return;
      }

      if (data.status === "slot_already_booked") {
        setError("This time slot is already fully booked. Please choose another.");
        return;
      }
      if (!res.ok || data.status !== "success") {
        setError("Booking failed. Please try again.");
        return;
      }

      setError("");
      setSuccess(
        "Booking successful! We have received your request and will confirm it by email."
      );
      setForm({ firstName: "", lastName: "", email: "", phone: "" });
    } catch (err) {
      console.error(err);
      setError(
        "Cannot connect to backend. Please check that XAMPP Apache and MySQL are running."
      );
    }
  };

  return (
    <main className="workshop-wrap">
      <section className="workshop-card">
        <div className="workshop-media">
          <img src="/images/workshop.png" alt="MandalArt workshop" />
        </div>

        <div className="workshop-content">
          <h2>Workshop booking</h2>
          <p className="workshop-sub">
            Book a workshop session for Saturdays only. You can book up to <b>3 weeks</b> in advance.
          </p>

          <form className="workshop-form" onSubmit={onSubmit}>
            <div className="workshop-row">
              <div className="workshop-field">
                <label>Saturday date*</label>
                {loading ? (
                  <select value="" disabled>
                    <option value="">Loading...</option>
                  </select>
                ) : (
                  <select
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      const first = sessions.find((s) => s.booking_date === e.target.value);
                      setSelectedSessionId(first ? String(first.id) : "");
                    }}
                  >
                    {dateOptions.length === 0 ? (
                      <option value="">No available Saturdays in the next 3 weeks</option>
                    ) : (
                      dateOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              <div className="workshop-field">
                <label>Time slot*</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  disabled={loading || sessionsForSelectedDate.length === 0}
                >
                  <option value="">Select…</option>
                  {sessionsForSelectedDate.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.start_time} - {s.end_time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="workshop-row">
              <div className="workshop-field">
                <label>First name*</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={onChange}
                  placeholder="First name"
                />
              </div>
              <div className="workshop-field">
                <label>Last name*</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={onChange}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="workshop-row">
              <div className="workshop-field">
                <label>Email*</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="name@email.com"
                />
              </div>
              <div className="workshop-field">
                <label>Phone*</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="+36 30 123 4567"
                />
              </div>
            </div>

            {error && <div className="workshop-error">{error}</div>}
            {success && <div className="workshop-success">{success}</div>}

            <button className="workshop-btn" type="submit">
              Request booking
            </button>

            <p className="workshop-note">
              After submitting, we will confirm your booking by email.
            </p>
          </form>
        </div>
      </section>

      <section className="workshop-extra">
        <h3>What you will learn</h3>
        <ul>
          <li>Basic dotting technique</li>
          <li>Color harmony & composition</li>
          <li>How to create a mandala step by step</li>
        </ul>
      </section>
    </main>
  );
}
