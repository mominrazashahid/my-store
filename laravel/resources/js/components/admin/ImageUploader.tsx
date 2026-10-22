import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";
import styles from "@/Pages/Admin/admin.module.css";

export function ImageUploader({
  storeId,
  onUploaded,
  label = "Upload image",
}: {
  storeId: number;
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      onUploaded(await uploadImage(storeId, file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
      <button
        type="button"
        className={`${styles.btn} ${styles.ghost}`}
        onClick={() => ref.current?.click()}
        disabled={busy}
      >
        {busy ? "Uploading…" : label}
      </button>
      {err ? <div className={styles.error} style={{ marginTop: 8 }}>{err}</div> : null}
    </div>
  );
}
