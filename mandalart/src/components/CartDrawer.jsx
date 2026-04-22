import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import API_BASE_URL from "../config/api";

export default function CartDrawer({ open, onClose }) {
  const { items, removeFromCart, changeQty, clearCart, totals } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    country: "",
    county: "",
    city: "",
    postalCode: "",
    street: "",
    houseNumber: "",
    phone: "",
    payment: "Cash on delivery",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const totalFormatted = useMemo(() => totals.total.toFixed(2), [totals.total]);

  if (!open) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    if (items.length === 0) return "Your cart is empty.";
    const required = ["fullName", "country", "county", "city", "postalCode", "street", "houseNumber", "phone"];
    for (const k of required) {
      if (!form[k]?.trim()) return "Please fill in all required fields.";
    }
    if (!privacyConsent) return "Please accept the Privacy Policy before placing your order.";
    return "";
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setSuccess("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");

    const payload = {
      customer: form,
      items,
      total: totals.total,
      createdAt: new Date().toISOString(),
    };

    try {
      const token = localStorage.getItem("mandalart_token");
      const res = await fetch(`${API_BASE_URL}/api/place_order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

      if (!res.ok || data.status !== "success") {
        if (data.status === "insufficient_stock") {
          setError(
            (typeof data.message === "string" && data.message.trim()) ||
              "Not enough stock for an item in your cart. Update quantities and try again."
          );
          return;
        }
        setError("Failed to save your order. Please try again.");
        return;
      }

      setSuccess("Order placed successfully! We will contact you soon.");
      clearCart();
      setForm((p) => ({ ...p, payment: "Cash on delivery" }));
      setPrivacyConsent(false);
    } catch (err) {
      console.error(err);
      setError(
        "Cannot connect to backend. Please check that XAMPP Apache and MySQL are running."
      );
    }
  };

  const closeAll = () => {
    setError("");
    setSuccess("");
    setShowCheckout(false);
    onClose();
  };

  return (
    <div className="cart-overlay" onClick={closeAll}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer__header">
          <h3>Cart</h3>
          <button className="cart-x" onClick={closeAll} aria-label="Close cart" type="button">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <p className="cart-empty">Your cart is empty.</p>
        ) : (
          <div className="cart-list">
            {items.map((p) => (
              <div className="cart-line" key={p.id}>
                <div className="cart-line__thumb">
                  {p.image ? (
                    <img src={p.image} alt="" />
                  ) : (
                    <div className="cart-line__thumbPlaceholder" aria-hidden="true" />
                  )}
                </div>

                <div className="cart-line__main">
                  <div className="cart-line__title">{p.name}</div>
                  {p.description ? <p className="cart-line__desc">{p.description}</p> : null}

                  <div className="cart-line__meta">
                    <label>Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={p.qty}
                      onChange={(e) => changeQty(p.id, e.target.value)}
                    />
                    <button className="cart-remove" onClick={() => removeFromCart(p.id)} type="button">
                      Remove
                    </button>
                  </div>
                </div>

                <div className="cart-line__price">
                  {(p.price * p.qty).toLocaleString()} {p.currency || "HUF"}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cart-total">
          <span>Total</span>
          <strong>{totals.total.toLocaleString()} HUF</strong>
        </div>

        <div className="cart-actions">
          <button
            className="cart-orderbtn"
            type="button"
            disabled={items.length === 0}
            onClick={() => {
              setError("");
              setSuccess("");
              setShowCheckout((v) => !v);
            }}
          >
            Order
          </button>
        </div>

        {showCheckout && (
          <div className="cart-checkout">
            <h4>Shipping details</h4>

            {error ? <div className="cart-error">{error}</div> : null}
            {success ? <div className="cart-success">{success}</div> : null}

            <form onSubmit={placeOrder} className="cart-form">
              <div className="cart-field">
                <label>Full name *</label>
                <input name="fullName" value={form.fullName} onChange={onChange} />
              </div>

              <div className="cart-row">
                <div className="cart-field">
                  <label>Country *</label>
                  <input name="country" value={form.country} onChange={onChange} />
                </div>
                <div className="cart-field">
                  <label>County/State *</label>
                  <input name="county" value={form.county} onChange={onChange} />
                </div>
              </div>

              <div className="cart-row">
                <div className="cart-field">
                  <label>City *</label>
                  <input name="city" value={form.city} onChange={onChange} />
                </div>
                <div className="cart-field">
                  <label>Postal code *</label>
                  <input name="postalCode" value={form.postalCode} onChange={onChange} />
                </div>
              </div>

              <div className="cart-row">
                <div className="cart-field">
                  <label>Street *</label>
                  <input name="street" value={form.street} onChange={onChange} />
                </div>
                <div className="cart-field">
                  <label>House number *</label>
                  <input name="houseNumber" value={form.houseNumber} onChange={onChange} />
                </div>
              </div>

              <div className="cart-field">
                <label>Phone number *</label>
                <input name="phone" value={form.phone} onChange={onChange} />
              </div>

              <div className="cart-field">
                <label>Payment method</label>
                <select name="payment" value={form.payment} onChange={onChange} disabled>
                  <option>Cash on delivery</option>
                </select>
                <p className="cart-note">Only cash on delivery is available at the moment.</p>
              </div>

              <label className="consent-row">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                />
                <span>
                  I agree to the processing of my personal data according to the{" "}
                  <Link to="/Privacy">Privacy Policy</Link>.
                </span>
              </label>

              <button className="cart-placebtn" type="submit">
                Place order
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
