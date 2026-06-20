"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  getSession,
  clearSession,
  type AdminStore,
  type AdminProduct,
  type AdminPage,
  type AdminOrder,
  type AdminBlogPost,
} from "@/lib/client";
import { Markdown } from "@/components/blog/Markdown";
import styles from "../admin.module.css";

const FREE_LIMIT = 20;

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [active, setActive] = useState<AdminStore | null>(null);
  const [tab, setTab] = useState<
    "products" | "orders" | "blog" | "appearance" | "settings"
  >("products");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/admin");
      return;
    }
    setToken(s.token);
    api
      .myStores(s.token)
      .then(({ stores }) => {
        setStores(stores);
        setActive(stores[0] || null);
      })
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    clearSession();
    router.replace("/admin");
  }

  if (loading) return <div className={styles.wrap} style={{ padding: 40 }}>Loading…</div>;
  if (!token) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <div className={styles.brand}>
          Store<span>Builder</span> Admin
        </div>
        <div className={styles.topRight}>
          {active ? (
            <a
              className={styles.viewLink}
              href={`/store/${active.subdomain}`}
              target="_blank"
              rel="noreferrer"
            >
              View store ↗
            </a>
          ) : null}
          <button className={styles.logout} onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <div className={styles.container}>
        {!active ? (
          <p className={styles.sub}>You don&apos;t have a store yet.</p>
        ) : (
          <>
            {stores.length > 1 ? (
              <div className={styles.storeSwitch}>
                <span>Store:</span>
                <select
                  className={styles.select}
                  value={active._id}
                  onChange={(e) =>
                    setActive(stores.find((s) => s._id === e.target.value) || null)
                  }
                >
                  {stores.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className={styles.tabs}>
              {(["products", "orders", "blog", "appearance", "settings"] as const).map((t) => (
                <button
                  key={t}
                  className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {tab === "products" && <ProductsTab token={token} store={active} />}
            {tab === "orders" && <OrdersTab token={token} store={active} />}
            {tab === "blog" && <BlogTab token={token} store={active} />}
            {tab === "appearance" && <AppearanceTab token={token} store={active} />}
            {tab === "settings" && (
              <SettingsTab
                token={token}
                store={active}
                onSaved={(s) => {
                  setActive(s);
                  setStores((prev) => prev.map((x) => (x._id === s._id ? s : x)));
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Image uploader ----------------------------- */

function ImageUploader({
  token,
  storeId,
  onUploaded,
  label = "Upload image",
}: {
  token: string;
  storeId: string;
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const url = await api.uploadImage(token, storeId, file);
      onUploaded(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        onChange={onPick}
        style={{ display: "none" }}
      />
      <button
        type="button"
        className={`${styles.btn} ${styles.ghost}`}
        onClick={() => ref.current?.click()}
        disabled={busy}
      >
        {busy ? "Uploading…" : label}
      </button>
      {err ? <div className={styles.error} style={{ marginTop: 8 }}>{err}</div> : null}
    </div>
  );
}

/* ------------------------------- Products -------------------------------- */

const blankProduct: Partial<AdminProduct> = {
  title: "",
  price: 0,
  compareAtPrice: undefined,
  stock: 0,
  description: "",
  images: [],
  status: "active",
};

function ProductsTab({ token, store }: { token: string; store: AdminStore }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [editing, setEditing] = useState<Partial<AdminProduct> | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.products(token, store._id).then(({ products }) => setProducts(products));
  }, [token, store._id]);

  useEffect(() => {
    load();
  }, [load]);

  const atLimit = store.plan === "free" && products.length >= FREE_LIMIT;

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    await api.deleteProduct(token, store._id, id);
    load();
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.count}>
          {products.length} / {store.plan === "free" ? FREE_LIMIT : "∞"} products
          {atLimit ? (
            <span className={styles.limit}> — free plan limit reached</span>
          ) : null}
        </div>
        <button
          className={`${styles.btn} ${styles.primary}`}
          disabled={atLimit}
          onClick={() => setEditing({ ...blankProduct })}
        >
          + Add product
        </button>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.pgrid}>
        {products.map((p) => (
          <div key={p._id} className={styles.pcard}>
            <div className={styles.pthumb}>
              {p.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.images[0]} alt={p.title} />
              ) : (
                "🖼"
              )}
            </div>
            <div className={styles.pbody}>
              <p className={styles.ptitle}>{p.title}</p>
              <span className={styles.pprice}>PKR {p.price.toLocaleString()}</span>
              <div className={styles.pmeta}>
                Stock: {p.stock} · {p.status}
              </div>
              <div className={styles.pactions}>
                <button
                  className={`${styles.btn} ${styles.ghost}`}
                  onClick={() => setEditing(p)}
                >
                  Edit
                </button>
                <button
                  className={`${styles.btn} ${styles.danger}`}
                  onClick={() => remove(p._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing ? (
        <ProductModal
          token={token}
          store={store}
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setError("");
            load();
          }}
          onError={(m) => setError(m)}
        />
      ) : null}
    </div>
  );
}

function ProductModal({
  token,
  store,
  product,
  onClose,
  onSaved,
  onError,
}: {
  token: string;
  store: AdminStore;
  product: Partial<AdminProduct>;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [form, setForm] = useState<Partial<AdminProduct>>({ ...product });
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(product._id);

  function set<K extends keyof AdminProduct>(k: K, v: AdminProduct[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.title || form.price === undefined) {
      onError("Title and price are required");
      return;
    }
    setBusy(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        stock: Number(form.stock || 0),
        images: form.images || [],
        status: form.status || "active",
      };
      if (isEdit) await api.updateProduct(token, store._id, product._id!, body);
      else await api.createProduct(token, store._id, body);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Save failed");
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const images = form.images || [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.h}>{isEdit ? "Edit product" : "New product"}</h2>

        <div className={styles.field}>
          <label className={styles.label}>Product images</label>
          <div className={styles.imgRow}>
            {images.map((url, i) => (
              <div key={i} className={styles.imgThumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" />
                <button
                  className={styles.imgRemove}
                  onClick={() =>
                    set("images", images.filter((_, idx) => idx !== i))
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <ImageUploader
            token={token}
            storeId={store._id}
            label="+ Add image"
            onUploaded={(url) => set("images", [...images, url])}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input
            className={styles.input}
            value={form.title || ""}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>Price (PKR)</label>
            <input
              className={styles.input}
              type="number"
              value={form.price ?? 0}
              onChange={(e) => set("price", Number(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Compare-at (optional)</label>
            <input
              className={styles.input}
              type="number"
              value={form.compareAtPrice ?? ""}
              onChange={(e) =>
                set("compareAtPrice", e.target.value ? Number(e.target.value) : (undefined as never))
              }
            />
          </div>
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>Stock</label>
            <input
              className={styles.input}
              type="number"
              value={form.stock ?? 0}
              onChange={(e) => set("stock", Number(e.target.value))}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select
              className={styles.input}
              value={form.status || "active"}
              onChange={(e) => set("status", e.target.value as AdminProduct["status"])}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={form.description || ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className={styles.modalActions}>
          <button className={`${styles.btn} ${styles.ghost}`} onClick={onClose}>
            Cancel
          </button>
          <button
            className={`${styles.btn} ${styles.primary}`}
            onClick={save}
            disabled={busy}
          >
            {busy ? "Saving…" : "Save product"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Orders --------------------------------- */

const NEXT_STATUS: Record<string, string | null> = {
  pending: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

function OrdersTab({ token, store }: { token: string; store: AdminStore }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .orders(token, store._id)
      .then(({ orders }) => setOrders(orders))
      .finally(() => setLoading(false));
  }, [token, store._id]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    await api.updateOrderStatus(token, store._id, id, status);
    load();
  }

  if (loading) return <p className={styles.sub}>Loading orders…</p>;

  return (
    <div>
      <h2 className={styles.h}>Orders</h2>
      <p className={styles.sub}>Cash-on-delivery orders from your storefront.</p>
      {orders.length === 0 ? (
        <p className={styles.sub}>No orders yet.</p>
      ) : (
        orders.map((o) => {
          const next = NEXT_STATUS[o.status];
          return (
            <div key={o._id} className={styles.order}>
              <div className={styles.orderTop}>
                <div>
                  <div className={styles.orderWho}>
                    {o.customer.name} · {o.customer.phone}
                  </div>
                  <div className={styles.orderMeta}>
                    {o.customer.address}, {o.customer.city} ·{" "}
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className={styles.orderTotal}>PKR {o.total.toLocaleString()}</div>
              </div>
              <ul className={styles.orderItems}>
                {o.items.map((i, idx) => (
                  <li key={idx}>
                    {i.qty} × {i.title} — PKR {(i.price * i.qty).toLocaleString()}
                  </li>
                ))}
              </ul>
              <div className={styles.statusRow}>
                <span className={`${styles.statusBadge} ${styles["s_" + o.status]}`}>
                  {o.status}
                </span>
                {next ? (
                  <button
                    className={`${styles.btn} ${styles.primary}`}
                    onClick={() => setStatus(o._id, next)}
                  >
                    Mark {next}
                  </button>
                ) : null}
                {o.status !== "cancelled" && o.status !== "delivered" ? (
                  <button
                    className={`${styles.btn} ${styles.danger}`}
                    onClick={() => setStatus(o._id, "cancelled")}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ------------------------------ Appearance ------------------------------- */

function AppearanceTab({ token, store }: { token: string; store: AdminStore }) {
  const [page, setPage] = useState<AdminPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.getPage(token, store._id, "home").then(({ page }) => setPage(page));
  }, [token, store._id]);

  if (!page) return <p className={styles.sub}>Loading page…</p>;

  const heroIdx = page.sections.findIndex((s) => s.type === "hero");
  const hero = page.sections[heroIdx];
  const content = (hero?.content || {}) as Record<string, string>;

  function setHero(key: string, value: string) {
    setPage((p) => {
      if (!p) return p;
      const sections = p.sections.map((s, i) =>
        i === heroIdx ? { ...s, content: { ...s.content, [key]: value } } : s
      );
      return { ...p, sections };
    });
  }

  // ---- navbar (logo + links) ----
  const navIdx = page.sections.findIndex((s) => s.type === "navbar");
  const navContent = (page.sections[navIdx]?.content || {}) as {
    logo?: string;
    links?: { label: string; href: string }[];
  };
  const links = navContent.links || [];

  function setNav(nextContent: Record<string, unknown>) {
    setPage((p) => {
      if (!p) return p;
      const sections = p.sections.map((s, i) =>
        i === navIdx ? { ...s, content: nextContent } : s
      );
      return { ...p, sections };
    });
  }
  function setLink(i: number, key: "label" | "href", value: string) {
    setNav({ ...navContent, links: links.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)) });
  }
  function addLink() {
    setNav({ ...navContent, links: [...links, { label: "New link", href: "/" }] });
  }
  function removeLink(i: number) {
    setNav({ ...navContent, links: links.filter((_, idx) => idx !== i) });
  }
  function moveLink(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    setNav({ ...navContent, links: next });
  }

  async function save() {
    if (!page) return;
    setBusy(true);
    setMsg("");
    try {
      await api.updatePage(token, store._id, "home", page.sections);
      setMsg("Saved! Refresh your storefront to see changes.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        style={{
          background: "#15233f",
          border: "1px solid #243049",
          borderRadius: 12,
          padding: 16,
          marginBottom: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>🎨 Theme editor</div>
          <div className={styles.sub} style={{ margin: 0 }}>
            Customize colors, fonts, spacing & layout — with live preview per device.
          </div>
        </div>
        <a
          className={`${styles.btn} ${styles.primary}`}
          href={`/admin/theme?store=${store._id}`}
        >
          Open editor →
        </a>
      </div>

      {msg ? <div className={styles.ok}>{msg}</div> : null}

      {navIdx >= 0 ? (
        <>
          <h2 className={styles.h}>Navbar</h2>
          <p className={styles.sub}>Your store name and the links shown in the top menu.</p>

          <div className={styles.field}>
            <label className={styles.label}>Logo / store name text</label>
            <input
              className={styles.input}
              value={navContent.logo || ""}
              onChange={(e) => setNav({ ...navContent, logo: e.target.value })}
            />
          </div>

          <datalist id="nav-targets">
            <option value="/">Home</option>
            <option value="/blog">Blog</option>
            <option value="#products">Products section</option>
          </datalist>

          <label className={styles.label}>Links</label>
          {links.length === 0 ? (
            <p className={styles.sub} style={{ marginTop: 4 }}>
              No links yet. A “Blog” link is shown automatically until you add your own.
            </p>
          ) : null}
          {links.map((l, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}
            >
              <input
                className={styles.input}
                style={{ flex: 1 }}
                value={l.label}
                placeholder="Label (e.g. Home)"
                onChange={(e) => setLink(i, "label", e.target.value)}
              />
              <input
                className={styles.input}
                style={{ flex: 1 }}
                list="nav-targets"
                value={l.href}
                placeholder="Target (/ , /blog, #products)"
                onChange={(e) => setLink(i, "href", e.target.value)}
              />
              <button
                className={`${styles.btn} ${styles.ghost}`}
                onClick={() => moveLink(i, -1)}
                disabled={i === 0}
                title="Move up"
              >
                ↑
              </button>
              <button
                className={`${styles.btn} ${styles.ghost}`}
                onClick={() => moveLink(i, 1)}
                disabled={i === links.length - 1}
                title="Move down"
              >
                ↓
              </button>
              <button
                className={`${styles.btn} ${styles.danger}`}
                onClick={() => removeLink(i)}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className={`${styles.btn} ${styles.ghost}`}
            onClick={addLink}
            style={{ marginTop: 4 }}
          >
            + Add link
          </button>

          <p className={styles.sub} style={{ marginTop: 10, fontSize: 12 }}>
            Tip: use <code>/</code> for home, <code>/blog</code> for the blog, or{" "}
            <code>#products</code> to jump to products. External links (https://…) also work.
          </p>

          <hr style={{ border: "none", borderTop: "1px solid #243049", margin: "26px 0" }} />
        </>
      ) : null}

      <h2 className={styles.h}>Hero content</h2>
      <p className={styles.sub}>The big banner text & image at the top of your store.</p>

      <div className={styles.field}>
        <label className={styles.label}>Hero image</label>
        <div
          className={styles.heroPreview}
          style={content.image ? { backgroundImage: `url(${content.image})` } : undefined}
        >
          {!content.image ? "No image yet" : null}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <ImageUploader
            token={token}
            storeId={store._id}
            label={content.image ? "Replace image" : "Upload image"}
            onUploaded={(url) => setHero("image", url)}
          />
          {content.image ? (
            <button
              className={`${styles.btn} ${styles.danger}`}
              onClick={() => setHero("image", "")}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Heading</label>
        <input
          className={styles.input}
          value={content.heading || ""}
          onChange={(e) => setHero("heading", e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Subtext</label>
        <input
          className={styles.input}
          value={content.subtext || ""}
          onChange={(e) => setHero("subtext", e.target.value)}
        />
      </div>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>Button text</label>
          <input
            className={styles.input}
            value={content.ctaText || ""}
            onChange={(e) => setHero("ctaText", e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Button link</label>
          <input
            className={styles.input}
            value={content.ctaLink || ""}
            onChange={(e) => setHero("ctaLink", e.target.value)}
          />
        </div>
      </div>

      <button className={`${styles.btn} ${styles.primary}`} onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

/* --------------------------------- Blog ---------------------------------- */

const blankPost: Partial<AdminBlogPost> = {
  title: "",
  slug: "",
  excerpt: "",
  coverImage: "",
  contentMarkdown: "",
  status: "draft",
};

function BlogTab({ token, store }: { token: string; store: AdminStore }) {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [editing, setEditing] = useState<Partial<AdminBlogPost> | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.posts(token, store._id).then(({ posts }) => setPosts(posts));
  }, [token, store._id]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    await api.deletePost(token, store._id, id);
    load();
  }

  if (editing) {
    return (
      <PostEditor
        token={token}
        store={store}
        post={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
        onError={setError}
      />
    );
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.count}>{posts.length} posts</div>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => setEditing({ ...blankPost })}
        >
          + New post
        </button>
      </div>
      {error ? <div className={styles.error}>{error}</div> : null}
      {posts.length === 0 ? (
        <p className={styles.sub}>No posts yet. Write your first one!</p>
      ) : (
        posts.map((p) => (
          <div key={p._id} className={styles.postRow}>
            {p.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.postThumb} src={p.coverImage} alt="" />
            ) : (
              <div className={styles.postThumb} />
            )}
            <div className={styles.postInfo}>
              <div className={styles.postName}>{p.title}</div>
              <div className={styles.postSub}>
                <span
                  className={`${styles.statusBadge} ${
                    p.status === "published" ? styles.s_delivered : styles.s_pending
                  }`}
                >
                  {p.status}
                </span>{" "}
                · /blog/{p.slug}
              </div>
            </div>
            {p.status === "published" ? (
              <a
                className={`${styles.btn} ${styles.ghost}`}
                href={`/store/${store.subdomain}/blog/${p.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                View
              </a>
            ) : null}
            <button className={`${styles.btn} ${styles.ghost}`} onClick={() => setEditing(p)}>
              Edit
            </button>
            <button className={`${styles.btn} ${styles.danger}`} onClick={() => remove(p._id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function PostEditor({
  token,
  store,
  post,
  onCancel,
  onSaved,
  onError,
}: {
  token: string;
  store: AdminStore;
  post: Partial<AdminBlogPost>;
  onCancel: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [form, setForm] = useState<Partial<AdminBlogPost>>({ ...post });
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const isEdit = Boolean(post._id);

  function set<K extends keyof AdminBlogPost>(k: K, v: AdminBlogPost[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // insert markdown image at the cursor position in the body textarea
  function insertImage(url: string) {
    const ta = taRef.current;
    const md = `\n![image](${url})\n`;
    const cur = form.contentMarkdown || "";
    if (!ta) return set("contentMarkdown", cur + md);
    const start = ta.selectionStart ?? cur.length;
    set("contentMarkdown", cur.slice(0, start) + md + cur.slice(start));
  }

  async function save(status: "draft" | "published") {
    if (!form.title) {
      onError("Title is required");
      return;
    }
    setBusy(true);
    try {
      const body = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        coverImage: form.coverImage,
        contentMarkdown: form.contentMarkdown,
        status,
      };
      if (isEdit) await api.updatePost(token, store._id, post._id!, body);
      else await api.createPost(token, store._id, body);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Save failed");
      setBusy(false);
    }
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <h2 className={styles.h}>{isEdit ? "Edit post" : "New post"}</h2>
        <button className={`${styles.btn} ${styles.ghost}`} onClick={onCancel}>
          ← Back
        </button>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Title</label>
        <input
          className={styles.input}
          value={form.title || ""}
          onChange={(e) => set("title", e.target.value)}
          placeholder="5 Makeup Tips for Summer"
        />
      </div>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>URL slug (optional)</label>
          <input
            className={styles.input}
            value={form.slug || ""}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="auto from title"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Cover image</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {form.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.coverImage}
                alt=""
                style={{ width: 54, height: 36, objectFit: "cover", borderRadius: 6 }}
              />
            ) : null}
            <ImageUploader
              token={token}
              storeId={store._id}
              label={form.coverImage ? "Replace" : "Upload cover"}
              onUploaded={(url) => set("coverImage", url)}
            />
          </div>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Excerpt</label>
        <input
          className={styles.input}
          value={form.excerpt || ""}
          onChange={(e) => set("excerpt", e.target.value)}
          placeholder="Short summary shown in the blog list"
        />
      </div>

      <div className={styles.field}>
        <div className={styles.paneLabel}>
          <span>Content (Markdown)</span>
          <ImageUploader
            token={token}
            storeId={store._id}
            label="+ Insert image"
            onUploaded={insertImage}
          />
        </div>
        <div className={styles.mdEditor}>
          <textarea
            ref={taRef}
            className={styles.mdTextarea}
            value={form.contentMarkdown || ""}
            onChange={(e) => set("contentMarkdown", e.target.value)}
            placeholder={"# Heading\n\nWrite your post in **markdown**.\n\n- bullet\n- list"}
          />
          <div className={styles.mdPane}>
            <div className={styles.paneLabel}>Preview</div>
            <div className={styles.mdPreview}>
              <Markdown>{form.contentMarkdown || "*Nothing to preview yet.*"}</Markdown>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          className={`${styles.btn} ${styles.ghost}`}
          onClick={() => save("draft")}
          disabled={busy}
        >
          Save draft
        </button>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => save("published")}
          disabled={busy}
        >
          {busy ? "Saving…" : "Publish"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- Settings -------------------------------- */

function SettingsTab({
  token,
  store,
  onSaved,
}: {
  token: string;
  store: AdminStore;
  onSaved: (s: AdminStore) => void;
}) {
  const [form, setForm] = useState({
    name: store.name,
    contactPhone: store.contactPhone || "",
    contactEmail: store.contactEmail || "",
    whatsapp: store.settings?.whatsapp || "",
    line: store.address?.line || "",
    city: store.address?.city || "",
    mapUrl: store.address?.mapUrl || "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const { store: updated } = await api.updateStore(token, store._id, {
        name: form.name,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        address: { line: form.line, city: form.city, mapUrl: form.mapUrl },
        settings: { ...store.settings, whatsapp: form.whatsapp },
      });
      onSaved(updated);
      setMsg("Settings saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className={styles.h}>Store settings</h2>
      <p className={styles.sub}>Contact details and address shown on your storefront.</p>
      {msg ? <div className={styles.ok}>{msg}</div> : null}

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
            placeholder="+92 300 1234567"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>WhatsApp</label>
          <input
            className={styles.input}
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="+92 300 1234567"
          />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Contact email</label>
        <input
          className={styles.input}
          value={form.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
          placeholder="hello@yourstore.pk"
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Address</label>
        <input
          className={styles.input}
          value={form.line}
          onChange={(e) => set("line", e.target.value)}
          placeholder="Shop 12, Main Boulevard"
        />
      </div>
      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>City</label>
          <input className={styles.input} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Lahore" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Google Maps link</label>
          <input className={styles.input} value={form.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} placeholder="https://maps.app.goo.gl/…" />
        </div>
      </div>

      <button className={`${styles.btn} ${styles.primary}`} onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
