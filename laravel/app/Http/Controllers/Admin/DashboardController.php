<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Send the owner to their first store's products; owners without a store
     * get a prompt to create one.
     */
    public function index(Request $request): RedirectResponse|Response
    {
        $store = $request->user()->stores()->oldest()->first();

        if ($store) {
            return redirect()->route('admin.stores.products.index', $store);
        }

        return Inertia::render('Admin/Dashboard');
    }
}
