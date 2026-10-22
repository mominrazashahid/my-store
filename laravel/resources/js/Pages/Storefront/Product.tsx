import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowRight, Image as ImageIcon, Minus, Plus, ShoppingCart, Store, Truck } from "lucide-react";
import { CartProvider, useCart } from "@/components/cart/CartContext";
import { CartWidget } from "@/components/cart/CartWidget";
import { OtherStoresProducts, type OtherStoreProduct } from "@/components/storefront/OtherStoresProducts";
import { BackLink } from "@/components/storefront/BackLink";
import { ShipsToBadge } from "@/components/storefront/ShipsToBadge";
import { StoreChrome } from "@/components/storefront/StoreChrome";
import { formatMoney } from "@/lib/money";
import type { Product, StoreInfo, StorePage } from "@/types/storefront";
import styles from "./product.module.css";

function discountPct(price: number, compare?: number | null) {
  if (!compare || compare <= price) return null;
  return Math.round(((compare - price) / compare) * 100);
}

// A product's own page: /store/<subdomain>/products/<slug>. Below the product:
// more from the same store (with a link to the whole store), then products
// from other stores.
export default function ProductPage({
  store,
  page,
  product,
  related,
  storeHasMore,
  shipsTo,
  otherStoresProducts,
}: {
  store: StoreInfo;
  page: StorePage;
  product: Product;
  related: Product[];
  storeHasMore: boolean;
  shipsTo: string[];
  otherStoresProducts: OtherStoreProduct[];
}) {
  const currency = store.settings?.currency || "USD";

  return (
    <CartProvider>
      <Head title={`${product.title} · ${store.name}`} />
      <StoreChrome store={store} page={page}>
        <div className={styles.wrap}>
          <BackLink storeName={store.name} storeUrl={store.basePath} className={styles.crumb} />

          <div className={styles.layout}>
            <Gallery images={product.images} title={product.title} />
            <ProductInfo product={product} currency={currency} store={store} shipsTo={shipsTo} />
          </div>

          {related.length > 0 ? (
            <section className={styles.related}>
              <div className={styles.relatedHead}>
                <h2 className={styles.relatedTitle}>More from {store.name}</h2>
                <Link href={store.basePath} className={styles.relatedLink}>
                  View all <ArrowRight size={16} />
                </Link>
              </div>
              <div className={styles.relatedGrid}>
                {related.map((p) => (
                  <Link key={p.id} href={`${store.basePath}/products/${p.slug}`} className={styles.relatedCard}>
                    <div className={styles.relatedThumb}>
                      {p.images[0] ? (
                        <img src={p.images[0]} alt={p.title} loading="lazy" />
                      ) : (
                        <ImageIcon size={32} strokeWidth={1.25} />
                      )}
                    </div>
                    <div className={styles.relatedBody}>
                      <span className={styles.relatedName}>{p.title}</span>
                      <span className={styles.relatedPrice}>{formatMoney(p.price, currency)}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className={styles.viewStore}>
                <Link href={store.basePath} className={styles.viewStoreBtn}>
                  <Store size={18} />
                  {storeHasMore ? `View more on ${store.name}` : `Visit ${store.name}`}
                  <ArrowRight size={18} />
                </Link>
              </div>
            </section>
          ) : null}
        </div>
        <OtherStoresProducts products={otherStoresProducts} />
      </StoreChrome>
      <CartWidget />
    </CartProvider>
  );
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImage}>
        {current ? (
          <img src={current} alt={title} />
        ) : (
          <ImageIcon size={64} strokeWidth={1} />
        )}
      </div>
      {images.length > 1 ? (
        <div className={styles.thumbs}>
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              className={`${styles.thumb} ${i === active ? styles.thumbActive : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductInfo({
  product,
  currency,
  store,
  shipsTo,
}: {
  product: Product;
  currency: string;
  store: StoreInfo;
  shipsTo: string[];
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const off = discountPct(product.price, product.compareAtPrice);
  const soldOut = product.stock <= 0;
  const maxQty = Math.max(1, Math.min(product.stock, 100));

  return (
    <div className={styles.info}>
      <h1 className={styles.title}>{product.title}</h1>

      <div className={styles.priceRow}>
        <span className={styles.price}>{formatMoney(product.price, currency)}</span>
        {off ? (
          <>
            <span className={styles.compare}>{formatMoney(product.compareAtPrice!, currency)}</span>
            <span className={styles.badge}>Save {off}%</span>
          </>
        ) : null}
      </div>

      <ShipsToBadge shipsTo={shipsTo} />

      <p className={soldOut ? styles.stockOut : styles.stockIn}>
        {soldOut ? "Sold out" : product.stock <= 5 ? `Only ${product.stock} left in stock` : "In stock"}
      </p>

      {!soldOut ? (
        <div className={styles.buyRow}>
          <div className={styles.qty}>
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span aria-live="polite">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => add(product.id, qty)}
          >
            <ShoppingCart size={18} /> Add to cart
          </button>
        </div>
      ) : null}

      <p className={styles.delivery}>
        <Truck size={18} /> Delivery options and costs are shown at checkout
      </p>

      <div className={styles.seller}>
        <span className={styles.sellerIcon}>
          <Store size={20} />
        </span>
        <div className={styles.sellerInfo}>
          <span className={styles.sellerLabel}>Sold by</span>
          <strong>{store.name}</strong>
        </div>
        <Link href={store.basePath} className={styles.sellerBtn}>
          Visit store <ArrowRight size={15} />
        </Link>
      </div>

      {product.description ? (
        <div className={styles.description}>
          <h2>Description</h2>
          <p>{product.description}</p>
        </div>
      ) : null}
    </div>
  );
}
