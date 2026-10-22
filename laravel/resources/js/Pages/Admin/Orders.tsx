import { useState } from "react";
import { router } from "@inertiajs/react";
import { Truck } from "lucide-react";
import { AdminLayout, firstError } from "@/components/admin/AdminLayout";
import { addressLines } from "@/lib/address";
import { formatMoney } from "@/lib/money";
import type { AdminOrder, AdminPageProps, OrderStatus } from "@/types/admin";
import styles from "./admin.module.css";

const ACTION_LABEL: Record<OrderStatus, string> = {
  pending: "Mark pending",
  confirmed: "Confirm",
  shipped: "Mark shipped",
  delivered: "Mark delivered",
  cancelled: "Cancel",
};

export default function Orders({ store, stores, orders }: AdminPageProps & { orders: AdminOrder[] }) {
  const money = (n: number) => formatMoney(n, store.currency);

  return (
    <AdminLayout store={store} stores={stores} tab="orders" title="Orders">
      <h2 className={styles.h}>Orders</h2>
      <p className={styles.sub}>Orders from your storefront. You ship them and collect payment on delivery.</p>
      {orders.length === 0 ? (
        <p className={styles.sub}>No orders yet.</p>
      ) : (
        orders.map((o) => (
          <div key={o.id} className={styles.order}>
            <div className={styles.orderTop}>
              <div>
                <div className={styles.orderWho}>
                  #{o.id} · {o.customer.name}
                </div>
                <div className={styles.orderMeta}>
                  {[o.customer.email, o.customer.phone].filter(Boolean).join(" · ")} ·{" "}
                  {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <div className={styles.orderTotal}>{money(o.total)}</div>
            </div>
            <div className={styles.orderAddresses}>
              <div>
                <div className={styles.label}>Ship to</div>
                {addressLines(o.shippingAddress).map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
              {o.billingAddress ? (
                <div>
                  <div className={styles.label}>Bill to</div>
                  {addressLines(o.billingAddress).map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              ) : null}
            </div>
            {o.notes ? (
              <p className={styles.orderNotes}>
                <strong>Note:</strong> {o.notes}
              </p>
            ) : null}
            <ul className={styles.orderItems}>
              {o.items.map((i, idx) => (
                <li key={idx}>
                  {i.qty} × {i.title} — {money(i.price * i.qty)}
                </li>
              ))}
              <li>
                Shipping{o.shippingMethod ? ` (${o.shippingMethod})` : ""} —{" "}
                {o.shippingCost === 0 ? "Free" : money(o.shippingCost)}
              </li>
            </ul>
            {o.trackingNumber || o.carrier ? (
              <div className={styles.orderShipping} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Truck size={16} /> {[o.carrier, o.trackingNumber].filter(Boolean).join(" · ")}
              </div>
            ) : null}
            <OrderActions storeId={store.id} order={o} />
          </div>
        ))
      )}
    </AdminLayout>
  );
}

function OrderActions({ storeId, order }: { storeId: number; order: AdminOrder }) {
  const [shipping, setShipping] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  function setStatus(status: OrderStatus, extra: Record<string, string> = {}) {
    if (status === "cancelled" && !confirm(`Cancel order #${order.id}? Its items go back into stock.`)) return;
    router.patch(
      `/admin/stores/${storeId}/orders/${order.id}`,
      { status, ...extra },
      { preserveScroll: true, onError: (errors) => alert(firstError(errors)) }
    );
  }

  return (
    <>
      <div className={styles.statusRow}>
        <span className={`${styles.statusBadge} ${styles["s_" + order.status]}`}>{order.status}</span>
        {order.nextStatuses.map((next) => (
          <button
            key={next}
            className={`${styles.btn} ${next === "cancelled" ? styles.danger : styles.primary}`}
            onClick={() => (next === "shipped" ? setShipping(true) : setStatus(next))}
          >
            {ACTION_LABEL[next]}
          </button>
        ))}
      </div>
      {shipping ? (
        <div className={styles.trackingForm}>
          <input
            className={styles.input}
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Carrier (e.g. USPS, DHL, TCS)"
          />
          <input
            className={styles.input}
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Tracking number (optional)"
          />
          <button className={`${styles.btn} ${styles.primary}`} onClick={() => setStatus("shipped", { carrier, trackingNumber })}>
            <Truck size={15} /> Confirm shipped
          </button>
          <button className={`${styles.btn} ${styles.ghost}`} onClick={() => setShipping(false)}>
            Cancel
          </button>
        </div>
      ) : null}
    </>
  );
}
