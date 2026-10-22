import type { ReactNode } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { ExternalLink, Package, Palette, Settings, ShoppingBag, Truck, type LucideIcon } from "lucide-react";
import type { AdminStore, StoreOption } from "@/types/admin";
import { Select } from "@/components/ui/Select";
import styles from "@/Pages/Admin/admin.module.css";

export type AdminTab = "products" | "orders" | "shipping" | "appearance" | "settings";

const TABS: { id: AdminTab; label: string; icon: LucideIcon; path: string }[] = [
  { id: "products", label: "Products", icon: ShoppingBag, path: "products" },
  { id: "orders", label: "Orders", icon: Package, path: "orders" },
  { id: "shipping", label: "Shipping", icon: Truck, path: "shipping" },
  { id: "appearance", label: "Appearance", icon: Palette, path: "appearance" },
  { id: "settings", label: "Settings", icon: Settings, path: "settings" },
];

// Shell for every store-admin page: top bar, a sidebar with the store and its
// sections (a scrollable tab row on phones), and the one-time success message
// flashed by the last save.
export function AdminLayout({
  store,
  stores,
  tab,
  title,
  children,
}: {
  store: AdminStore;
  stores: StoreOption[];
  tab: AdminTab;
  title: string;
  children: ReactNode;
}) {
  const { flash } = usePage();
  const success = typeof flash?.success === "string" ? flash.success : null;
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div className={styles.wrap}>
      <Head title={`${title} · ${store.name}`} />
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}>
          Store<span>Builder</span> Admin
        </Link>
        <div className={styles.topRight}>
          <a className={styles.viewLink} href={`/store/${store.subdomain}`} target="_blank" rel="noreferrer">
            View store <ExternalLink size={14} />
          </a>
          <Link className={styles.logout} href="/logout" method="post" as="button">
            Log out
          </Link>
        </div>
      </header>

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sideStore}>
            <div className={styles.sideStoreName} title={store.name}>
              {store.name}
            </div>
            <div className={styles.sideStoreMeta}>
              /store/{store.subdomain} · {store.plan} plan
            </div>
            {stores.length > 1 ? (
              <Select
                className={styles.storeSelect}
                ariaLabel="Switch store"
                value={String(store.id)}
                onChange={(id) => router.visit(`/admin/stores/${id}/${current.path}`)}
                options={stores.map((s) => ({ value: String(s.id), label: s.name }))}
              />
            ) : null}
          </div>

          <nav className={styles.sideNav}>
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={`/admin/stores/${store.id}/${t.path}`}
                className={`${styles.sideLink} ${tab === t.id ? styles.sideLinkActive : ""}`}
                aria-current={tab === t.id ? "page" : undefined}
              >
                <t.icon className={styles.sideIcon} size={18} strokeWidth={1.75} />
                {t.label}
              </Link>
            ))}
          </nav>

          <div className={styles.sideFoot}>
            <a className={styles.viewLink} href={`/store/${store.subdomain}`} target="_blank" rel="noreferrer">
              Open storefront <ExternalLink size={14} />
            </a>
          </div>
        </aside>

        <main className={styles.main}>
          {success ? <div className={styles.ok}>{success}</div> : null}
          {children}
        </main>
      </div>
    </div>
  );
}

// First validation message from an Inertia error bag.
export function firstError(errors: Record<string, string>): string {
  return Object.values(errors)[0] || "Something went wrong";
}
