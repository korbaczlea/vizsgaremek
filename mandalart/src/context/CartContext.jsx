import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "mandalart_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === product.id);
      if (found) {
        return prev.map((p) => (p.id === product.id ? { ...p, qty: p.qty + 1 } : p));
      }
      return [...prev, { ...product, qty: 1 }];
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
