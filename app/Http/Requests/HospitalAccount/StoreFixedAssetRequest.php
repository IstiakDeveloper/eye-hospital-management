<?php

namespace App\Http\Requests\HospitalAccount;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFixedAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'quantity' => $this->input('quantity') ?: null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'vendor_id' => ['required', 'integer', Rule::exists('fixed_asset_vendors', 'id')],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'total_amount' => ['required', 'numeric', 'min:1'],
            'paid_amount' => ['required', 'numeric', 'min:0'],
            'purchase_date' => ['required', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Asset name is required.',
            'vendor_id.required' => 'Please select a vendor.',
            'total_amount.min' => 'Total amount must be at least 1.',
            'paid_amount.min' => 'Paid amount cannot be negative.',
        ];
    }
}
