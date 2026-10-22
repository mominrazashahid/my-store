<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A guest cash-on-delivery order. Always belongs to exactly one store.
 */
#[Fillable([
    'customer_name',
    'customer_email',
    'customer_phone',
    'shipping_address',
    'billing_address',
    'notes',
    'subtotal',
    'shipping_cost',
    'shipping_method',
    'total',
    'status',
    'carrier',
    'tracking_number',
    'shipped_at',
])]
class Order extends Model
{
    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'payment_method' => 'COD',
        'status' => 'pending',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'integer',
            'shipping_cost' => 'integer',
            'total' => 'integer',
            'status' => OrderStatus::class,
            'shipped_at' => 'datetime',
            'shipping_address' => 'array',
            'billing_address' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
