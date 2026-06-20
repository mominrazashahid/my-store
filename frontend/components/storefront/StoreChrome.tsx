import { getStore, getPage } from "@/lib/api";
import { getTheme } from "@/themes";
import { themeToCss, googleFontsHref } from "@/lib/theme";
import { PreviewBridge } from "@/components/theme/PreviewBridge";
import type { ReactNode } from "react";

// Themed wrapper for non-home storefront pages (blog, etc). Injects the store's
// design tokens and reuses the owner's configured navbar + footer so these
// pages feel like part of the store. Returns null store handling to the caller.
export async function StoreChrome({
  subdomain,
  children,
}: {
  subdomain: string;
  children: ReactNode;
}) {
  const [store, page] = await Promise.all([
    getStore(subdomain),
    getPage(subdomain, "home"),
  ]);

  if (!store) return <>{children}</>;

  const theme = getTheme(store.themeId);
  const css = store.theme ? themeToCss(store.theme) : "";
  const fontsHref = store.theme
    ? googleFontsHref(store.theme.tokens.fonts.heading, store.theme.tokens.fonts.body)
    : "";

  const storeCtx = { ...store, basePath: `/store/${subdomain}` };
  const navbar = page?.sections.find((s) => s.type === "navbar");
  const footer = page?.sections.find((s) => s.type === "footer");
  const Navbar = theme.sections.navbar;
  const Footer = theme.sections.footer;

  return (
    <>
      {fontsHref ? (
        <link id="sb-theme-fonts" rel="stylesheet" href={fontsHref} />
      ) : null}
      <style id="sb-theme-style" dangerouslySetInnerHTML={{ __html: css }} />
      <PreviewBridge />
      <div className={theme.wrapperClassName} data-theme-root>
        {navbar && Navbar ? (
          <Navbar content={navbar.content} products={[]} store={storeCtx} />
        ) : null}
        {children}
        {footer && Footer ? (
          <Footer content={footer.content} products={[]} store={storeCtx} />
        ) : null}
      </div>
    </>
  );
}
