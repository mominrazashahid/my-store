<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row per store holding the editable draft theme and the live published
 * theme. Publishing copies draft -> published.
 */
#[Fillable(['draft', 'published'])]
class ThemeConfig extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * Decoded as objects (not arrays) so empty `{}` values in the theme survive
     * a round trip instead of turning into `[]`.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'draft' => 'object',
            'published' => 'object',
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
     * The theme every new store starts with: the Glow layout in the same
     * light-brown palette as the platform home page.
     *
     * `tokens` are global (colors, fonts, radius). Each section has `shared`
     * props for every device and `responsive` props per breakpoint
     * (desktop / tablet / mobile) for sizes, spacing, columns and visibility.
     *
     * @return array<string, mixed>
     */
    public static function defaultTheme(): array
    {
        return [
            'tokens' => [
                'colors' => [
                    'primary' => '#a47148',
                    'accent' => '#7f5534',
                    'bg' => '#fbf8f4',
                    'surface' => '#ffffff',
                    'text' => '#2b2118',
                    'muted' => '#76685b',
                    'border' => '#ece2d6',
                ],
                'fonts' => [
                    'heading' => 'Poppins',
                    'body' => 'Segoe UI',
                ],
                'radius' => 18,
            ],
            'sections' => [
                'navbar' => [
                    'shared' => ['bg' => '#ffffff', 'linkColor' => '#2b2118'],
                    'responsive' => [
                        'desktop' => ['padY' => 16, 'padX' => 32, 'visible' => true],
                        'tablet' => ['padY' => 14, 'padX' => 22],
                        'mobile' => ['padY' => 12, 'padX' => 16],
                    ],
                ],
                'hero' => [
                    'shared' => ['textColor' => '#ffffff', 'overlay' => 0.45],
                    'responsive' => [
                        'desktop' => ['headingSize' => 52, 'minHeight' => 460, 'padY' => 80, 'visible' => true],
                        'tablet' => ['headingSize' => 40, 'minHeight' => 400, 'padY' => 64],
                        'mobile' => ['headingSize' => 30, 'minHeight' => 340, 'padY' => 48],
                    ],
                ],
                'productCard' => [
                    'shared' => ['bg' => '#ffffff', 'borderColor' => '#ece2d6', 'radius' => 18],
                    'responsive' => [
                        'desktop' => ['columns' => 4, 'gap' => 26, 'visible' => true],
                        'tablet' => ['columns' => 3, 'gap' => 20],
                        'mobile' => ['columns' => 2, 'gap' => 14],
                    ],
                ],
                'footer' => [
                    'shared' => ['bg' => '#2b2118', 'textColor' => '#f3e7da'],
                    'responsive' => [
                        'desktop' => ['padY' => 44, 'visible' => true],
                        'tablet' => ['padY' => 36],
                        'mobile' => ['padY' => 28],
                    ],
                ],
            ],
        ];
    }
}
