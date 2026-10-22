import { useState } from "react";
import { router } from "@inertiajs/react";
import { AdminLayout, firstError } from "@/components/admin/AdminLayout";
import { CURRENCY_OPTIONS } from "@/lib/catalog";
import type { AdminPageProps } from "@/types/admin";
import styles from "./admin.module.css";

export default function Settings({ store, stores }: AdminPageProps) {
  const [form, setForm] = useState({
    name: store.name,
    contactPhone: store.contactPhone || "",
    contactEmail: store.contactEmail || "",
    whatsapp: store.whatsapp || "",
    line: store.address.line || "",
    city: store.address.city || "",
    mapUrl: store.address.mapUrl || "",
    showInMarketplace: store.showInMarketplace,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function save() {
    setError("");
    setBusy(true);
    router.patch(
      `/admin/stores/${store.id}/settings`,
      {
        name: form.name,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        whatsapp: form.whatsapp,
        address: { line: form.line, city: form.city, mapUrl: form.mapUrl },
        showInMarketplace: form.showInMarketplace,
      },
      {
        preserveScroll: true,
        onError: (errors) => setError(firstError(errors)),
        onFinish: () => setBusy(false),
      }
    );
  }

  const currencyLabel = CURRENCY_OPTIONS.find((c) => c.code === store.currency)?.label ?? store.currency;

  return (
    <AdminLayout store={store} stores={stores} tab="settings" title="Settings">
      <h2 className={styles.h}>Store settings</h2>
      <p className={styles.sub}>Contact details and address shown on your storefront.</p>
      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.field}>
        <label className={styles.label}>Store name</label>
        <input className={styles.input} value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>Contact phone</label>
          <input
            className={styles.input}
            value={form.contactPhone}
            onChange={(e) => set("contactPhone", e.target.value)}
            placeholder="+1 555 123 4567"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>WhatsApp</label>
          <input
            className={styles.input}
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="+1 555 123 4567"
          />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Contact email</label>
        <input
          className={styles.input}
          value={form.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
          placeholder="hello@yourstore.com"
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Address</label>
        <input
          className={styles.input}
          value={form.line}
          onChange={(e) => set("line", e.target.value)}
          placeholder="123 Main Street"
        />
      </div>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>City</label>
          <input className={styles.input} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Google Maps link</label>
          <input
            className={styles.input}
            value={form.mapUrl}
            onChange={(e) => set("mapUrl", e.target.value)}
            placeholder="https://maps.app.goo.gl/…"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Currency</label>
        <input className={styles.input} value={currencyLabel} disabled />
        <p className={styles.sub} style={{ fontSize: 12, marginTop: 6 }}>
          Set when the store was created. Changing it would change the meaning of every price.
        </p>
      </div>

      <label className={styles.field} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={form.showInMarketplace}
          onChange={(e) => set("showInMarketplace", e.target.checked)}
          style={{ marginTop: 3 }}
        />
        <span>
          <strong>Show my products on the StoreBuilder home page</strong>
          <br />
          <span className={styles.sub}>Free exposure: shoppers browsing the marketplace can discover your store.</span>
        </span>
      </label>

      <button className={`${styles.btn} ${styles.primary}`} onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save settings"}
      </button>
    </AdminLayout>
  );
}
