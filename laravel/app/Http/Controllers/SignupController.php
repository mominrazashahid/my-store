<?php

namespace App\Http\Controllers;

use App\Enums\StoreType;
use App\Http\Requests\SignupRequest;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SignupController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Signup');
    }

    /**
     * Create the owner account and their store (with starter page, products
     * and theme) atomically, log them in, and send them to their live store.
     */
    public function store(SignupRequest $request): RedirectResponse
    {
        $store = DB::transaction(function () use ($request): Store {
            $user = User::create($request->safe()->only(['name', 'email', 'password']));

            $store = $user->stores()->create([
                'name' => $request->validated('storeName'),
                'subdomain' => $request->validated('subdomain'),
                'store_type' => $request->validated('storeType'),
                // owners don't choose a theme at signup; they can switch later in the admin
                'theme_id' => StoreType::from($request->validated('storeType'))->defaultThemeId(),
                'settings' => ['currency' => $request->validated('currency')],
            ]);
            $store->createStarterContent();

            return $store;
        });

        Auth::login($store->owner, remember: true);
        $request->session()->regenerate();

        return redirect()->route('storefront.show', $store->subdomain);
    }
}
