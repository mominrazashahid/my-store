"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getSession, type AdminStore } from "@/lib/client";
import {
  themeToCss,
  googleFontsHref,
  DEVICE_PREVIEW_WIDTH,
  FONT_OPTIONS,
  DEVICES,
  type Device,
  type ThemeData,
} from "@/lib/theme";
import { THEME_GROUPS, getValue, setValue, type Control } from "@/lib/themeSchema";
import styles from "./editor.module.css";

export default function ThemeEditorPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [store, setStore] = useState<AdminStore | null>(null);
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [openGroup, setOpenGroup] = useState<string>("global");
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("");
  const frameRef = useRef<HTMLIFrameElement>(null);

  // load session + store + draft theme
  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/admin");
      return;
    }
    setToken(s.token);
    api.myStores(s.token).then(({ stores }) => {
      const want = new URLSearchParams(window.location.search).get("store");
      const active = stores.find((x) => x._id === want) || stores[0];
      if (!active) return;
      setStore(active);
      api.getTheme(s.token, active._id).then(({ theme }) => setTheme(theme));
    });
  }, [router]);

  // push current theme CSS into the preview iframe. Posting is safe even if the
  // bridge isn't listening yet, so we don't gate on readiness (avoids a race
  // where a missed "ready" message permanently blocks live updates).
  const pushPreview = useCallback((t: ThemeData) => {
    const frame = frameRef.current?.contentWindow;
    if (!frame) return;
    frame.postMessage(
      {
        type: "sb-theme-css",
        css: themeToCss(t),
        fontsHref: googleFontsHref(t.tokens.fonts.heading, t.tokens.fonts.body),
      },
      "*"
    );
  }, []);

  // the iframe's bridge announces when it's mounted → push the current theme
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "sb-preview-ready" && theme) pushPreview(theme);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [theme, pushPreview]);

  function update(ctrl: Control, value: unknown) {
    if (!theme) return;
    const next = setValue(theme as never, ctrl, device, value) as ThemeData;
    setTheme(next);
    setDirty(true);
    setStatus("");
    pushPreview(next);
  }

  async function save() {
    if (!token || !store || !theme) return;
    await api.updateTheme(token, store._id, theme);
    setDirty(false);
    setStatus("Draft saved");
  }

  async function publish() {
    if (!token || !store || !theme) return;
    await api.updateTheme(token, store._id, theme); // ensure draft is current
    await api.publishTheme(token, store._id);
    setDirty(false);
    setStatus("Published — live on your store");
  }

  async function reset() {
    if (!token || !store) return;
    if (!confirm("Reset all theme settings back to the default? This affects the draft — publish to make it live.")) return;
    const { theme: def } = await api.resetTheme(token, store._id);
    setTheme(def);
    setDirty(true);
    setStatus("Reset to default (not yet published)");
    pushPreview(def);
  }

  const frameWidth = DEVICE_PREVIEW_WIDTH[device];
  const previewSrc = useMemo(
    () => (store ? `/store/${store.subdomain}?preview=1` : ""),
    [store]
  );

  if (!theme || !store) {
    return <div className={styles.shell}><div className={styles.loading}>Loading editor…</div></div>;
  }

  return (
    <div className={styles.shell}>
      <div className={styles.bar}>
        <Link className={styles.back} href="/admin/dashboard">
          ← Dashboard
        </Link>
        <span className={styles.title}>Theme · {store.name}</span>

        <div className={styles.devices}>
          {DEVICES.map((d) => (
            <button
              key={d}
              className={`${styles.deviceBtn} ${device === d ? styles.deviceActive : ""}`}
              onClick={() => setDevice(d)}
            >
              {d === "desktop" ? "🖥 Desktop" : d === "tablet" ? "📲 Tablet" : "📱 Mobile"}
            </button>
          ))}
        </div>

        {dirty ? <span className={styles.dirty}>● Unsaved</span> : null}
        {status ? <span className={styles.saved}>{status}</span> : null}
        <button className={`${styles.barBtn} ${styles.save}`} onClick={reset}>
          Reset
        </button>
        <button className={`${styles.barBtn} ${styles.save}`} onClick={save} disabled={!dirty}>
          Save draft
        </button>
        <button className={`${styles.barBtn} ${styles.publish}`} onClick={publish}>
          Publish
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.panel}>
          {THEME_GROUPS.map((g) => (
            <div key={g.key} className={styles.group}>
              <button
                className={styles.groupHead}
                onClick={() => setOpenGroup(openGroup === g.key ? "" : g.key)}
              >
                {g.label}
                <span>{openGroup === g.key ? "−" : "+"}</span>
              </button>
              {openGroup === g.key ? (
                <div className={styles.groupBody}>
                  {g.controls.map((c) => (
                    <ControlRow
                      key={c.path}
                      ctrl={c}
                      device={device}
                      value={getValue(theme as never, c, device)}
                      onChange={(v) => update(c, v)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className={styles.preview}>
          <div className={styles.frameWrap} style={{ width: frameWidth, maxWidth: "100%" }}>
            <iframe
              ref={frameRef}
              className={styles.frame}
              src={previewSrc}
              onLoad={() => {
                // push the current (possibly unsaved) theme once the frame loads;
                // a short retry covers the bridge mounting a tick later
                pushPreview(theme);
                setTimeout(() => pushPreview(theme), 150);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlRow({
  ctrl,
  device,
  value,
  onChange,
}: {
  ctrl: Control;
  device: Device;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <div className={styles.ctrl}>
      <span className={styles.ctrlLabel}>
        {ctrl.label}
        {ctrl.responsive ? <span className={styles.ctrlResp}>{device}</span> : null}
      </span>
      {ctrl.type === "color" ? (
        <input
          className={styles.color}
          type="color"
          value={String(value ?? "#000000")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : ctrl.type === "font" ? (
        <select
          className={styles.select}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      ) : ctrl.type === "toggle" ? (
        <input
          className={styles.toggle}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      ) : (
        <input
          className={styles.num}
          type="number"
          value={Number(value ?? 0)}
          min={ctrl.min}
          max={ctrl.max}
          step={ctrl.max === 1 ? 0.05 : 1}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )}
    </div>
  );
}
