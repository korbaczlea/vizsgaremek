import { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/CartContext";
import API_BASE_URL from "../config/api";
import PageHelmet from "../components/PageHelmet";

function productImageSrc(product) {
  if (!product) return "";
  let fallbackImage = null;
  if (product.id === 1 || product.name?.includes("12")) {
    fallbackImage = "/images/little_mandala.png";
  } else if (product.id === 2 || product.name?.includes("22")) {
    fallbackImage = "/images/medium_mandala.png";
  } else if (product.id === 3 || product.name?.toLowerCase().includes("clock")) {
    fallbackImage = "/images/clock_mandala.png";
  }
  return product.image || fallbackImage || "";
}

export default function Order({ loggedIn = false }) {
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxProduct, setLightboxProduct] = useState(null);
  const [zoomImageSrc, setZoomImageSrc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

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
    addToCart({ ...product, image: productImageSrc(product) || product.image });
  };

  const categories = useMemo(() => {
    const set = new Set();
    for (const product of products) {
      const category = String(product.category || "").trim();
      if (category) set.add(category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    return products.filter((product) => {
      const productName = String(product.name || "").toLowerCase();
      const productDescription = String(product.description || "").toLowerCase();
      const category = String(product.category || "").trim();
      const price = Number(product.price || 0);

      const searchPass =
        normalizedSearch === "" ||
        productName.includes(normalizedSearch) ||
        productDescription.includes(normalizedSearch) ||
        category.toLowerCase().includes(normalizedSearch);

      const categoryPass =
        selectedCategory === "all" || category === selectedCategory;

      const minPass = min === null || (!Number.isNaN(min) && price >= min);
      const maxPass = max === null || (!Number.isNaN(max) && price <= max);

      return searchPass && categoryPass && minPass && maxPass;
    });
  }, [products, searchQuery, selectedCategory, minPrice, maxPrice]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    minPrice !== "" ||
    maxPrice !== "";

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

      <section className="order-filters" aria-label="Product filters">
        <input
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          step="1"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <input
          type="number"
          min="0"
          step="1"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        {hasActiveFilters ? (
          <button
            type="button"
            className="order-filters__clearBtn"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setMinPrice("");
              setMaxPrice("");
            }}
          >
            Clear filters
          </button>
        ) : null}
      </section>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="order-grid">
          {filteredProducts.map((product) => {
            const imageSrc = productImageSrc(product);
            const stock =
              product.stock_quantity != null ? Number(product.stock_quantity) : null;
            const outOfStock = typeof stock === "number" && stock <= 0;
            const openProductCard = () => {
              setLightboxProduct({
                src: imageSrc,
                description: product.description,
                price: product.price,
                currency: product.currency,
                name: product.name,
              });
            };

            return (
              <div
                key={product.id}
                className="order-card order-card--clickable"
                role="button"
                tabIndex={0}
                aria-label={`Open product card: ${product.name}`}
                onClick={openProductCard}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProductCard();
                  }
                }}
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
                  {typeof stock === "number" ? (
                    <p
                      className={`order-card__stock${outOfStock ? " order-card__stock--out" : ""}`}
                    >
                      {outOfStock ? "Out of stock" : `In stock: ${stock}`}
                    </p>
                  ) : null}
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
                        if (loggedIn && !outOfStock) handleAddToCart(product);
                      }}
                      disabled={!loggedIn || outOfStock}
                    >
                      {!loggedIn
                        ? "Sign in required"
                        : outOfStock
                          ? "Out of stock"
                          : "Add to cart"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && !error && filteredProducts.length === 0 ? (
        <p className="order-subtitle">No products match the selected filters.</p>
      ) : null}

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
