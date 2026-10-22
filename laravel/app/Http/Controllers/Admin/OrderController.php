<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Store $managedStore): Response
    {
        $orders = $managedStore->orders()->with('items')->latest()->limit(200)->get();

        return $this->renderAdmin($managedStore, 'Admin/Orders', [
            'orders' => $orders->map(fn (Order $order): array => [
                'id' => $order->id,
                'customer' => [
                    'name' => $order->customer_name,
                    'email' => $order->customer_email,
                    'phone' => $order->customer_phone,
                ],
                'shippingAddress' => $order->shipping_address,
                // only sent when it differs, so the admin shows one address in the common case
                'billingAddress' => $order->billing_address !== $order->shipping_address ? $order->billing_address : null,
                'notes' => $order->notes,
                'items' => $order->items->map(fn (OrderItem $item): array => [
                    'title' => $item->title,
                    'price' => $item->price,
                    'qty' => $item->qty,
                ]),
                'subtotal' => $order->subtotal,
                'shippingCost' => $order->shipping_cost,
                'shippingMethod' => $order->shipping_method,
                'total' => $order->total,
                'status' => $order->status,
                'carrier' => $order->carrier,
                'trackingNumber' => $order->tracking_number,
                'nextStatuses' => $order->status->nextStatuses(),
                'createdAt' => $order->created_at->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Move an order along pending -> confirmed -> shipped -> delivered, or cancel
     * it. Cancelling puts the items back in stock; shipping can record the
     * carrier and tracking number.
     */
    public function update(Request $request, Store $managedStore, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(OrderStatus::class)],
            'carrier' => ['nullable', 'string', 'max:100'],
            'trackingNumber' => ['nullable', 'string', 'max:100'],
        ]);
        $status = OrderStatus::from($validated['status']);

        DB::transaction(function () use ($order, $status, $validated): void {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);

            if (! in_array($status, $order->status->nextStatuses(), true)) {
                throw ValidationException::withMessages([
                    'status' => "A {$order->status->value} order can't be marked {$status->value}.",
                ]);
            }

            if ($status === OrderStatus::Cancelled) {
                foreach ($order->items()->whereNotNull('product_id')->get() as $item) {
                    $item->product()->increment('stock', $item->qty);
                }
            }

            $order->update([
                'status' => $status,
                ...($status === OrderStatus::Shipped ? [
                    'carrier' => $validated['carrier'] ?? null,
                    'tracking_number' => $validated['trackingNumber'] ?? null,
                    'shipped_at' => now(),
                ] : []),
            ]);
        });

        Inertia::flash('success', "Order #{$order->id} marked {$status->value}.");

        return back();
    }
}
