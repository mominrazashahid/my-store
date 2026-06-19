import { notFound } from "next/navigation";
import { getStore, getPage, getProducts } from "@/lib/api";
import { getTheme } from "@/themes";
import { CartProvider } from "@/components/cart/CartContext";
import { CartWidget } from "@/components/cart/CartWidget";

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
  const sections = [...page.sections].sort((a, b) => a.position - b.position);

  return (
    <CartProvider
      subdomain={subdomain}
      currency={store.settings?.currency || "PKR"}
      validProductIds={products.map((p) => p._id)}
    >
      <div className={theme.wrapperClassName}>
        {sections.map((section) => {
          const Section = theme.sections[section.type];
          if (!Section) return null; // unknown section type — skip gracefully
          return (
            <Section
              key={section._id}
              content={section.content}
              products={products}
              store={store}
            />
          );
        })}
      </div>
      <CartWidget subdomain={subdomain} />
    </CartProvider>
  );
}
