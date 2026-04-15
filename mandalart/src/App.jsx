import React, { useCallback, useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import About from "./pages/About";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Prices from "./pages/Prices";
import Workshop from "./pages/Workshop";
import Order from "./pages/Order";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import API_BASE_URL from "./config/api";

import { CartProvider, useCart } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer";
import AccessibleModal from "./components/AccessibleModal";

function isStrongPassword(password) {
  if (typeof password !== "string") return false;
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function parseJwtPayload(token) {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
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

function UserCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-user" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 14a8 8 0 0 1-5.6-2.3 5.9 5.9 0 0 1 11.2 0A8 8 0 0 1 12 20Z" />
    </svg>
  );
}

function Header() {
  return (
    <header className="hero">
      <img
        src="/images/logo_mandalart.png"
        alt="Mandalart logo"
        className="logo"
      />
      <h1>MANDALART</h1>
      <p className="tagline">CREATE · DECORATE · INSPIRE</p>
    </header>
  );
}

function NavMenu({ showAdmin = false, loggedIn = false }) {
  return (
    <nav className="menu">
      <div className="menu-links">
        <Link to="/">Home</Link>
        <Link to="/About">About</Link>
        <Link to="/Gallery">Gallery</Link>
        <Link to="/Contact">Contact</Link>
        <Link to="/Prices">Prices</Link>
        <Link to="/Workshop">Workshop booking</Link>
        <Link to="/Order">Order</Link>
        {showAdmin ? <Link to="/Admin">Admin</Link> : null}
      </div>
    </nav>
  );
}

function LoginModal({ isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [info, setInfo] = useState("");

  const resetState = () => {
    setError("");
    setInfo("");
    setPassword("");
  };

  const closeModal = () => {
    resetState();
    setMode("login");
    onClose();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setInfo("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        email: utf8ToBase64(email),
        password: utf8ToBase64(password),
      };

      const res = await fetch(`${API_BASE_URL}/api/login_promise`, {
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

      if (!res.ok || data.status !== "success" || !data.token) {
        setError("Invalid email or password.");
        return;
      }

      localStorage.setItem("mandalart_token", data.token);

      if (onSuccess) {
        onSuccess({ email, token: data.token });
      }
      closeModal();
    } catch (err) {
      console.error(err);
      setError(
        "Cannot connect to backend. Please check that XAMPP Apache and MySQL are running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setInfo("");
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        email: utf8ToBase64(email),
      };

      const res = await fetch(`${API_BASE_URL}/api/chpass_request`, {
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

      if (data.status === "email_not_registered") {
        setError("There is no account with this email address.");
        return;
      }

      if (!res.ok || data.status !== "success") {
        setError("Could not start password reset. Please try again.");
        return;
      }

      setInfo("Reset link has been sent.");
    } catch (err) {
      console.error(err);
      setError(
        "Cannot connect to backend. Please check that XAMPP Apache and MySQL are running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={closeModal}
      title={mode === "login" ? "Sign in" : "Forgot password"}
    >
        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-initial-focus="true"
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                resetState();
                setMode("forgot");
              }}
            >
              Forgot password?
            </button>
            <p className="error-message">{error}</p>
          </form>
        ) : (
          <form onSubmit={handleForgot}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-initial-focus="true"
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                resetState();
                setMode("login");
              }}
            >
              Back to sign in
            </button>
            <p className="error-message">{error}</p>
            {info ? <p className="info-message">{info}</p> : null}
          </form>
        )}
    </AccessibleModal>
  );
}

function RegisterModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const closeModal = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields.");
    } else if (!isStrongPassword(password)) {
      setError(
        "Password must be at least 8 characters and include lowercase, uppercase, and a special character."
      );
    } else if (password !== confirmPassword) {
      setError("Passwords do not match.");
    } else {
      try {
        setLoading(true);
        setError("");

        const payload = {
          name: utf8ToBase64(name),
          email: utf8ToBase64(email),
          phone: utf8ToBase64(phone),
          password: utf8ToBase64(password),
        };

        const res = await fetch(`${API_BASE_URL}/api/register_request`, {
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

        if (data.status === "email_already_exists") {
          setError("This email is already registered.");
          return;
        }
        if (data.status === "rate_limited") {
          setError("Too many sign-up attempts from this network. Please try again later.");
          return;
        }
        if (data.status === "registration_disabled") {
          setError("New registrations are temporarily closed.");
          return;
        }
        if (data.status === "weak_password") {
          setError(
            "Password must be at least 8 characters and include lowercase, uppercase, and a special character."
          );
          return;
        }

        if (!res.ok || data.status !== "success" || !data.token) {
          setError("Sign up failed. Please try again.");
          return;
        }

        if (onSuccess) {
          onSuccess({ name, email, token: data.token });
        }
        onClose();
      } catch (err) {
        console.error(err);
        setError(
          "Cannot connect to backend. Please check that XAMPP Apache and MySQL are running."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AccessibleModal isOpen={isOpen} onClose={closeModal} title="Sign up">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              data-initial-focus="true"
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Phone:</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Confirm Password:</label>
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
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
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Creating..." : "Sign up"}
          </button>
          <p className="error-message">{error}</p>
        </form>
    </AccessibleModal>
  );
}

function AuthButtons({ onLoginClick, onRegisterClick, loggedIn, registrationOpen }) {
  if (loggedIn) return null;
  return (
    <div className="auth-links">
      <button className="auth-link" onClick={onLoginClick}>
        Sign in
      </button>
      {registrationOpen ? (
        <>
          <span className="auth-divider">/</span>
          <button className="auth-link" onClick={onRegisterClick}>
            Sign up
          </button>
        </>
      ) : null}
    </div>
  );
}

function CartIconButton({ onClick }) {
  const { totals } = useCart();

  return (
    <button className="cart-iconBtn" onClick={onClick} aria-label="Open cart" type="button">
      🛒
      {totals.count > 0 && <span className="cart-badge">{totals.count}</span>}
    </button>
  );
}

function ProfileIconButton({ loggedIn, unreadSupportCount }) {
  if (!loggedIn) return null;
  const n = Math.max(0, Number(unreadSupportCount) || 0);
  const label =
    n > 0
      ? `Open profile — ${n} new support ${n === 1 ? "message" : "messages"}`
      : "Open profile";
  const badgeText = n > 99 ? "99+" : String(n);
  return (
    <Link className="cart-iconBtn profile-iconBtn" to="/Profile" aria-label={label}>
      <UserCircleIcon />
      {n > 0 ? (
        <span className="cart-badge" aria-hidden="true">
          {badgeText}
        </span>
      ) : null}
    </Link>
  );
}

export default function App() {
  const [tokenValue, setTokenValue] = useState(() => localStorage.getItem("mandalart_token"));
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [contactUnreadCount, setContactUnreadCount] = useState(0);

  const refreshContactUnread = useCallback(async () => {
    const token = localStorage.getItem("mandalart_token");
    if (!token) {
      setContactUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/profile_contact_messages?mark_read=0`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        return;
      }
      if (!res.ok || data.status !== "success") return;
      setContactUnreadCount(Number(data.unread_count ?? 0));
    } catch {}
  }, []);

  const handleLoginClick = () => setLoginOpen(true);
  const handleRegisterClick = () => {
    if (!registrationOpen) return;
    setRegisterOpen(true);
  };
  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("mandalart_token");
    setTokenValue(null);
  };

  const handleLoginClose = () => {
    setLoginOpen(false);
  };

  const handleRegisterClose = () => {
    setRegisterOpen(false);
  };

  const handleLoginSuccess = ({ email, token }) => {
    setLoggedIn(true);
    setUser({ email, token });
    setTokenValue(token);
    setLoginOpen(false);
  };

  const handleRegisterSuccess = ({ name, email, token }) => {
    if (token) {
      localStorage.setItem("mandalart_token", token);
      setTokenValue(token);
    }
    setLoggedIn(true);
    setUser({ name, email, token });
    setRegisterOpen(false);
  };

  useEffect(() => {
    const token = tokenValue || localStorage.getItem("mandalart_token");
    if (!token) return;

    const payload = parseJwtPayload(token);
    if (!payload || !payload.exp) {
      handleLogout();
      return;
    }

    setLoggedIn(true);
    if (payload.email) {
      setUser((prev) => ({ ...(prev || {}), email: payload.email, token }));
    }

    const expiresAt = Number(payload.exp) * 1000;
    const timeoutMs = expiresAt - Date.now();
    if (timeoutMs <= 0) {
      handleLogout();
      return;
    }

    const timer = window.setTimeout(() => {
      handleLogout();
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [tokenValue]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/get_site_pages`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data.status === "success" && "registration_open" in data) {
          setRegistrationOpen(data.registration_open !== false);
        }
      } catch {
        if (!cancelled) setRegistrationOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkAdmin() {
      const token = localStorage.getItem("mandalart_token");
      if (!token) {
        setIsAdmin(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/admin_me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          if (!cancelled) setIsAdmin(false);
          return;
        }

        if (!cancelled) {
          setIsAdmin(res.ok && data.status === "success" && data.role === "admin");
        }
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    }

    checkAdmin();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) {
      setContactUnreadCount(0);
      return;
    }
    refreshContactUnread();
    const intervalId = window.setInterval(refreshContactUnread, 30000);
    const onUnreadRefresh = () => {
      refreshContactUnread();
    };
    window.addEventListener("mandalart:contactUnreadRefresh", onUnreadRefresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("mandalart:contactUnreadRefresh", onUnreadRefresh);
    };
  }, [loggedIn, refreshContactUnread]);

  return (
    <CartProvider>
      <div>
        <Header />
        <NavMenu showAdmin={isAdmin} loggedIn={loggedIn} />

        <div className="top-right">
          <AuthButtons
            onLoginClick={handleLoginClick}
            onRegisterClick={handleRegisterClick}
            loggedIn={loggedIn}
            registrationOpen={registrationOpen}
          />
          <ProfileIconButton loggedIn={loggedIn} unreadSupportCount={contactUnreadCount} />
          <CartIconButton onClick={() => setCartOpen(true)} />
        </div>

        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

        <LoginModal
          isOpen={loginOpen}
          onClose={handleLoginClose}
          onSuccess={handleLoginSuccess}
        />
        <RegisterModal
          isOpen={registerOpen}
          onClose={handleRegisterClose}
          onSuccess={handleRegisterSuccess}
        />

        <Routes>
          <Route path="/" element={<Home loggedIn={loggedIn} />} />
          <Route path="/About" element={<About />} />
          <Route path="/Gallery" element={<Gallery />} />
          <Route path="/Contact" element={<Contact loggedIn={loggedIn} />} />
          <Route path="/Prices" element={<Prices />} />
          <Route path="/Workshop" element={<Workshop />} />
          <Route path="/Order" element={<Order loggedIn={loggedIn} />} />
          <Route path="/Admin" element={<Admin />} />
          <Route path="/Profile" element={<Profile onLogout={handleLogout} />} />
        </Routes>
      </div>
    </CartProvider>
  );
}
