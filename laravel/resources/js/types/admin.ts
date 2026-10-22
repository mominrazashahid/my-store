// Shapes of the props Laravel passes to admin pages
// (see app/Http/Controllers/Admin/* and AdminStoreResource).

export type AdminStore = {
  id: number;
  name: string;
  subdomain: string;
  storeType: string;
  themeId: string;
  plan: "free" | "paid";
  currency: string;
  showInMarketplace: boolean;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address: { line?: string; city?: string; mapUrl?: string };
  whatsapp?: string | null;
};

export type StoreOption = { id: number; name: string };

// every admin page receives these alongside its own props
export type AdminPageProps = {
  store: AdminStore;
  stores: StoreOption[];
};

export type AdminProduct = {
  id: number;
  title: string;
  description: string;
  price: number; // minor units
  compareAtPrice?: number | null;
  stock: number;
  status: "draft" | "active";
  images: string[];
};

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

// addresses are stored with snake_case keys (see PlaceOrderRequest::address)
export type OrderAddress = {
  first_name: string;
  last_name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export type AdminOrder = {
  id: number;
  customer: { name: string; email?: string | null; phone: string };
  shippingAddress: OrderAddress | null;
  // null when the same as the shipping address
  billingAddress: OrderAddress | null;
  notes?: string | null;
  items: { title: string; price: number; qty: number }[];
  subtotal: number;
  shippingCost: number;
  shippingMethod?: string | null;
  total: number;
  status: OrderStatus;
  nextStatuses: OrderStatus[];
  carrier?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
};

export type ShippingRate = {
  id: number;
  name: string;
  price: number; // minor units; 0 = free
  freeOver?: number | null; // free when the subtotal reaches this
  minDays?: number | null;
  maxDays?: number | null;
};

export type ShippingZone = {
  id: number;
  name: string;
  countries: string[];
  rates: ShippingRate[];
};

export type ProcessingDays = { min: number; max: number };
