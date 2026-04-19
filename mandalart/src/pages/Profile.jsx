import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import PageHelmet from "../components/PageHelmet";

function authHeaderFromStorage() {
  const t = localStorage.getItem("mandalart_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid JSON response from backend.");
  }
  return { res, data };
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-eye" aria-hidden="true">
      <path d="M12 5c-5.5 0-9.6 3.6-11 7 1.4 3.4 5.5 7 11 7s9.6-3.6 11-7c-1.4-3.4-5.5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-eye" aria-hidden="true">
      <path d="m3.3 2 18.7 18.7-1.4 1.4-4-4a12 12 0 0 1-4.6.9c-5.5 0-9.6-3.6-11-7 .7-1.7 2-3.6 3.8-5l-2.9-2.8L3.3 2Zm7.4 7.4a4 4 0 0 0 3.9 3.9l-3.9-3.9ZM12 5c5.5 0 9.6 3.6 11 7-.6 1.5-1.6 2.9-2.9 4.1l-1.4-1.4c.8-.8 1.5-1.7 2-2.7-1.2-2.4-4.3-5-8.7-5-1.4 0-2.8.3-4 .8L6.4 6.2A13 13 0 0 1 12 5Z" />
    </svg>
  );
}

export default function Profile({ onLogout }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [me, setMe] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [workshopWaitlist, setWorkshopWaitlist] = useState([]);
  const [workshopActionMsg, setWorkshopActionMsg] = useState("");
  const [workshopActionErr, setWorkshopActionErr] = useState("");
  const [bookingBusyId, setBookingBusyId] = useState(null);
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [rescheduleOptions, setRescheduleOptions] = useState([]);
  const [reschedulePick, setReschedulePick] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [changeDeadlineHours, setChangeDeadlineHours] = useState(48);
  const [contactConversations, setContactConversations] = useState([]);
  const [contactUnreadCount, setContactUnreadCount] = useState(0);
  const [messagesOpen, setMessagesOpen] = useState(false);

  const [profileReplyDrafts, setProfileReplyDrafts] = useState({});
  const [profileReplyLoadingId, setProfileReplyLoadingId] = useState(null);
  const [profileReplyError, setProfileReplyError] = useState("");

  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [profileMsg, setProfileMsg] = useState("");

  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");

  const doLogout = () => {
    if (onLogout) onLogout();
    navigate("/");
  };

  const loadContact = async (options = {}) => {
    const silent = options.silent === true;
    const markRead = options.markRead === true;

    const freshToken = localStorage.getItem("mandalart_token");
    if (!freshToken) return;

    try {
      const { res, data } = await fetchJson(
        `${API_BASE_URL}/api/profile_contact_messages?mark_read=${markRead ? "1" : "0"}`,
        { headers: { Authorization: `Bearer ${freshToken}` } }
      );
      if (!res.ok || data.status !== "success") throw new Error("Failed");
      setContactConversations(Array.isArray(data.conversations) ? data.conversations : []);
      setContactUnreadCount(Number(data.unread_count ?? 0));
      if (markRead) {
        window.dispatchEvent(new CustomEvent("mandalart:contactUnreadRefresh"));
      }
    } catch {
      if (!silent) {}
    }
  };

  const sendUserReply = async (conversationId) => {
    setProfileReplyError("");

    const text = String(profileReplyDrafts[conversationId] ?? "").trim();
    if (!text) {
      setProfileReplyError("Please write a reply.");
      return;
    }

    const freshToken = localStorage.getItem("mandalart_token");
    if (!freshToken) return;

    setProfileReplyLoadingId(conversationId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile_send_contact_reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${freshToken}` },
        body: JSON.stringify({ id: conversationId, reply: text }),
      });
      const bodyText = await res.text();
      let body = {};
      try {
        body = bodyText ? JSON.parse(bodyText) : {};
      } catch {
        body = {};
      }

      if (!res.ok || body.status !== "success") {
        const msg = body?.message || "Failed to send reply.";
        throw new Error(msg);
      }

      setProfileReplyDrafts((d) => ({ ...d, [conversationId]: "" }));
      await loadContact({ silent: true, markRead: true });
    } catch (err) {
      setProfileReplyError(err?.message || "Failed to send reply.");
    } finally {
      setProfileReplyLoadingId(null);
    }
  };

  const loadAll = async (options = {}) => {
    const silent = options.silent === true;
    const freshToken = localStorage.getItem("mandalart_token");
    if (!freshToken) {
      setError("Please log in to view your profile.");
      if (!silent) setLoading(false);
      return;
    }

    const authHeaders = { Authorization: `Bearer ${freshToken}` };

    try {
      if (!silent) {
        setLoading(true);
        setError("");
      }

      const [meResp, ordersResp, bookingsResp] = await Promise.all([
        fetchJson(`${API_BASE_URL}/api/profile_me`, { headers: { ...authHeaders } }),
        fetchJson(`${API_BASE_URL}/api/profile_orders`, { headers: { ...authHeaders } }),
        fetchJson(`${API_BASE_URL}/api/profile_bookings`, { headers: { ...authHeaders } }),
      ]);

      if (!meResp.res.ok || meResp.data.status !== "success") {
        throw new Error("Could not load profile.");
      }

      setMe(meResp.data.user || null);
      setProfileForm({
        name: meResp.data.user?.name || "",
        email: meResp.data.user?.email || "",
        phone: meResp.data.user?.phone || "",
      });
      setOrders(Array.isArray(ordersResp.data.orders) ? ordersResp.data.orders : []);
      setBookings(Array.isArray(bookingsResp.data.bookings) ? bookingsResp.data.bookings : []);

      let waitlist = [];
      try {
        const waitResp = await fetchJson(`${API_BASE_URL}/api/profile_workshop_waitlist`, {
          headers: { ...authHeaders },
        });
        if (waitResp.res.ok && waitResp.data.status === "success") {
          waitlist = Array.isArray(waitResp.data.waitlist) ? waitResp.data.waitlist : [];
        }
      } catch {}
      setWorkshopWaitlist(waitlist);
    } catch {
      if (silent) {
        setProfileMsg("Could not refresh profile data.");
      } else {
        setError("Failed to load profile data.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const hoursUntilSession = (startDatetime) => {
    if (!startDatetime) return -1;
    return (new Date(startDatetime).getTime() - Date.now()) / 3600000;
  };

  const openReschedule = async (b) => {
    setWorkshopActionErr("");
    setWorkshopActionMsg("");
    setRescheduleBooking(b);
    setReschedulePick("");
    setRescheduleLoading(true);
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/get_workshop_calendar`);
      if (!res.ok || data.status !== "success") throw new Error("calendar");
      const hrs = Number(data.change_deadline_hours ?? 48);
      setChangeDeadlineHours(hrs);
      const sessions = Array.isArray(data.sessions) ? data.sessions : [];
      const sid = Number(b.session_id);
      const opts = sessions.filter((s) => {
        if (Number(s.id) === sid) return false;
        if (s.is_full) return false;
        return hoursUntilSession(s.start_datetime) >= hrs;
      });
      setRescheduleOptions(opts);
    } catch {
      setWorkshopActionErr("Could not load sessions to reschedule.");
      setRescheduleBooking(null);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleBooking || !reschedulePick) return;
    const token = localStorage.getItem("mandalart_token");
    if (!token) return;
    setBookingBusyId(rescheduleBooking.id);
    setWorkshopActionErr("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile_reschedule_workshop_booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          booking_id: rescheduleBooking.id,
          new_session_id: Number(reschedulePick),
        }),
      });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (data.status === "too_late_to_change" || data.status === "target_session_too_soon") {
        setWorkshopActionErr(
          `Changes are only allowed at least ${changeDeadlineHours} hours before both sessions.`
        );
        return;
      }
      if (data.status === "slot_already_booked") {
        setWorkshopActionErr("That session is full. Pick another time.");
        return;
      }
      if (!res.ok || data.status !== "success") throw new Error("fail");
      setWorkshopActionMsg("Booking moved to the new session.");
      setRescheduleBooking(null);
      await loadAll({ silent: true });
    } catch {
      setWorkshopActionErr("Could not reschedule.");
    } finally {
      setBookingBusyId(null);
    }
  };

  const cancelWorkshopBooking = async (b) => {
    if (
      !window.confirm(
        `Cancel this workshop booking${
          b.start_datetime ? ` (${new Date(b.start_datetime).toLocaleString()})` : ""
        }?`
      )
    ) {
      return;
    }
    const token = localStorage.getItem("mandalart_token");
    if (!token) return;
    setBookingBusyId(b.id);
    setWorkshopActionErr("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile_cancel_workshop_booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ booking_id: b.id }),
      });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (data.status === "too_late_to_change") {
        setWorkshopActionErr(
          `Cancellations are only allowed at least ${changeDeadlineHours} hours before the start.`
        );
        return;
      }
      if (!res.ok || data.status !== "success") throw new Error("fail");
      setWorkshopActionMsg("Booking cancelled.");
      await loadAll({ silent: true });
    } catch {
      setWorkshopActionErr("Could not cancel booking.");
    } finally {
      setBookingBusyId(null);
    }
  };

  const removeWaitlistEntry = async (w) => {
    const token = localStorage.getItem("mandalart_token");
    if (!token) return;
    setBookingBusyId(`w-${w.id}`);
    setWorkshopActionErr("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile_cancel_workshop_waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ waitlist_id: w.id }),
      });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (!res.ok || data.status !== "success") throw new Error("fail");
      setWorkshopActionMsg("Removed from waitlist.");
      await loadAll({ silent: true });
    } catch {
      setWorkshopActionErr("Could not remove waitlist entry.");
    } finally {
      setBookingBusyId(null);
    }
  };

  useEffect(() => {
    loadAll();
    loadContact({ silent: true, markRead: false });

    const pollMs = 30000;
    const timer = window.setInterval(() => {
      loadContact({ silent: true, markRead: messagesOpen });
    }, pollMs);

    return () => window.clearInterval(timer);
  }, [messagesOpen]);

  const onProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    const prevEmail = (me?.email ?? "").trim().toLowerCase();
    const prevPhone = (me?.phone ?? "").trim();
    const nextEmail = profileForm.email.trim().toLowerCase();
    const nextPhone = profileForm.phone.trim();
    const emailChanged = nextEmail !== prevEmail;
    const phoneChanged = nextPhone !== prevPhone;
    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/profile_update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaderFromStorage() },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
        }),
      });
      if (data.status === "email_already_exists") {
        setProfileMsg("This email is already in use.");
        return;
      }
      if (!res.ok || data.status !== "success") {
        setProfileMsg("Could not update profile.");
        return;
      }
      if (data.token) {
        localStorage.setItem("mandalart_token", data.token);
      }
      let successMsg = "Profile updated.";
      if (emailChanged && phoneChanged) {
        successMsg = "Successful email address and phone number change.";
      } else if (emailChanged) {
        successMsg = "Successful email address change.";
      } else if (phoneChanged) {
        successMsg = "Successful phone number change.";
      }
      setProfileMsg(successMsg);
      await loadAll({ silent: true });
    } catch {
      setProfileMsg("Could not update profile.");
    }
  };

  const onPasswordSave = async (e) => {
    e.preventDefault();
    setPwdMsg("");
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg("New passwords do not match.");
      return;
    }

    try {
      const { res, data } = await fetchJson(`${API_BASE_URL}/api/profile_change_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaderFromStorage() },
        body: JSON.stringify({
          current_password: pwdForm.currentPassword,
          new_password: pwdForm.newPassword,
        }),
      });
      if (data.status === "weak_password") {
        setPwdMsg(
          "Password must be at least 8 characters and include lowercase, uppercase, and a special character."
        );
        return;
      }
      if (!res.ok || data.status !== "success") {
        setPwdMsg("Could not change password.");
        return;
      }
      setPwdMsg("Password changed successfully.");
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setPwdMsg("Could not change password.");
    }
  };

  if (loading) {
    return (
      <main className="profile-page profile-loading">
        <PageHelmet title="Profile" description="Your MandalArt account." path="/Profile" noindex />
        Loading profile...
      </main>
    );
  }

  if (error) {
    return (
      <main className="profile-page">
        <PageHelmet title="Profile" description="Your MandalArt account." path="/Profile" noindex />
        <h2>Profile</h2>
        <p className="profile-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <PageHelmet title="Profile" description="Your MandalArt account, orders, and support messages." path="/Profile" noindex />
      <section className="profile-card profile-card--header">
        <div>
          <h2 className="profile-title">Profile</h2>
          <p className="profile-muted">Manage your account details.</p>
        </div>
        <button type="button" className="profile-logoutBtn" onClick={doLogout}>
          Logout
        </button>
      </section>

      {contactUnreadCount > 0 ? (
        <p className="profile-message" style={{ margin: "0 auto", maxWidth: 980 }}>
          You have new messages from Support.
        </p>
      ) : null}

      <section className="profile-card">
        <h3 className="profile-subtitle">Personal data</h3>
        <form onSubmit={onProfileSave} className="profile-form">
          <input
            placeholder="Full name"
            value={profileForm.name}
            onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            placeholder="Email"
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            placeholder="Phone"
            value={profileForm.phone}
            onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <button type="submit" className="profile-btn">Save profile</button>
          {profileMsg ? <p className="profile-message">{profileMsg}</p> : null}
        </form>
      </section>

      <section className="profile-card">
        <h3 className="profile-subtitle">Change password</h3>
        <form onSubmit={onPasswordSave} className="profile-form">
          <div className="password-field">
            <input
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Current password"
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowCurrentPassword((v) => !v)}
              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
            >
              {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <div className="password-field">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="New password"
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowNewPassword((v) => !v)}
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <button type="submit" className="profile-btn">Change password</button>
          {pwdMsg ? <p className="profile-message">{pwdMsg}</p> : null}
        </form>
      </section>

      <section className="profile-card">
        <h3 className="profile-subtitle">My orders</h3>
        {orders.length === 0 ? (
          <p className="profile-muted">No orders yet.</p>
        ) : (
          <div className="profile-tableWrap">
            <table className="profile-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Order date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.order_number}</td>
                    <td>{o.order_status}</td>
                    <td>{Number(o.total_amount).toLocaleString()} HUF</td>
                    <td>{o.created_at ? new Date(o.created_at).toLocaleString() : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="profile-card">
        <h3 className="profile-subtitle">My workshop bookings</h3>
        {workshopActionMsg ? (
          <p className="profile-message" style={{ color: "#2e7d32", marginTop: 0 }}>
            {workshopActionMsg}
          </p>
        ) : null}
        {workshopActionErr ? (
          <p className="profile-message" style={{ color: "#b00020", marginTop: 0 }}>
            {workshopActionErr}
          </p>
        ) : null}
        <p className="profile-muted" style={{ marginTop: 0 }}>
          Cancel or change your booking at least {changeDeadlineHours} hours before the session starts.
        </p>
        {bookings.length === 0 ? (
          <p className="profile-muted">No workshop bookings yet.</p>
        ) : (
          <div className="profile-bookings">
            {bookings.map((b) => {
              const cancelled = String(b.status) === "cancelled";
              return (
                <div
                  key={b.id}
                  className={`profile-bookingItem${cancelled ? " profile-bookingItem--cancelled" : ""}`}
                >
                  <div>
                    <b>{b.workshop_title}</b>
                    <span className="profile-muted" style={{ marginLeft: 8, textTransform: "capitalize" }}>
                      ({b.status})
                    </span>
                  </div>
                  {b.start_datetime ? (
                    <div className="profile-muted">
                      {new Date(b.start_datetime).toLocaleString()}
                      {b.end_datetime ? ` – ${new Date(b.end_datetime).toLocaleString()}` : ""}
                    </div>
                  ) : null}
                  {!cancelled && b.can_modify ? (
                    <div className="profile-bookingActions">
                      <button
                        type="button"
                        className="profile-btn profile-btn--ghost"
                        disabled={bookingBusyId === b.id}
                        onClick={() => openReschedule(b)}
                      >
                        Change date
                      </button>
                      <button
                        type="button"
                        className="profile-btn profile-btn--danger"
                        disabled={bookingBusyId === b.id}
                        onClick={() => cancelWorkshopBooking(b)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}
                  {!cancelled && !b.can_modify ? (
                    <p className="profile-muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
                      Changes are no longer allowed (less than {changeDeadlineHours}h before start).
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="profile-card">
        <h3 className="profile-subtitle">Workshop waitlist</h3>
        {workshopWaitlist.length === 0 ? (
          <p className="profile-muted">You are not on any waitlist.</p>
        ) : (
          <div className="profile-bookings">
            {workshopWaitlist.map((w) => (
              <div key={w.id} className="profile-bookingItem">
                <div>
                  <b>{w.workshop_title}</b>
                </div>
                <div className="profile-muted">
                  {w.start_datetime ? new Date(w.start_datetime).toLocaleString() : ""}
                </div>
                <button
                  type="button"
                  className="profile-btn profile-btn--ghost"
                  disabled={bookingBusyId === `w-${w.id}`}
                  onClick={() => removeWaitlistEntry(w)}
                >
                  Leave waitlist
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="profile-card">
        <h3 className="profile-subtitle">Messages</h3>
        <button
          type="button"
          className="profile-btn"
          style={{ width: "auto" }}
          onClick={async () => {
            const next = !messagesOpen;
            setMessagesOpen(next);
            if (next) {
              await loadContact({ silent: true, markRead: true });
            }
          }}
        >
          {messagesOpen ? "Hide messages" : "Open messages"}
        </button>
        {profileReplyError ? (
          <p className="profile-message" style={{ marginTop: 10, color: "#b00020" }}>
            {profileReplyError}
          </p>
        ) : null}
        {messagesOpen ? (
          contactConversations.length === 0 ? (
            <p className="profile-muted">No messages yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {contactConversations.map((c) => (
                <div
                  key={c.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 14,
                    background: "rgba(255, 255, 255, 0.65)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <b>{c.subject || "No subject"}</b>
                    </div>
                    <div className="profile-muted" style={{ fontSize: 13 }}>
                      {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                    </div>
                  </div>

                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 10 }}>
                    {c.message}
                  </div>

                  {c.replies && c.replies.length ? (
                    <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                      {c.replies.map((r) => (
                        <div
                          key={r.id}
                          style={{
                            borderRadius: 10,
                            padding: 12,
                            background: "rgba(185, 108, 156, 0.10)",
                            border: "1px solid rgba(185, 108, 156, 0.20)",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>
                            {r.sender_type === "user" ? "Your reply" : "Support reply"}
                          </div>
                          <div className="profile-muted" style={{ fontSize: 13 }}>
                            {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                          </div>
                          <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{r.reply_message}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="profile-muted" style={{ marginTop: 10, fontSize: 13 }}>
                      No reply yet.
                    </p>
                  )}

                  <div style={{ marginTop: 14 }}>
                    <textarea
                      value={profileReplyDrafts[c.id] ?? ""}
                      onChange={(e) =>
                        setProfileReplyDrafts((d) => ({ ...d, [c.id]: e.target.value }))
                      }
                      placeholder="Write your reply..."
                      rows={3}
                      maxLength={300}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        borderRadius: 10,
                        padding: 12,
                        border: "2px solid #e6e0da",
                        background: "#fff",
                      }}
                      disabled={profileReplyLoadingId === c.id}
                    />
                    <div className="profile-muted" style={{ fontSize: 12, marginTop: 6 }}>
                      {(profileReplyDrafts[c.id] ?? "").length}/300
                    </div>
                    <button
                      type="button"
                      className="profile-btn"
                      style={{ width: "auto", marginTop: 10 }}
                      disabled={profileReplyLoadingId === c.id}
                      onClick={() => sendUserReply(c.id)}
                    >
                      {profileReplyLoadingId === c.id ? "Sending..." : "Send reply"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : contactUnreadCount > 0 ? (
          <p className="profile-muted" style={{ marginTop: 10 }}>
            You have {contactUnreadCount} new message(s). Open Messages to view.
          </p>
        ) : (
          <p className="profile-muted">No messages yet.</p>
        )}
      </section>

      {rescheduleBooking ? (
        <div
          className="profile-modalOverlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRescheduleBooking(null);
          }}
        >
          <div className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
            <h3 id="reschedule-title">Move to another session</h3>
            <p className="profile-muted">
              Only sessions with free spots and at least {changeDeadlineHours} hours until start are listed.
            </p>
            {rescheduleLoading ? (
              <p>Loading…</p>
            ) : rescheduleOptions.length === 0 ? (
              <p className="profile-muted">No alternative sessions available right now.</p>
            ) : (
              <>
                <label className="profile-fieldLabel" htmlFor="reschedule-select">
                  New time slot
                </label>
                <select
                  id="reschedule-select"
                  className="profile-select"
                  value={reschedulePick}
                  onChange={(e) => setReschedulePick(e.target.value)}
                >
                  <option value="">Choose…</option>
                  {rescheduleOptions.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.booking_date} {s.start_time}–{s.end_time} ({s.remaining} places)
                    </option>
                  ))}
                </select>
              </>
            )}
            <div className="profile-modalActions">
              <button type="button" className="profile-btn profile-btn--ghost" onClick={() => setRescheduleBooking(null)}>
                Close
              </button>
              <button
                type="button"
                className="profile-btn"
                disabled={!reschedulePick || bookingBusyId === rescheduleBooking.id}
                onClick={submitReschedule}
              >
                {bookingBusyId === rescheduleBooking.id ? "Saving…" : "Confirm move"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
