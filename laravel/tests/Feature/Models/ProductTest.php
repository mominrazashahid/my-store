<?php

namespace Tests\Feature\Models;

use App\Models\Product;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_slug_gets_a_numeric_suffix_when_taken_in_the_same_store(): void
    {
        $store = Store::factory()->create();

        $first = Product::factory()->for($store)->create(['title' => 'Kajal Eyeliner']);
        $second = Product::factory()->for($store)->create(['title' => 'Kajal Eyeliner']);

        $this->assertSame('kajal-eyeliner', $first->slug);
        $this->assertSame('kajal-eyeliner-2', $second->slug);
    }

    public function test_same_slug_is_allowed_in_different_stores(): void
    {
        Product::factory()->create(['title' => 'Kajal Eyeliner']);

        $other = Product::factory()->create(['title' => 'Kajal Eyeliner']);

        $this->assertSame('kajal-eyeliner', $other->slug);
    }

    public function test_marketplace_shows_only_sellable_products_from_listed_stores(): void
    {
        $listed = Product::factory()->create();
        Product::factory()->draft()->create();
        Product::factory()->outOfStock()->create();
        Product::factory()->for(Store::factory()->suspended())->create();
        Product::factory()->for(Store::factory()->hiddenFromMarketplace())->create();

        $this->assertSame([$listed->id], Product::inMarketplace()->pluck('id')->all());
    }
}
