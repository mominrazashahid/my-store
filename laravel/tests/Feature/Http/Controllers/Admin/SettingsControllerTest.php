<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_updates_contact_details_and_marketplace_listing_but_not_currency(): void
    {
        $store = Store::factory()->create(['settings' => ['currency' => 'GBP']]);

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/settings", [
            'name' => 'Renamed',
            'contactEmail' => 'hi@example.com',
            'whatsapp' => '+44 7700 900000',
            'address' => ['line' => '1 High St', 'city' => 'London', 'mapUrl' => ''],
            'showInMarketplace' => false,
            'currency' => 'USD',
        ])->assertRedirect();

        $store->refresh();
        $this->assertSame('Renamed', $store->name);
        $this->assertSame(['line' => '1 High St', 'city' => 'London'], $store->address);
        $this->assertSame('+44 7700 900000', $store->settings['whatsapp']);
        $this->assertFalse($store->show_in_marketplace);
        $this->assertSame('GBP', $store->currency()->value);
    }

    public function test_cannot_change_plan_or_status(): void
    {
        $store = Store::factory()->create();

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/settings", [
            'name' => 'Same',
            'showInMarketplace' => true,
            'plan' => 'paid',
            'status' => 'suspended',
        ]);

        $store->refresh();
        $this->assertSame('free', $store->plan->value);
        $this->assertSame('active', $store->status->value);
    }
}
