<?php

namespace App\Http\Resources;

use App\Models\Store;
use App\Models\ThemeConfig;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public store info for rendering a storefront. Only fields a visitor may see:
 * no owner, plan or status.
 *
 * @mixin Store
 */
class StorefrontStoreResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'subdomain' => $this->subdomain,
            'storeType' => $this->store_type,
            'themeId' => $this->theme_id,
            'settings' => (object) [...($this->settings ?? []), 'currency' => $this->currency()->value],
            'contactPhone' => $this->contact_phone,
            'contactEmail' => $this->contact_email,
            'address' => $this->address,
            // the live (published) theme; stores created before themes existed fall back to the default
            'theme' => $this->themeConfig?->published ?? ThemeConfig::defaultTheme(),
            // path the storefront is mounted at, so theme links stay inside the store
            'basePath' => '/store/'.$this->subdomain,
            // only the logged-in owner gets a link back to their admin
            'manageUrl' => $request->user()?->getAuthIdentifier() === $this->owner_id
                ? route('admin.stores.products.index', $this->resource, absolute: false)
                : null,
        ];
    }
}
