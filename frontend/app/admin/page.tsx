"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, saveSession, getSession } from "@/lib/client";
import styles from "./admin.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // already logged in → go straight to the dashboard
  useEffect(() => {
    if (getSession()) router.replace("/admin/dashboard");
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const session = await api.login({ email, password });
      saveSession(session);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={submit}>
        <h1 className={styles.h}>Store owner login</h1>
        <p className={styles.sub}>Manage your products, theme and settings.</p>
        {error ? <div className={styles.error}>{error}</div> : null}
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
            placeholder="Your password"
          />
        </div>
        <button
          className={`${styles.btn} ${styles.primary}`}
          style={{ width: "100%" }}
          disabled={busy}
        >
          {busy ? "Signing in…" : "Log in"}
        </button>
        <p className={styles.foot}>
          No store yet? <Link href="/signup">Create one</Link>
        </p>
      </form>
    </div>
  );
}
