import { Ban, Globe, Truck } from "lucide-react";
import { CountryPicker, useShopperCountry } from "@/components/platform/CountryPicker";
import { countryName } from "@/lib/countries";
import styles from "./storefront.module.css";

// Where this store delivers. With a country picked: "Ships to Pakistan" or
// "Doesn't ship to United States". While browsing worldwide: the store's
// shipping countries, with the picker to check your own.
export function ShipsToBadge({ shipsTo }: { shipsTo: string[] }) {
  const country = useShopperCountry();

  if (!country) {
    const where =
      shipsTo.length === 0
        ? "No shipping set up yet"
        : shipsTo.length <= 3
          ? `Ships to ${shipsTo.map(countryName).join(", ")}`
          : `Ships to ${shipsTo.length} countries`;
    return (
      <div className={`${styles.shipsTo} ${styles.shipsNeutral}`}>
        <Globe size={18} />
        <span>{where}</span>
        <CountryPicker className={styles.shipsSelect} label="Check your country" />
      </div>
    );
  }

  const ships = shipsTo.includes(country);

  return (
    <div className={`${styles.shipsTo} ${ships ? styles.shipsYes : styles.shipsNo}`}>
      {ships ? <Truck size={18} /> : <Ban size={18} />}
      <span>
        {ships ? "Ships to" : "Doesn’t ship to"} <strong>{countryName(country)}</strong>
      </span>
      <CountryPicker className={styles.shipsSelect} />
    </div>
  );
}
