import React, { useState } from "react";

export default function Prices() {
  const [selectedImage, setSelectedImage] = useState(null);

  const items = [
    {
      title: "12 cm mandala",
      price: "5500 HUF",
      image: "/images/little_mandala.png",
      alt: "12 cm mandala",
      sizeLabel: "Small",
    },
    {
      title: "22 cm mandala",
      price: "15000 HUF",
      image: "/images/medium_mandala.png",
      alt: "22 cm mandala",
      sizeLabel: "Medium",
    },
    {
      title: "30 cm wall clock mandala",
      price: "25500 HUF",
      image: "/images/clock_mandala.png",
      alt: "30 cm wall clock mandala",
      sizeLabel: "Wall clock",
    },
  ];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px" }}>
      <section style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <h2 style={{ marginTop: 0 }}>Mandala prices</h2>

        <ul style={{ listStyle: "none", padding: 0, margin: "18px 0 0" }}>
          {items.map((it) => (
            <li
              key={it.title}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 12px",
                borderBottom: "1px solid #eee",
                gap: 12,
                alignItems: "center",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setSelectedImage({ src: it.image, alt: it.alt })}
                  aria-label={`${it.alt} megnyitasa`}
                  style={{
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    display: "flex",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={it.image}
                    alt={it.alt}
                    style={{
                      width: 70,
                      height: 70,
                      objectFit: "cover",
                      borderRadius: "50%",
                      border: "1px solid #f0e5ed",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  />
                </button>
                <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontWeight: 600 }}>{it.title}</span>
                  <span style={{ color: "#8b6f80", fontSize: 13, fontWeight: 600 }}>{it.sizeLabel}</span>
                </span>
              </span>
              <span style={{ color: "#b96c9c", fontWeight: 700 }}>{it.price}</span>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 18, color: "#666" }}>
          Custom requests are priced individually depending on complexity and size.
        </p>
      </section>

      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mandala kep nagyitva"
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: 14,
              padding: 12,
              maxWidth: 520,
              width: "100%",
              boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              aria-label="Bezaras"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "none",
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                fontSize: 20,
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: 10,
                display: "block",
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
