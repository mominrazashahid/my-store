<?php

namespace App\Http\Requests\Admin;

use App\Enums\ProductStatus;
use App\Models\Store;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create or update a product. Prices arrive in major units ("19.99") and are
 * converted to the store's minor units by toAttributes().
 */
class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        // ownership is enforced by the {managedStore} route binding
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'compareAtPrice' => ['nullable', 'numeric', 'min:0', 'max:1000000', 'gt:price'],
            'stock' => ['required', 'integer', 'min:0', 'max:1000000'],
            'status' => ['required', Rule::enum(ProductStatus::class)],
            'images' => ['array', 'max:8'],
            // only images uploaded to this store's own folder
            'images.*' => ['string', 'starts_with:/storage/stores/'.$this->route('managedStore')->id.'/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'compareAtPrice.gt' => 'The compare-at price must be higher than the price.',
            'images.*.starts_with' => 'Upload product images with the image button.',
        ];
    }

    /**
     * Validated input as product attributes, prices in minor units.
     *
     * @return array<string, mixed>
     */
    public function toAttributes(Store $store): array
    {
        $currency = $store->currency();

        return [
            'title' => $this->validated('title'),
            'description' => $this->validated('description'),
            'price' => $currency->toMinor($this->validated('price')),
            'compare_at_price' => filled($this->validated('compareAtPrice'))
                ? $currency->toMinor($this->validated('compareAtPrice'))
                : null,
            'stock' => (int) $this->validated('stock'),
            'status' => $this->validated('status'),
            'images' => array_values($this->validated('images', [])),
        ];
    }
}
