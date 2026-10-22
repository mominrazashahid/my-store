<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Signature('demo:product-images {--force : Replace images on products that already have some}')]
#[Description('Local development only: give demo products without photos a matching stock photo from Unsplash')]
class AddDemoProductImages extends Command
{
    /**
     * Title keyword => Unsplash photo id (free to use under the Unsplash licence).
     * Each was checked by eye to show the product it's matched to.
     */
    private const PHOTOS = [
        'lipstick' => '1586495777744-4413f21062fa',
        'serum' => '1620916566398-39f1143ab7be',
        'foundation' => '1512496015851-a90fb38ba796',
        'eyeliner' => '1596462502278-27bfdc403348',
        'highlighter' => '1583241800698-e8ab01830a07',
        'nail polish' => '1604654894610-df63bc536371',
        'dress' => '1595777457583-95e059d581b8',
        'tunic' => '1584030373081-f37b7bb4fa8e',
        'denim' => '1576995853123-5a10305d93c0',
        'scarf' => '1601244005535-a48d21d951ac',
        'earbuds' => '1590658268037-6bf12165a8df',
        'power bank' => '1609091839311-d5365f9ff1c5',
        'watch' => '1579586337278-3befd40fd17a',
        'charger' => '1583863788434-e58a36330cf0',
    ];

    public function handle(): int
    {
        if (app()->isProduction()) {
            $this->error('Demo images are for local development only.');

            return self::FAILURE;
        }

        $products = Product::query()
            ->when(! $this->option('force'), fn ($query) => $query->where(fn ($q) => $q->whereNull('images')->orWhereJsonLength('images', 0)))
            ->get();

        $added = 0;
        foreach ($products as $product) {
            $photoId = $this->photoFor($product->title);
            if (! $photoId) {
                $this->line("  skipped (no matching photo): {$product->title}");

                continue;
            }

            $response = Http::timeout(30)->get("https://images.unsplash.com/photo-{$photoId}", [
                'w' => 800, 'h' => 800, 'fit' => 'crop', 'q' => 75, 'fm' => 'jpg',
            ]);
            if (! $response->successful()) {
                $this->warn("  download failed ({$response->status()}): {$product->title}");

                continue;
            }

            // same folder as owner uploads, so the admin accepts it on save
            $path = "stores/{$product->store_id}/demo-".Str::slug($product->title).'.jpg';
            Storage::disk('public')->put($path, $response->body());
            $product->update(['images' => ['/storage/'.$path]]);

            $this->line("  added: {$product->title}");
            $added++;
        }

        $this->info("Added photos to {$added} product(s).");

        return self::SUCCESS;
    }

    private function photoFor(string $title): ?string
    {
        $title = Str::lower($title);
        // "Kajal" / "Kohl" are eyeliners
        $title = str_replace(['kajal', 'kohl'], 'eyeliner', $title);

        foreach (self::PHOTOS as $keyword => $photoId) {
            if (str_contains($title, $keyword)) {
                return $photoId;
            }
        }

        return null;
    }
}
