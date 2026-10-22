<?php

namespace App\Http\Middleware;

use App\Support\Cart;
use App\Support\ShopperCountry;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user()?->only(['id', 'name', 'email']),
            ],
            // the country the shopper picked, or null while browsing worldwide (see ShopperCountry)
            'shopperCountry' => ShopperCountry::from($request),
            // the marketplace-wide cart, grouped by store (a closure so partial reloads can skip it)
            'cart' => fn (): array => app(Cart::class)->summary(),
        ];
    }
}
