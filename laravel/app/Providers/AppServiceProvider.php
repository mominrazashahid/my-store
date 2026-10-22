<?php

namespace App\Providers;

use App\Models\Store;
use App\Support\Cart;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // one cart per request, backed by the visitor's session
        $this->app->scoped(Cart::class, fn ($app): Cart => new Cart($app['request']->session()));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Public storefront tenant: resolved only from the URL, never the request
        // body, so a visitor can't reach another store's data. Suspended stores 404.
        Route::bind('storefront', fn (string $subdomain): Store => Store::query()
            ->active()
            ->where('subdomain', strtolower($subdomain))
            ->firstOrFail());

        // Admin tenant: a store the logged-in owner owns. Anyone else's store is a
        // 404 (not 403), so owners can't even learn another store's id exists.
        Route::bind('managedStore', fn (string $id): Store => Store::query()
            ->whereKey($id)
            ->where('owner_id', request()->user()?->getAuthIdentifier())
            ->firstOrFail());
    }
}
