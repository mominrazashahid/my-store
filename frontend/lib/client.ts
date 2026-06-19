// Browser-side API client (used by client components like onboarding/admin).
// Talks to the backend directly; CORS on the backend allows the frontend origin.
"use client";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export type Session = {
  token: string;
  user: { _id: string; name: string; email: string };
};

const SESSION_KEY = "sb_session";

export function saveSession(s: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Thin fetch wrapper that throws the backend's error message on failure.
async function request<T>(
  path: string,
  { method = "GET", body, token }: { method?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export type AdminStore = {
  _id: string;
  name: string;
  subdomain: string;
  storeType: string;
  themeId: string;
  plan: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: { line?: string; city?: string; mapUrl?: string };
  settings?: { currency?: string; whatsapp?: string };
};

export type AdminProduct = {
  _id: string;
  title: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
  status: "draft" | "active";
};

export type AdminOrder = {
  _id: string;
  customer: { name: string; phone: string; address: string; city: string };
  items: { title: string; price: number; qty: number }[];
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
};

export type AdminPage = {
  slug: string;
  title: string;
  sections: { _id: string; type: string; position: number; content: Record<string, unknown> }[];
};

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    request<Session>("/api/auth/register", { method: "POST", body }),
  login: (body: { email: string; password: string }) =>
    request<Session>("/api/auth/login", { method: "POST", body }),
  createStore: (
    token: string,
    body: { name: string; subdomain: string; storeType: string; themeId: string }
  ) =>
    request<{ store: { _id: string; subdomain: string } }>("/api/stores", {
      method: "POST",
      body,
      token,
    }),

  myStores: (token: string) =>
    request<{ stores: AdminStore[] }>("/api/stores", { token }),
  updateStore: (token: string, storeId: string, body: Partial<AdminStore>) =>
    request<{ store: AdminStore }>(`/api/stores/${storeId}`, {
      method: "PATCH",
      body,
      token,
    }),

  products: (token: string, storeId: string) =>
    request<{ products: AdminProduct[] }>(`/api/stores/${storeId}/products`, { token }),
  createProduct: (token: string, storeId: string, body: Partial<AdminProduct>) =>
    request<{ product: AdminProduct }>(`/api/stores/${storeId}/products`, {
      method: "POST",
      body,
      token,
    }),
  updateProduct: (token: string, storeId: string, id: string, body: Partial<AdminProduct>) =>
    request<{ product: AdminProduct }>(`/api/stores/${storeId}/products/${id}`, {
      method: "PATCH",
      body,
      token,
    }),
  deleteProduct: (token: string, storeId: string, id: string) =>
    request<{ ok: boolean }>(`/api/stores/${storeId}/products/${id}`, {
      method: "DELETE",
      token,
    }),

  orders: (token: string, storeId: string) =>
    request<{ orders: AdminOrder[] }>(`/api/stores/${storeId}/orders`, { token }),
  updateOrderStatus: (token: string, storeId: string, orderId: string, status: string) =>
    request<{ order: AdminOrder }>(`/api/stores/${storeId}/orders/${orderId}`, {
      method: "PATCH",
      body: { status },
      token,
    }),

  getPage: (token: string, storeId: string, slug = "home") =>
    request<{ page: AdminPage }>(`/api/stores/${storeId}/pages/${slug}`, { token }),
  updatePage: (token: string, storeId: string, slug: string, sections: AdminPage["sections"]) =>
    request<{ page: AdminPage }>(`/api/stores/${storeId}/pages/${slug}`, {
      method: "PATCH",
      body: { sections },
      token,
    }),

  // Guest storefront checkout — tenant via x-store header, no auth.
  async placeOrder(
    subdomain: string,
    body: {
      customer: { name: string; phone: string; address: string; city: string };
      items: { productId: string; qty: number }[];
    }
  ): Promise<{ _id: string; total: number; status: string }> {
    const res = await fetch(`${BASE}/api/storefront/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-store": subdomain },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not place order");
    return data.order;
  },

  // multipart upload — returns the public image URL
  async uploadImage(token: string, storeId: string, file: File): Promise<string> {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`${BASE}/api/stores/${storeId}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  },
};
