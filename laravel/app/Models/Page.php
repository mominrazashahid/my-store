<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A page built from ordered sections. The frontend maps each section `type`
 * to a component per theme; `content` has a different shape per type.
 */
#[Fillable(['slug', 'title', 'is_published', 'sections'])]
class Page extends Model
{
    /** Section types the frontend knows how to render. */
    public const SECTION_TYPES = ['navbar', 'hero', 'products', 'richText', 'footer', 'banner'];

    /**
     * Get the attributes that should be cast.
     *
     * `sections` is decoded as objects (not arrays) so an empty `content: {}`
     * survives a round trip instead of turning into `[]`.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'sections' => 'object',
        ];
    }

    /**
     * @return BelongsTo<Store, $this>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * The home page seeded for a new store.
     *
     * @return array{slug: string, title: string, is_published: bool, sections: list<array<string, mixed>>}
     */
    public static function defaultHome(string $storeName): array
    {
        return [
            'slug' => 'home',
            'title' => 'Home',
            'is_published' => true,
            'sections' => [
                [
                    'type' => 'hero',
                    'position' => 0,
                    // an image-only banner; hidden until the owner uploads one
                    'content' => ['image' => ''],
                ],
                [
                    'type' => 'products',
                    'position' => 1,
                    // the store's products (paged with "Load more"); no settings yet
                    'content' => new \stdClass,
                ],
                [
                    'type' => 'footer',
                    'position' => 2,
                    'content' => ['text' => '© '.now()->year.' '.$storeName],
                ],
            ],
        ];
    }
}
