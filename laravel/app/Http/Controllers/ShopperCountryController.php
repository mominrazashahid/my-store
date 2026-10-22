<?php

namespace App\Http\Controllers;

use App\Support\ShopperCountry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;

/**
 * Remembers which country the shopper is buying for, or "WW" for worldwide.
 */
class ShopperCountryController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate(['country' => ['required', 'string', 'regex:/^[A-Z]{2}$/']]);

        Cookie::queue(ShopperCountry::COOKIE, $validated['country'], 60 * 24 * 365);

        return back();
    }
}
