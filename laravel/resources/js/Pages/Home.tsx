import { Head, Link, router, usePage } from "@inertiajs/react";
import { ArrowRight, Globe, ShoppingBag, Store, Truck, X } from "lucide-react";
import { CountryPicker, useShopperCountry } from "@/components/platform/CountryPicker";
import { PlatformFooter } from "@/components/platform/PlatformFooter";
import { PlatformHeader } from "@/components/platform/PlatformHeader";
import { STORE_TYPE_OPTIONS, storeTypeIcon } from "@/lib/catalog";
import { countryName } from "@/lib/countries";
import { formatMoney } from "@/lib/money";
import styles from "./Home.module.css";

type MarketplaceProduct = {
  id: number;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string | null;
  store: { name: string; subdomain: string; storeType: string; currency: string };
};

type Filters = { type: string | null; q: string };

const money = formatMoney;

// placeholder art for products without a photo
function StoreTypeIcon({ type }: { type: string }) {
  const Icon = storeTypeIcon(type);
  return <Icon size={44} strokeWidth={1.25} />;
}

function discountPct(price: number, compare?: number | null) {
  if (!compare || compare <= price) return null;
  return Math.round(((compare - price) / compare) * 100);
}

// Platform home page: a marketplace of products mixed from every store, so
// new stores get seen without doing their own marketing.
export default function Home({
  products,
  filters,
}: {
  products: MarketplaceProduct[];
  filters: Filters;
}) {
  const { auth } = usePage<{ auth: { user: { name: string } | null } }>().props;

  const country = useShopperCountry();

  function browse(next: Partial<Filters>) {
    const params = { type: filters.type, q: filters.q, ...next };
    router.get(
      "/",
      {
        ...(params.type ? { type: params.type } : {}),
        ...(params.q ? { q: params.q } : {}),
      },
      { preserveState: true, preserveScroll: true, replace: true }
    );
  }

  return (
    <div className={styles.page}>
      <Head title="Shop independent stores from around the world" />

      {/* keyed by the query so "Clear search" also empties the header's search box */}
      <PlatformHeader
        key={filters.q}
        initialQuery={filters.q}
        onSearch={(q) => {
          browse({ q });
          document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* ---- Hero: a slim intro so the products are visible right away ---- */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>
            Discover <span>independent stores</span> worldwide
          </h1>
          <p className={styles.heroSub}>
            <Globe size={15} /> Beauty, fashion and gadgets from small brands, all in one place.
          </p>
        </div>
      </section>

      {/* ---- Product feed ---- */}
      <main id="shop" className={styles.shop}>
        <div className={styles.shopHead}>
          <div>
            <h2 className={styles.sectionTitle}>
              {filters.q ? `Results for “${filters.q}”` : "Fresh from our stores"}
            </h2>
            <div className={styles.shipsToPicker}>
              <Truck size={15} /> {country ? "Showing products that ship to" : "Showing products from"}
              <CountryPicker className={styles.countrySelect} label="Ships to" />
            </div>
          </div>
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!filters.type}
              className={`${styles.tab} ${!filters.type ? styles.tabActive : ""}`}
              onClick={() => browse({ type: null })}
            >
              All
            </button>
            {STORE_TYPE_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={filters.type === t.id}
                className={`${styles.tab} ${filters.type === t.id ? styles.tabActive : ""}`}
                onClick={() => browse({ type: t.id })}
              >
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {filters.q ? (
          <button
            type="button"
            className={styles.clearSearch}
            onClick={() => {
              browse({ q: "" });
            }}
          >
            <X size={15} /> Clear search
          </button>
        ) : null}

        {products.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <ShoppingBag size={40} strokeWidth={1.5} />
            </div>
            <p>
              {country
                ? `No products ${filters.q ? `for “${filters.q}” ` : ""}ship to ${countryName(country)} yet. Try Worldwide or another country above.`
                : `No products found${filters.q ? ` for “${filters.q}”` : ""}.`}
            </p>
            <Link href="/signup" className={styles.btnPrimary}>
              Be the first to sell here
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {products.map((p) => {
              const off = discountPct(p.price, p.compareAtPrice);
              const storeHref = `/store/${p.store.subdomain}`;
              return (
                <article key={p.id} className={styles.card}>
                  <a href={`${storeHref}/products/${p.slug}`} className={styles.thumbWrap}>
                    {p.image ? (
                      <img className={styles.thumb} src={p.image} alt={p.title} loading="lazy" />
                    ) : (
                      <div className={`${styles.thumbPlaceholder} ${styles[p.store.storeType] ?? ""}`}>
                        <StoreTypeIcon type={p.store.storeType} />
                      </div>
                    )}
                    {off ? <span className={styles.badge}>-{off}%</span> : null}
                  </a>
                  <div className={styles.cardBody}>
                    <a href={`${storeHref}/products/${p.slug}`} className={styles.cardTitle}>
                      {p.title}
                    </a>
                    <div className={styles.priceRow}>
                      <span className={styles.price}>{money(p.price, p.store.currency)}</span>
                      {off ? (
                        <span className={styles.compare}>
                          {money(p.compareAtPrice!, p.store.currency)}
                        </span>
                      ) : null}
                    </div>
                    <a href={storeHref} className={styles.storeLink}>
                      <Store size={13} /> {p.store.name}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ---- Sell ---- */}
      <section id="sell" className={styles.sell}>
        <div className={styles.sellInner}>
          <h2 className={styles.sectionTitle}>Sell online in minutes</h2>
          <p className={styles.sellSub}>
            Get your own store — and your products featured right here, in front of
            shoppers, without spending on ads.
          </p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNum}>1</span>
              <h3>Create your store</h3>
              <p>Pick cosmetics, clothing or electronics and a theme. Free to start.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>2</span>
              <h3>Add your products</h3>
              <p>Upload photos, set prices and stock. Up to 20 products on the free plan.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <h3>Get orders</h3>
              <p>Shoppers find you here and place orders. You ship, they pay on delivery.</p>
            </div>
          </div>
          <Link href={auth.user ? "/admin/dashboard" : "/signup"} className={styles.btnPrimaryLg}>
            {auth.user ? "Go to my dashboard" : "Create your free store"}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <PlatformFooter />
    </div>
  );
}
