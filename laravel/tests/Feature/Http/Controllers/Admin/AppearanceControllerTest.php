<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\TestWith;
use Tests\TestCase;

class AppearanceControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $heroContent
     * @param  list<array{label: string, href: string}>  $links
     * @return list<array<string, mixed>>
     */
    private function sections(array $heroContent = [], array $links = [['label' => 'Home', 'href' => '/']]): array
    {
        return [
            ['type' => 'navbar', 'position' => 0, 'content' => ['logo' => 'My Shop', 'links' => $links]],
            ['type' => 'hero', 'position' => 1, 'content' => ['heading' => 'Hello', 'ctaLink' => '#products', ...$heroContent]],
        ];
    }

    public function test_saves_navbar_and_hero(): void
    {
        $store = Store::factory()->withHomePage()->create();

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/appearance", [
            'sections' => $this->sections(['heading' => 'New heading'], [['label' => 'Products', 'href' => '#products']]),
        ])->assertRedirect();

        $page = $store->pages()->sole();
        $this->assertSame('New heading', $page->sections[1]->content->heading);
        $this->assertSame('#products', $page->sections[0]->content->links[0]->href);
    }

    #[TestWith(['javascript:alert(1)'])]
    #[TestWith(['data:text/html,hi'])]
    public function test_rejects_script_links(string $href): void
    {
        $store = Store::factory()->withHomePage()->create();

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/appearance", [
            'sections' => $this->sections(['ctaLink' => $href]),
        ])->assertSessionHasErrors(['sections.1.content.ctaLink' => 'Links must start with /, # or https://.']);

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/appearance", [
            'sections' => $this->sections(links: [['label' => 'Evil', 'href' => $href]]),
        ])->assertSessionHasErrors('sections.0.content.links.0.href');
    }

    public function test_rejects_hero_image_from_another_store(): void
    {
        $store = Store::factory()->withHomePage()->create();

        $this->actingAs($store->owner)->patch("/admin/stores/{$store->id}/appearance", [
            'sections' => $this->sections(['image' => '/storage/stores/999/x.png']),
        ])->assertSessionHasErrors('sections.1.content.image');
    }
}
