import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { router, usePage } from "@inertiajs/react";
import type { CartSummary } from "@/types/cart";

type CartContextValue = {
  cart: CartSummary;
  open: boolean;
  setOpen: (v: boolean) => void;
  // the error from the last cart action (e.g. sold out), if any
  error: string;
  add: (productId: number, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const EMPTY_CART: CartSummary = { count: 0, groups: [] };

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

// The cart itself lives on the server (one cart across every store) and comes
// with every page as the shared `cart` prop; this only adds the drawer's
// open state and the actions, which update the cart and refresh the page data.
export function CartProvider({ children }: { children: ReactNode }) {
  const cart = usePage<{ cart?: CartSummary }>().props.cart ?? EMPTY_CART;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const value = useMemo<CartContextValue>(() => {
    const options = (onSuccess?: () => void) => ({
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setError("");
        onSuccess?.();
      },
      onError: (errors: Record<string, string>) => setError(Object.values(errors)[0] ?? "Something went wrong"),
    });

    return {
      cart,
      open,
      setOpen,
      error,
      add(productId, qty = 1) {
        router.post("/cart/items", { productId, qty }, options(() => setOpen(true)));
      },
      setQty(productId, qty) {
        router.patch(`/cart/items/${productId}`, { qty }, options());
      },
      remove(productId) {
        router.delete(`/cart/items/${productId}`, options());
      },
    };
  }, [cart, open, error]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
