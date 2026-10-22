<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller as BaseController;
use App\Http\Resources\AdminStoreResource;
use App\Models\Store;
use Inertia\Inertia;
use Inertia\Response;

abstract class Controller extends BaseController
{
    /**
     * Render an admin page with the props every admin page's layout needs:
     * the store being managed and the owner's other stores for the switcher.
     *
     * @param  array<string, mixed>  $props
     */
    protected function renderAdmin(Store $store, string $component, array $props = []): Response
    {
        return Inertia::render($component, [
            ...$props,
            'store' => AdminStoreResource::make($store)->resolve(),
            'stores' => $store->owner->stores()->orderBy('name')->get(['id', 'name'])
                ->map(fn (Store $other): array => ['id' => $other->id, 'name' => $other->name]),
        ]);
    }
}
