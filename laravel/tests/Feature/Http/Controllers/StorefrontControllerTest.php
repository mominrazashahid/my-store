<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Product;
use App\Models\Store;
use App\Support\ShopperCountry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StorefrontControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_renders_home_page_with_only_active_products(): void
    {
        $store = Store::factory()->withHomePage()->create(['name' => 'Glow Beauty', 'subdomain' => 'glow']);
        $active = Product::factory()->for($store)->create(['compare_at_price' => 1500]);
        Product::factory()->for($store)->draft()->create();
        Product::factory()->create();

        $response = $this->get('/store/GLOW');

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Storefront/Home')
            ->where('store.name', 'Glow Beauty')
            ->where('store.basePath', '/store/glow')
            ->where('page.sections.0.type', 'hero')
            ->has('products', 1)
            ->where('products.0.id', $active->id)
            ->where('products.0.compareAtPrice', 1500)
        );
    }

    public function test_shows_twelve_products_per_page_with_load_more(): void
    {
        $store = Store::factory()->withHomePage()->create();
        Product::factory()->count(13)->for($store)->create();

        $this->get("/store/{$store->subdomain}")
            ->assertInertia(fn (Assert $page) => $page
                ->has('products', 12)
                ->where('productsPage', ['current' => 1, 'hasMore' => true])
            );

        $this->get("/store/{$store->subdomain}?page=2")
            ->assertInertia(fn (Assert $page) => $page
                ->has('products', 1)
                ->where('productsPage', ['current' => 2, 'hasMore' => false])
            );
    }

    public function test_promotes_other_stores_at_most_two_products_each(): void
    {
        $store = Store::factory()->withHomePage()->create();
        Product::factory()->for($store)->create();
        $neighbour = Store::factory()->shipsTo(['PK'])->create();
        Product::factory()->count(5)->for($neighbour)->create();
        $another = Store::factory()->shipsTo(['PK'])->create();
        Product::factory()->for($another)->create();
        Product::factory()->for(Store::factory()->shipsTo(['PK'])->hiddenFromMarketplace())->create();
        Product::factory()->for(Store::factory()->shipsTo(['US']))->create(); // can't deliver to the shopper

        $this->withCookie(ShopperCountry::COOKIE, 'PK')->get("/store/{$store->subdomain}")
            ->assertInertia(fn (Assert $page) => $page
                ->has('otherStoresProducts', 3)
                ->where('otherStoresProducts', fn ($products) => collect($products)->pluck('store.subdomain')->sort()->values()->all()
                    === collect([$neighbour->subdomain, $neighbour->subdomain, $another->subdomain])->sort()->values()->all())
            );
    }

    public function test_store_outside_the_marketplace_does_not_promote_others(): void
    {
        $store = Store::factory()->withHomePage()->hiddenFromMarketplace()->create();
        Product::factory()->count(3)->create();

        $this->get("/store/{$store->subdomain}")
            ->assertInertia(fn (Assert $page) => $page->has('otherStoresProducts', 0));
    }

    public function test_does_not_expose_owner_or_plan(): void
    {
        $store = Store::factory()->withHomePage()->create();

        $response = $this->get("/store/{$store->subdomain}");

        $response->assertInertia(fn (Assert $page) => $page
            ->missing('store.owner_id')
            ->missing('store.plan')
            ->missing('store.status')
        );
    }

    public function test_only_the_owner_gets_a_manage_link(): void
    {
        $store = Store::factory()->withHomePage()->create();

        $this->get("/store/{$store->subdomain}")
            ->assertInertia(fn (Assert $page) => $page->where('store.manageUrl', null));
        $this->actingAs(Store::factory()->create()->owner)->get("/store/{$store->subdomain}")
            ->assertInertia(fn (Assert $page) => $page->where('store.manageUrl', null));
        $this->actingAs($store->owner)->get("/store/{$store->subdomain}")
            ->assertInertia(fn (Assert $page) => $page->where('store.manageUrl', "/admin/stores/{$store->id}/products"));
    }

    public function test_suspended_store_returns_404(): void
    {
        $store = Store::factory()->suspended()->withHomePage()->create();

        $this->get("/store/{$store->subdomain}")->assertNotFound();
    }

    public function test_unknown_store_returns_404(): void
    {
        $this->get('/store/does-not-exist')->assertNotFound();
    }
}
