<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Enums\Currency;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductControllerTest extends TestCase
{
    use RefreshDatabase;

    private const VALID = [
        'title' => 'Silk Scarf',
        'description' => 'Hand-dyed',
        'price' => '19.99',
        'compareAtPrice' => '24.50',
        'stock' => '7',
        'status' => 'active',
        'images' => [],
    ];

    public function test_guest_is_redirected_to_login(): void
    {
        $store = Store::factory()->create();

        $this->get("/admin/stores/{$store->id}/products")->assertRedirect('/admin');
    }

    public function test_another_owners_store_returns_404(): void
    {
        $mine = Store::factory()->create();
        $theirs = Store::factory()->create();

        $this->actingAs($mine->owner)->get("/admin/stores/{$theirs->id}/products")->assertNotFound();
        $this->actingAs($mine->owner)->post("/admin/stores/{$theirs->id}/products", self::VALID)->assertNotFound();
        $this->assertSame(0, $theirs->products()->count());
    }

    public function test_lists_only_this_stores_products(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->create();
        Product::factory()->create();

        $this->actingAs($store->owner)->get("/admin/stores/{$store->id}/products")
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Products')
                ->has('products', 1)
                ->where('products.0.id', $product->id)
                ->where('store.id', $store->id)
            );
    }

    public function test_creates_product_converting_prices_to_minor_units(): void
    {
        $store = Store::factory()->create();

        $this->actingAs($store->owner)->post("/admin/stores/{$store->id}/products", self::VALID)
            ->assertRedirect();

        $product = $store->products()->sole();
        $this->assertSame(1999, $product->price);
        $this->assertSame(2450, $product->compare_at_price);
        $this->assertSame(7, $product->stock);
    }

    public function test_zero_decimal_currency_is_not_multiplied(): void
    {
        $store = Store::factory()->create(['settings' => ['currency' => Currency::Jpy->value]]);

        $this->actingAs($store->owner)->post("/admin/stores/{$store->id}/products", [...self::VALID, 'price' => '1800', 'compareAtPrice' => null]);

        $this->assertSame(1800, $store->products()->sole()->price);
    }

    public function test_free_plan_cannot_exceed_product_limit(): void
    {
        config(['store.free_plan_product_limit' => 1]);
        $store = Store::factory()->create();
        Product::factory()->for($store)->create();

        $this->actingAs($store->owner)->post("/admin/stores/{$store->id}/products", self::VALID)
            ->assertSessionHasErrors(['title' => 'The free plan is limited to 1 products. Upgrade to add more.']);
        $this->assertSame(1, $store->products()->count());
    }

    public function test_rejects_images_not_uploaded_to_this_store(): void
    {
        $store = Store::factory()->create();

        $this->actingAs($store->owner)->post("/admin/stores/{$store->id}/products", [
            ...self::VALID,
            'images' => ['/storage/stores/999/stolen.png'],
        ])->assertSessionHasErrors('images.0');
    }

    public function test_cannot_edit_another_stores_product_through_own_store_url(): void
    {
        $store = Store::factory()->create();
        $foreign = Product::factory()->create(['title' => 'Untouched']);

        $this->actingAs($store->owner)
            ->patch("/admin/stores/{$store->id}/products/{$foreign->id}", self::VALID)
            ->assertNotFound();
        $this->assertSame('Untouched', $foreign->fresh()->title);
    }

    public function test_deletes_product(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->create();

        $this->actingAs($store->owner)->delete("/admin/stores/{$store->id}/products/{$product->id}")
            ->assertRedirect();

        $this->assertModelMissing($product);
    }
}
