<?php

namespace App\Http\Requests;

use App\Enums\Currency;
use App\Enums\StoreType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Onboarding: creates the owner account and their first store in one go.
 */
class SignupRequest extends FormRequest
{
    /**
     * Subdomains kept for the platform itself.
     */
    public const RESERVED_SUBDOMAINS = ['www', 'admin', 'api', 'app', 'mail', 'store', 'signup', 'login'];

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->input('email'))),
            'subdomain' => strtolower(trim((string) $this->input('subdomain'))),
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
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'storeType' => ['required', Rule::enum(StoreType::class)],
            'storeName' => ['required', 'string', 'max:100'],
            'currency' => ['required', Rule::enum(Currency::class)],
            'subdomain' => [
                'required',
                'string',
                'max:63',
                'regex:/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/',
                Rule::notIn(self::RESERVED_SUBDOMAINS),
                'unique:stores,subdomain',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'That email is already registered — log in instead.',
            'password.min' => 'Password must be at least 6 characters.',
            'storeType.required' => 'Pick what you’re selling.',
            'currency.required' => 'Pick the currency your store sells in.',
            'currency.enum' => 'That currency isn’t supported yet.',
            'subdomain.regex' => 'Store address may only use a-z, 0-9 and dashes, and can’t start or end with a dash.',
            'subdomain.not_in' => 'That store address is reserved — try another.',
            'subdomain.unique' => 'That store address is taken — try another.',
        ];
    }
}
