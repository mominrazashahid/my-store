import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { getTheme } from "@/themes";
import { CartProvider } from "@/components/cart/CartContext";
import { CartWidget } from "@/components/cart/CartWidget";
import { OtherStoresProducts, type OtherStoreProduct } from "@/components/storefront/OtherStoresProducts";
import { StoreChrome } from "@/components/storefront/StoreChrome";
import type { Product, StoreInfo, StorePage } from "@/types/storefront";
import styles from "@/components/storefront/storefront.module.css";

// A store's home page: /store/<subdomain> locally. StoreChrome supplies the
// StoreBuilder header/footer; this renders the page's body sections (banner,
// products), a "Load more" button, then products from other stores.
export default function StorefrontHome({
  store,
  page,
  products,
  productsPage,
  otherStoresProducts,
}: {
  store: StoreInfo;
  page: StorePage;
  products: Product[];
  productsPage: { current: number; hasMore: boolean };
  otherStoresProducts: OtherStoreProduct[];
}) {
  const theme = getTheme(store.themeId);
  const body = page.sections.filter((s) => s.type !== "navbar" && s.type !== "footer");
  const [loading, setLoading] = useState(false);

  // Fetch the next page of products; the server marks `products` as a merge
  // prop, so Inertia appends it to what's already shown.
  function loadMore() {
    setLoading(true);
    router.reload({
      data: { page: productsPage.current + 1 },
      only: ["products", "productsPage"],
      preserveUrl: true,
      onFinish: () => setLoading(false),
    });
  }

  return (
    <CartProvider>
      <Head title={store.name} />
      <StoreChrome store={store} page={page}>
        {body.map((section, index) => {
          const Section = theme.sections[section.type];
          if (!Section) return null; // unknown section type — skip gracefully
          return (
            <Section
              key={`${section.type}-${index}`}
              content={section.content}
              products={products}
              store={store}
            />
          );
        })}
        {productsPage.hasMore ? (
          <div className={styles.loadMore}>
            <button type="button" className={styles.loadMoreBtn} onClick={loadMore} disabled={loading}>
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        ) : null}
        <OtherStoresProducts products={otherStoresProducts} />
      </StoreChrome>
      <CartWidget />
    </CartProvider>
  );
}
