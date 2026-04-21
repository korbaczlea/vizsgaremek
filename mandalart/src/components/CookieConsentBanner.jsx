import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export const COOKIE_CONSENT_KEY = "mandalart_cookie_consent_v1";

function readStoredConsent() {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    if (parsed?.choice === "accepted" || parsed?.choice === "rejected") {
      return parsed.choice;
    }
    return "";
  } catch {
    return "";
  }
}

function storeConsent(choice) {
  localStorage.setItem(
    COOKIE_CONSENT_KEY,
    JSON.stringify({
      choice,
      updated_at: new Date().toISOString(),
    })
  );
}

export default function CookieConsentBanner() {
  const [choice, setChoice] = useState(() => readStoredConsent());
  const visible = useMemo(() => choice !== "accepted" && choice !== "rejected", [choice]);

  React.useEffect(() => {
    const onOpenSettings = () => {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      setChoice("");
    };
    window.addEventListener("mandalart:openCookieSettings", onOpenSettings);
    return () => window.removeEventListener("mandalart:openCookieSettings", onOpenSettings);
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Cookie consent">
      <div className="cookie-banner__text">
        We use essential cookies to keep the site secure and functional. Optional
        cookies are used only with your consent. Read more in our{" "}
        <Link to="/Privacy">Privacy Policy</Link>.
      </div>
      <div className="cookie-banner__actions">
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--ghost"
          onClick={() => {
            storeConsent("rejected");
            setChoice("rejected");
          }}
        >
          Reject
        </button>
        <button
          type="button"
          className="cookie-banner__btn"
          onClick={() => {
            storeConsent("accepted");
            setChoice("accepted");
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
