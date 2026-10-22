import { Link } from "@inertiajs/react";
import styles from "./platform.module.css";

// StoreBuilder's own footer, shown on the marketplace and on every store page.
export function PlatformFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div>
          <div className={styles.logo}>
            Store<span>Builder</span>
          </div>
          <p className={styles.footerNote}>Online stores for independent brands, wherever you sell.</p>
        </div>
        <div className={styles.footerLinks}>
          <a href="/#shop">Shop</a>
          <a href="/#sell">Sell online</a>
          <Link href="/admin">Seller login</Link>
          <Link href="/signup">Create a store</Link>
        </div>
      </div>
      <div className={styles.footerBar}>© {new Date().getFullYear()} StoreBuilder</div>
    </footer>
  );
}
