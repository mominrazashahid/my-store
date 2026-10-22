<?php

namespace Tests\Feature\Http\Controllers\Admin;

use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_stores_image_in_the_stores_own_folder(): void
    {
        Storage::fake('public');
        $store = Store::factory()->create();

        $response = $this->actingAs($store->owner)->postJson("/admin/stores/{$store->id}/uploads", [
            'image' => UploadedFile::fake()->image('hero.png'),
        ]);

        $response->assertCreated();
        $url = $response->json('url');
        $this->assertStringStartsWith("/storage/stores/{$store->id}/", $url);
        Storage::disk('public')->assertExists(substr($url, strlen('/storage/')));
    }

    public function test_rejects_non_images(): void
    {
        Storage::fake('public');
        $store = Store::factory()->create();

        $this->actingAs($store->owner)->postJson("/admin/stores/{$store->id}/uploads", [
            'image' => UploadedFile::fake()->create('script.php', 1, 'application/x-php'),
        ])->assertJsonValidationErrors(['image' => 'Only JPG, PNG, WEBP or GIF images are allowed.']);
    }

    public function test_another_owners_store_returns_404(): void
    {
        Storage::fake('public');
        $mine = Store::factory()->create();
        $theirs = Store::factory()->create();

        $this->actingAs($mine->owner)->postJson("/admin/stores/{$theirs->id}/uploads", [
            'image' => UploadedFile::fake()->image('x.png'),
        ])->assertNotFound();
    }
}
