"use client";

import { useCart, type CartItem } from "./CartContext";

// Client button dropped into (server-rendered) theme product cards.
// Keeps the theme's own styling via the passed className.
export function AddToCartButton({
  product,
  soldOut,
  className,
}: {
  product: Omit<CartItem, "qty">;
  soldOut?: boolean;
  className?: string;
}) {
  const { add } = useCart();
  return (
    <button
      className={className}
      disabled={soldOut}
      onClick={() => add(product)}
    >
      {soldOut ? "Unavailable" : "Add to cart"}
    </button>
  );
}
