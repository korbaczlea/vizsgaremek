import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "mandalart_cart_v1";

/** Merge saved lines by product id (handles older carts that stored one line per add). */
function mergeCartByProductId(raw) {
  if (!Array.isArray(raw)) return [];
  const byId = new Map();
  for (const p of raw) {
    const id = p?.id;
    if (id == null) continue;
    const qty = Math.max(1, Number(p.qty) || 1);
    const { lineId: _drop, ...rest } = p;
    const prev = byId.get(id);
    if (!prev) {
      byId.set(id, { ...rest, qty });
    } else {
      byId.set(id, {
        ...prev,
        ...rest,
        qty: prev.qty + qty,
        image: rest.image || prev.image,
        description: rest.description || prev.description,
        name: rest.name || prev.name,
        price: rest.price ?? prev.price,
        currency: rest.currency || prev.currency,
      });
    }
  }
  return Array.from(byId.values());
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? mergeCartByProductId(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product) => {
    const baseQty = Math.max(1, Number(product.qty) || 1);
    setItems((prev) => {
      const found = prev.find((p) => p.id === product.id);
      if (found) {
        return prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                qty: p.qty + baseQty,
                image: product.image ?? p.image,
                description: product.description ?? p.description,
                name: product.name ?? p.name,
                price: product.price ?? p.price,
                currency: product.currency ?? p.currency,
              }
            : p
        );
      }
      return [...prev, { ...product, qty: baseQty }];
    });
  };

  const removeFromCart = (id) => setItems((prev) => prev.filter((p) => p.id !== id));

  const changeQty = (id, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: q } : p)));
  };

  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const count = items.reduce((s, p) => s + (p.qty || 0), 0);
    const total = items.reduce((s, p) => s + (p.price || 0) * (p.qty || 0), 0);
    return { count, total };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, changeQty, clearCart, totals }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
