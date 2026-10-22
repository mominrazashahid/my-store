<?php

namespace Tests\Feature\Http\Controllers;

use App\Enums\Currency;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Support\ShopperCountry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CheckoutControllerTest extends TestCase
{
    use RefreshDatabase;

    private const ADDRESS = [
        'firstName' => 'Ayesha',
        'lastName' => 'Khan',
        'line1' => 'House 12, Street 4',
        'line2' => 'Flat 2',
        'city' => 'Lahore',
        'state' => 'Punjab',
        'postalCode' => '54000',
        'country' => 'PK',
    ];

    private function pkrStore(array $shipsTo = ['PK'], int $shippingPrice = 0, ?int $freeOver = null): Store
    {
        return Store::factory()
            ->shipsTo($shipsTo, $shippingPrice, $freeOver)
            ->create(['settings' => ['currency' => Currency::Pkr->value]]);
    }

    private function rateId(Store $store): int
    {
        return $store->shippingZones()->first()->rates()->first()->id;
    }

    private function addToCart(Product $product, int $qty = 1): void
    {
        $this->post('/cart/items', ['productId' => $product->id, 'qty' => $qty]);
    }

    /**
     * @param  array<int, int>  $rates  store id => rate id
     * @return array<string, mixed>
     */
    private function checkout(array $rates, array $overrides = []): array
    {
        return [
            'email' => 'Ayesha@Example.com',
            'phone' => '+92 300 1234567',
            'shipping' => self::ADDRESS,
            'billingSameAsShipping' => true,
            'notes' => 'Call before delivery',
            'currency' => 'PKR',
            'shippingRates' => $rates,
            ...$overrides,
        ];
    }

    public function test_places_one_order_per_store_with_database_prices_and_shipping(): void
    {
        $storeA = $this->pkrStore(shippingPrice: 25000);
        $storeB = $this->pkrStore(shippingPrice: 30000);
        $serum = Product::factory()->for($storeA)->create(['title' => 'Serum', 'price' => 280000, 'stock' => 5]);
        $kurta = Product::factory()->for($storeB)->create(['title' => 'Kurta', 'price' => 220000, 'stock' => 5]);
        $this->addToCart($serum, 2);
        $this->addToCart($kurta);

        $this->post('/checkout', $this->checkout([$storeA->id => $this->rateId($storeA), $storeB->id => $this->rateId($storeB)]))
            ->assertRedirect('/checkout/complete');

        $orderA = Order::whereBelongsTo($storeA)->sole();
        $orderB = Order::whereBelongsTo($storeB)->sole();
        $this->assertSame(560000, $orderA->subtotal);
        $this->assertSame(25000, $orderA->shipping_cost);
        $this->assertSame(585000, $orderA->total);
        $this->assertSame(250000, $orderB->total);
        $this->assertSame('ayesha@example.com', $orderB->customer_email);
        $this->assertSame('Flat 2', $orderB->shipping_address['line2']);
        $this->assertSame(3, $serum->fresh()->stock);
        $this->assertSame(4, $kurta->fresh()->stock);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('cart.count', 0));
        $this->get('/checkout/complete')->assertInertia(fn (Assert $page) => $page
            ->component('Checkout/Complete')
            ->has('orders', 2)
        );
    }

    public function test_store_that_does_not_ship_to_the_address_is_skipped_and_stays_in_the_cart(): void
    {
        $ships = $this->pkrStore();
        $doesNot = $this->pkrStore(['US']);
        $shipped = Product::factory()->for($ships)->create(['stock' => 5]);
        $left = Product::factory()->for($doesNot)->create(['stock' => 5]);
        $this->addToCart($shipped);
        $this->addToCart($left);

        $this->post('/checkout', $this->checkout([$ships->id => $this->rateId($ships)]))
            ->assertRedirect('/checkout/complete');

        $this->assertSame(1, Order::count());
        $this->assertSame($ships->id, Order::sole()->store_id);
        $this->assertSame(5, $left->fresh()->stock);
        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('cart.count', 1)
            ->where('cart.groups.0.items.0.productId', $left->id)
        );
    }

    public function test_rejects_when_no_store_in_the_cart_ships_to_the_address(): void
    {
        $store = $this->pkrStore(['US']);
        $this->addToCart(Product::factory()->for($store)->create());

        $this->post('/checkout', $this->checkout([]))
            ->assertSessionHasErrors(['shipping.country' => 'None of the stores in your cart ship to Pakistan.']);
        $this->assertSame(0, Order::count());
    }

    public function test_only_the_chosen_currency_is_checked_out(): void
    {
        $pkr = $this->pkrStore();
        $usd = Store::factory()->shipsTo(['PK'])->create(['settings' => ['currency' => 'USD']]);
        $this->addToCart(Product::factory()->for($pkr)->create());
        $dollarProduct = Product::factory()->for($usd)->create();
        $this->addToCart($dollarProduct);

        $this->post('/checkout', $this->checkout([$pkr->id => $this->rateId($pkr), $usd->id => $this->rateId($usd)]));

        $this->assertSame([$pkr->id], Order::pluck('store_id')->all());
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('cart.groups.0.items.0.productId', $dollarProduct->id));
    }

    public function test_checkout_page_offers_one_currency_at_a_time(): void
    {
        $pkr = $this->pkrStore();
        $usd = Store::factory()->shipsTo(['US'])->create(['settings' => ['currency' => 'USD']]);
        $this->addToCart(Product::factory()->for($pkr)->create());
        $this->addToCart(Product::factory()->for($usd)->create());

        $this->get('/checkout?currency=USD')->assertInertia(fn (Assert $page) => $page
            ->component('Checkout/Index')
            ->where('currency', 'USD')
            ->where('currencies', fn ($currencies) => collect($currencies)->sort()->values()->all() === ['PKR', 'USD'])
            ->has("shipping.{$usd->id}")
            ->missing("shipping.{$pkr->id}")
        );
    }

    public function test_address_country_defaults_to_the_browser_region_while_browsing_worldwide(): void
    {
        $this->addToCart(Product::factory()->for($this->pkrStore())->create());

        $this->get('/checkout', ['Accept-Language' => 'ur-PK,en;q=0.8'])
            ->assertInertia(fn (Assert $page) => $page->where('defaultCountry', 'PK'));
    }

    public function test_address_country_defaults_to_the_chosen_country(): void
    {
        $this->addToCart(Product::factory()->for($this->pkrStore())->create());

        $this->withCookie(ShopperCountry::COOKIE, 'GB')->get('/checkout', ['Accept-Language' => 'ur-PK'])
            ->assertInertia(fn (Assert $page) => $page->where('defaultCountry', 'GB'));
    }

    public function test_rejects_a_rate_from_another_store(): void
    {
        $store = $this->pkrStore();
        $other = $this->pkrStore();
        $this->addToCart(Product::factory()->for($store)->create());

        $this->post('/checkout', $this->checkout([$store->id => $this->rateId($other)]))
            ->assertSessionHasErrors(["shippingRates.{$store->id}" => "Choose a shipping method for {$store->name}."]);
    }

    public function test_free_shipping_once_the_store_subtotal_reaches_the_threshold(): void
    {
        $store = $this->pkrStore(shippingPrice: 25000, freeOver: 100000);
        $this->addToCart(Product::factory()->for($store)->create(['price' => 100000]));

        $this->post('/checkout', $this->checkout([$store->id => $this->rateId($store)]));

        $this->assertSame(0, Order::sole()->shipping_cost);
    }

    public function test_addresses_outside_pakistan_are_blocked_until_card_payment_exists(): void
    {
        $store = $this->pkrStore(['US']);
        $product = Product::factory()->for($store)->create(['stock' => 5]);
        $this->addToCart($product);

        $this->post('/checkout', $this->checkout(
            [$store->id => $this->rateId($store)],
            ['shipping' => [...self::ADDRESS, 'country' => 'US', 'state' => 'TX', 'postalCode' => '78701']],
        ))->assertSessionHasErrors(['payment' => 'Card payment is coming soon. For now, orders can only be paid cash on delivery within Pakistan.']);

        $this->assertSame(0, Order::count());
        $this->assertSame(5, $product->fresh()->stock);
    }

    public function test_stock_shortfall_in_one_store_rolls_back_every_order(): void
    {
        $storeA = $this->pkrStore();
        $storeB = $this->pkrStore();
        $plenty = Product::factory()->for($storeA)->create(['stock' => 10]);
        $scarce = Product::factory()->for($storeB)->create(['title' => 'Smart Watch', 'stock' => 3]);
        $this->addToCart($plenty, 2);
        $this->addToCart($scarce, 3);
        $scarce->update(['stock' => 1]); // someone else bought some meanwhile

        $this->post('/checkout', $this->checkout([$storeA->id => $this->rateId($storeA), $storeB->id => $this->rateId($storeB)]))
            ->assertSessionHasErrors(['cart' => '"Smart Watch" only has 1 left in stock.']);

        $this->assertSame(0, Order::count());
        $this->assertSame(10, $plenty->fresh()->stock);
    }

    public function test_us_address_requires_state_and_postal_code(): void
    {
        $store = $this->pkrStore(['US']);
        $this->addToCart(Product::factory()->for($store)->create());

        $this->post('/checkout', $this->checkout(
            [$store->id => $this->rateId($store)],
            ['shipping' => [...self::ADDRESS, 'country' => 'US', 'state' => '', 'postalCode' => '']],
        ))->assertSessionHasErrors([
            'shipping.state' => 'Shipping address: select a state / province.',
            'shipping.postalCode' => 'Shipping address: enter a postal code.',
        ]);
    }

    public function test_requires_billing_address_when_not_same_as_shipping(): void
    {
        $store = $this->pkrStore();
        $this->addToCart(Product::factory()->for($store)->create());

        $this->post('/checkout', $this->checkout([$store->id => $this->rateId($store)], ['billingSameAsShipping' => false]))
            ->assertSessionHasErrors(['billing.line1' => 'Billing address: enter a street address.']);
    }

    public function test_empty_cart_cannot_be_checked_out(): void
    {
        $this->post('/checkout', $this->checkout([]))->assertSessionHasErrors(['cart' => 'Your cart is empty.']);
    }

    public function test_confirmation_is_only_for_the_buyer(): void
    {
        $store = $this->pkrStore();
        $this->addToCart(Product::factory()->for($store)->create());
        $this->post('/checkout', $this->checkout([$store->id => $this->rateId($store)]));

        $this->get('/checkout/complete')->assertOk();

        $this->flushSession();
        $this->get('/checkout/complete')->assertRedirect('/');
    }
}
