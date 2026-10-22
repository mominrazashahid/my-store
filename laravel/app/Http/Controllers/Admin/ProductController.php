<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StorePlan;
use App\Http\Requests\Admin\ProductRequest;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Store $managedStore): Response
    {
        $products = $managedStore->products()->latest()->get();

        return $this->renderAdmin($managedStore, 'Admin/Products', [
            'products' => $products->map(fn (Product $product): array => [
                'id' => $product->id,
                'title' => $product->title,
                'description' => $product->description ?? '',
                'price' => $product->price,
                'compareAtPrice' => $product->compare_at_price,
                'stock' => $product->stock,
                'status' => $product->status,
                'images' => $product->images ?? [],
            ]),
            'productLimit' => $managedStore->plan === StorePlan::Free ? config('store.free_plan_product_limit') : null,
        ]);
    }

    public function store(ProductRequest $request, Store $managedStore): RedirectResponse
    {
        if ($managedStore->hasReachedProductLimit()) {
            throw ValidationException::withMessages([
                'title' => 'The free plan is limited to '.config('store.free_plan_product_limit').' products. Upgrade to add more.',
            ]);
        }

        $managedStore->products()->create($request->toAttributes($managedStore));
        Inertia::flash('success', 'Product added.');

        return back();
    }

    public function update(ProductRequest $request, Store $managedStore, Product $product): RedirectResponse
    {
        $product->update($request->toAttributes($managedStore));
        Inertia::flash('success', 'Product saved.');

        return back();
    }

    public function destroy(Store $managedStore, Product $product): RedirectResponse
    {
        $product->delete();
        Inertia::flash('success', 'Product deleted.');

        return back();
    }
}
