import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from "../config/api";
import { defaultHomeContent } from "../data/sitePageDefaults";

export default function Home() {
  const [content, setContent] = useState(null);
  const [featuredFromProducts, setFeaturedFromProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/get_home_page`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data.status === "success" && data.home) {
          setContent(data.home);
        } else if (!cancelled) {
          setContent(defaultHomeContent);
        }
      } catch {
        if (!cancelled) setContent(defaultHomeContent);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/get_all_products`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.status !== "success" || !Array.isArray(data.products)) return;

        const normalized = data.products
          .filter((p) => Number(p?.is_active ?? 1) === 1)
          .slice(0, 3)
          .map((p) => {
            let fallbackImage = null;
            const name = String(p?.name || "");
            const lowerName = name.toLowerCase();
            if (p?.id === 1 || name.includes("12")) fallbackImage = "/images/little_mandala.png";
            else if (p?.id === 2 || name.includes("22")) fallbackImage = "/images/medium_mandala.png";
            else if (p?.id === 3 || lowerName.includes("clock")) fallbackImage = "/images/clock_mandala.png";

            const rawPrice = Number(p?.price ?? 0);
            const currency = p?.currency || "HUF";
            return {
              name: name || "Product",
              price: `${rawPrice.toLocaleString()} ${currency}`,
              image: p?.image || fallbackImage || "/images/medium_mandala.png",
              desc: p?.description || "Handmade mandala available on the Order page.",
            };
          });

        if (!cancelled && normalized.length) setFeaturedFromProducts(normalized);
      } catch {
        // Keep existing featured fallback content if product endpoint fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const home = content ?? defaultHomeContent;
  const slides = useMemo(
    () => (Array.isArray(home.slides) && home.slides.length ? home.slides : defaultHomeContent.slides),
    [home.slides]
  );
  const featured = useMemo(
    () =>
      Array.isArray(home.featured) && home.featured.length ? home.featured : defaultHomeContent.featured,
    [home.featured]
  );
  const featuredItems = featuredFromProducts.length ? featuredFromProducts : featured;
  const trust = useMemo(
    () => (Array.isArray(home.trust) && home.trust.length ? home.trust : defaultHomeContent.trust),
    [home.trust]
  );
  const whyBullets = useMemo(
    () =>
      Array.isArray(home.why_bullets) && home.why_bullets.length
        ? home.why_bullets
        : defaultHomeContent.why_bullets,
    [home.why_bullets]
  );
  const steps = useMemo(
    () => (Array.isArray(home.steps) && home.steps.length ? home.steps : defaultHomeContent.steps),
    [home.steps]
  );

  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    setIndex((i) => (slides.length ? Math.min(i, slides.length - 1) : 0));
  }, [slides.length]);

  return (
    <main className="home-wrap">
      <section className="home-hero">
        <div className="home-hero__grid">
          <div className="home-hero__media">
            <div className="home-slider">
              {slides[index] ? (
                <img
                  src={slides[index].src}
                  alt={slides[index].alt || ""}
                  className="home-slider__img"
                  loading="eager"
                />
              ) : null}

              <button
                type="button"
                className="home-slider__nav home-slider__nav--left"
                onClick={prev}
                aria-label="Previous image"
              >
                ‹
              </button>

              <button
                type="button"
                className="home-slider__nav home-slider__nav--right"
                onClick={next}
                aria-label="Next image"
              >
                ›
              </button>

              <div className="home-slider__dots" role="tablist" aria-label="Slider dots">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`home-slider__dot ${i === index ? "is-active" : ""}`}
                    onClick={() => setIndex(i)}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="home-hero__content">
            <div className="home-kicker">{home.kicker}</div>
            <h2 className="home-headline">{home.headline}</h2>
            <p className="home-subhead">{home.subhead}</p>

            <div className="home-cta">
              <Link className="home-btn home-btn--primary" to="/Order">
                Shop now
              </Link>
              <Link className="home-btn home-btn--ghost" to="/Contact">
                Custom order
              </Link>
            </div>

            <div className="home-trust">
              {trust.map((item, i) => (
                <div key={i} className="home-trustItem">
                  <div className="home-trustIcon" aria-hidden="true"></div>
                  <div>
                    <div className="home-trustTitle">{item.title}</div>
                    <div className="home-trustText">{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-sectionHeader">
          <h3>{home.featured_section_title || "Featured products"}</h3>
          <Link className="home-link" to="/Order">
            View all →
          </Link>
        </div>

        <div className="home-featured">
          {featuredItems.map((p, i) => (
            <div key={p.name || i} className="home-productCard">
              <div className="home-productCard__img">
                <img src={p.image} alt={p.name || ""} loading="lazy" />
              </div>

              <div className="home-productCard__body">
                <div className="home-productCard__name">{p.name}</div>
                <div className="home-productCard__desc">{p.desc}</div>
                <div className="home-productCard__row">
                  <div className="home-productCard__price">{p.price}</div>
                  <Link className="home-miniBtn" to="/Order">
                    Shop
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section home-split">
        <div className="home-card">
          <h3>{home.why_title}</h3>
          <p>{home.why_body}</p>
          <div className="home-divider" />
          <div className="home-bullets">
            {whyBullets.map((line, i) => (
              <div key={i} className="home-bullet">
                • {line}
              </div>
            ))}
          </div>
        </div>

        <div className="home-card">
          <h3>{home.process_title}</h3>
          <p>{home.process_body}</p>

          <div className="home-steps">
            {steps.map((s, i) => (
              <div key={i} className="home-step">
                <div className="home-stepNum">{s.num}</div>
                <div className="home-stepText">{s.text}</div>
              </div>
            ))}
          </div>

          <div className="home-ctaRow">
            <Link className="home-btn home-btn--ghost" to="/Workshop">
              Workshop booking
            </Link>
            <Link className="home-btn home-btn--primary" to="/Contact">
              Ask a question
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
