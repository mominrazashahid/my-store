<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One shipping option in a zone, e.g. "Standard, $5, 3–7 days, free over $50".
 * Amounts are in the store currency's minor units.
 */
#[Fillable(['name', 'price', 'free_over', 'min_days', 'max_days'])]
class ShippingRate extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'free_over' => 'integer',
            'min_days' => 'integer',
            'max_days' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<ShippingZone, $this>
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(ShippingZone::class, 'shipping_zone_id');
    }

    /**
     * What this rate costs for an order with the given subtotal.
     */
    public function costFor(int $subtotal): int
    {
        if ($this->free_over !== null && $subtotal >= $this->free_over) {
            return 0;
        }

        return $this->price;
    }
}
