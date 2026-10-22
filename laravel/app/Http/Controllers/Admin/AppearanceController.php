<?php

namespace App\Http\Controllers\Admin;

use App\Http\Resources\PageResource;
use App\Models\Page;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edits the home page sections the owner can change today: navbar and hero.
 */
class AppearanceController extends Controller
{
    /**
     * Links shoppers can click: in-store paths, anchors or web URLs. Blocks
     * `javascript:` and other schemes that could run code on the storefront.
     */
    private const SAFE_LINK = '~^(/|#|https?://)~i';

    public function edit(Store $managedStore): Response
    {
        $page = $managedStore->pages()->where('slug', 'home')->firstOrFail();

        return $this->renderAdmin($managedStore, 'Admin/Appearance', [
            'page' => PageResource::make($page)->resolve(),
        ]);
    }

    public function update(Request $request, Store $managedStore): RedirectResponse
    {
        $request->validate([
            'sections' => ['required', 'array', 'max:30'],
            'sections.*.type' => ['required', Rule::in(Page::SECTION_TYPES)],
            'sections.*.position' => ['required', 'integer', 'min:0'],
            'sections.*.content' => ['present', 'array'],
            'sections.*.content.links' => ['sometimes', 'array', 'max:12'],
            'sections.*.content.links.*.label' => ['required', 'string', 'max:40'],
            'sections.*.content.links.*.href' => ['required', 'string', 'max:300', 'regex:'.self::SAFE_LINK],
            'sections.*.content.ctaLink' => ['nullable', 'string', 'max:300', 'regex:'.self::SAFE_LINK],
            'sections.*.content.image' => ['nullable', 'string', 'starts_with:/storage/stores/'.$managedStore->id.'/'],
        ], [
            'regex' => 'Links must start with /, # or https://.',
            'sections.*.content.image.starts_with' => 'Upload the hero image with the upload button.',
        ]);

        // validate() would return only the keys that have rules and drop the free-form
        // content (heading, logo, ...), so save the full validated input instead
        $managedStore->pages()->where('slug', 'home')->firstOrFail()
            ->update(['sections' => array_values($request->input('sections'))]);

        Inertia::flash('success', 'Saved! Your storefront is updated.');

        return back();
    }
}
