import { countryName } from "@/lib/countries";
import type { OrderAddress } from "@/types/admin";

// An order address as display lines:
// ["Sam Carter", "500 Congress Ave, Apt 4B", "Austin, TX 78701", "United States"]
export function addressLines(a: OrderAddress | null | undefined): string[] {
  if (!a) return [];
  return [
    `${a.first_name} ${a.last_name}`.trim(),
    [a.line1, a.line2].filter(Boolean).join(", "),
    [a.city, [a.state, a.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    countryName(a.country),
  ].filter(Boolean);
}
