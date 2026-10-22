<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShippingControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function zone(array $countries = ['US'], array $overrides = []): array
    {
        return [
            'name' => 'United States',
            'countries' => $countries,
            'rates' => [
                ['name' => 'Standard', 'price' => '4.99', 'freeOver' => '50', 'minDays' => 3, 'maxDays' => 7],
                ['name' => 'Express', 'price' => '14.5', 'freeOver' => null, 'minDays' => 1, 'maxDays' => 2],
            ],
            ...$overrides,
        ];
    }

    public function test_creates_zone_with_rates_in_minor_units(): void
    {
        $store = Store::factory()->create();

        $this->actingAs($store->owner)->post("/admin/stores/{$store->id}/shipping/zones", $this->zone())
            ->assertRedirect();

        $zone = $store->shippingZones()->with('rates')->sole();
        $this->assertSame(['US'], $zone->countries);
        $this->assertSame([[499, 5000], [1450, null]], $zone->rates->map(fn ($r) => [$r->price, $r->free_over])->all());
    }

    public function test_rejects_a_country_already_in_another_zone(): void
    {
        $store = Store::factory()->shipsTo(['US', 'CA'])->create();

        $this->actingAs($store->owner)->post("/admin/stores/{$store->id}/shipping/zones", $this->zone(['CA', 'MX']))
            ->assertSessionHasErrors(['countries' => 'Already in another zone: CA. A country can only be in one zone.']);
    }

    public function test_updating_a_zone_replaces_its_rates(): void
    {
        $store = Store::factory()->shipsTo(['US'])->create();
        $zone = $store->shippingZones()->sole();

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/shipping/zones/{$zone->id}", $this->zone(['US'], [
            'rates' => [['name' => 'Flat', 'price' => '7', 'freeOver' => null, 'minDays' => null, 'maxDays' => null]],
        ]))->assertSessionHasNoErrors();

        $this->assertSame(['Flat'], $zone->rates()->pluck('name')->all());
    }

    public function test_another_owners_zone_returns_404(): void
    {
        $store = Store::factory()->create();
        $foreign = Store::factory()->shipsTo(['US'])->create()->shippingZones()->sole();

        $this->actingAs($store->owner)->delete("/admin/stores/{$store->id}/shipping/zones/{$foreign->id}")
            ->assertNotFound();
        $this->assertModelExists($foreign);
    }

    public function test_saves_processing_time(): void
    {
        $store = Store::factory()->create();

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/shipping/processing", ['min' => 2, 'max' => 4]);

        $this->assertSame(['min' => 2, 'max' => 4], $store->fresh()->processingDays());
    }

    public function test_rejects_processing_range_that_ends_before_it_starts(): void
    {
        $store = Store::factory()->create();

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/shipping/processing", ['min' => 5, 'max' => 2])
            ->assertSessionHasErrors('max');
    }
}
