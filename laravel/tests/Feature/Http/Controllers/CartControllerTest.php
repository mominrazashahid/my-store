<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Product;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CartControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_one_cart_holds_products_from_several_stores_grouped_by_store(): void
    {
        $lipstick = Product::factory()->create(['price' => 1200, 'stock' => 10]);
        $earbuds = Product::factory()->create(['price' => 3500, 'stock' => 10]);

        $this->post('/cart/items', ['productId' => $lipstick->id, 'qty' => 2]);
        $this->post('/cart/items', ['productId' => $earbuds->id]);
        $this->post('/cart/items', ['productId' => $lipstick->id]);

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('cart.count', 4)
            ->has('cart.groups', 2)
            ->where('cart.groups', fn ($groups) => collect($groups)->firstWhere('store.id', $lipstick->store_id)['items'][0]['qty'] === 3
                && collect($groups)->firstWhere('store.id', $lipstick->store_id)['subtotal'] === 3600)
        );
    }

    public function test_quantity_is_capped_at_stock(): void
    {
        $product = Product::factory()->create(['stock' => 2]);

        $this->post('/cart/items', ['productId' => $product->id, 'qty' => 5]);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('cart.groups.0.items.0.qty', 2));
    }

    public function test_rejects_sold_out_and_draft_products(): void
    {
        $soldOut = Product::factory()->outOfStock()->create(['title' => 'Gone']);
        $draft = Product::factory()->draft()->create();

        $this->post('/cart/items', ['productId' => $soldOut->id])->assertSessionHasErrors(['cart' => '"Gone" is sold out.']);
        $this->post('/cart/items', ['productId' => $draft->id])->assertSessionHasErrors(['cart' => 'That product is no longer available.']);
    }

    public function test_setting_quantity_to_zero_removes_the_line(): void
    {
        $product = Product::factory()->create();
        $this->post('/cart/items', ['productId' => $product->id]);

        $this->patch("/cart/items/{$product->id}", ['qty' => 0]);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('cart.count', 0));
    }

    public function test_products_that_stop_being_sold_drop_out_of_the_cart(): void
    {
        $product = Product::factory()->create();
        $this->post('/cart/items', ['productId' => $product->id]);

        $product->update(['status' => 'draft']);

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('cart.count', 0)->has('cart.groups', 0));
    }

    public function test_removes_a_line(): void
    {
        $keep = Product::factory()->create();
        $drop = Product::factory()->create();
        $this->post('/cart/items', ['productId' => $keep->id]);
        $this->post('/cart/items', ['productId' => $drop->id]);

        $this->delete("/cart/items/{$drop->id}");

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('cart.count', 1)
            ->where('cart.groups.0.items.0.productId', $keep->id)
        );
    }

    public function test_products_from_a_suspended_store_cannot_be_added(): void
    {
        $product = Product::factory()->for(Store::factory()->suspended())->create();

        $this->post('/cart/items', ['productId' => $product->id])->assertSessionHasErrors('cart');
    }
}
