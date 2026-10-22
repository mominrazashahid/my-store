import { Head, Link } from "@inertiajs/react";
import styles from "./admin.module.css";

// Only shown to owners without a store; everyone else is redirected to
// their first store's products.
export default function Dashboard() {
  return (
    <div className={styles.wrap}>
      <Head title="Dashboard" />
      <div className={styles.topbar}>
        <Link href="/" className={styles.brand}>
          Store<span>Builder</span> Admin
        </Link>
        <div className={styles.topRight}>
          <Link className={styles.logout} href="/logout" method="post" as="button">
            Log out
          </Link>
        </div>
      </div>
      <div className={styles.container}>
        <h1 className={styles.h}>You don&apos;t have a store yet</h1>
        <p className={styles.sub}>Stores are created during signup.</p>
      </div>
    </div>
  );
}
