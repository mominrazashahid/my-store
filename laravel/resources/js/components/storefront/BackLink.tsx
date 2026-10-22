import { useEffect, useState, type MouseEvent } from "react";
import { router } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { previousUrl } from "@/lib/history";

function pathOf(url: string): string {
  return url.split(/[?#]/)[0] || "/";
}

// "Back" that returns the shopper to wherever they came from (the
// marketplace, the store, another product). With no history, e.g. a shared
// link opened fresh, it goes to the store instead.
export function BackLink({
  storeName,
  storeUrl,
  className,
}: {
  storeName: string;
  storeUrl: string;
  className?: string;
}) {
  // read on the client after mount; the server render has no browser history
  const [prev, setPrev] = useState<string | null>(null);
  useEffect(() => setPrev(previousUrl()), []);

  const label = !prev
    ? storeName
    : pathOf(prev) === "/"
      ? "Back to all stores"
      : pathOf(prev) === storeUrl
        ? `Back to ${storeName}`
        : "Back";

  function goBack(e: MouseEvent) {
    if (!prev) return; // plain link to the store
    e.preventDefault();
    // the real browser back keeps the previous page's search, filters and scroll;
    // a tab opened fresh has no back entry, so visit the remembered page instead
    if (window.history.length > 1) window.history.back();
    else router.visit(prev);
  }

  return (
    <a href={prev ?? storeUrl} onClick={goBack} className={className}>
      <ArrowLeft size={16} /> {label}
    </a>
  );
}
