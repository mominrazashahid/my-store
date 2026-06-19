"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, saveSession } from "@/lib/client";
import {
  STORE_TYPE_OPTIONS,
  THEMES_BY_TYPE,
  slugify,
  type StoreTypeOption,
} from "@/lib/catalog";
import styles from "./signup.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // store
  const [storeType, setStoreType] = useState<StoreTypeOption["id"] | "">("");
  const [themeId, setThemeId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainEdited, setSubdomainEdited] = useState(false);

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
    if (step === 2 && (!storeType || !themeId)) {
      setError("Pick a store type and a theme.");
      return;
    }
    setStep((s) => s + 1);
  }

  async function submit() {
    setError("");
    if (!storeName || !subdomain) {
      setError("Enter a store name and a store address.");
      return;
    }
    setBusy(true);
    try {
      // 1) create the owner account, 2) create their store, 3) go to it live
      const session = await api.register({ name, email, password });
      saveSession(session);
      const { store } = await api.createStore(session.token, {
        name: storeName,
        subdomain,
        storeType: storeType as string,
        themeId,
      });
      router.push(`/store/${store.subdomain}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  const themes = storeType ? THEMES_BY_TYPE[storeType] : [];

  return (
    <main className={styles.page}>
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
                placeholder="Ali Raza"
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
            <p className={styles.sub}>Step 2 of 3 — pick a store type and a theme.</p>
            <div className={styles.field}>
              <label className={styles.label}>Store type</label>
              <div className={styles.typeGrid}>
                {STORE_TYPE_OPTIONS.map((t) => (
                  <div
                    key={t.id}
                    className={`${styles.typeCard} ${
                      storeType === t.id ? styles.typeCardActive : ""
                    }`}
                    onClick={() => {
                      setStoreType(t.id);
                      setThemeId(""); // reset theme when type changes
                    }}
                  >
                    <div className={styles.typeEmoji}>{t.emoji}</div>
                    <div className={styles.typeLabel}>{t.label}</div>
                    <div className={styles.typeBlurb}>{t.blurb}</div>
                  </div>
                ))}
              </div>
            </div>
            {storeType ? (
              <div className={styles.field}>
                <label className={styles.label}>Theme</label>
                <div className={styles.themeRow}>
                  {themes.map((th) => (
                    <div
                      key={th.id}
                      className={`${styles.themeCard} ${
                        themeId === th.id ? styles.themeCardActive : ""
                      }`}
                      onClick={() => setThemeId(th.id)}
                    >
                      <div className={styles.themeName}>{th.name}</div>
                      <div className={styles.themePreview}>{th.preview}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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
