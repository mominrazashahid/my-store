<?php

namespace App\Http\Controllers;

use App\Enums\StoreType;
use App\Http\Resources\MarketplaceProductResource;
use App\Models\Product;
use App\Support\ShopperCountry;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Random\Engine\Mt19937;
use Random\Randomizer;

class MarketplaceController extends Controller
{
    /**
     * The platform home page: a mixed feed of products from every store that
     * opted into the marketplace (worldwide by default, or only stores shipping
     * to the shopper's chosen country), optionally filtered by type or search.
     */
    public function index(Request $request): Response
    {
        $type = StoreType::tryFrom((string) $request->query('type'));
        $search = trim((string) $request->query('q'));

        return Inertia::render('Home', [
            'products' => MarketplaceProductResource::collection(
                $this->feed($type, $search, ShopperCountry::from($request)),
            )->resolve(),
            'filters' => ['type' => $type?->value, 'q' => $search],
        ]);
    }

    /**
     * Take each store's newest products (capped per store), then deal them out
     * round-robin across stores so small stores get seen next to big ones.
     * The store order is shuffled with a seed that changes daily: it rotates
     * who appears first without reshuffling on every refresh.
     *
     * @return Collection<int, Product>
     */
    private function feed(?StoreType $type, string $search, ?string $country): Collection
    {
        $perStore = config('store.marketplace.per_store');

        $ranked = Product::query()
            ->inMarketplace()
            // once the shopper picks a country, only stores that can deliver there
            ->when($country, fn ($query) => $query->whereHas('store', fn ($store) => $store->shipsTo($country)))
            ->when($type, fn ($query) => $query->whereHas('store', fn ($store) => $store->where('store_type', $type)))
            // "!" escapes LIKE wildcards the same way on MySQL and SQLite, so "50%" matches literally
            ->when($search !== '', fn ($query) => $query->whereRaw(
                "title LIKE ? ESCAPE '!'",
                ['%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%'],
            ))
            ->select('products.*')
            ->selectRaw('ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY created_at DESC, id DESC) AS store_rank');

        $candidates = Product::query()
            ->fromSub($ranked, 'products')
            ->where('store_rank', '<=', $perStore)
            ->orderBy('store_rank')
            ->with('store:id,name,subdomain,store_type,settings')
            ->get();

        $byStore = $candidates->groupBy('store_id');
        $storeOrder = (new Randomizer(new Mt19937(crc32(now()->toDateString()))))
            ->shuffleArray($byStore->keys()->all());

        $feed = new Collection;
        for ($round = 0; $round < $perStore; $round++) {
            // within a round, products with photos go first so the grid looks good
            $roundItems = collect($storeOrder)
                ->map(fn ($storeId) => $byStore[$storeId][$round] ?? null)
                ->filter()
                ->sortBy(fn (Product $product): int => empty($product->images) ? 1 : 0);

            $feed->push(...$roundItems->values()->all());
        }

        return $feed->take(config('store.marketplace.size'))->values();
    }
}
