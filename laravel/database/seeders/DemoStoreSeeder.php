<?php

namespace Database\Seeders;

use App\Enums\Currency;
use App\Enums\StoreType;
use App\Models\Page;
use App\Models\Store;
use App\Models\ThemeConfig;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Demo cosmetics store so the storefront has content.
 * Idempotent: clears and recreates the demo store on every run.
 *
 * Visit /store/glow-demo — owner login demo@my-store.test / demo1234
 */
class DemoStoreSeeder extends Seeder
{
    public const SUBDOMAIN = 'glow-demo';

    /**
     * Stores in other countries so the marketplace shows a real mix of sellers and currencies.
     *
     * @var array<string, array{string, StoreType, Currency}>
     */
    private const NEIGHBOURS = [
        'thread-and-co' => ['Thread & Co', StoreType::Clothing, Currency::Gbp],
        'gadget-point' => ['Gadget Point', StoreType::Electronics, Currency::Usd],
    ];

    public function run(): void
    {
        DB::transaction(function (): void {
            $owner = User::firstOrCreate(
                ['email' => 'demo@my-store.test'],
                ['name' => 'Demo Owner', 'password' => 'demo1234'],
            );

            // child rows (products, pages, theme, ...) cascade on delete
            Store::where('subdomain', self::SUBDOMAIN)->delete();

            $store = $owner->stores()->create([
                'name' => 'Glow Beauty',
                'subdomain' => self::SUBDOMAIN,
                'store_type' => StoreType::Cosmetics,
                'theme_id' => 'glow',
                'contact_phone' => '+92 300 1234567',
                'contact_email' => 'hello@glowbeauty.pk',
                'settings' => ['currency' => 'PKR', 'whatsapp' => '+923001234567'],
            ]);

            $store->pages()->create(Page::defaultHome($store->name));

            $theme = ThemeConfig::defaultTheme();
            $store->themeConfig()->create(['draft' => $theme, 'published' => $theme]);

            $zone = $store->shippingZones()->create(['name' => 'Pakistan', 'countries' => ['PK']]);
            $zone->rates()->createMany([
                ['name' => 'Standard (TCS)', 'price' => 25000, 'free_over' => 500000, 'min_days' => 2, 'max_days' => 4],
                ['name' => 'Express', 'price' => 50000, 'min_days' => 1, 'max_days' => 1],
            ]);

            // prices in paisa (minor units): 120000 = Rs 1,200
            $store->products()->createMany([
                ['title' => 'Matte Liquid Lipstick', 'price' => 120000, 'compare_at_price' => 150000, 'stock' => 40],
                ['title' => 'Hydrating Face Serum', 'price' => 280000, 'stock' => 25],
                ['title' => 'Velvet Foundation', 'price' => 220000, 'compare_at_price' => 260000, 'stock' => 30],
                ['title' => 'Kajal Eyeliner', 'price' => 65000, 'stock' => 80],
                ['title' => 'Rose Glow Highlighter', 'price' => 180000, 'stock' => 18],
                ['title' => 'Nail Polish Set (6)', 'price' => 150000, 'stock' => 22],
            ]);

            // 'lawn-house' was an earlier demo store name
            Store::whereIn('subdomain', ['lawn-house', ...array_keys(self::NEIGHBOURS)])->delete();

            foreach (self::NEIGHBOURS as $subdomain => [$name, $type, $currency]) {
                $owner->stores()
                    ->create([
                        'name' => $name,
                        'subdomain' => $subdomain,
                        'store_type' => $type,
                        'theme_id' => 'glow',
                        'settings' => ['currency' => $currency->value],
                    ])
                    ->createStarterContent();
            }
        });

        $this->command?->info('Seeded "Glow Beauty" — visit /store/'.self::SUBDOMAIN.' (owner: demo@my-store.test / demo1234)');
    }
}
