import { useState } from "react";
import { router } from "@inertiajs/react";
import { Trash2 } from "lucide-react";
import { AdminLayout, firstError } from "@/components/admin/AdminLayout";
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { AdminPageProps } from "@/types/admin";
import type { StorePage } from "@/types/storefront";
import styles from "./admin.module.css";

// Edits what the owner controls on their store page: the banner image.
// StoreBuilder supplies the header and footer.
export default function Appearance({ store, stores, page: initial }: AdminPageProps & { page: StorePage }) {
  const [page, setPage] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const heroIdx = page.sections.findIndex((s) => s.type === "hero");
  const hero = (page.sections[heroIdx]?.content || {}) as Record<string, unknown>;
  const banner = (hero.image as string) || "";

  function setContent(idx: number, content: Record<string, unknown>) {
    if (idx < 0) return;
    setPage((p) => ({
      ...p,
      sections: p.sections.map((s, i) => (i === idx ? { ...s, content } : s)),
    }));
  }

  function save() {
    setError("");
    setBusy(true);
    router.patch(
      `/admin/stores/${store.id}/appearance`,
      // section content is free-form JSON, which Inertia's form-data types can't describe
      { sections: page.sections as unknown as Record<string, string>[] },
      {
        preserveScroll: true,
        preserveState: true,
        onError: (errors) => setError(firstError(errors)),
        onFinish: () => setBusy(false),
      }
    );
  }

  return (
    <AdminLayout store={store} stores={stores} tab="appearance" title="Appearance">
      <h2 className={styles.h}>Appearance</h2>
      <p className={styles.sub}>
        Your store page sits inside the StoreBuilder header and footer. Customize the parts that are yours.
      </p>
      {error ? <div className={styles.error}>{error}</div> : null}

      {heroIdx >= 0 ? (
        <div className={styles.field}>
          <label className={styles.label}>Banner image</label>
          <p className={styles.sub} style={{ marginTop: 0 }}>
            Shown full width at the top of your store. A wide image works best (about 1600 × 500 px). Leave empty for
            no banner.
          </p>
          <div
            className={styles.heroPreview}
            style={banner ? { backgroundImage: `url(${banner})` } : undefined}
          >
            {!banner ? "No banner" : null}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <ImageUploader
              storeId={store.id}
              label={banner ? "Replace image" : "Upload image"}
              onUploaded={(url) => setContent(heroIdx, { ...hero, image: url })}
            />
            {banner ? (
              <button className={`${styles.btn} ${styles.danger}`} onClick={() => setContent(heroIdx, { ...hero, image: "" })}>
                <Trash2 size={15} /> Remove
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <button className={`${styles.btn} ${styles.primary}`} onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save changes"}
      </button>
    </AdminLayout>
  );
}
