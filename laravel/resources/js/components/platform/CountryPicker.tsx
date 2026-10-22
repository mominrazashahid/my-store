import { router, usePage } from "@inertiajs/react";
import { Select } from "@/components/ui/Select";
import { countryOptions } from "@/lib/countries";

// Cookie value for "every store" (see App\Support\ShopperCountry::WORLDWIDE).
const WORLDWIDE = "WW";

// The country the shopper picked (shared `shopperCountry` prop), or null while
// browsing worldwide. Changing it is remembered in a cookie and reloads the
// page, so the products shown and the "Ships to" badges follow it.
export function useShopperCountry(): string | null {
  return usePage<{ shopperCountry: string | null }>().props.shopperCountry;
}

export function CountryPicker({ className, label = "Your country" }: { className?: string; label?: string }) {
  const country = useShopperCountry();

  return (
    <Select
      compact
      searchable
      searchPlaceholder="Search countries"
      className={className}
      ariaLabel={label}
      value={country ?? WORLDWIDE}
      onChange={(value) => router.post("/country", { country: value }, { preserveScroll: true })}
      options={[
        { value: WORLDWIDE, label: "Worldwide (all stores)" },
        ...countryOptions().map((c) => ({ value: c.code, label: c.name })),
      ]}
    />
  );
}
