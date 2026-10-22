import { router } from "@inertiajs/react";

// Remembers the page the shopper was on before the current one (per tab), so
// "Back" buttons can go where they actually came from instead of a fixed page.

const CURRENT = "sb_nav_current";
const PREVIOUS = "sb_nav_previous";

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable — back buttons fall back to their default target */
  }
}

// Call once at startup. Inertia fires "navigate" for the first page and every
// visit after it; full page loads restart the app, and sessionStorage survives.
export function trackNavigation() {
  router.on("navigate", (event) => {
    const url = event.detail.page.url;
    const current = read(CURRENT);
    if (current && current !== url) write(PREVIOUS, current);
    write(CURRENT, url);
  });
}

// The previous page's URL (path + query), or null on the first page of the tab.
export function previousUrl(): string | null {
  return read(PREVIOUS);
}
