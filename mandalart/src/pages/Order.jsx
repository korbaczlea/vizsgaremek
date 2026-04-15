import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import API_BASE_URL from "../config/api";
import PageHelmet from "../components/PageHelmet";

export default function Order({ loggedIn = false }) {
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxProduct, setLightboxProduct] = useState(null);
  const [zoomImageSrc, setZoomImageSrc] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/api/get_all_products`);
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

        if (!res.ok || data.status !== "success" || !Array.isArray(data.products)) {
          if (!cancelled) {
            setError("Failed to load products. Please try again later.");
          }
          return;
        }

        if (!cancelled) {
          setProducts(data.products);
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

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  useEffect(() => {
    if (!lightboxProduct) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (zoomImageSrc) setZoomImageSrc("");
        else setLightboxProduct(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxProduct, zoomImageSrc]);

  return (
    <main className="order-wrap">
      <PageHelmet
        title="Order"
        description="Order handmade MandalArt mandalas — browse products and checkout with your account."
        path="/Order"
      />
      <h2 className="order-title">Order products</h2>
      <p className="order-subtitle">
        Browse available handmade mandalas and add them to your cart.
      </p>

      {!loggedIn && (
        <p className="order-login-note">
          Please{" "}
          <strong>sign in</strong> to see prices and place an order.
        </p>
      )}

      {error && <p className="order-error">{error}</p>}

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="order-grid">
          {products.map((product) => {
            let fallbackImage = null;
            if (product.id === 1 || product.name?.includes("12")) {
              fallbackImage = "/images/little_mandala.png";
            } else if (product.id === 2 || product.name?.includes("22")) {
              fallbackImage = "/images/medium_mandala.png";
            } else if (product.id === 3 || product.name?.toLowerCase().includes("clock")) {
              fallbackImage = "/images/clock_mandala.png";
            }
            const imageSrc = product.image || fallbackImage;

            const handleCardClick = () => {
              setLightboxProduct({
                src: imageSrc,
                description: product.description,
                price: product.price,
                currency: product.currency,
                name: product.name,
              });
            };

            const handleCardKeyDown = (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick();
              }
            };

            return (
              <div
                key={product.id}
                className="order-card order-card--clickable"
                role="button"
                tabIndex={0}
                aria-label={`Open product card: ${product.name}`}
                onClick={handleCardClick}
                onKeyDown={handleCardKeyDown}
              >
                <div className="order-card__image">
                  {imageSrc ? (
                    <img src={imageSrc} alt={product.name} />
                  ) : (
                    <div className="order-card__imagePlaceholder" />
                  )}
                </div>

                <div className="order-card__content">
                  <h3>{product.name}</h3>
                  <p className="order-card__description">{product.description}</p>

                  <div className="order-card__footer">
                    {loggedIn ? (
                      <span className="order-price">
                        {product.price.toLocaleString()} {product.currency}
                      </span>
                    ) : (
                      <span className="order-price order-price--hidden">
                        Sign in to see price
                      </span>
                    )}

                    <button
                      className="order-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (loggedIn) handleAddToCart(product);
                      }}
                      disabled={!loggedIn}
                    >
                      {loggedIn ? "Add to cart" : "Sign in required"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lightboxProduct ? (
        <div
          className="image-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged product image"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setLightboxProduct(null);
          }}
        >
          <div className="image-modal__content">
            <button
              type="button"
              className="image-modal__close"
              onClick={() => setLightboxProduct(null)}
              aria-label="Close"
            >
              &times;
            </button>

            <div className="order-card" style={{ width: "100%", maxWidth: 620, margin: "0 auto" }}>
              <div className="order-card__image">
                {lightboxProduct.src ? (
                  <button
                    type="button"
                    className="gallery-imageBtn"
                    onClick={() => setZoomImageSrc(lightboxProduct.src)}
                    aria-label={`Enlarge image: ${lightboxProduct.name || "product"}`}
                  >
                    <img
                      className="image-modal__img"
                      src={lightboxProduct.src}
                      alt={lightboxProduct.name || "Product image"}
                    />
                  </button>
                ) : (
                  <div className="order-card__imagePlaceholder" />
                )}
              </div>

              <div className="order-card__content">
                <h3>{lightboxProduct.name}</h3>
                <p className="order-card__description">{lightboxProduct.description}</p>
                <div className="order-card__footer">
                  {loggedIn ? (
                    <span className="order-price">
                      {Number(lightboxProduct.price || 0).toLocaleString()}{" "}
                      {lightboxProduct.currency || "HUF"}
                    </span>
                  ) : (
                    <span className="order-price order-price--hidden">Sign in to see price</span>
                  )}

                  <button
                    className="order-btn"
                    disabled={!loggedIn}
                    onClick={() => {
                      if (!loggedIn) return;
                      handleAddToCart({
                        name: lightboxProduct.name,
                        description: lightboxProduct.description,
                        image: lightboxProduct.src,
                        price: lightboxProduct.price,
                        currency: lightboxProduct.currency,
                      });
                    }}
                  >
                    {loggedIn ? "Add to cart" : "Sign in required"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {zoomImageSrc ? (
        <div
          className="image-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged product image"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setZoomImageSrc("");
          }}
        >
          <div className="image-modal__content">
            <button
              type="button"
              className="image-modal__close"
              onClick={() => setZoomImageSrc("")}
              aria-label="Close"
            >
              &times;
            </button>
            <img className="image-modal__img" src={zoomImageSrc} alt="Enlarged product image" />
          </div>
        </div>
      ) : null}
    </main>
  );
}
