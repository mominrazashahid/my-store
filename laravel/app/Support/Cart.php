<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Contracts\Session\Session;
use Illuminate\Database\Eloquent\Collection;

/**
 * The shopper's marketplace-wide cart, kept in their session as
 * product id => quantity. Prices, titles and stock always come from the
 * database; products that are no longer for sale drop out on read.
 *
 * Stored server-side (not in the browser) so one cart works across every
 * store, including when stores live on their own subdomains.
 */
class Cart
{
    private const SESSION_KEY = 'cart';

    private const MAX_QTY = 100;

    public function __construct(private Session $session) {}

    /**
     * @return array<int, int> product id => quantity
     */
    public function quantities(): array
    {
        return $this->session->get(self::SESSION_KEY, []);
    }

    public function add(Product $product, int $qty): void
    {
        $quantities = $this->quantities();
        $this->set($product, ($quantities[$product->id] ?? 0) + $qty);
    }

    /**
     * Set a line's quantity, capped at what's in stock; 0 or less removes it.
     */
    public function set(Product $product, int $qty): void
    {
        $quantities = $this->quantities();
        $qty = min($qty, $product->stock, self::MAX_QTY);

        if ($qty <= 0) {
            unset($quantities[$product->id]);
        } else {
            $quantities[$product->id] = $qty;
        }

        $this->session->put(self::SESSION_KEY, $quantities);
    }

    /**
     * @param  list<int>  $productIds
     */
    public function remove(array $productIds): void
    {
        $this->session->put(self::SESSION_KEY, array_diff_key($this->quantities(), array_flip($productIds)));
    }

    /**
     * Products in the cart that can still be bought, with their store loaded.
     * Lines for products that are gone, drafted or from suspended stores are
     * pruned from the session.
     *
     * @return Collection<int, Product>
     */
    public function products(): Collection
    {
        $quantities = $this->quantities();
        if ($quantities === []) {
            return new Collection;
        }

        $products = Product::query()
            ->active()
            ->whereKey(array_keys($quantities))
            ->whereHas('store', fn ($store) => $store->active())
            ->with('store')
            ->get();

        if ($products->count() !== count($quantities)) {
            $this->session->put(self::SESSION_KEY, array_intersect_key($quantities, $products->keyBy('id')->all()));
        }

        return $products;
    }

    /**
     * The cart grouped by store, for the cart drawer and checkout.
     *
     * @return array{count: int, groups: list<array<string, mixed>>}
     */
    public function summary(): array
    {
        $quantities = $this->quantities();
        $groups = $this->products()
            ->groupBy('store_id')
            ->map(function (Collection $products) use ($quantities): array {
                $store = $products->first()->store;
                $items = $products->map(fn (Product $product): array => [
                    'productId' => $product->id,
                    'title' => $product->title,
                    'slug' => $product->slug,
                    'image' => $product->images[0] ?? null,
                    'price' => $product->price,
                    'qty' => min($quantities[$product->id], $product->stock),
                    'stock' => $product->stock,
                ])->values();

                return [
                    'store' => [
                        'id' => $store->id,
                        'name' => $store->name,
                        'subdomain' => $store->subdomain,
                        'currency' => $store->currency()->value,
                    ],
                    'items' => $items->all(),
                    'subtotal' => $items->sum(fn (array $item): int => $item['price'] * $item['qty']),
                ];
            })
            ->values();

        return [
            'count' => (int) $groups->sum(fn (array $group): int => collect($group['items'])->sum('qty')),
            'groups' => $groups->all(),
        ];
    }
}
