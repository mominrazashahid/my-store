// Shapes of the props Laravel passes to storefront pages
// (see app/Http/Resources/*Resource.php).

import type { ThemeData } from "@/lib/theme";

export type Section = {
  type: string;
  position: number;
  content: Record<string, unknown>;
};

export type StorePage = {
  slug: string;
  title: string;
  sections: Section[];
};

export type Product = {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  stock: number;
};

export type StoreInfo = {
  name: string;
  subdomain: string;
  storeType: string;
  themeId: string;
  settings: { currency?: string; whatsapp?: string };
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: { line?: string; city?: string; mapUrl?: string } | null;
  theme: ThemeData;
  // path the storefront is mounted at (e.g. "/store/glow-demo" in local dev);
  // theme links are resolved relative to this so they stay within the store
  basePath: string;
  // set only when the logged-in owner is viewing their own store
  manageUrl?: string | null;
};
