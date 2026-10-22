<?php

namespace App\Models;

use App\Enums\ProductStatus;
use App\Models\Concerns\HasStoreScopedSlug;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'category_id',
    'title',
    'slug',
    'description',
    'price',
    'compare_at_price',
    'images',
    'stock',
    'status',
])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, HasStoreScopedSlug;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'active',
        'stock' => 0,
        'images' => '[]',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'compare_at_price' => 'integer',
            'stock' => 'integer',
            'images' => 'array',
            'status' => ProductStatus::class,
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
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    #[Scope]
    protected function active(Builder $query): Builder
    {
        return $query->where('status', ProductStatus::Active);
    }

    /**
     * Active and in stock — what a shopper can actually order.
     */
    #[Scope]
    protected function sellable(Builder $query): Builder
    {
        return $query->active()->where('stock', '>', 0);
    }

    /**
     * Sellable products from stores listed in the platform marketplace feed.
     */
    #[Scope]
    protected function inMarketplace(Builder $query): Builder
    {
        return $query->sellable()->whereHas('store', fn (Builder $store) => $store->listedInMarketplace());
    }
}
