"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import { api } from "@/lib/client";
import styles from "./cart.module.css";

function money(n: number, currency: string) {
  return `${currency} ${n.toLocaleString()}`;
}

export function CartWidget({ subdomain }: { subdomain: string }) {
  const { items, count, subtotal, currency, setQty, remove, clear, open, setOpen } =
    useCart();

  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ total: number } | null>(null);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function placeOrder() {
    setError("");
    if (!form.name || !form.phone || !form.address || !form.city) {
      setError("Please fill in name, phone, address and city.");
      return;
    }
    setBusy(true);
    try {
      const order = await api.placeOrder(subdomain, {
        customer: form,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      });
      setPlaced({ total: order.total });
      clear();
      setForm({ name: "", phone: "", address: "", city: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className={styles.fab} onClick={() => setOpen(true)}>
        🛒 Cart
        {count > 0 ? <span className={styles.fabCount}>{count}</span> : null}
      </button>

      {open ? (
        <>
          <div
            className={styles.overlay}
            onClick={() => {
              setOpen(false);
              setPlaced(null);
            }}
          />
          <aside className={styles.drawer}>
            <div className={styles.head}>
              <h3>{placed ? "Order placed" : "Your cart"}</h3>
              <button
                className={styles.close}
                onClick={() => {
                  setOpen(false);
                  setPlaced(null);
                }}
              >
                ×
              </button>
            </div>

            {placed ? (
              <div className={styles.success}>
                <div className={styles.successIcon}>✅</div>
                <div className={styles.successTitle}>Thank you!</div>
                <p className={styles.successText}>
                  Your order of {money(placed.total, currency)} is confirmed.
                  <br />
                  Pay <strong>cash on delivery</strong>. We&apos;ll call you to
                  confirm.
                </p>
                <button
                  className={styles.successBtn}
                  onClick={() => {
                    setOpen(false);
                    setPlaced(null);
                  }}
                >
                  Continue shopping
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className={styles.body}>
                <p className={styles.empty}>Your cart is empty.</p>
              </div>
            ) : (
              <>
                <div className={styles.body}>
                  {items.map((i) => (
                    <div key={i.productId} className={styles.item}>
                      {i.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className={styles.itemImg} src={i.image} alt={i.title} />
                      ) : (
                        <div className={styles.itemImg} />
                      )}
                      <div className={styles.itemMain}>
                        <p className={styles.itemTitle}>{i.title}</p>
                        <span className={styles.itemPrice}>
                          {money(i.price, currency)}
                        </span>
                        <div className={styles.qtyRow}>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => setQty(i.productId, i.qty - 1)}
                          >
                            −
                          </button>
                          <span className={styles.qtyNum}>{i.qty}</span>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => setQty(i.productId, i.qty + 1)}
                          >
                            +
                          </button>
                          <button
                            className={styles.removeBtn}
                            onClick={() => remove(i.productId)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.foot}>
                  <div className={styles.subtotal}>
                    <span>Subtotal</span>
                    <span>{money(subtotal, currency)}</span>
                  </div>
                  {error ? <div className={styles.error}>{error}</div> : null}
                  <div className={styles.field}>
                    <input
                      className={styles.input}
                      placeholder="Full name"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <input
                      className={styles.input}
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <input
                      className={styles.input}
                      placeholder="Delivery address"
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <input
                      className={styles.input}
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                    />
                  </div>
                  <button
                    className={styles.placeBtn}
                    onClick={placeOrder}
                    disabled={busy}
                  >
                    {busy ? "Placing order…" : `Place order · ${money(subtotal, currency)}`}
                  </button>
                  <p className={styles.cod}>💵 Cash on delivery — no payment now</p>
                </div>
              </>
            )}
          </aside>
        </>
      ) : null}
    </>
  );
}
