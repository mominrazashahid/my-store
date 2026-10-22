<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * Gives a model a `slug` that is unique within its store, generated from
 * `title` on create when none is set ("My Post" -> "my-post", "my-post-2", ...).
 */
trait HasStoreScopedSlug
{
    protected static function bootHasStoreScopedSlug(): void
    {
        static::creating(function (self $model): void {
            if (blank($model->slug)) {
                $model->slug = static::uniqueSlug($model->store_id, $model->title);
            }
        });
    }

    /**
     * Slugify a value and append -2, -3, ... until it is free within the store.
     */
    public static function uniqueSlug(int $storeId, ?string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug((string) $value) ?: Str::kebab(class_basename(static::class));
        $slug = $base;
        $suffix = 2;

        while (static::query()
            ->where('store_id', $storeId)
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
