<?php

namespace Tests\Unit\Enums;

use App\Enums\Currency;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;

class CurrencyTest extends TestCase
{
    #[TestWith([Currency::Usd, 12.0, 1200], 'dollars stay as cents')]
    #[TestWith([Currency::Gbp, 12.0, 1000], 'small rates round to whole units')]
    #[TestWith([Currency::Pkr, 12.0, 336000], 'large rates round to the nearest 10')]
    #[TestWith([Currency::Jpy, 12.0, 1800], 'zero-decimal currency has no minor unit')]
    public function test_starter_price_converts_dollars_to_tidy_minor_units(Currency $currency, float $usd, int $expected): void
    {
        $this->assertSame($expected, $currency->starterPrice($usd));
    }
}
