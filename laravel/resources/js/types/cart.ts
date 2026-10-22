// The marketplace-wide cart shared with every page (see App\Support\Cart::summary).

export type CartLine = {
  productId: number;
  title: string;
  slug: string;
  image?: string | null;
  price: number; // minor units of the store's currency
  qty: number;
  stock: number;
};

export type CartGroup = {
  store: { id: number; name: string; subdomain: string; currency: string };
  items: CartLine[];
  subtotal: number;
};

export type CartSummary = {
  count: number;
  groups: CartGroup[];
};
