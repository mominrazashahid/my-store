import { useState, type FormEvent } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Ban, Banknote, CreditCard, Image as ImageIcon, Lock, Store } from "lucide-react";
import {
  POSTAL_REQUIRED,
  STATE_REQUIRED,
  countryName,
  countryOptions,
  postalLabel,
  stateLabel,
} from "@/lib/countries";
import { Select } from "@/components/ui/Select";
import { formatMoney } from "@/lib/money";
import { deliveryEstimate, rateCost } from "@/lib/shipping";
import type { ProcessingDays, ShippingRate } from "@/types/admin";
import type { CartGroup, CartSummary } from "@/types/cart";
import styles from "./checkout.module.css";

type Address = {
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type Errors = Record<string, string>;

type StoreShipping = {
  zones: { countries: string[]; rates: ShippingRate[] }[];
  processingDays: ProcessingDays;
};

const blankAddress = (country: string): Address => ({
  firstName: "",
  lastName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country,
});

// /checkout — one checkout for the marketplace cart, one currency at a time.
// Each store is checked against the shipping address on its own: stores that
// ship there get an order each; the rest stay in the cart.
export default function Checkout({
  currency,
  currencies,
  shipping: storeShipping,
  codCountries,
  defaultCountry,
}: {
  currency: string | null;
  currencies: string[];
  shipping: Record<string, StoreShipping>;
  codCountries: string[];
  // the shopper's chosen country, or a guess from their browser, for the address form
  defaultCountry: string;
}) {
  const cart = usePage<{ cart: CartSummary }>().props.cart;
  const groups = cart.groups.filter((g) => g.store.currency === currency);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shipping, setShipping] = useState<Address>(() => blankAddress(defaultCountry));
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<Address>(() => blankAddress(defaultCountry));
  const [notes, setNotes] = useState("");
  const [chosenRates, setChosenRates] = useState<Record<number, number>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const money = (n: number) => formatMoney(n, currency ?? "USD");

  // per store: the zone covering the shipping country and the chosen rate
  const plans = groups.map((group) => {
    const zone = storeShipping[group.store.id]?.zones.find((z) => z.countries.includes(shipping.country));
    const rates = zone?.rates ?? [];
    const rate = rates.find((r) => r.id === chosenRates[group.store.id]) ?? rates[0];
    const cost = rate ? rateCost(rate, group.subtotal) : 0;
    return { group, rates, rate, cost, ships: Boolean(zone && rate) };
  });
  const shippable = plans.filter((p) => p.ships);
  const total = shippable.reduce((sum, p) => sum + p.group.subtotal + p.cost, 0);
  const codAllowed = codCountries.includes(shipping.country);
  const canPlaceOrder = shippable.length > 0 && codAllowed;

  function submit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    router.post(
      "/checkout",
      {
        email,
        phone,
        shipping,
        billingSameAsShipping: billingSame,
        billing: billingSame ? null : billing,
        notes,
        currency,
        shippingRates: Object.fromEntries(shippable.map((p) => [p.group.store.id, p.rate!.id])),
      },
      {
        preserveScroll: true,
        onError: (errs) => {
          setErrors(errs);
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        onFinish: () => setBusy(false),
      }
    );
  }

  const header = (
    <header className={styles.header}>
      <Link href="/" className={styles.storeName}>
        Store<span style={{ color: "var(--accent)" }}>Builder</span>
      </Link>
      <span className={styles.secure}>
        <Lock size={14} /> Secure checkout
      </span>
    </header>
  );

  if (groups.length === 0) {
    return (
      <div className={styles.page}>
        <Head title="Checkout" />
        {header}
        <div className={styles.emptyCart}>
          <h1>Your cart is empty</h1>
          <Link href="/" className={styles.primaryBtn}>
            <ArrowLeft size={18} /> Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const errorList = Object.values(errors);
  const skippedCount = plans.length - shippable.length;
  const unshippableNames = plans.filter((p) => !p.ships).map((p) => p.group.store.name);

  return (
    <div className={styles.page}>
      <Head title="Checkout" />
      {header}
      <form className={styles.layout} onSubmit={submit} noValidate>
        <div className={styles.formCol}>
          {currencies.length > 1 ? (
            <div className={styles.currencyNote}>
              Your cart has items priced in {currencies.join(" and ")}. Each currency is checked out separately.
              <div className={styles.currencyTabs}>
                {currencies.map((c) => (
                  <Link
                    key={c}
                    href={`/checkout?currency=${c}`}
                    className={`${styles.currencyTab} ${c === currency ? styles.currencyTabActive : ""}`}
                  >
                    {c} items
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {unshippableNames.length > 0 ? (
            <div className={`${styles.notice} ${styles.topNotice}`} role="status">
              <Ban size={20} />
              <p>
                <strong>{listNames(unshippableNames)}</strong>{" "}
                {unshippableNames.length === 1 ? "doesn’t" : "don’t"} ship to {countryName(shipping.country)}.{" "}
                {unshippableNames.length === 1 ? "Its" : "Their"} items stay in your cart and won&apos;t be ordered.
                {shippable.length === 0 ? " Choose another country to place your order." : ""}
              </p>
            </div>
          ) : null}

          {errorList.length > 0 ? (
            <div className={styles.errorBox} role="alert">
              <strong>Please check your details:</strong>
              <ul>
                {errorList.slice(0, 6).map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <section className={styles.section}>
            <h2>Contact</h2>
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="For delivery updates"
              />
            </Field>
          </section>

          <section className={styles.section}>
            <h2>Shipping address</h2>
            <AddressFields prefix="shipping" value={shipping} onChange={setShipping} errors={errors} />
          </section>

          <section className={styles.section}>
            <h2>Shipping</h2>
            <p className={styles.muted} style={{ marginTop: -6, fontSize: 14 }}>
              Each store ships its own items.
            </p>
            {plans.map(({ group, rates, rate, ships }) => (
              <div key={group.store.id} className={styles.storeGroup}>
                <div className={styles.storeGroupHead}>
                  <strong>
                    <Store size={15} /> {group.store.name}
                  </strong>
                  <span className={styles.muted}>
                    {group.items.reduce((n, i) => n + i.qty, 0)} item{group.items.length === 1 && group.items[0].qty === 1 ? "" : "s"}
                  </span>
                </div>
                {errors[`shippingRates.${group.store.id}`] ? (
                  <p className={styles.errorText} style={{ padding: "8px 16px 0" }}>
                    {errors[`shippingRates.${group.store.id}`]}
                  </p>
                ) : null}
                {ships ? (
                  <div className={styles.rates}>
                    {rates.map((r) => {
                      const cost = rateCost(r, group.subtotal);
                      return (
                        <label key={r.id} className={`${styles.rate} ${rate?.id === r.id ? styles.rateActive : ""}`}>
                          <input
                            type="radio"
                            name={`rate-${group.store.id}`}
                            checked={rate?.id === r.id}
                            onChange={() => setChosenRates((c) => ({ ...c, [group.store.id]: r.id }))}
                          />
                          <span className={styles.rateInfo}>
                            <strong>{r.name}</strong>
                            <span className={styles.muted}>
                              {deliveryEstimate(r, storeShipping[group.store.id].processingDays)}
                            </span>
                          </span>
                          <span className={styles.ratePrice}>{cost === 0 ? "Free" : money(cost)}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.unavailable}>
                    <Ban size={18} />
                    <p>
                      Doesn&apos;t ship to <strong>{countryName(shipping.country)}</strong>. These items stay in your
                      cart and won&apos;t be ordered.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </section>

          <section className={styles.section}>
            <h2>Billing address</h2>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} />
              Same as shipping address
            </label>
            {!billingSame ? <AddressFields prefix="billing" value={billing} onChange={setBilling} errors={errors} /> : null}
          </section>

          <section className={styles.section}>
            <h2>Payment</h2>
            {codAllowed ? (
              <div className={styles.payment}>
                <Banknote size={22} />
                <div>
                  <strong>Cash on delivery</strong>
                  <p>Pay each store in cash when its items arrive. No payment is taken now.</p>
                </div>
              </div>
            ) : (
              <div className={styles.notice}>
                <CreditCard size={20} />
                <p>
                  <strong>Card payment is coming soon.</strong> For now, orders can only be paid cash on delivery within
                  Pakistan.
                </p>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <Field label="Order notes (optional)" error={errors.notes}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Delivery instructions, gift message…"
              />
            </Field>
          </section>

          <button type="submit" className={styles.primaryBtn} disabled={busy || !canPlaceOrder}>
            {busy
              ? "Placing order…"
              : skippedCount > 0 && shippable.length > 0
                ? `Place order for ${shippable.length} of ${plans.length} stores · ${money(total)}`
                : `Place order · ${money(total)}`}
          </button>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Continue shopping
          </Link>
        </div>

        <OrderSummary plans={plans} money={money} total={total} />
      </form>
    </div>
  );
}

// ["A"] -> "A", ["A", "B"] -> "A and B", ["A", "B", "C"] -> "A, B and C"
function listNames(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function OrderSummary({
  plans,
  money,
  total,
}: {
  plans: { group: CartGroup; ships: boolean; cost: number }[];
  money: (n: number) => string;
  total: number;
}) {
  return (
    <aside className={styles.summary}>
      <h2>Order summary</h2>
      {plans.map(({ group, ships, cost }) => (
        <div key={group.store.id}>
          <div className={`${styles.summaryStore} ${ships ? "" : styles.summaryStoreSkipped}`}>
            <span>{group.store.name}</span>
            {ships ? null : <span>stays in cart</span>}
          </div>
          {group.items.map((item) => (
            <div key={item.productId} className={`${styles.line} ${ships ? "" : styles.lineSkipped}`}>
              <div className={styles.lineThumb}>
                {item.image ? <img src={item.image} alt="" /> : <ImageIcon size={22} />}
                <span className={styles.lineQty}>{item.qty}</span>
              </div>
              <span className={styles.lineTitle}>{item.title}</span>
              <span>{money(item.price * item.qty)}</span>
            </div>
          ))}
          {ships ? (
            <div className={styles.line} style={{ gridTemplateColumns: "1fr auto" }}>
              <span className={styles.muted}>Shipping</span>
              <span>{cost === 0 ? "Free" : money(cost)}</span>
            </div>
          ) : null}
        </div>
      ))}
      <div className={styles.totals}>
        <div className={styles.grandTotal}>
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
      </div>
    </aside>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className={`${styles.field} ${error ? styles.fieldError : ""}`}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? <span className={styles.errorText}>{error}</span> : null}
    </label>
  );
}

function AddressFields({
  prefix,
  value,
  onChange,
  errors,
}: {
  prefix: "shipping" | "billing";
  value: Address;
  onChange: (a: Address) => void;
  errors: Errors;
}) {
  const set = (k: keyof Address, v: string) => onChange({ ...value, [k]: v });
  const err = (k: keyof Address) => errors[`${prefix}.${k}`];
  const ac = (token: string) => `section-${prefix} ${prefix} ${token}`;
  const needsState = STATE_REQUIRED.includes(value.country);
  const needsPostal = POSTAL_REQUIRED.includes(value.country);

  return (
    <>
      {/* a div, not Field's label: a label would re-click the dropdown's button */}
      <div className={`${styles.field} ${err("country") ? styles.fieldError : ""}`}>
        <span className={styles.label}>Country / region</span>
        <Select
          searchable
          searchPlaceholder="Search countries"
          ariaLabel="Country / region"
          value={value.country}
          onChange={(country) => set("country", country)}
          options={countryOptions().map((c) => ({ value: c.code, label: c.name }))}
        />
        {err("country") ? <span className={styles.errorText}>{err("country")}</span> : null}
      </div>
      <div className={styles.row2}>
        <Field label="First name" error={err("firstName")}>
          <input value={value.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete={ac("given-name")} />
        </Field>
        <Field label="Last name" error={err("lastName")}>
          <input value={value.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete={ac("family-name")} />
        </Field>
      </div>
      <Field label="Address" error={err("line1")}>
        <input
          value={value.line1}
          onChange={(e) => set("line1", e.target.value)}
          autoComplete={ac("address-line1")}
          placeholder="Street address"
        />
      </Field>
      <Field label="Apartment, suite, etc. (optional)" error={err("line2")}>
        <input value={value.line2} onChange={(e) => set("line2", e.target.value)} autoComplete={ac("address-line2")} />
      </Field>
      <div className={styles.row3}>
        <Field label="City" error={err("city")}>
          <input value={value.city} onChange={(e) => set("city", e.target.value)} autoComplete={ac("address-level2")} />
        </Field>
        <Field label={`${stateLabel(value.country)}${needsState ? "" : " (optional)"}`} error={err("state")}>
          <input value={value.state} onChange={(e) => set("state", e.target.value)} autoComplete={ac("address-level1")} />
        </Field>
        <Field label={`${postalLabel(value.country)}${needsPostal ? "" : " (optional)"}`} error={err("postalCode")}>
          <input value={value.postalCode} onChange={(e) => set("postalCode", e.target.value)} autoComplete={ac("postal-code")} />
        </Field>
      </div>
    </>
  );
}
