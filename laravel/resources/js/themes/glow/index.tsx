import { Image as ImageIcon, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Theme, SectionContext } from "../types";
import { formatMoney } from "@/lib/money";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import styles from "./glow.module.css";

function fmtPrice(value: unknown, currency = "USD") {
  return formatMoney(Number(value || 0), currency);
}

function discountPct(price: number, compare?: number | null) {
  if (!compare || compare <= price) return null;
  return Math.round(((compare - price) / compare) * 100);
}

// Just the owner's banner image; nothing is shown until one is uploaded.
function Hero({ content, store }: SectionContext) {
  const image = (content.image as string) || "";
  if (!image) return null;
  return (
    <header className={styles.hero}>
      <img className={styles.heroImage} src={image} alt={store.name} />
    </header>
  );
}

// The store's product grid. Shows every product the page has loaded so far;
// the page appends more with "Load more".
function Products({ products, store }: SectionContext) {
  const currency = store.settings?.currency || "USD";
  return (
    <section id="products" className={styles.products}>
      {products.length === 0 ? (
        <p className={styles.empty}>This store has no products yet.</p>
      ) : (
        <div className={styles.grid}>
          {products.map((p) => {
            const off = discountPct(p.price, p.compareAtPrice);
            const soldOut = p.stock <= 0;
            return (
              <article key={p.id} className={styles.card}>
                <a className={styles.thumbWrap} href={`${store.basePath}/products/${p.slug}`}>
                  {p.images?.[0] ? (
                    <img className={styles.thumb} src={p.images[0]} alt={p.title} />
                  ) : (
                    <div className={styles.thumbPlaceholder}>
                      <ImageIcon size={40} strokeWidth={1.25} />
                    </div>
                  )}
                  {off ? <span className={styles.badge}>-{off}%</span> : null}
                  {soldOut ? <span className={styles.soldout}>Sold out</span> : null}
                </a>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>
                    <a href={`${store.basePath}/products/${p.slug}`}>{p.title}</a>
                  </h3>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>{fmtPrice(p.price, currency)}</span>
                    {p.compareAtPrice ? (
                      <span className={styles.compare}>
                        {fmtPrice(p.compareAtPrice, currency)}
                      </span>
                    ) : null}
                  </div>
                  <AddToCartButton
                    className={styles.buy}
                    soldOut={soldOut}
                    productId={p.id}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// The store's contact details, shown at the end of every store page (above
// StoreBuilder's footer). Hidden when the owner hasn't added any.
function StoreInfo({ store }: SectionContext) {
  const addr = store.address;
  const hasContact = store.contactPhone || store.settings?.whatsapp || store.contactEmail;
  const hasAddress = addr?.line || addr?.city;
  if (!hasContact && !hasAddress) return null;

  return (
    <section className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerCol}>
          <h4>{store.name}</h4>
          <p>Questions about an order? Get in touch with the store.</p>
        </div>
        {hasContact ? (
          <div className={styles.footerCol}>
            <h4>Contact</h4>
            {store.contactPhone ? (
              <p className={styles.contactLine}>
                <Phone size={15} /> {store.contactPhone}
              </p>
            ) : null}
            {store.settings?.whatsapp ? (
              <p className={styles.contactLine}>
                <MessageCircle size={15} /> {store.settings.whatsapp}
              </p>
            ) : null}
            {store.contactEmail ? (
              <p className={styles.contactLine}>
                <Mail size={15} /> {store.contactEmail}
              </p>
            ) : null}
          </div>
        ) : null}
        {hasAddress ? (
          <div className={styles.footerCol}>
            <h4>Visit us</h4>
            {addr?.line ? <p>{addr.line}</p> : null}
            {addr?.city ? <p>{addr.city}</p> : null}
            {addr?.mapUrl ? (
              <p>
                <a className={styles.contactLine} href={addr.mapUrl} target="_blank" rel="noreferrer">
                  <MapPin size={15} /> View on map
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export const glowTheme: Theme = {
  id: "glow",
  name: "Glow",
  storeType: "cosmetics",
  wrapperClassName: styles.theme,
  sections: { hero: Hero, products: Products, footer: StoreInfo },
};
