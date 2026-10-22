<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ShippingRate;
use App\Models\ShippingZone;
use App\Models\Store;
use App\Support\Cart;
use App\Support\ShopperCountry;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Locale;

/**
 * Checkout for the marketplace-wide cart.
 *
 * The cart is checked out one currency at a time (a payment can only be in one
 * currency). The buyer enters one address; each store in the cart is checked
 * against it on its own: stores that ship there get an order each, stores that
 * don't are skipped and their items stay in the cart.
 */
class CheckoutController extends Controller
{
    /**
     * Session key holding the ids of orders this visitor placed, so only they
     * can see them on the confirmation page.
     */
    private const PLACED_ORDERS = 'placed_orders';

    /**
     * Session key holding the orders from the most recent checkout.
     */
    private const LAST_CHECKOUT = 'last_checkout';

    public function create(Request $request, Cart $cart): Response
    {
        $products = $cart->products()->load('store.shippingZones.rates');
        $currencies = $products->map(fn (Product $product): string => $product->store->currency()->value)->unique()->values();
        $currency = $currencies->contains($request->query('currency')) ? $request->query('currency') : $currencies->first();

        $stores = $products->pluck('store')->unique('id')
            ->filter(fn (Store $store): bool => $store->currency()->value === $currency)
            ->values();

        return Inertia::render('Checkout/Index', [
            'currency' => $currency,
            'currencies' => $currencies,
            'shipping' => $stores->mapWithKeys(fn (Store $store): array => [
                $store->id => [
                    'zones' => $store->shippingZones->map(fn (ShippingZone $zone): array => [
                        'countries' => $zone->countries,
                        'rates' => $zone->rates->map(fn (ShippingRate $rate): array => [
                            'id' => $rate->id,
                            'name' => $rate->name,
                            'price' => $rate->price,
                            'freeOver' => $rate->free_over,
                            'minDays' => $rate->min_days,
                            'maxDays' => $rate->max_days,
                        ]),
                    ]),
                    'processingDays' => $store->processingDays(),
                ],
            ]),
            'codCountries' => config('store.cod_countries'),
            // a concrete country for the address form, even while browsing worldwide
            'defaultCountry' => ShopperCountry::guess($request),
        ]);
    }

    /**
     * Place one order per store that ships to the buyer's address, all in one
     * transaction: if any store's stock check fails, no order is created.
     */
    public function store(PlaceOrderRequest $request, Cart $cart): RedirectResponse
    {
        $country = $request->validated('shipping.country');

        if (! in_array($country, config('store.cod_countries'), true)) {
            throw ValidationException::withMessages([
                'payment' => 'Card payment is coming soon. For now, orders can only be paid cash on delivery within Pakistan.',
            ]);
        }

        $quantities = $cart->quantities();
        $groups = $cart->products()
            ->load('store.shippingZones.rates')
            ->filter(fn (Product $product): bool => $product->store->currency()->value === $request->validated('currency'))
            ->groupBy('store_id');

        if ($groups->isEmpty()) {
            throw ValidationException::withMessages(['cart' => 'Your cart is empty.']);
        }

        // pick each shippable store's rate; stores that don't ship here are left in the cart
        $shippable = [];
        foreach ($groups as $storeId => $products) {
            $store = $products->first()->store;
            $zone = $store->shippingZoneFor($country);
            if (! $zone) {
                continue;
            }

            $rate = $zone->rates->firstWhere('id', (int) ($request->validated('shippingRates')[$storeId] ?? 0));
            if (! $rate) {
                throw ValidationException::withMessages([
                    "shippingRates.{$storeId}" => "Choose a shipping method for {$store->name}.",
                ]);
            }

            $shippable[] = [$store, $products, $rate];
        }

        if ($shippable === []) {
            throw ValidationException::withMessages([
                'shipping.country' => 'None of the stores in your cart ship to '.$this->countryName($country).'.',
            ]);
        }

        $orders = DB::transaction(fn (): array => array_map(
            fn (array $group): Order => $this->placeStoreOrder($request, $group[0], $group[1], $group[2], $quantities),
            $shippable,
        ));

        $orderedProductIds = collect($shippable)->flatMap(fn (array $group) => $group[1]->modelKeys())->all();
        $cart->remove($orderedProductIds);

        $orderIds = array_map(fn (Order $order): int => $order->id, $orders);
        foreach ($orderIds as $id) {
            $request->session()->push(self::PLACED_ORDERS, $id);
        }
        $request->session()->put(self::LAST_CHECKOUT, $orderIds);

        return redirect()->route('checkout.complete');
    }

    /**
     * The confirmation for the visitor's most recent checkout.
     */
    public function complete(Request $request): Response|RedirectResponse
    {
        $ids = array_intersect(
            $request->session()->get(self::LAST_CHECKOUT, []),
            $request->session()->get(self::PLACED_ORDERS, []),
        );
        if ($ids === []) {
            return redirect('/');
        }

        $orders = Order::query()->whereKey($ids)->with(['items', 'store'])->get();

        return Inertia::render('Checkout/Complete', [
            'orders' => $orders->map(fn (Order $order): array => [
                'id' => $order->id,
                'store' => ['name' => $order->store->name, 'subdomain' => $order->store->subdomain],
                'currency' => $order->store->currency()->value,
                'email' => $order->customer_email,
                'phone' => $order->customer_phone,
                'subtotal' => $order->subtotal,
                'shippingCost' => $order->shipping_cost,
                'shippingMethod' => $order->shipping_method,
                'total' => $order->total,
                'shippingAddress' => $order->shipping_address,
                'items' => $order->items->map(fn (OrderItem $item): array => [
                    'title' => $item->title,
                    'price' => $item->price,
                    'qty' => $item->qty,
                ]),
            ]),
        ]);
    }

    /**
     * Create one store's order. Prices and titles come from the database; the
     * products are row-locked so two shoppers can't oversell the same item.
     *
     * @param  Collection<int, Product>  $cartProducts
     * @param  array<int, int>  $quantities  product id => qty from the cart
     *
     * @throws ValidationException
     */
    private function placeStoreOrder(PlaceOrderRequest $request, Store $store, Collection $cartProducts, ShippingRate $rate, array $quantities): Order
    {
        $products = $store->products()
            ->active()
            ->whereKey($cartProducts->modelKeys())
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        $lines = [];
        foreach ($products as $product) {
            $qty = $quantities[$product->id];

            if ($product->stock < $qty) {
                throw ValidationException::withMessages([
                    'cart' => "\"{$product->title}\" only has {$product->stock} left in stock.",
                ]);
            }

            $product->decrement('stock', $qty);
            $lines[] = ['product_id' => $product->id, 'title' => $product->title, 'price' => $product->price, 'qty' => $qty];
        }

        $shipping = $request->address('shipping');
        $subtotal = collect($lines)->sum(fn (array $line): int => $line['price'] * $line['qty']);
        $shippingCost = $rate->costFor($subtotal);

        $order = $store->orders()->create([
            'customer_name' => trim($shipping['first_name'].' '.$shipping['last_name']),
            'customer_email' => $request->validated('email'),
            'customer_phone' => $request->validated('phone'),
            'shipping_address' => $shipping,
            'billing_address' => $request->address('billing'),
            'notes' => $request->validated('notes'),
            'subtotal' => $subtotal,
            'shipping_cost' => $shippingCost,
            'shipping_method' => $rate->name,
            'total' => $subtotal + $shippingCost,
        ]);
        $order->items()->createMany($lines);

        return $order;
    }

    private function countryName(string $code): string
    {
        return Locale::getDisplayRegion("-{$code}", 'en') ?: $code;
    }
}
