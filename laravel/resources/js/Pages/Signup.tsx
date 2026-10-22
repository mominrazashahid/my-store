import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
  CURRENCY_OPTIONS,
  STORE_TYPE_OPTIONS,
  guessCurrency,
  slugify,
  type StoreTypeOption,
} from "@/lib/catalog";
import { Select } from "@/components/ui/Select";
import styles from "./Signup.module.css";

// Which wizard step owns each server-side field, so a validation error
// sends the owner back to the step where they can fix it.
const FIELD_STEP: Record<string, number> = {
  name: 1,
  email: 1,
  password: 1,
  storeType: 2,
  storeName: 3,
  subdomain: 3,
  currency: 3,
};

export default function Signup() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // store
  const [storeType, setStoreType] = useState<StoreTypeOption["id"] | "">("");
  const [storeName, setStoreName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [currency, setCurrency] = useState(guessCurrency);

  // keep subdomain in sync with the store name until the user edits it manually
  function onStoreNameChange(v: string) {
    setStoreName(v);
    if (!subdomainEdited) setSubdomain(slugify(v));
  }

  function next() {
    setError("");
    if (step === 1) {
      if (!name || !email || password.length < 6) {
        setError("Enter your name, email, and a password of at least 6 characters.");
        return;
      }
    }
    if (step === 2 && !storeType) {
      setError("Pick what you're selling.");
      return;
    }
    setStep((s) => s + 1);
  }

  function submit() {
    setError("");
    if (!storeName || !subdomain) {
      setError("Enter a store name and a store address.");
      return;
    }
    setBusy(true);
    // Laravel creates the account + store, logs the owner in, and
    // redirects to the live store (see SignupController).
    router.post(
      "/signup",
      { name, email, password, storeType, storeName, subdomain, currency },
      {
        onError: (errors) => {
          const [field, message] = Object.entries(errors)[0] ?? [];
          setError(message || "Something went wrong");
          if (field && FIELD_STEP[field]) setStep(FIELD_STEP[field]);
        },
        onFinish: () => setBusy(false),
      }
    );
  }

  return (
    <main className={styles.page}>
      <Head title="Create your store" />
      <div className={styles.card}>
        <div className={styles.steps}>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`${styles.step} ${n <= step ? styles.stepActive : ""}`}
            />
          ))}
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}

        {step === 1 && (
          <>
            <h1 className={styles.h}>Create your account</h1>
            <p className={styles.sub}>Step 1 of 3 — your details as the store owner.</p>
            <div className={styles.field}>
              <label className={styles.label}>Full name</label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className={styles.row}>
              <button className={`${styles.btn} ${styles.primary}`} onClick={next}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className={styles.h}>What are you selling?</h1>
            <p className={styles.sub}>
              Step 2 of 3 — we&apos;ll set up your store with sample products to get you started.
            </p>
            <div className={styles.field}>
              <label className={styles.label}>Store type</label>
              <div className={styles.typeGrid}>
                {STORE_TYPE_OPTIONS.map((t) => (
                  <div
                    key={t.id}
                    className={`${styles.typeCard} ${
                      storeType === t.id ? styles.typeCardActive : ""
                    }`}
                    onClick={() => setStoreType(t.id)}
                  >
                    <div className={styles.typeEmoji}>
                      <t.icon size={28} strokeWidth={1.75} />
                    </div>
                    <div className={styles.typeLabel}>{t.label}</div>
                    <div className={styles.typeBlurb}>{t.blurb}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <button
                className={`${styles.btn} ${styles.ghost}`}
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button className={`${styles.btn} ${styles.primary}`} onClick={next}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className={styles.h}>Name your store</h1>
            <p className={styles.sub}>Step 3 of 3 — almost done.</p>
            <div className={styles.field}>
              <label className={styles.label}>Store name</label>
              <input
                className={styles.input}
                value={storeName}
                onChange={(e) => onStoreNameChange(e.target.value)}
                placeholder="Glow Beauty"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Store address</label>
              <input
                className={styles.input}
                value={subdomain}
                onChange={(e) => {
                  setSubdomainEdited(true);
                  setSubdomain(slugify(e.target.value));
                }}
                placeholder="glow-beauty"
              />
              <p className={styles.hint}>
                Your store will be at{" "}
                <span className={styles.urlPreview}>
                  /store/{subdomain || "your-store"}
                </span>
              </p>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Currency</label>
              <Select
                className={styles.selectFull}
                searchable
                searchPlaceholder="Search currencies"
                ariaLabel="Currency"
                value={currency}
                onChange={setCurrency}
                options={CURRENCY_OPTIONS.map((c) => ({ value: c.code, label: c.label }))}
              />
              <p className={styles.hint}>Your prices will be shown to shoppers in this currency.</p>
            </div>
            <div className={styles.row}>
              <button
                className={`${styles.btn} ${styles.ghost}`}
                onClick={() => setStep(2)}
                disabled={busy}
              >
                Back
              </button>
              <button
                className={`${styles.btn} ${styles.primary}`}
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Creating…" : "Create my store"}
              </button>
            </div>
          </>
        )}

        <p className={styles.foot}>
          Already have a store? <Link href="/admin">Log in</Link>
        </p>
      </div>
    </main>
  );
}
