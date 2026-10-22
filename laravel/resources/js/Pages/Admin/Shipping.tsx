import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { Globe, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { AdminLayout, firstError } from "@/components/admin/AdminLayout";
import { countryName, countryOptions } from "@/lib/countries";
import { formatMoney, toMajorInput } from "@/lib/money";
import { dayRange } from "@/lib/shipping";
import type { AdminPageProps, AdminStore, ProcessingDays, ShippingZone } from "@/types/admin";
import styles from "./admin.module.css";

// Form values are strings so amounts can hold "4.99" while typing.
type RateForm = { name: string; price: string; freeOver: string; minDays: string; maxDays: string };
type ZoneForm = { id?: number; name: string; countries: string[]; rates: RateForm[] };

const blankRate: RateForm = { name: "Standard shipping", price: "0", freeOver: "", minDays: "3", maxDays: "7" };

export default function Shipping({
  store,
  stores,
  zones,
  processingDays,
}: AdminPageProps & { zones: ShippingZone[]; processingDays: ProcessingDays }) {
  const [editing, setEditing] = useState<ZoneForm | null>(null);
  const money = (n: number) => formatMoney(n, store.currency);

  function edit(zone: ShippingZone) {
    setEditing({
      id: zone.id,
      name: zone.name,
      countries: zone.countries,
      rates: zone.rates.map((r) => ({
        name: r.name,
        price: toMajorInput(r.price, store.currency),
        freeOver: toMajorInput(r.freeOver, store.currency),
        minDays: r.minDays == null ? "" : String(r.minDays),
        maxDays: r.maxDays == null ? "" : String(r.maxDays),
      })),
    });
  }

  function remove(zone: ShippingZone) {
    if (!confirm(`Remove “${zone.name}”? Buyers in its countries won't be able to check out.`)) return;
    router.delete(`/admin/stores/${store.id}/shipping/zones/${zone.id}`, { preserveScroll: true });
  }

  return (
    <AdminLayout store={store} stores={stores} tab="shipping" title="Shipping">
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.h}>Shipping</h2>
          <p className={styles.sub} style={{ margin: 0 }}>
            Choose where you ship and what it costs. Buyers in countries not listed here can&apos;t check out.
          </p>
        </div>
        <button
          className={`${styles.btn} ${styles.primary}`}
          onClick={() => setEditing({ name: "", countries: [], rates: [{ ...blankRate }] })}
        >
          <Plus size={16} /> Add zone
        </button>
      </div>

      {zones.length === 0 ? (
        <div className={styles.error}>You don&apos;t ship anywhere yet, so nobody can check out. Add a shipping zone.</div>
      ) : null}

      {zones.map((zone) => (
        <div key={zone.id} className={styles.order}>
          <div className={styles.orderTop}>
            <div>
              <div className={styles.orderWho} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Globe size={18} /> {zone.name}
              </div>
              <div className={styles.orderMeta}>
                {zone.countries.length <= 6
                  ? zone.countries.map(countryName).join(", ")
                  : `${zone.countries.slice(0, 5).map(countryName).join(", ")} +${zone.countries.length - 5} more`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={`${styles.btn} ${styles.ghost}`} onClick={() => edit(zone)}>
                <Pencil size={15} /> Edit
              </button>
              <button className={`${styles.btn} ${styles.danger}`} onClick={() => remove(zone)} aria-label={`Remove ${zone.name}`}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <ul className={styles.orderItems}>
            {zone.rates.map((rate) => (
              <li key={rate.id}>
                <strong>{rate.name}</strong> — {rate.price === 0 ? "Free" : money(rate.price)}
                {rate.freeOver != null ? ` · free over ${money(rate.freeOver)}` : ""}
                {dayRange(rate.minDays, rate.maxDays) ? ` · ${dayRange(rate.minDays, rate.maxDays)} in transit` : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <ProcessingTime store={store} initial={processingDays} />

      {editing ? (
        <ZoneEditor
          store={store}
          zone={editing}
          takenElsewhere={zones.filter((z) => z.id !== editing.id).flatMap((z) => z.countries)}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </AdminLayout>
  );
}

function ProcessingTime({ store, initial }: { store: AdminStore; initial: ProcessingDays }) {
  const [min, setMin] = useState(String(initial.min));
  const [max, setMax] = useState(String(initial.max));
  const [error, setError] = useState("");

  function save() {
    setError("");
    router.patch(
      `/admin/stores/${store.id}/shipping/processing`,
      { min, max },
      { preserveScroll: true, onError: (errors) => setError(firstError(errors)) }
    );
  }

  return (
    <div className={styles.order} style={{ marginTop: 26 }}>
      <div className={styles.orderWho}>Processing time</div>
      <p className={styles.sub}>How many days you need to prepare an order before it ships. Shown to buyers with the delivery estimate.</p>
      {error ? <div className={styles.error}>{error}</div> : null}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className={styles.field} style={{ margin: 0 }}>
          <label className={styles.label}>From (days)</label>
          <input className={styles.input} type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} style={{ width: 110 }} />
        </div>
        <div className={styles.field} style={{ margin: 0 }}>
          <label className={styles.label}>To (days)</label>
          <input className={styles.input} type="number" min="0" value={max} onChange={(e) => setMax(e.target.value)} style={{ width: 110 }} />
        </div>
        <button className={`${styles.btn} ${styles.primary}`} onClick={save}>
          Save
        </button>
      </div>
    </div>
  );
}

function ZoneEditor({
  store,
  zone,
  takenElsewhere,
  onClose,
}: {
  store: AdminStore;
  zone: ZoneForm;
  takenElsewhere: string[];
  onClose: () => void;
}) {
  const [form, setForm] = useState<ZoneForm>(zone);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const taken = useMemo(() => new Set(takenElsewhere), [takenElsewhere]);
  const selected = useMemo(() => new Set(form.countries), [form.countries]);
  const visible = countryOptions().filter(
    (c) => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.code === query.toUpperCase()
  );

  function toggle(code: string) {
    setForm((f) => ({
      ...f,
      countries: f.countries.includes(code) ? f.countries.filter((c) => c !== code) : [...f.countries, code],
    }));
  }

  function setRate(i: number, k: keyof RateForm, v: string) {
    setForm((f) => ({ ...f, rates: f.rates.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)) }));
  }

  function save() {
    setError("");
    setBusy(true);
    const data = {
      name: form.name,
      countries: form.countries,
      rates: form.rates.map((r) => ({
        name: r.name,
        price: r.price || "0",
        freeOver: r.freeOver || null,
        minDays: r.minDays === "" ? null : r.minDays,
        maxDays: r.maxDays === "" ? null : r.maxDays,
      })),
    };
    const options = {
      preserveScroll: true,
      onSuccess: onClose,
      onError: (errors: Record<string, string>) => setError(firstError(errors)),
      onFinish: () => setBusy(false),
    };
    if (form.id) router.patch(`/admin/stores/${store.id}/shipping/zones/${form.id}`, data, options);
    else router.post(`/admin/stores/${store.id}/shipping/zones`, data, options);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.toolbar} style={{ marginBottom: 12 }}>
          <h2 className={styles.h}>{form.id ? "Edit shipping zone" : "New shipping zone"}</h2>
          <button className={`${styles.btn} ${styles.ghost}`} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.field}>
          <label className={styles.label}>Zone name</label>
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. United States, Europe, Worldwide"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Countries ({form.countries.length} selected)
          </label>
          {form.countries.length > 0 ? (
            <div className={styles.chips}>
              {form.countries.map((code) => (
                <button key={code} type="button" className={styles.chip} onClick={() => toggle(code)}>
                  {countryName(code)} <X size={12} />
                </button>
              ))}
            </div>
          ) : null}
          <div className={styles.searchBox}>
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search countries" />
          </div>
          <div className={styles.countryList}>
            {visible.map((c) => (
              <label key={c.code} className={`${styles.countryRow} ${taken.has(c.code) ? styles.countryTaken : ""}`}>
                <input
                  type="checkbox"
                  checked={selected.has(c.code)}
                  disabled={taken.has(c.code)}
                  onChange={() => toggle(c.code)}
                />
                {c.name}
                {taken.has(c.code) ? <span className={styles.countryNote}>in another zone</span> : null}
              </label>
            ))}
          </div>
        </div>

        <label className={styles.label}>Rates buyers can choose ({store.currency})</label>
        {form.rates.map((rate, i) => (
          <div key={i} className={styles.rateRow}>
            <input className={styles.input} value={rate.name} onChange={(e) => setRate(i, "name", e.target.value)} placeholder="Name, e.g. Express" />
            <input className={styles.input} type="number" min="0" step="any" value={rate.price} onChange={(e) => setRate(i, "price", e.target.value)} placeholder="Price (0 = free)" title="Price — 0 for free shipping" />
            <input className={styles.input} type="number" min="0" step="any" value={rate.freeOver} onChange={(e) => setRate(i, "freeOver", e.target.value)} placeholder="Free over (optional)" title="Free when the order subtotal reaches this" />
            <input className={styles.input} type="number" min="0" value={rate.minDays} onChange={(e) => setRate(i, "minDays", e.target.value)} placeholder="Min days" title="Shortest transit time" />
            <input className={styles.input} type="number" min="0" value={rate.maxDays} onChange={(e) => setRate(i, "maxDays", e.target.value)} placeholder="Max days" title="Longest transit time" />
            <button
              className={`${styles.btn} ${styles.danger}`}
              onClick={() => setForm((f) => ({ ...f, rates: f.rates.filter((_, idx) => idx !== i) }))}
              disabled={form.rates.length === 1}
              aria-label="Remove rate"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <p className={styles.sub} style={{ fontSize: 12 }}>
          Columns: name · price (0 = free) · free over · min / max days in transit.
        </p>
        <button
          className={`${styles.btn} ${styles.ghost}`}
          onClick={() => setForm((f) => ({ ...f, rates: [...f.rates, { ...blankRate, name: "Express shipping", minDays: "1", maxDays: "2" }] }))}
          disabled={form.rates.length >= 10}
        >
          <Plus size={15} /> Add rate
        </button>

        <div className={styles.modalActions}>
          <button className={`${styles.btn} ${styles.ghost}`} onClick={onClose}>
            Cancel
          </button>
          <button className={`${styles.btn} ${styles.primary}`} onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save zone"}
          </button>
        </div>
      </div>
    </div>
  );
}
