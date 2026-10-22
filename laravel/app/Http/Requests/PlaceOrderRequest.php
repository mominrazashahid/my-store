<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Guest checkout of one currency group of the marketplace cart. The cart
 * itself lives in the session (App\Support\Cart), so no items, prices or
 * quantities are taken from the request.
 */
class PlaceOrderRequest extends FormRequest
{
    /**
     * Countries whose addresses need a state / province / region.
     * Mirrored in resources/js/lib/countries.ts.
     */
    public const STATE_REQUIRED = ['US', 'CA', 'AU', 'IN', 'BR', 'MX'];

    /**
     * Countries whose addresses need a postal code.
     * Mirrored in resources/js/lib/countries.ts.
     */
    public const POSTAL_REQUIRED = [
        'US', 'CA', 'GB', 'AU', 'NZ', 'IN', 'DE', 'FR', 'NL', 'BE', 'ES', 'IT', 'PT',
        'SE', 'DK', 'NO', 'FI', 'AT', 'CH', 'IE', 'PL', 'JP', 'BR', 'MX',
    ];

    /**
     * Anyone may place an order on a public storefront.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->input('email'))),
            'billingSameAsShipping' => $this->boolean('billingSameAsShipping', true),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            ...$this->addressRules('shipping'),
            'billingSameAsShipping' => ['boolean'],
            ...$this->addressRules('billing', ['exclude_if:billingSameAsShipping,true']),
            'notes' => ['nullable', 'string', 'max:1000'],
            // which currency group of the cart is being checked out
            'currency' => ['required', 'string', 'size:3'],
            // store id => chosen shipping rate id
            'shippingRates' => ['array'],
            'shippingRates.*' => ['integer'],
        ];
    }

    /**
     * @param  list<string>  $prefixRules  rules applied before each field's own rules
     * @return array<string, array<int, string>>
     */
    private function addressRules(string $prefix, array $prefixRules = []): array
    {
        return [
            "{$prefix}.firstName" => [...$prefixRules, 'required', 'string', 'max:100'],
            "{$prefix}.lastName" => [...$prefixRules, 'required', 'string', 'max:100'],
            "{$prefix}.line1" => [...$prefixRules, 'required', 'string', 'max:200'],
            "{$prefix}.line2" => [...$prefixRules, 'nullable', 'string', 'max:200'],
            "{$prefix}.city" => [...$prefixRules, 'required', 'string', 'max:100'],
            "{$prefix}.state" => [...$prefixRules, 'nullable', 'required_if:'.$prefix.'.country,'.implode(',', self::STATE_REQUIRED), 'string', 'max:100'],
            "{$prefix}.postalCode" => [...$prefixRules, 'nullable', 'required_if:'.$prefix.'.country,'.implode(',', self::POSTAL_REQUIRED), 'string', 'max:20'],
            "{$prefix}.country" => [...$prefixRules, 'required', 'string', 'regex:/^[A-Z]{2}$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $messages = [
            'email.required' => 'Enter your email so we can send your order confirmation.',
            'email.email' => 'Enter a valid email address.',
            'phone.required' => 'Enter a phone number for delivery updates.',

        ];

        foreach (['shipping' => 'Shipping', 'billing' => 'Billing'] as $prefix => $label) {
            $messages += [
                "{$prefix}.firstName.required" => "{$label} address: enter a first name.",
                "{$prefix}.lastName.required" => "{$label} address: enter a last name.",
                "{$prefix}.line1.required" => "{$label} address: enter a street address.",
                "{$prefix}.city.required" => "{$label} address: enter a city.",
                "{$prefix}.state.required_if" => "{$label} address: select a state / province.",
                "{$prefix}.postalCode.required_if" => "{$label} address: enter a postal code.",
                "{$prefix}.country.required" => "{$label} address: select a country.",
                "{$prefix}.country.regex" => "{$label} address: select a country.",
            ];
        }

        return $messages;
    }

    /**
     * A validated address as stored on the order (snake_case keys).
     *
     * @return array{first_name: string, last_name: string, line1: string, line2: ?string, city: string, state: ?string, postal_code: ?string, country: string}
     */
    public function address(string $which): array
    {
        $source = $which === 'billing' && $this->validated('billingSameAsShipping')
            ? 'shipping'
            : $which;
        $address = $this->validated($source);

        return [
            'first_name' => $address['firstName'],
            'last_name' => $address['lastName'],
            'line1' => $address['line1'],
            'line2' => $address['line2'] ?? null,
            'city' => $address['city'],
            'state' => $address['state'] ?? null,
            'postal_code' => isset($address['postalCode']) ? strtoupper($address['postalCode']) : null,
            'country' => $address['country'],
        ];
    }
}
