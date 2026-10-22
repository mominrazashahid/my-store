import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, CircleCheck, Store } from "lucide-react";
import { addressLines } from "@/lib/address";
import { formatMoney } from "@/lib/money";
import type { OrderAddress } from "@/types/admin";
import styles from "./checkout.module.css";

type PlacedOrder = {
  id: number;
  store: { name: string; subdomain: string };
  currency: string;
  email: string;
  phone: string;
  subtotal: number;
  shippingCost: number;
  shippingMethod?: string | null;
  total: number;
  shippingAddress: OrderAddress;
  items: { title: string; price: number; qty: number }[];
};

// /checkout/complete — confirmation for the visitor's latest checkout, which
// may have created one order per store. Only the buyer's session can see it.
export default function CheckoutComplete({ orders }: { orders: PlacedOrder[] }) {
  const first = orders[0];

  return (
    <div className={styles.page}>
      <Head title="Order confirmed" />
      <header className={styles.header}>
        <Link href="/" className={styles.storeName}>
          Store<span style={{ color: "var(--accent)" }}>Builder</span>
        </Link>
      </header>
      <div className={styles.confirm}>
        <div className={styles.confirmIcon}>
          <CircleCheck size={56} strokeWidth={1.5} />
        </div>
        <h1>Thank you for your order!</h1>
        <p>
          {orders.length === 1
            ? `Your order #${first.id} from ${first.store.name} is confirmed.`
            : `You placed ${orders.length} orders, one per store. Each store ships its own items.`}{" "}
          The store{orders.length === 1 ? "" : "s"} will contact you at {first.phone} to arrange delivery. Pay in cash when
          your items arrive.
        </p>

        <div className={styles.confirmCard}>
          {orders.map((order) => {
            const money = (n: number) => formatMoney(n, order.currency);
            return (
              <div key={order.id} className={styles.confirmOrder}>
                <h3 style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Store size={14} /> {order.store.name} · Order #{order.id}
                </h3>
                {order.items.map((item, i) => (
                  <div key={i}>
                    {item.qty} × {item.title} — {money(item.price * item.qty)}
                  </div>
                ))}
                <div>
                  {order.shippingMethod ?? "Shipping"} — {order.shippingCost === 0 ? "Free" : money(order.shippingCost)}
                </div>
                <div>
                  <strong>Pay on delivery: {money(order.total)}</strong>
                </div>
              </div>
            );
          })}
          <div>
            <h3>Shipping to</h3>
            {addressLines(first.shippingAddress).map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
          <div>
            <h3>Contact</h3>
            <div>{first.email}</div>
            <div>{first.phone}</div>
          </div>
        </div>

        <Link href="/" className={styles.primaryBtn} style={{ width: "auto", padding: "14px 26px" }}>
          <ArrowLeft size={18} /> Continue shopping
        </Link>
      </div>
    </div>
  );
}
