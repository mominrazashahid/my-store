import { Link } from "@inertiajs/react";
import { ArrowRight, Minus, Plus, ShoppingCart, Store, X } from "lucide-react";
import { useCart } from "./CartContext";
import { formatMoney } from "@/lib/money";
import styles from "./cart.module.css";

// Floating cart button + slide-in drawer showing the marketplace-wide cart,
// grouped by store. Checkout happens on its own page.
export function CartWidget() {
  const { cart, setQty, remove, open, setOpen, error } = useCart();

  return (
    <>
      <button className={styles.fab} onClick={() => setOpen(true)}>
        <ShoppingCart size={18} /> Cart
        {cart.count > 0 ? <span className={styles.fabCount}>{cart.count}</span> : null}
      </button>

      {open ? (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />
          <aside className={styles.drawer} aria-label="Shopping cart">
            <div className={styles.head}>
              <h3>Your cart</h3>
              <button className={styles.close} onClick={() => setOpen(false)} aria-label="Close cart">
                <X size={20} />
              </button>
            </div>

            {cart.groups.length === 0 ? (
              <div className={styles.body}>
                {error ? <div className={styles.error}>{error}</div> : null}
                <p className={styles.empty}>Your cart is empty.</p>
              </div>
            ) : (
              <>
                <div className={styles.body}>
                  {error ? <div className={styles.error}>{error}</div> : null}
                  {cart.groups.map((group) => {
                    const money = (n: number) => formatMoney(n, group.store.currency);
                    return (
                      <section key={group.store.id} className={styles.group}>
                        <a href={`/store/${group.store.subdomain}`} className={styles.groupStore}>
                          <Store size={15} /> {group.store.name}
                        </a>
                        {group.items.map((i) => (
                          <div key={i.productId} className={styles.item}>
                            {i.image ? (
                              <img className={styles.itemImg} src={i.image} alt={i.title} />
                            ) : (
                              <div className={styles.itemImg} />
                            )}
                            <div className={styles.itemMain}>
                              <a href={`/store/${group.store.subdomain}/products/${i.slug}`} className={styles.itemTitle}>
                                {i.title}
                              </a>
                              <span className={styles.itemPrice}>{money(i.price)}</span>
                              <div className={styles.qtyRow}>
                                <button
                                  className={styles.qtyBtn}
                                  onClick={() => setQty(i.productId, i.qty - 1)}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className={styles.qtyNum}>{i.qty}</span>
                                <button
                                  className={styles.qtyBtn}
                                  onClick={() => setQty(i.productId, i.qty + 1)}
                                  disabled={i.qty >= i.stock}
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={14} />
                                </button>
                                <button className={styles.removeBtn} onClick={() => remove(i.productId)}>
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className={styles.groupSubtotal}>
                          <span>Subtotal</span>
                          <span>{money(group.subtotal)}</span>
                        </div>
                      </section>
                    );
                  })}
                </div>

                <div className={styles.foot}>
                  <p className={styles.footNote}>Shipping is calculated per store at checkout.</p>
                  <Link className={styles.placeBtn} href="/checkout" onClick={() => setOpen(false)}>
                    Checkout <ArrowRight size={18} />
                  </Link>
                </div>
              </>
            )}
          </aside>
        </>
      ) : null}
    </>
  );
}
