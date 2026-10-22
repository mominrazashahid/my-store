// Prices arrive as integers in the currency's minor unit (cents, paisa, ...).
// formatMoney(1999, "USD") -> "$19.99", formatMoney(120000, "PKR") -> "Rs 1,200",
// formatMoney(1800, "JPY") -> "¥1,800".

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string): Intl.NumberFormat {
  let f = formatters.get(currency);
  if (!f) {
    try {
      f = new Intl.NumberFormat("en", {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      });
    } catch {
      // unknown currency code — fall back to USD formatting rather than crash
      f = new Intl.NumberFormat("en", { style: "currency", currency: "USD" });
    }
    formatters.set(currency, f);
  }
  return f;
}

// Digits after the decimal point for a currency (USD 2, JPY 0).
export function currencyDecimals(currency = "USD"): number {
  return formatter(currency).resolvedOptions().maximumFractionDigits ?? 2;
}

// Minor units -> value for a price input: (1999, "USD") -> "19.99".
export function toMajorInput(minor: number | null | undefined, currency = "USD"): string {
  if (minor === null || minor === undefined) return "";
  return String(minor / 10 ** currencyDecimals(currency));
}

export function formatMoney(minor: number, currency = "USD"): string {
  const f = formatter(currency);
  const decimals = f.resolvedOptions().maximumFractionDigits ?? 2;
  const major = Number(minor || 0) / 10 ** decimals;
  // drop ".00" on whole amounts so "$12" / "Rs 1,200" read cleanly
  return Number.isInteger(major)
    ? f.format(major).replace(/\.0+(?=\D*$)/, "")
    : f.format(major);
}
