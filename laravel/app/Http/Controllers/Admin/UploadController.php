<?php

namespace App\Http\Controllers\Admin;

use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Image upload for products and banners. Files are stored
 * under storage/app/public/stores/<id>/ so they stay tenant-scoped on disk.
 */
class UploadController extends Controller
{
    public function store(Request $request, Store $managedStore): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
        ], [
            'image.mimes' => 'Only JPG, PNG, WEBP or GIF images are allowed.',
            'image.max' => 'Images must be 5 MB or smaller.',
        ]);

        $path = $request->file('image')->store("stores/{$managedStore->id}", 'public');

        return response()->json(['url' => '/storage/'.$path], 201);
    }
}
