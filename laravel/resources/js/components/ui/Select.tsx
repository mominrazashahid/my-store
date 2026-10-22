import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import styles from "./select.module.css";

export type SelectOption = { value: string; label: string };

// A styled replacement for the browser's <select>: a button showing the
// current choice and a dropdown list, with an optional search box for long
// lists (countries, currencies). Works with the keyboard: arrows, Enter, Escape.
export function Select({
  value,
  onChange,
  options,
  searchable = false,
  searchPlaceholder = "Search…",
  ariaLabel,
  className,
  disabled = false,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  searchable?: boolean;
  searchPlaceholder?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  // smaller trigger for pickers that sit inside a sentence or badge
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState({ up: false, right: false });
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  // scroll the highlighted option into view only for keyboard moves and on open,
  // never for mouse hover (which would yank the list under the pointer)
  const scrollToActive = useRef(false);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase() === q) : options;
  }, [options, query]);

  function openList() {
    if (disabled) return;
    // open upwards / align right when there isn't room below / to the right
    const rect = root.current?.getBoundingClientRect();
    if (rect) {
      setPlacement({
        up: window.innerHeight - rect.bottom < 300 && rect.top > window.innerHeight - rect.bottom,
        right: rect.left + 280 > window.innerWidth,
      });
    }
    setQuery("");
    scrollToActive.current = true;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(option: SelectOption) {
    setOpen(false);
    if (option.value !== value) onChange(option.value);
  }

  // close when clicking anywhere else
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // keep the highlighted option in view (the current choice is centred on open)
  useEffect(() => {
    if (!open || !scrollToActive.current) return;
    const option = list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (option && list.current) {
      list.current.scrollTop = option.offsetTop - list.current.clientHeight / 2 + option.clientHeight / 2;
    }
    scrollToActive.current = false;
  }, [open, active]);

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      scrollToActive.current = true;
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      scrollToActive.current = true;
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={root} className={`${styles.root} ${compact ? styles.compact : ""} ${className ?? ""}`} onKeyDown={onKeyDown}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => (open ? setOpen(false) : openList())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <span className={styles.value}>{selected?.label ?? "Select…"}</span>
        <ChevronDown size={16} className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />
      </button>

      {open ? (
        <div className={`${styles.panel} ${placement.up ? styles.up : ""} ${placement.right ? styles.right : ""}`}>
          {searchable ? (
            <div className={styles.search}>
              <Search size={15} />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
            </div>
          ) : null}
          <ul ref={list} id={listId} role="listbox" className={styles.list} aria-label={ariaLabel}>
            {filtered.length === 0 ? <li className={styles.empty}>No matches</li> : null}
            {filtered.map((option, i) => (
              <li
                key={option.value}
                data-index={i}
                role="option"
                aria-selected={option.value === value}
                className={`${styles.option} ${i === active ? styles.optionActive : ""}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()} // keep focus inside while choosing
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {option.value === value ? <Check size={15} className={styles.check} /> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
