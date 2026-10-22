<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    private function order(Store $store, Product $product, int $qty, OrderStatus $status = OrderStatus::Pending): Order
    {
        $order = $store->orders()->create([
            'customer_name' => 'Sam Carter',
            'customer_email' => 'sam@example.com',
            'customer_phone' => '555',
            'shipping_address' => ['first_name' => 'Sam', 'last_name' => 'Carter', 'line1' => '1 Main St', 'city' => 'Austin', 'country' => 'US'],
            'total' => $product->price * $qty,
            'status' => $status,
        ]);
        $order->items()->create(['product_id' => $product->id, 'title' => $product->title, 'price' => $product->price, 'qty' => $qty]);

        return $order;
    }

    public function test_confirms_a_pending_order(): void
    {
        $store = Store::factory()->create();
        $order = $this->order($store, Product::factory()->for($store)->create(), 1);

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/orders/{$order->id}", ['status' => 'confirmed'])
            ->assertRedirect();

        $this->assertSame(OrderStatus::Confirmed, $order->fresh()->status);
    }

    public function test_marking_shipped_records_carrier_and_tracking_number(): void
    {
        $store = Store::factory()->create();
        $order = $this->order($store, Product::factory()->for($store)->create(), 1, OrderStatus::Confirmed);

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/orders/{$order->id}", [
            'status' => 'shipped',
            'carrier' => 'TCS',
            'trackingNumber' => 'TCS123456',
        ]);

        $order->refresh();
        $this->assertSame(OrderStatus::Shipped, $order->status);
        $this->assertSame('TCS', $order->carrier);
        $this->assertSame('TCS123456', $order->tracking_number);
        $this->assertNotNull($order->shipped_at);
    }

    public function test_cancelling_puts_items_back_in_stock(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->create(['stock' => 3]);
        $order = $this->order($store, $product, 2);

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/orders/{$order->id}", ['status' => 'cancelled']);

        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
        $this->assertSame(5, $product->fresh()->stock);
    }

    public function test_rejects_moving_a_delivered_order(): void
    {
        $store = Store::factory()->create();
        $product = Product::factory()->for($store)->create(['stock' => 3]);
        $order = $this->order($store, $product, 2, OrderStatus::Delivered);

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/orders/{$order->id}", ['status' => 'cancelled'])
            ->assertSessionHasErrors(['status' => "A delivered order can't be marked cancelled."]);

        $this->assertSame(OrderStatus::Delivered, $order->fresh()->status);
        $this->assertSame(3, $product->fresh()->stock);
    }

    public function test_another_owners_order_returns_404(): void
    {
        $mine = Store::factory()->create();
        $theirs = Store::factory()->create();
        $order = $this->order($theirs, Product::factory()->for($theirs)->create(), 1);

        $this->actingAs($mine->owner)->patch("/admin/stores/{$mine->id}/orders/{$order->id}", ['status' => 'confirmed'])
            ->assertNotFound();
        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);
    }
}
