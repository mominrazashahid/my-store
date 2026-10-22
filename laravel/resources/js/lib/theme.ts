// Theme data shape + CSS generation. Shared by the storefront render, the
// editor's live preview, and the in-iframe PreviewBridge so they always agree.

export type Device = "desktop" | "tablet" | "mobile";
export const DEVICES: Device[] = ["desktop", "tablet", "mobile"];

// Breakpoints: desktop is the base (no media query); tablet/mobile are max-width.
export const BREAKPOINTS: Record<Exclude<Device, "desktop">, number> = {
  tablet: 1024,
  mobile: 640,
};

export const DEVICE_PREVIEW_WIDTH: Record<Device, number> = {
  desktop: 1280,
  tablet: 820,
  mobile: 390,
};

type Responsive<T> = { desktop: T; tablet?: Partial<T>; mobile?: Partial<T> };

export type ThemeData = {
  tokens: {
    colors: {
      primary: string;
      accent: string;
      bg: string;
      surface: string;
      text: string;
      muted: string;
      border: string;
    };
    fonts: { heading: string; body: string };
    radius: number;
  };
  sections: {
    navbar: {
      shared: { bg: string; linkColor: string };
      responsive: Responsive<{ padY: number; padX: number; visible: boolean }>;
    };
    hero: {
      shared: { textColor: string; overlay: number };
      responsive: Responsive<{
        headingSize: number;
        minHeight: number;
        padY: number;
        visible: boolean;
      }>;
    };
    productCard: {
      shared: { bg: string; borderColor: string; radius: number };
      responsive: Responsive<{ columns: number; gap: number; visible: boolean }>;
    };
    footer: {
      shared: { bg: string; textColor: string };
      responsive: Responsive<{ padY: number; visible: boolean }>;
    };
  };
};

// ---- variable mapping ----

// Globals + per-section "shared" props (same on every device).
function sharedVars(t: ThemeData): Record<string, string> {
  const c = t.tokens.colors;
  const s = t.sections;
  return {
    "--c-primary": c.primary,
    "--c-accent": c.accent,
    "--c-bg": c.bg,
    "--c-surface": c.surface,
    "--c-text": c.text,
    "--c-muted": c.muted,
    "--c-border": c.border,
    "--font-heading": `"${t.tokens.fonts.heading}", system-ui, sans-serif`,
    "--font-body": `"${t.tokens.fonts.body}", system-ui, sans-serif`,
    "--radius": `${t.tokens.radius}px`,
    "--nav-bg": s.navbar.shared.bg,
    "--nav-link": s.navbar.shared.linkColor,
    "--hero-text": s.hero.shared.textColor,
    "--hero-overlay": String(s.hero.shared.overlay),
    "--card-bg": s.productCard.shared.bg,
    "--card-border": s.productCard.shared.borderColor,
    "--card-radius": `${s.productCard.shared.radius}px`,
    "--footer-bg": s.footer.shared.bg,
    "--footer-text": s.footer.shared.textColor,
  };
}

// Responsive ("key") props for one device. Returns only the vars defined on
// that device so tablet/mobile only emit their overrides.
function deviceVars(t: ThemeData, device: Device): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (k: string, v: number | undefined, unit = "") => {
    if (v !== undefined && v !== null) out[k] = `${v}${unit}`;
  };
  const vis = (k: string, v: boolean | undefined) => {
    if (v !== undefined) out[k] = v ? "flex" : "none";
  };

  const nav = t.sections.navbar.responsive[device];
  if (nav) {
    put("--nav-pad-y", nav.padY, "px");
    put("--nav-pad-x", nav.padX, "px");
    vis("--nav-display", nav.visible);
  }
  const hero = t.sections.hero.responsive[device];
  if (hero) {
    put("--hero-h-size", hero.headingSize, "px");
    put("--hero-min-h", hero.minHeight, "px");
    put("--hero-pad-y", hero.padY, "px");
    if (hero.visible !== undefined) out["--hero-display"] = hero.visible ? "grid" : "none";
  }
  const card = t.sections.productCard.responsive[device];
  if (card) {
    put("--grid-cols", card.columns);
    put("--grid-gap", card.gap, "px");
    if (card.visible !== undefined)
      out["--products-display"] = card.visible ? "block" : "none";
  }
  const footer = t.sections.footer.responsive[device];
  if (footer) {
    put("--footer-pad-y", footer.padY, "px");
    if (footer.visible !== undefined)
      out["--footer-display"] = footer.visible ? "block" : "none";
  }
  return out;
}

function block(selector: string, vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  return `${selector}{${body}}`;
}

/**
 * Generate the full CSS (variables + responsive media queries) for a theme,
 * scoped to `selector` (default the storefront root attribute).
 */
export function themeToCss(theme: ThemeData, selector = "[data-theme-root]"): string {
  if (!theme?.tokens || !theme?.sections) return "";
  const base = { ...sharedVars(theme), ...deviceVars(theme, "desktop") };
  let css = block(selector, base);
  const tablet = deviceVars(theme, "tablet");
  if (Object.keys(tablet).length)
    css += `@media(max-width:${BREAKPOINTS.tablet}px){${block(selector, tablet)}}`;
  const mobile = deviceVars(theme, "mobile");
  if (Object.keys(mobile).length)
    css += `@media(max-width:${BREAKPOINTS.mobile}px){${block(selector, mobile)}}`;
  return css;
}

// Google Fonts the editor offers; loaded via a stylesheet link.
export const FONT_OPTIONS = [
  "Poppins",
  "Inter",
  "Montserrat",
  "Playfair Display",
  "Lora",
  "Roboto",
  "Nunito",
  "Segoe UI",
];

export function googleFontsHref(...families: string[]): string {
  const unique = [...new Set(families)].filter((f) => f !== "Segoe UI");
  if (!unique.length) return "";
  const params = unique
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
