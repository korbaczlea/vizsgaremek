import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import API_BASE_URL from "../config/api";

export default function Order({ loggedIn = false }) {
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className="order-wrap">
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
            // Fallback local images by id/name if DB image_url is empty
            let fallbackImage = null;
            if (product.id === 1 || product.name?.includes("12")) {
              fallbackImage = "/images/little_mandala.png";
            } else if (product.id === 2 || product.name?.includes("22")) {
              fallbackImage = "/images/medium_mandala.png";
            } else if (product.id === 3 || product.name?.toLowerCase().includes("clock")) {
              fallbackImage = "/images/clock_mandala.png";
            }
            const imageSrc = product.image || fallbackImage;

            return (
              <div key={product.id} className="order-card">
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
                      onClick={() => handleAddToCart(product)}
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
    </main>
  );
}
