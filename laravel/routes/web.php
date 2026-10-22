<?php

use App\Http\Controllers\Admin\AppearanceController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\SessionController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\ShippingController;
use App\Http\Controllers\Admin\UploadController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\ShopperCountryController;
use App\Http\Controllers\SignupController;
use App\Http\Controllers\StorefrontController;
use App\Http\Controllers\StorefrontProductController;
use Illuminate\Support\Facades\Route;

Route::get('/', [MarketplaceController::class, 'index'])->name('home');

// One cart across every store, kept in the session.
Route::post('/cart/items', [CartController::class, 'store'])->middleware('throttle:60,1')->name('cart.store');
Route::patch('/cart/items/{productId}', [CartController::class, 'update'])->whereNumber('productId')->name('cart.update');
Route::delete('/cart/items/{productId}', [CartController::class, 'destroy'])->whereNumber('productId')->name('cart.destroy');

Route::post('/country', [ShopperCountryController::class, 'update'])->middleware('throttle:30,1')->name('country.update');

Route::get('/checkout', [CheckoutController::class, 'create'])->name('checkout');
Route::post('/checkout', [CheckoutController::class, 'store'])->middleware('throttle:10,1')->name('checkout.store');
Route::get('/checkout/complete', [CheckoutController::class, 'complete'])->name('checkout.complete');

Route::middleware('guest')->group(function () {
    Route::get('/signup', [SignupController::class, 'create'])->name('signup');
    Route::post('/signup', [SignupController::class, 'store'])->middleware('throttle:5,1');
    Route::get('/admin', [SessionController::class, 'create'])->name('login');
    Route::post('/admin/login', [SessionController::class, 'store'])->name('login.store');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [SessionController::class, 'destroy'])->name('logout');
    Route::get('/admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');

    // Store admin. {managedStore} only resolves to a store the logged-in owner
    // owns (see AppServiceProvider); child models are scoped to that store.
    Route::prefix('admin/stores/{managedStore}')->name('admin.stores.')->scopeBindings()->group(function () {
        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
        Route::post('/products', [ProductController::class, 'store'])->name('products.store');
        Route::patch('/products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

        Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
        Route::patch('/orders/{order}', [OrderController::class, 'update'])->name('orders.update');


        Route::get('/appearance', [AppearanceController::class, 'edit'])->name('appearance.edit');
        Route::patch('/appearance', [AppearanceController::class, 'update'])->name('appearance.update');

        Route::get('/shipping', [ShippingController::class, 'index'])->name('shipping.index');
        Route::post('/shipping/zones', [ShippingController::class, 'store'])->name('shipping.zones.store');
        Route::patch('/shipping/zones/{shippingZone}', [ShippingController::class, 'update'])->name('shipping.zones.update');
        Route::delete('/shipping/zones/{shippingZone}', [ShippingController::class, 'destroy'])->name('shipping.zones.destroy');
        Route::patch('/shipping/processing', [ShippingController::class, 'updateProcessing'])->name('shipping.processing.update');

        Route::get('/settings', [SettingsController::class, 'edit'])->name('settings.edit');
        Route::patch('/settings', [SettingsController::class, 'update'])->name('settings.update');

        Route::post('/uploads', [UploadController::class, 'store'])->middleware('throttle:30,1')->name('uploads.store');
    });
});

// Public storefront. Locally stores live at /store/<subdomain>; in production
// the same routes will be driven by the request's subdomain.
Route::prefix('store/{storefront}')->name('storefront.')->group(function () {
    Route::get('/', [StorefrontController::class, 'show'])->name('show');
    Route::get('/products/{slug}', [StorefrontProductController::class, 'show'])->name('products.show');
});
