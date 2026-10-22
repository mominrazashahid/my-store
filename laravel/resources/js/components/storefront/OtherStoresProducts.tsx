import { Image as ImageIcon, Store } from "lucide-react";
import { formatMoney } from "@/lib/money";
import styles from "./storefront.module.css";

export type OtherStoreProduct = {
  id: number;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string | null;
  store: { name: string; subdomain: string; currency: string };
};

// Promotes products from other marketplace stores below a store's own
// products, so every store helps shoppers discover the others.
export function OtherStoresProducts({ products }: { products: OtherStoreProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className={styles.others}>
      <h2 className={styles.othersTitle}>More from other stores</h2>
      <div className={styles.othersGrid}>
        {products.map((p) => {
          const href = `/store/${p.store.subdomain}/products/${p.slug}`;
          return (
            <article key={p.id} className={styles.otherCard}>
              <a href={href} className={styles.otherThumb}>
                {p.image ? <img src={p.image} alt={p.title} loading="lazy" /> : <ImageIcon size={36} strokeWidth={1.25} />}
              </a>
              <div className={styles.otherBody}>
                <a href={href} className={styles.otherName}>
                  {p.title}
                </a>
                <span className={styles.otherPrice}>{formatMoney(p.price, p.store.currency)}</span>
                <a href={`/store/${p.store.subdomain}`} className={styles.otherStore}>
                  <Store size={13} /> {p.store.name}
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
