<?php

namespace App\Http\Resources;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The store as its owner sees it in the admin.
 *
 * @mixin Store
 */
class AdminStoreResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'subdomain' => $this->subdomain,
            'storeType' => $this->store_type,
            'themeId' => $this->theme_id,
            'plan' => $this->plan,
            'currency' => $this->currency()->value,
            'showInMarketplace' => $this->show_in_marketplace,
            'contactPhone' => $this->contact_phone,
            'contactEmail' => $this->contact_email,
            'address' => (object) ($this->address ?? []),
            'whatsapp' => $this->settings['whatsapp'] ?? null,
        ];
    }
}
