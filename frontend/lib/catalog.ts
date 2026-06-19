// Store types and the themes available for each (frontend-only config).
// Mirrors STORE_TYPES in the backend. As we build more themes we add them here.

export type StoreTypeOption = {
  id: "cosmetics" | "clothing" | "electronics";
  label: string;
  emoji: string;
  blurb: string;
};

export const STORE_TYPE_OPTIONS: StoreTypeOption[] = [
  { id: "cosmetics", label: "Cosmetics", emoji: "💄", blurb: "Makeup, skincare, beauty" },
  { id: "clothing", label: "Clothing", emoji: "👗", blurb: "Apparel & fashion brands" },
  { id: "electronics", label: "Electronics", emoji: "📱", blurb: "Gadgets & accessories" },
];

export type ThemeOption = { id: string; name: string; preview: string };

// Themes implemented in /themes. Only "glow" exists today, so it's offered for
// every store type for now; new per-type themes get added here as we build them.
export const THEMES_BY_TYPE: Record<string, ThemeOption[]> = {
  cosmetics: [{ id: "glow", name: "Glow", preview: "Soft pink, modern beauty look" }],
  clothing: [{ id: "glow", name: "Glow", preview: "Clean storefront (more themes soon)" }],
  electronics: [{ id: "glow", name: "Glow", preview: "Clean storefront (more themes soon)" }],
};

// "Awesome Lipstick" -> "awesome-lipstick"
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
