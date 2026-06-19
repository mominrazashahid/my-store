import type { Theme } from "./types";
import { glowTheme } from "./glow";

// Theme registry. Add new themes (clothing, electronics, more cosmetics)
// here — the DB only stores a themeId that maps into this object.
const THEMES: Record<string, Theme> = {
  glow: glowTheme,
};

export function getTheme(themeId: string): Theme {
  return THEMES[themeId] || glowTheme;
}
