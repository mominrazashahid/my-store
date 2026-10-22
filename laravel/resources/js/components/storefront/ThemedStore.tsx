import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { getTheme } from "@/themes";
import { themeToCss, googleFontsHref } from "@/lib/theme";
import { PreviewBridge } from "@/components/theme/PreviewBridge";
import type { StoreInfo } from "@/types/storefront";

// Thin bar shown only to the store's owner, linking back to their admin.
// Styled inline so it looks the same whatever theme the store uses.
function OwnerBar({ manageUrl }: { manageUrl: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
        padding: "8px 16px",
        background: "#2b2118",
        color: "#f3e7da",
        fontSize: 13,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <span>You&apos;re viewing your store</span>
      <a
        href={manageUrl}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#a47148",
          color: "#fff",
          padding: "5px 12px",
          borderRadius: 999,
          fontWeight: 700,
        }}
      >
        Manage store <ArrowRight size={14} />
      </a>
    </div>
  );
}

// Injects the store's published design tokens as scoped CSS variables and
// wraps children in the theme root. Shared by every storefront page.
export function ThemedStore({ store, children }: { store: StoreInfo; children: ReactNode }) {
  const theme = getTheme(store.themeId);

  // Guard against a missing theme so the storefront can never crash on render.
  const css = store.theme ? themeToCss(store.theme) : "";
  const fontsHref = store.theme?.tokens
    ? googleFontsHref(store.theme.tokens.fonts.heading, store.theme.tokens.fonts.body)
    : "";

  return (
    <>
      {fontsHref ? <link id="sb-theme-fonts" rel="stylesheet" href={fontsHref} /> : null}
      <style id="sb-theme-style" dangerouslySetInnerHTML={{ __html: css }} />
      <PreviewBridge />
      {store.manageUrl ? <OwnerBar manageUrl={store.manageUrl} /> : null}
      <div className={theme.wrapperClassName} data-theme-root>
        {children}
      </div>
    </>
  );
}
