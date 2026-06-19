"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  image?: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  currency: string;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

// Cart is persisted per store so different stores don't share a cart.
export function CartProvider({
  subdomain,
  currency = "PKR",
  validProductIds,
  children,
}: {
  subdomain: string;
  currency?: string;
  // current product ids on the store; stale cart items are pruned against this
  validProductIds?: string[];
  children: ReactNode;
}) {
  const storageKey = `sb_cart_${subdomain}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // load once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupt cart */
    }
    setHydrated(true);
  }, [storageKey]);

  // drop cart items whose product no longer exists (e.g. deleted/re-seeded),
  // so checkout never fails on phantom items
  useEffect(() => {
    if (!hydrated || !validProductIds || validProductIds.length === 0) return;
    const valid = new Set(validProductIds);
    setItems((prev) => {
      const pruned = prev.filter((i) => valid.has(i.productId));
      return pruned.length === prev.length ? prev : pruned;
    });
  }, [hydrated, validProductIds]);

  // persist on change (after initial load)
  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, hydrated, storageKey]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    return {
      items,
      count,
      subtotal,
      currency,
      open,
      setOpen,
      add(item, qty = 1) {
        setItems((prev) => {
          const existing = prev.find((i) => i.productId === item.productId);
          if (existing) {
            return prev.map((i) =>
              i.productId === item.productId ? { ...i, qty: i.qty + qty } : i
            );
          }
          return [...prev, { ...item, qty }];
        });
        setOpen(true);
      },
      setQty(productId, qty) {
        setItems((prev) =>
          prev
            .map((i) => (i.productId === productId ? { ...i, qty } : i))
            .filter((i) => i.qty > 0)
        );
      },
      remove(productId) {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
      },
      clear() {
        setItems([]);
      },
    };
  }, [items, open, currency]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
