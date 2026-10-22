<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Seller-run shipping: each store has zones (a set of countries it ships to)
 * and each zone has one or more rates the buyer picks from at checkout.
 * Countries in no zone can't be shipped to.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shipping_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            // ISO 3166-1 alpha-2 codes, e.g. ["US"] or ["DE","FR","NL"]
            $table->json('countries');
            $table->timestamps();
        });

        Schema::create('shipping_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipping_zone_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            // minor units of the store's currency; 0 = free shipping
            $table->unsignedInteger('price');
            // free when the order subtotal reaches this (minor units); null = never
            $table->unsignedInteger('free_over')->nullable();
            // transit time after the store's processing time
            $table->unsignedSmallInteger('min_days')->nullable();
            $table->unsignedSmallInteger('max_days')->nullable();
            $table->timestamps();
        });

        $this->giveExistingStoresAStarterZone();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipping_rates');
        Schema::dropIfExists('shipping_zones');
    }

    /**
     * Stores created before shipping existed get one zone for their home
     * country (inferred from their currency) with a free standard rate, so
     * their checkout keeps working. Snapshot of the mapping in App\Enums\Currency.
     */
    private function giveExistingStoresAStarterZone(): void
    {
        $homeCountries = [
            'USD' => ['US'], 'CAD' => ['CA'], 'GBP' => ['GB'], 'AUD' => ['AU'], 'NZD' => ['NZ'],
            'AED' => ['AE'], 'SAR' => ['SA'], 'INR' => ['IN'], 'PKR' => ['PK'], 'BDT' => ['BD'], 'JPY' => ['JP'],
            'EUR' => ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'],
        ];

        DB::table('stores')->orderBy('id')->each(function (object $store) use ($homeCountries): void {
            $currency = json_decode((string) $store->settings, true)['currency'] ?? 'USD';
            $now = now();

            $zoneId = DB::table('shipping_zones')->insertGetId([
                'store_id' => $store->id,
                'name' => 'Domestic',
                'countries' => json_encode($homeCountries[$currency] ?? ['US']),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('shipping_rates')->insert([
                'shipping_zone_id' => $zoneId,
                'name' => 'Standard shipping',
                'price' => 0,
                'free_over' => null,
                'min_days' => 3,
                'max_days' => 7,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        });
    }
};
