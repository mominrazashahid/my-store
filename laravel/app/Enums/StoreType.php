<?php

namespace App\Enums;

enum StoreType: string
{
    case Cosmetics = 'cosmetics';
    case Clothing = 'clothing';
    case Electronics = 'electronics';

    /**
     * The theme a new store of this type starts with (themes live in
     * resources/js/themes). Glow is the only theme so far.
     */
    public function defaultThemeId(): string
    {
        return 'glow';
    }

    /**
     * Sample products seeded into a new store so its storefront isn't empty.
     * Kept well under the free-plan cap. Prices are in US dollars and get
     * converted to the store's currency (see Currency::starterPrice()).
     *
     * @return list<array{title: string, usd: float, compare_usd?: float, stock: int}>
     */
    public function sampleProducts(): array
    {
        return match ($this) {
            self::Cosmetics => [
                ['title' => 'Matte Liquid Lipstick', 'usd' => 12, 'compare_usd' => 15, 'stock' => 40],
                ['title' => 'Hydrating Face Serum', 'usd' => 28, 'stock' => 25],
                ['title' => 'Velvet Foundation', 'usd' => 22, 'compare_usd' => 26, 'stock' => 30],
                ['title' => 'Kohl Eyeliner', 'usd' => 7, 'stock' => 80],
            ],
            self::Clothing => [
                ['title' => 'Embroidered Summer Dress', 'usd' => 45, 'compare_usd' => 55, 'stock' => 20],
                ['title' => 'Cotton Tunic', 'usd' => 22, 'stock' => 35],
                ['title' => 'Denim Jacket', 'usd' => 38, 'stock' => 15],
                ['title' => 'Printed Scarf', 'usd' => 12, 'compare_usd' => 16, 'stock' => 50],
            ],
            self::Electronics => [
                ['title' => 'Wireless Earbuds', 'usd' => 35, 'compare_usd' => 42, 'stock' => 30],
                ['title' => '20000mAh Power Bank', 'usd' => 28, 'stock' => 40],
                ['title' => 'Smart Watch', 'usd' => 55, 'compare_usd' => 65, 'stock' => 18],
                ['title' => 'USB-C Fast Charger', 'usd' => 15, 'stock' => 60],
            ],
        };
    }
}
