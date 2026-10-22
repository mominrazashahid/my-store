<?php

namespace App\Http\Controllers\Admin;

use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(Store $managedStore): Response
    {
        return $this->renderAdmin($managedStore, 'Admin/Settings');
    }

    /**
     * Contact details, address and marketplace listing. Currency is fixed at
     * signup because changing it would silently change every price.
     */
    public function update(Request $request, Store $managedStore): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'contactPhone' => ['nullable', 'string', 'max:30'],
            'contactEmail' => ['nullable', 'email', 'max:255'],
            'whatsapp' => ['nullable', 'string', 'max:30'],
            'address.line' => ['nullable', 'string', 'max:200'],
            'address.city' => ['nullable', 'string', 'max:100'],
            'address.mapUrl' => ['nullable', 'url:https', 'max:500'],
            'showInMarketplace' => ['required', 'boolean'],
        ]);

        $managedStore->update([
            'name' => $validated['name'],
            'contact_phone' => $validated['contactPhone'] ?? null,
            'contact_email' => $validated['contactEmail'] ?? null,
            'address' => array_filter($validated['address'] ?? []),
            'settings' => [...($managedStore->settings ?? []), 'whatsapp' => $validated['whatsapp'] ?? null],
            'show_in_marketplace' => $validated['showInMarketplace'],
        ]);

        Inertia::flash('success', 'Settings saved.');

        return back();
    }
}
