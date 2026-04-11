import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";
import PageHelmet from "../components/PageHelmet";

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE_URL}/api/get_gallery_images`);
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

        if (!res.ok || data.status !== "success" || !Array.isArray(data.images)) {
          if (!cancelled) {
            setError("Failed to load gallery images.");
          }
          return;
        }

        if (!cancelled) {
          setImages(data.images);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            "Cannot connect to backend. Please check that XAMPP Apache and MySQL are running."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!lightboxImage) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") setLightboxImage(null);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxImage]);

  return (
    <main style={{ padding: 40 }}>
      <PageHelmet
        title="Gallery"
        description="Browse the MandalArt gallery — handmade mandalas and decorative pieces."
        path="/Gallery"
      />
      <h2>Gallery</h2>

      {error && <p style={{ color: "#b00020" }}>{error}</p>}
      {loading ? <p>Loading...</p> : null}

      {!loading && !error && images.length === 0 ? (
        <p>
          No images found. Put image files into <code>public/gallery_images</code> then call{" "}
          <code>/api/sync_gallery_images</code> once to import filenames into the database.
        </p>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        {images.map((img) => (
          <figure
            key={img.id}
            style={{
              margin: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="gallery-imageBtn"
              onClick={() => setLightboxImage(img)}
              aria-label={`Open image${img.title ? `: ${img.title}` : ""}`}
            >
              <img
                src={img.src}
                alt={img.title || "Gallery image"}
                style={{
                  width: "min(220px, 100%)",
                  aspectRatio: "1",
                  height: "auto",
                  borderRadius: "50%",
                  objectFit: "cover",
                  display: "block",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxSizing: "border-box",
                  background: "#fff",
                }}
                loading="lazy"
              />
            </button>
            {img.title ? (
              <figcaption style={{ padding: "10px 4px 0", fontSize: 14, textAlign: "center" }}>
                {img.title}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {lightboxImage ? (
        <div
          className="image-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged gallery image"
          onMouseDown={(e) => {
            // Csak akkor zárjuk, ha a háttérre kattintanak.
            if (e.currentTarget === e.target) setLightboxImage(null);
          }}
        >
          <div className="image-modal__content">
            <button
              type="button"
              className="image-modal__close"
              onClick={() => setLightboxImage(null)}
              aria-label="Close"
            >
              &times;
            </button>

            <img
              className="image-modal__img"
              src={lightboxImage.src}
              alt={lightboxImage.title || "Gallery image"}
            />

            {lightboxImage.title ? (
              <div className="image-modal__caption">{lightboxImage.title}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
