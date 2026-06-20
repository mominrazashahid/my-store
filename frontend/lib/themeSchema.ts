// Data-driven description of what the theme editor can edit. The editor renders
// its controls from this, so adding a new editable property is a one-line change
// here (+ consuming the variable in the theme CSS).
import type { Device } from "./theme";

export type ControlType = "color" | "font" | "number" | "toggle";

export type Control = {
  // dot-path into the theme object; "$" is replaced by the active device
  path: string;
  label: string;
  type: ControlType;
  responsive?: boolean; // edits the device-scoped value
  unit?: string;
  min?: number;
  max?: number;
};

export type Group = { key: string; label: string; controls: Control[] };

export const THEME_GROUPS: Group[] = [
  {
    key: "global",
    label: "Global",
    controls: [
      { path: "tokens.colors.primary", label: "Primary", type: "color" },
      { path: "tokens.colors.accent", label: "Accent (dark)", type: "color" },
      { path: "tokens.colors.bg", label: "Page background", type: "color" },
      { path: "tokens.colors.surface", label: "Card surface", type: "color" },
      { path: "tokens.colors.text", label: "Text", type: "color" },
      { path: "tokens.colors.border", label: "Borders", type: "color" },
      { path: "tokens.fonts.heading", label: "Heading font", type: "font" },
      { path: "tokens.fonts.body", label: "Body font", type: "font" },
      { path: "tokens.radius", label: "Corner radius", type: "number", unit: "px", min: 0, max: 40 },
    ],
  },
  {
    key: "navbar",
    label: "Navbar",
    controls: [
      { path: "sections.navbar.shared.bg", label: "Background", type: "color" },
      { path: "sections.navbar.shared.linkColor", label: "Link color", type: "color" },
      { path: "sections.navbar.responsive.$.padY", label: "Vertical padding", type: "number", unit: "px", responsive: true, min: 0, max: 60 },
      { path: "sections.navbar.responsive.$.padX", label: "Side padding", type: "number", unit: "px", responsive: true, min: 0, max: 80 },
      { path: "sections.navbar.responsive.$.visible", label: "Show navbar", type: "toggle", responsive: true },
    ],
  },
  {
    key: "hero",
    label: "Hero",
    controls: [
      { path: "sections.hero.shared.textColor", label: "Text color", type: "color" },
      { path: "sections.hero.shared.overlay", label: "Image overlay", type: "number", min: 0, max: 1 },
      { path: "sections.hero.responsive.$.headingSize", label: "Heading size", type: "number", unit: "px", responsive: true, min: 18, max: 90 },
      { path: "sections.hero.responsive.$.minHeight", label: "Height", type: "number", unit: "px", responsive: true, min: 200, max: 800 },
      { path: "sections.hero.responsive.$.padY", label: "Vertical padding", type: "number", unit: "px", responsive: true, min: 0, max: 160 },
      { path: "sections.hero.responsive.$.visible", label: "Show hero", type: "toggle", responsive: true },
    ],
  },
  {
    key: "productCard",
    label: "Product cards",
    controls: [
      { path: "sections.productCard.shared.bg", label: "Card background", type: "color" },
      { path: "sections.productCard.shared.borderColor", label: "Card border", type: "color" },
      { path: "sections.productCard.shared.radius", label: "Card radius", type: "number", unit: "px", min: 0, max: 40 },
      { path: "sections.productCard.responsive.$.columns", label: "Columns", type: "number", responsive: true, min: 1, max: 6 },
      { path: "sections.productCard.responsive.$.gap", label: "Gap", type: "number", unit: "px", responsive: true, min: 0, max: 60 },
      { path: "sections.productCard.responsive.$.visible", label: "Show products", type: "toggle", responsive: true },
    ],
  },
  {
    key: "footer",
    label: "Footer",
    controls: [
      { path: "sections.footer.shared.bg", label: "Background", type: "color" },
      { path: "sections.footer.shared.textColor", label: "Text color", type: "color" },
      { path: "sections.footer.responsive.$.padY", label: "Vertical padding", type: "number", unit: "px", responsive: true, min: 0, max: 100 },
      { path: "sections.footer.responsive.$.visible", label: "Show footer", type: "toggle", responsive: true },
    ],
  },
];

// ---- path helpers (operate on a plain theme object) ----

type AnyObj = Record<string, unknown>;

function resolvePath(path: string, device: Device) {
  return path.replace("$", device).split(".");
}

export function getValue(theme: AnyObj, ctrl: Control, device: Device): unknown {
  const parts = resolvePath(ctrl.path, device);
  let cur: unknown = theme;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = (cur as AnyObj)[p];
  }
  // responsive fallback: if this device has no value, show the desktop value
  if (cur === undefined && ctrl.responsive && device !== "desktop") {
    return getValue(theme, ctrl, "desktop");
  }
  return cur;
}

// Immutably set a value, creating intermediate objects as needed.
export function setValue(
  theme: AnyObj,
  ctrl: Control,
  device: Device,
  value: unknown
): AnyObj {
  const parts = resolvePath(ctrl.path, device);
  const clone = structuredClone(theme);
  let cur: AnyObj = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k] as AnyObj;
  }
  cur[parts[parts.length - 1]] = value;
  return clone;
}
