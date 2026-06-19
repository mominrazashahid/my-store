// Server-side API client for the storefront.
//
// In production each store is reached on its own subdomain, so the backend
// resolves the tenant from the Host header. Locally we have no real
// subdomains, so we pass the store via the `x-store` header instead.

const API_BASE = process.env.API_BASE || "http://localhost:4000";

export type Section = {
  _id: string;
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
  _id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
};

export type StoreInfo = {
  name: string;
  storeType: string;
  themeId: string;
  settings: { currency: string; whatsapp?: string };
  contactPhone?: string;
  contactEmail?: string;
  address?: { line?: string; city?: string; mapUrl?: string };
};

async function storefrontGet<T>(subdomain: string, path: string): Promise<T | null> {
  const res = await fetch(`${API_BASE}/api/storefront${path}`, {
    headers: { "x-store": subdomain },
    // storefront data changes when the owner edits — revalidate often
    next: { revalidate: 10 },
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export function getStore(subdomain: string) {
  return storefrontGet<StoreInfo>(subdomain, "/");
}

export async function getPage(subdomain: string, slug = "home") {
  const data = await storefrontGet<{ page: StorePage }>(subdomain, `/pages/${slug}`);
  return data?.page ?? null;
}

export async function getProducts(subdomain: string) {
  const data = await storefrontGet<{ products: Product[] }>(subdomain, "/products");
  return data?.products ?? [];
}
