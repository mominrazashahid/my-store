import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import styles from "./admin.module.css";

// Already-logged-in owners never see this page: the `guest` middleware
// redirects them to the dashboard.
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    router.post(
      "/admin/login",
      { email, password },
      {
        onError: (errors) => setError(Object.values(errors)[0] || "Login failed"),
        onFinish: () => setBusy(false),
      }
    );
  }

  return (
    <div className={styles.loginPage}>
      <Head title="Log in" />
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
