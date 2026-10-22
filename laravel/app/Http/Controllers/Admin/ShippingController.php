<?php

namespace App\Http\Controllers\Admin;

use App\Models\ShippingRate;
use App\Models\ShippingZone;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Where a store ships (zones of countries), what it charges there (rates)
 * and how long it takes to prepare orders.
 */
class ShippingController extends Controller
{
    public function index(Store $managedStore): Response
    {
        $zones = $managedStore->shippingZones()->with('rates')->orderBy('name')->get();

        return $this->renderAdmin($managedStore, 'Admin/Shipping', [
            'zones' => $zones->map(fn (ShippingZone $zone): array => [
                'id' => $zone->id,
                'name' => $zone->name,
                'countries' => $zone->countries,
                'rates' => $zone->rates->map(fn (ShippingRate $rate): array => [
                    'id' => $rate->id,
                    'name' => $rate->name,
                    'price' => $rate->price,
                    'freeOver' => $rate->free_over,
                    'minDays' => $rate->min_days,
                    'maxDays' => $rate->max_days,
                ]),
            ]),
            'processingDays' => $managedStore->processingDays(),
        ]);
    }

    public function store(Request $request, Store $managedStore): RedirectResponse
    {
        $validated = $this->validateZone($request, $managedStore);

        DB::transaction(function () use ($managedStore, $validated): void {
            $zone = $managedStore->shippingZones()->create([
                'name' => $validated['name'],
                'countries' => $validated['countries'],
            ]);
            $zone->rates()->createMany($this->rateAttributes($validated['rates'], $managedStore));
        });

        Inertia::flash('success', 'Shipping zone added.');

        return back();
    }

    public function update(Request $request, Store $managedStore, ShippingZone $shippingZone): RedirectResponse
    {
        $validated = $this->validateZone($request, $managedStore, $shippingZone);

        DB::transaction(function () use ($managedStore, $shippingZone, $validated): void {
            $shippingZone->update(['name' => $validated['name'], 'countries' => $validated['countries']]);
            // rates are edited as a list; replacing them keeps the form simple
            $shippingZone->rates()->delete();
            $shippingZone->rates()->createMany($this->rateAttributes($validated['rates'], $managedStore));
        });

        Inertia::flash('success', 'Shipping zone saved.');

        return back();
    }

    public function destroy(Store $managedStore, ShippingZone $shippingZone): RedirectResponse
    {
        $shippingZone->delete();
        Inertia::flash('success', 'Shipping zone removed. Buyers in those countries can no longer check out.');

        return back();
    }

    public function updateProcessing(Request $request, Store $managedStore): RedirectResponse
    {
        $validated = $request->validate([
            'min' => ['required', 'integer', 'min:0', 'max:60'],
            'max' => ['required', 'integer', 'min:0', 'max:60', 'gte:min'],
        ], ['max.gte' => 'The longest processing time can’t be shorter than the shortest.']);

        $managedStore->update(['settings' => [
            ...($managedStore->settings ?? []),
            'processing_min_days' => (int) $validated['min'],
            'processing_max_days' => (int) $validated['max'],
        ]]);

        Inertia::flash('success', 'Processing time saved.');

        return back();
    }

    /**
     * @return array{name: string, countries: list<string>, rates: list<array<string, mixed>>}
     */
    private function validateZone(Request $request, Store $store, ?ShippingZone $zone = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'countries' => ['required', 'array', 'min:1', 'max:250'],
            'countries.*' => ['required', 'string', 'regex:/^[A-Z]{2}$/', 'distinct'],
            'rates' => ['required', 'array', 'min:1', 'max:10'],
            'rates.*.name' => ['required', 'string', 'max:100'],
            'rates.*.price' => ['required', 'numeric', 'min:0', 'max:100000'],
            'rates.*.freeOver' => ['nullable', 'numeric', 'min:0', 'max:10000000'],
            'rates.*.minDays' => ['nullable', 'integer', 'min:0', 'max:120'],
            'rates.*.maxDays' => ['nullable', 'integer', 'min:0', 'max:120'],
        ], [
            'countries.required' => 'Pick at least one country for this zone.',
            'rates.required' => 'Add at least one shipping rate.',
            'rates.*.name.required' => 'Give each rate a name, e.g. “Standard”.',
        ]);

        // a country can only belong to one zone, so checkout knows which rates apply
        $taken = $store->shippingZones()
            ->when($zone, fn ($query) => $query->whereKeyNot($zone->id))
            ->pluck('countries')
            ->flatten()
            ->intersect($validated['countries']);

        if ($taken->isNotEmpty()) {
            throw ValidationException::withMessages([
                'countries' => 'Already in another zone: '.$taken->implode(', ').'. A country can only be in one zone.',
            ]);
        }

        return $validated;
    }

    /**
     * @param  list<array<string, mixed>>  $rates
     * @return list<array<string, mixed>>
     */
    private function rateAttributes(array $rates, Store $store): array
    {
        $currency = $store->currency();

        return array_map(fn (array $rate): array => [
            'name' => $rate['name'],
            'price' => $currency->toMinor($rate['price']),
            'free_over' => filled($rate['freeOver'] ?? null) ? $currency->toMinor($rate['freeOver']) : null,
            'min_days' => $rate['minDays'] ?? null,
            'max_days' => $rate['maxDays'] ?? null,
        ], array_values($rates));
    }
}
