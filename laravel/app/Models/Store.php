<?php

namespace App\Models;

use App\Enums\Currency;
use App\Enums\ProductStatus;
use App\Enums\StorePlan;
use App\Enums\StoreStatus;
use App\Enums\StoreType;
use Database\Factories\StoreFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * A tenant. Every store-owned table carries a store_id pointing here.
 * `plan` and `status` are deliberately not fillable: owners can't change them.
 */
#[Fillable([
    'name',
    'subdomain',
    'store_type',
    'theme_id',
    'show_in_marketplace',
    'contact_phone',
    'contact_email',
    'address',
    'settings',
])]
class Store extends Model
{
    /** @use HasFactory<StoreFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'plan' => 'free',
        'status' => 'active',
        'show_in_marketplace' => true,
        'settings' => '{"currency":"USD"}',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'store_type' => StoreType::class,
            'plan' => StorePlan::class,
            'status' => StoreStatus::class,
            'show_in_marketplace' => 'boolean',
            'address' => 'array',
            'settings' => 'array',
        ];
    }

    /**
     * Subdomains are case-insensitive in URLs, so always store them lowercase.
     */
    protected function subdomain(): Attribute
    {
        return Attribute::make(set: fn (string $value): string => strtolower(trim($value)));
    }

    protected function contactEmail(): Attribute
    {
        return Attribute::make(set: fn (?string $value): ?string => $value === null ? null : strtolower(trim($value)));
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * @return HasMany<Category, $this>
     */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    /**
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * @return HasMany<Page, $this>
     */
    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }

    /**
     * @return HasMany<ShippingZone, $this>
     */
    public function shippingZones(): HasMany
    {
        return $this->hasMany(ShippingZone::class);
    }

    /**
     * @return HasOne<ThemeConfig, $this>
     */
    public function themeConfig(): HasOne
    {
        return $this->hasOne(ThemeConfig::class);
    }

    #[Scope]
    protected function active(Builder $query): Builder
    {
        return $query->where('status', StoreStatus::Active);
    }

    /**
     * Active stores whose products may appear in the platform-wide marketplace feed.
     */
    #[Scope]
    protected function listedInMarketplace(Builder $query): Builder
    {
        return $query->active()->where('show_in_marketplace', true);
    }

    /**
     * Stores with a shipping zone covering the given country.
     */
    #[Scope]
    protected function shipsTo(Builder $query, string $country): Builder
    {
        return $query->whereHas('shippingZones', fn (Builder $zones) => $zones->whereJsonContains('countries', $country));
    }

    /**
     * The currency this store sells in. All its prices are in this currency's minor units.
     */
    public function currency(): Currency
    {
        return Currency::tryFrom($this->settings['currency'] ?? '') ?? Currency::Usd;
    }

    /**
     * The published home page; its navbar and footer are reused on other storefront pages.
     */
    public function publishedHomePage(): Page
    {
        return $this->pages()->where('slug', 'home')->where('is_published', true)->firstOrFail();
    }

    /**
     * Days the store takes to prepare an order before it ships (kept in settings).
     *
     * @return array{min: int, max: int}
     */
    public function processingDays(): array
    {
        return [
            'min' => (int) ($this->settings['processing_min_days'] ?? 1),
            'max' => (int) ($this->settings['processing_max_days'] ?? 2),
        ];
    }

    /**
     * The zone covering a destination country, or null if the store doesn't ship there.
     */
    public function shippingZoneFor(string $country): ?ShippingZone
    {
        return $this->shippingZones->first(fn (ShippingZone $zone): bool => $zone->covers($country));
    }

    /**
     * Products from other marketplace stores to promote on this store's pages:
     * same kind of store first, at most two per store so many sellers get
     * seen, reshuffled daily so different sellers take turns.
     *
     * Only stores that are themselves in the marketplace promote others. When
     * the shopper has picked a country, only stores that ship there are shown.
     *
     * @return EloquentCollection<int, Product>
     */
    public function productsFromOtherStores(int $limit, ?string $shopperCountry): EloquentCollection
    {
        if (! $this->show_in_marketplace) {
            return new EloquentCollection;
        }

        $candidates = Product::query()
            ->inMarketplace()
            ->when($shopperCountry, fn (Builder $query) => $query->whereHas('store', fn (Builder $store) => $store->shipsTo($shopperCountry)))
            ->where('store_id', '!=', $this->id)
            ->with('store:id,name,subdomain,store_type,settings')
            ->latest()
            ->limit(200)
            ->get();

        $shuffled = (new Randomizer(new Mt19937(crc32(now()->toDateString().'|'.$this->id))))
            ->shuffleArray($candidates->all());

        $perStore = [];

        return (new EloquentCollection($shuffled))
            // stable sort: same-type stores first, shuffled order kept within each group
            ->sortBy(fn (Product $product): int => $product->store->store_type === $this->store_type ? 0 : 1)
            ->filter(function (Product $product) use (&$perStore): bool {
                $perStore[$product->store_id] = ($perStore[$product->store_id] ?? 0) + 1;

                return $perStore[$product->store_id] <= 2;
            })
            ->take($limit)
            ->values();
    }

    /**
     * Whether the free-plan product cap blocks adding another product.
     */
    public function hasReachedProductLimit(): bool
    {
        return $this->plan === StorePlan::Free
            && $this->products()->count() >= config('store.free_plan_product_limit');
    }

    /**
     * Seed a new store's home page, sample products, theme and a domestic
     * shipping zone so its storefront works on day one. Callers should wrap
     * store creation and this call in one transaction.
     */
    public function createStarterContent(): void
    {
        $this->pages()->create(Page::defaultHome($this->name));

        $currency = $this->currency();
        $this->products()->createMany(array_map(
            fn (array $product): array => [
                'title' => $product['title'],
                'price' => $currency->starterPrice($product['usd']),
                'compare_at_price' => isset($product['compare_usd']) ? $currency->starterPrice($product['compare_usd']) : null,
                'stock' => $product['stock'],
                'status' => ProductStatus::Active,
                'images' => [],
            ],
            $this->store_type->sampleProducts(),
        ));

        $theme = ThemeConfig::defaultTheme();
        $this->themeConfig()->create(['draft' => $theme, 'published' => $theme]);

        $zone = $this->shippingZones()->create(['name' => 'Domestic', 'countries' => $currency->homeCountries()]);
        $zone->rates()->create([
            'name' => 'Standard shipping',
            'price' => $currency->starterPrice(5),
            'free_over' => $currency->starterPrice(50),
            'min_days' => 3,
            'max_days' => 7,
        ]);
    }
}
