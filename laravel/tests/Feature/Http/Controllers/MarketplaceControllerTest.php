<?php

namespace Tests\Feature\Http\Controllers;

use App\Enums\StoreType;
use App\Models\Product;
use App\Models\Store;
use App\Support\ShopperCountry;
use Database\Factories\StoreFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MarketplaceControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A store that ships to Pakistan, the shopper country these tests browse from.
     */
    private function pkStore(): StoreFactory
    {
        return Store::factory()->shipsTo(['PK']);
    }

    /**
     * Browse the marketplace as a shopper who picked Pakistan.
     */
    private function browse(string $query = '')
    {
        return $this->withCookie(ShopperCountry::COOKIE, 'PK')->get('/'.$query);
    }

    public function test_caps_each_store_and_mixes_stores_before_repeating_one(): void
    {
        config(['store.marketplace.per_store' => 2]);
        $big = $this->pkStore()->create();
        $small = $this->pkStore()->create();
        Product::factory()->count(5)->for($big)->create();
        Product::factory()->for($small)->create();

        $this->browse()->assertInertia(fn (Assert $page) => $page
            ->component('Home')
            ->has('products', 3)
            ->where('products', fn ($products) => collect($products)->take(2)->pluck('store.subdomain')->sort()->values()->all()
                === collect([$big->subdomain, $small->subdomain])->sort()->values()->all())
        );
    }

    public function test_shows_only_stores_that_ship_to_the_shoppers_country(): void
    {
        $local = Product::factory()->for($this->pkStore())->create();
        Product::factory()->for(Store::factory()->shipsTo(['US']))->create();
        Product::factory()->create(); // a store with no shipping zones at all

        $this->browse()->assertInertia(fn (Assert $page) => $page
            ->where('shopperCountry', 'PK')
            ->has('products', 1)
            ->where('products.0.id', $local->id)
        );
    }

    public function test_shows_every_store_worldwide_by_default(): void
    {
        $local = Product::factory()->for($this->pkStore())->create();
        $american = Product::factory()->for(Store::factory()->shipsTo(['US']))->create();

        $this->get('/', ['Accept-Language' => 'en-US'])->assertInertia(fn (Assert $page) => $page
            ->where('shopperCountry', null)
            ->has('products', 2)
            ->where('products', fn ($products) => collect($products)->pluck('id')->sort()->values()->all()
                === collect([$local->id, $american->id])->sort()->values()->all())
        );
    }

    public function test_choosing_worldwide_again_shows_every_store(): void
    {
        Product::factory()->for($this->pkStore())->create();
        Product::factory()->for(Store::factory()->shipsTo(['US']))->create();

        $this->withCookie(ShopperCountry::COOKIE, ShopperCountry::WORLDWIDE)->get('/')
            ->assertInertia(fn (Assert $page) => $page->where('shopperCountry', null)->has('products', 2));
    }

    public function test_choosing_a_country_is_remembered(): void
    {
        $this->post('/country', ['country' => 'GB'])->assertCookie(ShopperCountry::COOKIE, 'GB');
    }

    public function test_rejects_an_invalid_country(): void
    {
        $this->post('/country', ['country' => 'Pakistan'])->assertSessionHasErrors('country');
    }

    public function test_hides_products_that_are_not_in_the_marketplace(): void
    {
        $listed = Product::factory()->for($this->pkStore())->create();
        Product::factory()->for($this->pkStore())->draft()->create();
        Product::factory()->for($this->pkStore())->outOfStock()->create();
        Product::factory()->for($this->pkStore()->hiddenFromMarketplace())->create();
        Product::factory()->for($this->pkStore()->suspended())->create();

        $this->browse()->assertInertia(fn (Assert $page) => $page
            ->has('products', 1)
            ->where('products.0.id', $listed->id)
        );
    }

    public function test_filters_by_store_type(): void
    {
        $gadget = Product::factory()->for($this->pkStore()->state(['store_type' => StoreType::Electronics]))->create();
        Product::factory()->for($this->pkStore()->state(['store_type' => StoreType::Clothing]))->create();

        $this->browse('?type=electronics')->assertInertia(fn (Assert $page) => $page
            ->where('filters.type', 'electronics')
            ->has('products', 1)
            ->where('products.0.id', $gadget->id)
            ->where('products.0.store.storeType', 'electronics')
        );
    }

    public function test_searches_titles_treating_wildcards_literally(): void
    {
        $store = $this->pkStore()->create();
        $sale = Product::factory()->for($store)->create(['title' => '50% off Lipstick']);
        Product::factory()->for($store)->create(['title' => '500 Thread Bedsheet']);

        $this->browse('?q=50%25')->assertInertia(fn (Assert $page) => $page
            ->has('products', 1)
            ->where('products.0.id', $sale->id)
        );
    }
}
