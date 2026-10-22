<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A product card on the platform home page, with the store it links to.
 *
 * @mixin Product
 */
class MarketplaceProductResource extends JsonResource
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
            'title' => $this->title,
            'slug' => $this->slug,
            'price' => $this->price,
            'compareAtPrice' => $this->compare_at_price,
            'image' => $this->images[0] ?? null,
            'store' => [
                'name' => $this->store->name,
                'subdomain' => $this->store->subdomain,
                'storeType' => $this->store->store_type,
                'currency' => $this->store->currency()->value,
            ],
        ];
    }
}
