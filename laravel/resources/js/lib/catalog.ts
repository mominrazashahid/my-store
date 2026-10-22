// Store types (frontend-only config). Mirrors App\Enums\StoreType on the server.

import { Shirt, Smartphone, Sparkles, type LucideIcon } from "lucide-react";

export type StoreTypeOption = {
  id: "cosmetics" | "clothing" | "electronics";
  label: string;
  icon: LucideIcon;
  blurb: string;
};

export const STORE_TYPE_OPTIONS: StoreTypeOption[] = [
  { id: "cosmetics", label: "Cosmetics", icon: Sparkles, blurb: "Makeup, skincare, beauty" },
  { id: "clothing", label: "Clothing", icon: Shirt, blurb: "Apparel & fashion brands" },
  { id: "electronics", label: "Electronics", icon: Smartphone, blurb: "Gadgets & accessories" },
];

// Icon for a store type, e.g. for image placeholders.
export function storeTypeIcon(type: string): LucideIcon {
  return STORE_TYPE_OPTIONS.find((t) => t.id === type)?.icon ?? Sparkles;
}

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

// Currencies a store can sell in. Mirrors App\Enums\Currency on the server.
export const CURRENCY_OPTIONS: { code: string; label: string }[] = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "CAD", label: "Canadian Dollar (CA$)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "NZD", label: "New Zealand Dollar (NZ$)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "SAR", label: "Saudi Riyal (SAR)" },
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "PKR", label: "Pakistani Rupee (Rs)" },
  { code: "BDT", label: "Bangladeshi Taka (৳)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
];

const EURO_REGIONS = ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"];

const REGION_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", GB: "GBP", AU: "AUD", NZ: "NZD", AE: "AED", SA: "SAR",
  IN: "INR", PK: "PKR", BD: "BDT", JP: "JPY",
  ...Object.fromEntries(EURO_REGIONS.map((r) => [r, "EUR"])),
};

// Best guess at the owner's currency from the browser locale ("en-PK" -> PKR); USD otherwise.
export function guessCurrency(): string {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    return (region && REGION_CURRENCY[region]) || "USD";
  } catch {
    return "USD";
  }
}
