import Link from "next/link";
import styles from "./home.module.css";

// Platform landing page (the marketing/home page of the builder itself,
// not a customer storefront). Storefronts live at /store/<subdomain>.
export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.brand}>StoreBuilder</h1>
        <p className={styles.tag}>
          Launch your own online store in minutes — cosmetics, clothing, or
          electronics. Cash on delivery across Pakistan.
        </p>

        <div className={styles.row}>
          <Link className={styles.primary} href="/signup">
            Create your store →
          </Link>
          <Link className={styles.secondary} href="/store/glow-demo">
            View a demo store
          </Link>
        </div>

        <p className={styles.note}>
          Dev note: signup creates a real account + store and drops you on your
          live storefront. Make sure the backend is running on{" "}
          <code>:4000</code>.
        </p>
      </div>
    </main>
  );
}
