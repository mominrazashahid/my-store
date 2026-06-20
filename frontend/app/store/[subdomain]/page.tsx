import { notFound } from "next/navigation";
import { getStore, getPage, getProducts } from "@/lib/api";
import { getTheme } from "@/themes";
import { themeToCss, googleFontsHref } from "@/lib/theme";
import { CartProvider } from "@/components/cart/CartContext";
import { CartWidget } from "@/components/cart/CartWidget";
import { PreviewBridge } from "@/components/theme/PreviewBridge";

// Local dev storefront: /store/<subdomain>
// In production this same render path is driven by the request's subdomain.
export default async function StorePage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const [store, page, products] = await Promise.all([
    getStore(subdomain),
    getPage(subdomain, "home"),
    getProducts(subdomain),
  ]);

  if (!store || !page) notFound();

  const theme = getTheme(store.themeId);
  const storeCtx = { ...store, basePath: `/store/${subdomain}` };
  const sections = [...page.sections].sort((a, b) => a.position - b.position);

  // Render the owner's saved (published) design tokens as scoped CSS variables.
  // Guard against a missing theme so the storefront can never crash on render.
  const css = store.theme ? themeToCss(store.theme) : "";
  const fontsHref = store.theme
    ? googleFontsHref(store.theme.tokens.fonts.heading, store.theme.tokens.fonts.body)
    : "";

  return (
    <CartProvider
      subdomain={subdomain}
      currency={store.settings?.currency || "PKR"}
      validProductIds={products.map((p) => p._id)}
    >
      {fontsHref ? (
        <link id="sb-theme-fonts" rel="stylesheet" href={fontsHref} />
      ) : null}
      <style id="sb-theme-style" dangerouslySetInnerHTML={{ __html: css }} />
      <PreviewBridge />
      <div className={theme.wrapperClassName} data-theme-root>
        {sections.map((section) => {
          const Section = theme.sections[section.type];
          if (!Section) return null; // unknown section type — skip gracefully
          return (
            <Section
              key={section._id}
              content={section.content}
              products={products}
              store={storeCtx}
            />
          );
        })}
      </div>
      <CartWidget subdomain={subdomain} />
    </CartProvider>
  );
}
