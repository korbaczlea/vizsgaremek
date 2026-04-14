import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../config/api";
import PageHelmet from "../components/PageHelmet";

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday = 0 … Sunday = 6 */
function mondayIndex(d) {
  return (d.getDay() + 6) % 7;
}

function startOfWeekMonday(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - mondayIndex(x));
  return x;
}

function monthGridCells(monthAnchor) {
  const y = monthAnchor.getFullYear();
  const m = monthAnchor.getMonth();
  const first = new Date(y, m, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - mondayIndex(first));
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const c = new Date(start);
    c.setDate(start.getDate() + i);
    cells.push(c);
  }
  return cells;
}

function addMonths(d, delta) {
  const x = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  return x;
}

export default function Workshop() {
  const [calendarSessions, setCalendarSessions] = useState([]);
  const [deadlineHours, setDeadlineHours] = useState(48);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [waitlistSuccess, setWaitlistSuccess] = useState("");

  const [viewMode, setViewMode] = useState("month"); // "month" | "week"
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [weekCursor, setWeekCursor] = useState(() => startOfWeekMonday(new Date()));

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

    async function loadCalendar() {
      try {
        setLoading(true);
        setError("");
        setSuccess("");
        setWaitlistSuccess("");

        const res = await fetch(`${API_BASE_URL}/api/get_workshop_calendar`);
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
          if (!cancelled) setError("Failed to load workshop calendar.");
          return;
        }

        const list = Array.isArray(data.sessions) ? data.sessions : [];
        if (!cancelled) {
          setCalendarSessions(list);
          if (typeof data.change_deadline_hours === "number") {
            setDeadlineHours(data.change_deadline_hours);
          }
          const dates = Array.from(new Set(list.map((s) => s.booking_date))).sort();
          const bookable = list.filter((s) => !s.is_full);
          const bookableDates = Array.from(new Set(bookable.map((s) => s.booking_date))).sort();
          const firstDate = bookableDates[0] || dates[0] || "";
          setSelectedDate(firstDate);
          const firstSession = list.find((s) => s.booking_date === firstDate);
          setSelectedSessionId(
            firstSession && !firstSession.is_full ? String(firstSession.id) : ""
          );
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

    loadCalendar();
    return () => {
      cancelled = true;
    };
  }, []);

  const sessionsByDate = useMemo(() => {
    const m = {};
    for (const s of calendarSessions) {
      if (!m[s.booking_date]) m[s.booking_date] = [];
      m[s.booking_date].push(s);
    }
    return m;
  }, [calendarSessions]);

  const dateOptions = useMemo(() => {
    return Array.from(new Set(calendarSessions.map((s) => s.booking_date))).sort();
  }, [calendarSessions]);

  const sessionsForSelectedDate = useMemo(() => {
    return calendarSessions.filter((s) => s.booking_date === selectedDate);
  }, [calendarSessions, selectedDate]);

  const selectedSession = useMemo(() => {
    return calendarSessions.find((s) => String(s.id) === String(selectedSessionId)) || null;
  }, [calendarSessions, selectedSessionId]);

  useEffect(() => {
    if (!selectedDate) return;
    if (!selectedSessionId) {
      const firstOpen = sessionsForSelectedDate.find((s) => !s.is_full);
      const first = firstOpen || sessionsForSelectedDate[0];
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

  const onSubmitBook = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setSuccess("");
    setWaitlistSuccess("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");

    try {
      const payload = {
        session_id: Number(selectedSessionId),
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
        setError("This time slot just filled up. You can join the waitlist below.");
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
      const calRes = await fetch(`${API_BASE_URL}/api/get_workshop_calendar`);
      const calText = await calRes.text();
      const calData = calText ? JSON.parse(calText) : {};
      if (calRes.ok && calData.status === "success" && Array.isArray(calData.sessions)) {
        setCalendarSessions(calData.sessions);
      }
    } catch (err) {
      console.error(err);
      setError(
        "Cannot connect to backend. Please check that XAMPP Apache and MySQL are running."
      );
    }
  };

  const onSubmitWaitlist = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setWaitlistSuccess("");
    setSuccess("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");

    try {
      const payload = {
        session_id: Number(selectedSessionId),
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
      };

      const res = await fetch(`${API_BASE_URL}/api/workshop_waitlist_join`, {
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

      if (data.status === "session_not_full") {
        setError("This slot has space again — use “Request booking” instead.");
        return;
      }
      if (data.status === "already_on_waitlist") {
        setError("You are already on the waitlist for this session.");
        return;
      }
      if (!res.ok || data.status !== "success") {
        setError("Could not join waitlist. Please try again.");
        return;
      }

      setError("");
      setWaitlistSuccess(
        "You are on the waitlist. We will email you if a place becomes available."
      );
    } catch (err) {
      console.error(err);
      setError(
        "Cannot connect to backend. Please check that XAMPP Apache and MySQL are running."
      );
    }
  };

  const monthCells = useMemo(() => monthGridCells(monthAnchor), [monthAnchor]);
  const weekCells = useMemo(() => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekCursor);
      d.setDate(weekCursor.getDate() + i);
      out.push(d);
    }
    return out;
  }, [weekCursor]);

  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const onCalendarDayClick = (d) => {
    if (d.getDay() !== 6) return;
    const iso = toISODate(d);
    if (!sessionsByDate[iso]) return;
    setSelectedDate(iso);
    const firstOpen = calendarSessions.find((s) => s.booking_date === iso && !s.is_full);
    const first = firstOpen || calendarSessions.find((s) => s.booking_date === iso);
    setSelectedSessionId(first ? String(first.id) : "");
  };

  const monthTitle = monthAnchor.toLocaleString("en-GB", { month: "long", year: "numeric" });

  return (
    <main className="workshop-wrap">
      <PageHelmet
        title="Workshop booking"
        description="Book a Saturday MandalArt workshop session. Reserve your place online."
        path="/Workshop"
      />
      <section className="workshop-card">
        <div className="workshop-media">
          <img src="/images/workshop.png" alt="MandalArt workshop" />
        </div>

        <div className="workshop-content">
          <h2>Workshop booking</h2>
          <p className="workshop-sub">
            Book a workshop session for <b>Saturdays</b> only. Calendar shows free and full slots.
            Changes or cancellations are allowed at least <b>{deadlineHours} hours</b> before the
            session starts (manage in your Profile).
          </p>

          <div className="workshop-calToolbar">
            <div className="workshop-calToggle">
              <button
                type="button"
                className={viewMode === "month" ? "is-active" : ""}
                onClick={() => setViewMode("month")}
              >
                Month
              </button>
              <button
                type="button"
                className={viewMode === "week" ? "is-active" : ""}
                onClick={() => setViewMode("week")}
              >
                Week
              </button>
            </div>
            {viewMode === "month" ? (
              <div className="workshop-calNav">
                <button type="button" onClick={() => setMonthAnchor((m) => addMonths(m, -1))}>
                  ←
                </button>
                <span className="workshop-calTitle">{monthTitle}</span>
                <button type="button" onClick={() => setMonthAnchor((m) => addMonths(m, 1))}>
                  →
                </button>
              </div>
            ) : (
              <div className="workshop-calNav">
                <button
                  type="button"
                  onClick={() => {
                    const x = new Date(weekCursor);
                    x.setDate(x.getDate() - 7);
                    setWeekCursor(startOfWeekMonday(x));
                  }}
                >
                  ←
                </button>
                <span className="workshop-calTitle">
                  Week of {toISODate(weekCursor)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const x = new Date(weekCursor);
                    x.setDate(x.getDate() + 7);
                    setWeekCursor(startOfWeekMonday(x));
                  }}
                >
                  →
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="workshop-muted">Loading calendar…</p>
          ) : (
            <div className="workshop-calendar">
              <div className="workshop-calWeekdays">
                {weekdayLabels.map((w) => (
                  <div key={w} className="workshop-calWeekday">
                    {w}
                  </div>
                ))}
              </div>
              <div className="workshop-calGrid">
                {(viewMode === "month" ? monthCells : weekCells).map((d, idx) => {
                  const iso = toISODate(d);
                  const inMonth =
                    viewMode === "week" ||
                    (d.getMonth() === monthAnchor.getMonth() &&
                      d.getFullYear() === monthAnchor.getFullYear());
                  const isSat = d.getDay() === 6;
                  const daySessions = sessionsByDate[iso] || [];
                  const hasWorkshop = daySessions.length > 0;
                  const allFull = hasWorkshop && daySessions.every((s) => s.is_full);
                  const hasFree = hasWorkshop && daySessions.some((s) => !s.is_full);

                  let cellClass = "workshop-calCell";
                  if (!inMonth && viewMode === "month") cellClass += " is-other-month";
                  if (isSat) cellClass += " is-saturday";
                  if (hasWorkshop) cellClass += " has-workshop";
                  if (hasFree) cellClass += " has-free";
                  if (hasWorkshop && allFull) cellClass += " is-full";

                  return (
                    <button
                      key={`${iso}-${idx}`}
                      type="button"
                      className={cellClass}
                      disabled={!hasWorkshop || !isSat}
                      onClick={() => onCalendarDayClick(d)}
                      title={
                        hasWorkshop && isSat
                          ? allFull
                            ? "Full — waitlist available"
                            : "Spaces available"
                          : undefined
                      }
                    >
                      <span className="workshop-calDayNum">{d.getDate()}</span>
                      {hasWorkshop && isSat ? (
                        <span className="workshop-calDots" aria-hidden>
                          {daySessions.map((s) => (
                            <span
                              key={s.id}
                              className={s.is_full ? "dot full" : "dot free"}
                            />
                          ))}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form className="workshop-form" onSubmit={onSubmitBook}>
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
                      const list = calendarSessions.filter((s) => s.booking_date === e.target.value);
                      const fo = list.find((s) => !s.is_full);
                      const f = fo || list[0];
                      setSelectedSessionId(f ? String(f.id) : "");
                    }}
                  >
                    {dateOptions.length === 0 ? (
                      <option value="">No Saturday sessions in the calendar window</option>
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
                      {s.start_time} – {s.end_time}
                      {s.is_full ? " (full)" : ` (${s.remaining} left)`}
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
            {waitlistSuccess && <div className="workshop-success">{waitlistSuccess}</div>}

            <div className="workshop-actions">
              <button
                className="workshop-btn"
                type="submit"
                disabled={!selectedSession || selectedSession.is_full}
              >
                Request booking
              </button>
              {selectedSession?.is_full ? (
                <button
                  type="button"
                  className="workshop-btn workshop-btn--secondary"
                  onClick={() => void onSubmitWaitlist()}
                >
                  Join waitlist for this slot
                </button>
              ) : null}
            </div>

            <p className="workshop-note">
              After submitting, we will confirm by email. Full slots: join the waitlist — if someone
              cancels, the next person on the list is offered the place automatically.
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
