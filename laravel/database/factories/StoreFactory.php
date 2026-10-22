<?php

namespace Database\Factories;

use App\Enums\StorePlan;
use App\Enums\StoreStatus;
use App\Enums\StoreType;
use App\Models\Page;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Store>
 */
class StoreFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'name' => fake()->company(),
            'subdomain' => fake()->unique()->slug(2),
            'store_type' => StoreType::Cosmetics,
            'theme_id' => 'glow',
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'plan' => StorePlan::Paid,
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => StoreStatus::Suspended,
        ]);
    }

    /**
     * A published home page, which every storefront page renders from.
     */
    public function withHomePage(): static
    {
        return $this->afterCreating(function (Store $store): void {
            $store->pages()->create(Page::defaultHome($store->name));
        });
    }

    /**
     * A shipping zone for the given countries with one rate (amounts in minor units).
     *
     * @param  list<string>  $countries
     */
    public function shipsTo(array $countries, int $price = 0, ?int $freeOver = null): static
    {
        return $this->afterCreating(function (Store $store) use ($countries, $price, $freeOver): void {
            $store->shippingZones()
                ->create(['name' => implode(', ', $countries), 'countries' => $countries])
                ->rates()->create(['name' => 'Standard', 'price' => $price, 'free_over' => $freeOver, 'min_days' => 2, 'max_days' => 4]);
        });
    }

    public function hiddenFromMarketplace(): static
    {
        return $this->state(fn (array $attributes) => [
            'show_in_marketplace' => false,
        ]);
    }
}
