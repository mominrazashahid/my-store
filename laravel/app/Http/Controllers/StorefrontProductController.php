<?php

namespace App\Http\Controllers;

use App\Http\Resources\MarketplaceProductResource;
use App\Http\Resources\PageResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\StorefrontStoreResource;
use App\Models\Store;
use App\Support\ShopperCountry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontProductController extends Controller
{
    /**
     * How many of the store's other products to show under the product.
     */
    private const MORE_FROM_STORE = 8;

    /**
     * How many products from other stores to promote at the bottom.
     */
    private const OTHER_STORES_COUNT = 8;

    /**
     * A product's own page, with more from the same store (and a link to the
     * whole store) and products from other marketplace stores. Draft products 404.
     */
    public function show(Request $request, Store $storefront, string $slug): Response
    {
        $storefront->loadMissing('themeConfig');

        $product = $storefront->products()->active()->where('slug', $slug)->firstOrFail();
        $moreFromStore = $storefront->products()->active()
            ->whereKeyNot($product->id)
            ->latest()
            ->limit(self::MORE_FROM_STORE + 1) // one extra tells us whether there are more
            ->get();

        return Inertia::render('Storefront/Product', [
            'store' => StorefrontStoreResource::make($storefront)->resolve(),
            'page' => PageResource::make($storefront->publishedHomePage())->resolve(),
            'product' => ProductResource::make($product)->resolve(),
            'related' => ProductResource::collection($moreFromStore->take(self::MORE_FROM_STORE))->resolve(),
            'storeHasMore' => $moreFromStore->count() > self::MORE_FROM_STORE,
            // every country the store ships to, for the "Ships to …" badge
            'shipsTo' => $storefront->shippingZones()->pluck('countries')->flatten()->unique()->sort()->values(),
            'otherStoresProducts' => MarketplaceProductResource::collection(
                $storefront->productsFromOtherStores(self::OTHER_STORES_COUNT, ShopperCountry::from($request)),
            )->resolve(),
        ]);
    }
}
