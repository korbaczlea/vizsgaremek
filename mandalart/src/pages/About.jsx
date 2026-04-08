import React, { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";
import { defaultAboutContent } from "../data/sitePageDefaults";

export default function About() {
  const [about, setAbout] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/get_about_page`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data.status === "success" && data.about) {
          setAbout(data.about);
        } else if (!cancelled) {
          setAbout(defaultAboutContent);
        }
      } catch {
        if (!cancelled) setAbout(defaultAboutContent);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const a = about ?? defaultAboutContent;
  const paragraphs = Array.isArray(a.paragraphs) && a.paragraphs.length ? a.paragraphs : defaultAboutContent.paragraphs;

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 20px" }}>
      <section
        style={{
          background: "white",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
          <div
            style={{
              flex: "0 1 240px",
              minWidth: 180,
              maxWidth: 260,
              background: "linear-gradient(135deg, #fff7fb 0%, #f9f2f7 100%)",
              borderRadius: 18,
              padding: 10,
              border: "1px solid #f0e1ec",
              boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
            }}
          >
            <img
              src="/images/about.jpg"
              alt="About MandalArt"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: 14,
                objectFit: "cover",
              }}
            />
          </div>

          <div style={{ flex: "1 1 420px", minWidth: 280 }}>
            <h2 style={{ marginTop: 0 }}>{a.title}</h2>
            <p style={{ marginTop: 8, color: "#666" }}>{a.tagline}</p>

            {paragraphs.map((text, i) => (
              <p key={i} style={{ lineHeight: 1.7, color: "#444", marginTop: i === 0 ? 8 : 18 }}>
                {text}
              </p>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
