import { useState, type FormEvent } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { Search, ShoppingCart } from "lucide-react";
import type { CartSummary } from "@/types/cart";
import styles from "./platform.module.css";

// StoreBuilder's own header, shown on the marketplace and on every store page,
// so shoppers always know they're on StoreBuilder and can search everything.
export function PlatformHeader({
  initialQuery = "",
  onSearch,
}: {
  initialQuery?: string;
  // the marketplace filters in place; elsewhere a search opens the marketplace
  onSearch?: (query: string) => void;
}) {
  const { auth, cart } = usePage<{ auth: { user: { name: string } | null }; cart?: CartSummary }>().props;
  const [query, setQuery] = useState(initialQuery);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (onSearch) onSearch(q);
    else router.get("/", q ? { q } : {});
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          Store<span>Builder</span>
        </Link>
        <nav className={styles.links}>
          <a href="/#shop">Shop</a>
          <a href="/#sell">Sell online</a>
        </nav>
        <form className={styles.search} onSubmit={submit} role="search">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products across all stores"
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">
            <Search size={18} />
          </button>
        </form>
        <div className={styles.actions}>
          <Link href="/checkout" className={styles.cartLink} aria-label={`Cart, ${cart?.count ?? 0} items`}>
            <ShoppingCart size={20} />
            {cart && cart.count > 0 ? <span className={styles.cartCount}>{cart.count}</span> : null}
          </Link>
          {auth.user ? (
            <Link href="/admin/dashboard" className={styles.btnPrimary}>
              My dashboard
            </Link>
          ) : (
            <Link href="/admin" className={styles.btnGhost}>
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
