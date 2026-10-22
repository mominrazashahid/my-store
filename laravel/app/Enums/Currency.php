<?php

namespace App\Enums;

/**
 * Currencies a store can sell in. Prices are stored as integers in the
 * currency's minor unit (cents, paisa, ...), so $19.99 is stored as 1999.
 */
enum Currency: string
{
    case Usd = 'USD';
    case Cad = 'CAD';
    case Eur = 'EUR';
    case Gbp = 'GBP';
    case Aud = 'AUD';
    case Nzd = 'NZD';
    case Aed = 'AED';
    case Sar = 'SAR';
    case Inr = 'INR';
    case Pkr = 'PKR';
    case Bdt = 'BDT';
    case Jpy = 'JPY';

    /**
     * Digits after the decimal point (ISO 4217 minor unit).
     */
    public function decimals(): int
    {
        return match ($this) {
            self::Jpy => 0,
            default => 2,
        };
    }

    /**
     * Countries a store selling in this currency most likely ships to first;
     * used for a new store's starter shipping zone.
     *
     * @return list<string>
     */
    public function homeCountries(): array
    {
        return match ($this) {
            self::Usd => ['US'],
            self::Cad => ['CA'],
            self::Eur => ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'],
            self::Gbp => ['GB'],
            self::Aud => ['AU'],
            self::Nzd => ['NZ'],
            self::Aed => ['AE'],
            self::Sar => ['SA'],
            self::Inr => ['IN'],
            self::Pkr => ['PK'],
            self::Bdt => ['BD'],
            self::Jpy => ['JP'],
        };
    }

    /**
     * Convert an amount typed by an owner ("19.99") into minor units (1999).
     */
    public function toMinor(float|int|string $major): int
    {
        return (int) round((float) $major * 10 ** $this->decimals());
    }

    /**
     * Rough units per US dollar — only used to give starter sample products
     * believable prices in the store's currency. Owners edit them anyway.
     */
    public function approxPerUsd(): float
    {
        return match ($this) {
            self::Usd => 1,
            self::Cad => 1.4,
            self::Eur => 0.9,
            self::Gbp => 0.8,
            self::Aud => 1.5,
            self::Nzd => 1.7,
            self::Aed, self::Sar => 3.7,
            self::Inr => 85,
            self::Pkr => 280,
            self::Bdt => 120,
            self::Jpy => 150,
        };
    }

    /**
     * Convert a US-dollar sample price into a tidy price in this currency's
     * minor units: 12.00 USD -> 1200 (USD), 336000 (PKR, Rs 3,360), 1800 (JPY).
     */
    public function starterPrice(float $usd): int
    {
        $major = $usd * $this->approxPerUsd();
        // round big-number currencies to the nearest 10, others to whole units
        $major = $this->approxPerUsd() >= 10 ? round($major, -1) : round($major);

        return (int) ($major * 10 ** $this->decimals());
    }
}
