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

class StorefrontController extends Controller
{
    /**
     * Products per "Load more" page on a store's home page.
     */
    private const PER_PAGE = 12;

    /**
     * How many products from other stores to promote below the store's own.
     */
    private const OTHER_STORES_COUNT = 8;

    /**
     * A store's home page: its banner, its active products (paged; "Load more"
     * fetches the next page and the client appends it) and a few products from
     * other marketplace stores.
     */
    public function show(Request $request, Store $storefront): Response
    {
        $storefront->loadMissing('themeConfig');

        $products = $storefront->products()->active()->latest()->latest('id')->paginate(self::PER_PAGE);

        return Inertia::render('Storefront/Home', [
            'store' => StorefrontStoreResource::make($storefront)->resolve(),
            'page' => PageResource::make($storefront->publishedHomePage())->resolve(),
            'products' => Inertia::merge(fn () => ProductResource::collection($products->getCollection())->resolve()),
            'productsPage' => [
                'current' => $products->currentPage(),
                'hasMore' => $products->hasMorePages(),
            ],
            // a closure, so "Load more" (a partial reload of products only) skips this query
            'otherStoresProducts' => fn () => MarketplaceProductResource::collection(
                $storefront->productsFromOtherStores(self::OTHER_STORES_COUNT, ShopperCountry::from($request)),
            )->resolve(),
        ]);
    }
}
