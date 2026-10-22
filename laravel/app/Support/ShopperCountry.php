<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * The country a shopper is buying for. By default shoppers browse worldwide
 * (null: every store is shown); picking a country narrows the marketplace to
 * stores that ship there. The choice is kept in a cookie.
 */
class ShopperCountry
{
    public const COOKIE = 'sb_country';

    /**
     * Cookie value meaning "show every store".
     */
    public const WORLDWIDE = 'WW';

    private const FALLBACK_GUESS = 'US';

    /**
     * The chosen country code, or null when browsing worldwide.
     */
    public static function from(Request $request): ?string
    {
        $chosen = strtoupper((string) $request->cookie(self::COOKIE));

        return self::isCountry($chosen) ? $chosen : null;
    }

    /**
     * A best guess at where the shopper is, for pre-filling a checkout address:
     * their chosen country, else their browser's language region ("en-PK" -> PK).
     */
    public static function guess(Request $request): string
    {
        $chosen = self::from($request);
        if ($chosen) {
            return $chosen;
        }

        foreach ($request->getLanguages() as $language) {
            // "en_PK" / "en-PK" style tags carry the region after the separator
            $region = strtoupper((string) (preg_split('/[-_]/', $language)[1] ?? ''));
            if (self::isCountry($region)) {
                return $region;
            }
        }

        return self::FALLBACK_GUESS;
    }

    public static function isCountry(string $code): bool
    {
        return $code !== self::WORLDWIDE && (bool) preg_match('/^[A-Z]{2}$/', $code);
    }
}
