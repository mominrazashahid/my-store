"use client";

import { useEffect } from "react";

// Rendered inside the storefront. When shown in the theme editor's iframe, the
// editor posts { type:"sb-theme-css", css, fontsHref } on every edit; this swaps
// the storefront's OWN theme <style> content so changes appear instantly without
// a reload. Updating the same element guarantees the edit wins the cascade.
// Harmless on the public storefront (no messages ever arrive there).

export function PreviewBridge() {
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data;
      if (!data || data.type !== "sb-theme-css") return;

      if (typeof data.css === "string") {
        let style = document.getElementById("sb-theme-style") as HTMLStyleElement | null;
        if (!style) {
          style = document.createElement("style");
          style.id = "sb-theme-style";
          document.body.appendChild(style); // body = late in document, wins cascade
        }
        style.textContent = data.css;
      }

      if (typeof data.fontsHref === "string" && data.fontsHref) {
        let link = document.getElementById("sb-theme-fonts") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          link.id = "sb-theme-fonts";
          link.rel = "stylesheet";
          document.head.appendChild(link);
        }
        if (link.href !== data.fontsHref) link.href = data.fontsHref;
      }
    }
    window.addEventListener("message", onMessage);
    // tell the editor we're mounted and ready for the initial theme
    window.parent?.postMessage({ type: "sb-preview-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
