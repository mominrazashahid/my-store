<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Product;
use App\Models\Store;
use App\Support\ShopperCountry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StorefrontProductControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_shows_up_to_eight_more_products_from_the_store_and_flags_more(): void
    {
        $store = Store::factory()->withHomePage()->create();
        $product = Product::factory()->for($store)->create(['title' => 'Silk Scarf']);
        Product::factory()->count(9)->for($store)->create();

        $this->get("/store/{$store->subdomain}/products/silk-scarf")
            ->assertInertia(fn (Assert $page) => $page
                ->component('Storefront/Product')
                ->where('product.id', $product->id)
                ->has('related', 8)
                ->where('related', fn ($related) => ! collect($related)->contains('id', $product->id))
                ->where('storeHasMore', true)
            );
    }

    public function test_does_not_flag_more_when_the_store_has_eight_or_fewer_others(): void
    {
        $store = Store::factory()->withHomePage()->create();
        Product::factory()->for($store)->create(['title' => 'Silk Scarf']);
        Product::factory()->count(8)->for($store)->create();

        $this->get("/store/{$store->subdomain}/products/silk-scarf")
            ->assertInertia(fn (Assert $page) => $page->has('related', 8)->where('storeHasMore', false));
    }

    public function test_promotes_products_from_other_stores_that_ship_to_the_shopper(): void
    {
        $store = Store::factory()->withHomePage()->create();
        Product::factory()->for($store)->create(['title' => 'Silk Scarf']);
        $other = Product::factory()->for(Store::factory()->shipsTo(['PK']))->create();
        Product::factory()->for(Store::factory()->shipsTo(['US']))->create(); // can't deliver to the shopper

        $this->withCookie(ShopperCountry::COOKIE, 'PK')->get("/store/{$store->subdomain}/products/silk-scarf")
            ->assertInertia(fn (Assert $page) => $page
                ->has('otherStoresProducts', 1)
                ->where('otherStoresProducts.0.id', $other->id)
            );
    }

    public function test_lists_the_countries_the_store_ships_to(): void
    {
        $store = Store::factory()->withHomePage()->shipsTo(['US', 'CA'])->create();
        Product::factory()->for($store)->create(['title' => 'Silk Scarf']);

        $this->get("/store/{$store->subdomain}/products/silk-scarf")
            ->assertInertia(fn (Assert $page) => $page->where('shipsTo', ['CA', 'US']));
    }

    public function test_draft_product_returns_404(): void
    {
        $store = Store::factory()->withHomePage()->create();
        Product::factory()->for($store)->draft()->create(['title' => 'Hidden']);

        $this->get("/store/{$store->subdomain}/products/hidden")->assertNotFound();
    }

    public function test_product_from_another_store_returns_404(): void
    {
        $store = Store::factory()->withHomePage()->create();
        Product::factory()->create(['title' => 'Elsewhere']);

        $this->get("/store/{$store->subdomain}/products/elsewhere")->assertNotFound();
    }
}
