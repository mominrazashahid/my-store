<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Support\Cart;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * The marketplace-wide cart. Every action redirects back; the updated cart
 * reaches the page through the shared `cart` prop.
 */
class CartController extends Controller
{
    public function store(Request $request, Cart $cart): RedirectResponse
    {
        $validated = $request->validate([
            'productId' => ['required', 'integer'],
            'qty' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $product = $this->purchasable($validated['productId']);
        if ($product->stock < 1) {
            throw ValidationException::withMessages(['cart' => "\"{$product->title}\" is sold out."]);
        }

        $cart->add($product, $validated['qty'] ?? 1);

        return back();
    }

    public function update(Request $request, Cart $cart, int $productId): RedirectResponse
    {
        $validated = $request->validate(['qty' => ['required', 'integer', 'min:0', 'max:100']]);

        $cart->set($this->purchasable($productId), $validated['qty']);

        return back();
    }

    public function destroy(Cart $cart, int $productId): RedirectResponse
    {
        $cart->remove([$productId]);

        return back();
    }

    /**
     * An active product from an active store, or a validation error.
     */
    private function purchasable(int $productId): Product
    {
        $product = Product::query()
            ->active()
            ->whereKey($productId)
            ->whereHas('store', fn ($store) => $store->active())
            ->first();

        if (! $product) {
            throw ValidationException::withMessages(['cart' => 'That product is no longer available.']);
        }

        return $product;
    }
}
