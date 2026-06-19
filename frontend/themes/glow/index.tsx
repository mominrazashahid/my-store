import type { Theme, SectionContext } from "../types";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import styles from "./glow.module.css";

function fmtPrice(value: unknown, currency = "PKR") {
  const n = Number(value || 0);
  return `${currency} ${n.toLocaleString()}`;
}

function discountPct(price: number, compare?: number) {
  if (!compare || compare <= price) return null;
  return Math.round(((compare - price) / compare) * 100);
}

function Navbar({ content }: SectionContext) {
  const logo = (content.logo as string) || "Store";
  const links = (content.links as { label: string; href: string }[]) || [];
  return (
    <nav className={styles.nav}>
      <span className={styles.logo}>{logo}</span>
      <ul className={styles.navLinks}>
        {links.map((l, i) => (
          <li key={i}>
            <a href={l.href}>{l.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Hero({ content }: SectionContext) {
  const image = (content.image as string) || "";
  return (
    <header className={styles.hero}>
      {image ? (
        <div className={styles.heroBg} style={{ backgroundImage: `url(${image})` }} />
      ) : null}
      <div
        className={`${styles.heroInner} ${
          image ? styles.heroOnImage : styles.heroOnPlain
        }`}
      >
        <h1 className={styles.heroHeading}>{content.heading as string}</h1>
        <p className={styles.heroSub}>{content.subtext as string}</p>
        {content.ctaText ? (
          <a className={styles.cta} href={(content.ctaLink as string) || "#"}>
            {content.ctaText as string}
          </a>
        ) : null}
      </div>
    </header>
  );
}

function Products({ content, products, store }: SectionContext) {
  const title = (content.title as string) || "Products";
  const limit = Number(content.limit || 8);
  const shown = products.slice(0, limit);
  const currency = store.settings?.currency || "PKR";
  return (
    <section id="products" className={styles.products}>
      <div className={styles.productsHead}>
        <h2 className={styles.productsTitle}>{title}</h2>
        <div className={styles.productsRule} />
      </div>
      {shown.length === 0 ? (
        <p className={styles.empty}>No products yet — add some in your admin panel.</p>
      ) : (
        <div className={styles.grid}>
          {shown.map((p) => {
            const off = discountPct(p.price, p.compareAtPrice);
            const soldOut = p.stock <= 0;
            return (
              <article key={p._id} className={styles.card}>
                <div className={styles.thumbWrap}>
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.thumb} src={p.images[0]} alt={p.title} />
                  ) : (
                    <div className={styles.thumbPlaceholder}>✦</div>
                  )}
                  {off ? <span className={styles.badge}>-{off}%</span> : null}
                  {soldOut ? <span className={styles.soldout}>Sold out</span> : null}
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{p.title}</h3>
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
                    product={{
                      productId: p._id,
                      title: p.title,
                      price: p.price,
                      image: p.images?.[0],
                    }}
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

function Footer({ content, store }: SectionContext) {
  const addr = store.address;
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerCol}>
          <h4>{store.name}</h4>
          <p>Cash on delivery across Pakistan.</p>
        </div>
        <div className={styles.footerCol}>
          <h4>Contact</h4>
          {store.contactPhone ? <p>📞 {store.contactPhone}</p> : null}
          {store.settings?.whatsapp ? <p>💬 {store.settings.whatsapp}</p> : null}
          {store.contactEmail ? <p>✉️ {store.contactEmail}</p> : null}
        </div>
        {addr?.line || addr?.city ? (
          <div className={styles.footerCol}>
            <h4>Visit us</h4>
            {addr.line ? <p>{addr.line}</p> : null}
            {addr.city ? <p>{addr.city}</p> : null}
            {addr.mapUrl ? (
              <p>
                <a href={addr.mapUrl} target="_blank" rel="noreferrer">
                  View on map →
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={styles.footerBar}>{(content.text as string) || ""}</div>
    </footer>
  );
}

export const glowTheme: Theme = {
  id: "glow",
  name: "Glow",
  storeType: "cosmetics",
  wrapperClassName: styles.theme,
  sections: { navbar: Navbar, hero: Hero, products: Products, footer: Footer },
};
