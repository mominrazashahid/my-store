<?php

namespace Tests\Feature\Models;

use App\Enums\StoreType;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_starter_content_creates_home_page_sample_products_and_theme(): void
    {
        $store = Store::factory()->create(['name' => 'Tech Hub', 'store_type' => StoreType::Electronics]);

        $store->createStarterContent();

        $home = $store->pages()->where('slug', 'home')->sole();
        $this->assertSame(['hero', 'products', 'footer'], array_map(fn ($section) => $section->type, $home->sections));
        $this->assertSame('© '.now()->year.' Tech Hub', $home->sections[2]->content->text);
        $this->assertEqualsCanonicalizing(
            ['Wireless Earbuds', '20000mAh Power Bank', 'Smart Watch', 'USB-C Fast Charger'],
            $store->products()->pluck('title')->all(),
        );
        $this->assertEquals($store->themeConfig->draft, $store->themeConfig->published);
    }

    public function test_free_store_reaches_product_limit_at_the_configured_cap(): void
    {
        config(['store.free_plan_product_limit' => 3]);
        $store = Store::factory()->create();
        Product::factory()->count(2)->for($store)->create();

        $this->assertFalse($store->hasReachedProductLimit());

        Product::factory()->for($store)->create();

        $this->assertTrue($store->hasReachedProductLimit());
    }

    public function test_paid_store_never_reaches_product_limit(): void
    {
        config(['store.free_plan_product_limit' => 1]);
        $store = Store::factory()->paid()->create();
        Product::factory()->count(2)->for($store)->create();

        $this->assertFalse($store->hasReachedProductLimit());
    }

    public function test_subdomain_is_saved_lowercase(): void
    {
        $store = Store::factory()->create(['subdomain' => '  Glow-Demo ']);

        $this->assertSame('glow-demo', $store->fresh()->subdomain);
    }

    public function test_empty_objects_in_theme_survive_a_round_trip(): void
    {
        $store = Store::factory()->create();
        $store->themeConfig()->create([
            'draft' => ['sections' => ['hero' => ['shared' => (object) []]]],
            'published' => (object) [],
        ]);

        $json = json_encode($store->themeConfig()->sole()->toArray());

        $this->assertStringContainsString('"shared":{}', $json);
        $this->assertStringContainsString('"published":{}', $json);
    }
}
