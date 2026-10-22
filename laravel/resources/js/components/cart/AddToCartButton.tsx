import { useCart } from "./CartContext";

// Button dropped into theme product cards.
// Keeps the theme's own styling via the passed className.
export function AddToCartButton({
  productId,
  soldOut,
  className,
}: {
  productId: number;
  soldOut?: boolean;
  className?: string;
}) {
  const { add } = useCart();
  return (
    <button className={className} disabled={soldOut} onClick={() => add(productId)}>
      {soldOut ? "Unavailable" : "Add to cart"}
    </button>
  );
}
