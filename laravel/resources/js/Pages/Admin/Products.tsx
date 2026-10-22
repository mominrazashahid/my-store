import { useState } from "react";
import { router } from "@inertiajs/react";
import { Image as ImageIcon, X } from "lucide-react";
import { AdminLayout, firstError } from "@/components/admin/AdminLayout";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { formatMoney, toMajorInput } from "@/lib/money";
import type { AdminPageProps, AdminProduct, AdminStore } from "@/types/admin";
import { Select } from "@/components/ui/Select";
import styles from "./admin.module.css";

// Form values are strings so price inputs can hold "19.99" while typing.
type ProductForm = {
  id?: number;
  title: string;
  description: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  status: AdminProduct["status"];
  images: string[];
};

const blankProduct: ProductForm = {
  title: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  status: "active",
  images: [],
};

function toForm(p: AdminProduct, currency: string): ProductForm {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: toMajorInput(p.price, currency),
    compareAtPrice: toMajorInput(p.compareAtPrice, currency),
    stock: String(p.stock),
    status: p.status,
    images: p.images,
  };
}

export default function Products({
  store,
  stores,
  products,
  productLimit,
}: AdminPageProps & { products: AdminProduct[]; productLimit: number | null }) {
  const [editing, setEditing] = useState<ProductForm | null>(null);
  const atLimit = productLimit !== null && products.length >= productLimit;

  function remove(p: AdminProduct) {
    if (!confirm(`Delete “${p.title}”?`)) return;
    router.delete(`/admin/stores/${store.id}/products/${p.id}`, { preserveScroll: true });
  }

  return (
    <AdminLayout store={store} stores={stores} tab="products" title="Products">
      <div className={styles.toolbar}>
        <div className={styles.count}>
          {products.length} / {productLimit ?? "∞"} products
          {atLimit ? <span className={styles.limit}> — free plan limit reached</span> : null}
        </div>
        <button
          className={`${styles.btn} ${styles.primary}`}
          disabled={atLimit}
          onClick={() => setEditing({ ...blankProduct })}
        >
          + Add product
        </button>
      </div>

      {products.length === 0 ? (
        <p className={styles.sub}>No products yet. Add your first one!</p>
      ) : null}

      <div className={styles.pgrid}>
        {products.map((p) => (
          <div key={p.id} className={styles.pcard}>
            <div className={styles.pthumb}>
              {p.images[0] ? <img src={p.images[0]} alt={p.title} /> : <ImageIcon size={32} strokeWidth={1.25} />}
            </div>
            <div className={styles.pbody}>
              <p className={styles.ptitle}>{p.title}</p>
              <span className={styles.pprice}>{formatMoney(p.price, store.currency)}</span>
              <div className={styles.pmeta}>
                Stock: {p.stock} · {p.status}
              </div>
              <div className={styles.pactions}>
                <button
                  className={`${styles.btn} ${styles.ghost}`}
                  onClick={() => setEditing(toForm(p, store.currency))}
                >
                  Edit
                </button>
                <button className={`${styles.btn} ${styles.danger}`} onClick={() => remove(p)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing ? (
        <ProductModal store={store} product={editing} onClose={() => setEditing(null)} />
      ) : null}
    </AdminLayout>
  );
}

function ProductModal({
  store,
  product,
  onClose,
}: {
  store: AdminStore;
  product: ProductForm;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProductForm>(product);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(product.id);

  function set<K extends keyof ProductForm>(k: K, v: ProductForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function save() {
    setError("");
    if (!form.title || form.price === "") {
      setError("Title and price are required.");
      return;
    }
    setBusy(true);
    const data = {
      title: form.title,
      description: form.description,
      price: form.price,
      compareAtPrice: form.compareAtPrice || null,
      stock: form.stock || "0",
      status: form.status,
      images: form.images,
    };
    const options = {
      preserveScroll: true,
      onSuccess: onClose,
      onError: (errors: Record<string, string>) => setError(firstError(errors)),
      onFinish: () => setBusy(false),
    };
    if (isEdit) router.patch(`/admin/stores/${store.id}/products/${product.id}`, data, options);
    else router.post(`/admin/stores/${store.id}/products`, data, options);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.h}>{isEdit ? "Edit product" : "New product"}</h2>
        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.field}>
          <label className={styles.label}>Product images</label>
          <div className={styles.imgRow}>
            {form.images.map((url, i) => (
              <div key={url} className={styles.imgThumb}>
                <img src={url} alt="" />
                <button
                  className={styles.imgRemove}
                  onClick={() => set("images", form.images.filter((_, idx) => idx !== i))}
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <ImageUploader
            storeId={store.id}
            label="+ Add image"
            onUploaded={(url) => setForm((f) => ({ ...f, images: [...f.images, url] }))}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input className={styles.input} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>Price ({store.currency})</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="19.99"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Compare-at (optional)</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={form.compareAtPrice}
              onChange={(e) => set("compareAtPrice", e.target.value)}
              placeholder="Original price"
            />
          </div>
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>Stock</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <Select
              className={styles.selectFull}
              ariaLabel="Status"
              value={form.status}
              onChange={(status) => set("status", status as ProductForm["status"])}
              options={[
                { value: "active", label: "Active — shown in your store" },
                { value: "draft", label: "Draft — hidden" },
              ]}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className={styles.modalActions}>
          <button className={`${styles.btn} ${styles.ghost}`} onClick={onClose}>
            Cancel
          </button>
          <button className={`${styles.btn} ${styles.primary}`} onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save product"}
          </button>
        </div>
      </div>
    </div>
  );
}
