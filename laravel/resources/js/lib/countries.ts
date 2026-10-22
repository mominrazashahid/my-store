// Countries for checkout address forms. Names come from the browser's
// Intl.DisplayNames, so no large name table ships with the app.

// ISO 3166-1 alpha-2 codes
const CODES = (
  "AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ " +
  "CA CD CF CG CH CI CL CM CN CO CR CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB " +
  "GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IS IT JM JO JP KE KG KH KM KN KR KW " +
  "KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MK ML MM MN MO MR MT MU MV MW MX MY MZ NA " +
  "NE NG NI NL NO NP NZ OM PA PE PG PH PK PL PR PS PT PY QA RO RS RW SA SB SC SE SG SI SK SL SM SN " +
  "SO SR SS ST SV SZ TD TG TH TJ TL TM TN TO TR TT TW TZ UA UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW"
).split(" ");

// Mirrors PlaceOrderRequest::STATE_REQUIRED / POSTAL_REQUIRED on the server.
export const STATE_REQUIRED = ["US", "CA", "AU", "IN", "BR", "MX"];
export const POSTAL_REQUIRED = [
  "US", "CA", "GB", "AU", "NZ", "IN", "DE", "FR", "NL", "BE", "ES", "IT", "PT",
  "SE", "DK", "NO", "FI", "AT", "CH", "IE", "PL", "JP", "BR", "MX",
];

let cached: { code: string; name: string }[] | null = null;

export function countryOptions(): { code: string; name: string }[] {
  if (cached) return cached;
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    names = null;
  }
  cached = CODES.map((code) => ({ code, name: names?.of(code) ?? code })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  return cached;
}

export function countryName(code?: string | null): string {
  if (!code) return "";
  return countryOptions().find((c) => c.code === code)?.name ?? code;
}

// Local wording for address fields.
export function stateLabel(country: string): string {
  if (country === "US") return "State";
  if (country === "CA") return "Province";
  if (country === "GB" || country === "IE") return "County";
  return "State / Province";
}

export function postalLabel(country: string): string {
  if (country === "US") return "ZIP code";
  if (country === "GB") return "Postcode";
  return "Postal code";
}
