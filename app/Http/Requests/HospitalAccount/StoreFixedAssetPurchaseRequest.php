<?php

namespace App\Http\Requests\HospitalAccount;

use Illuminate\Foundation\Http\FormRequest;

class StoreFixedAssetPurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $total = (float) $this->input('total_amount', 0);

        $this->merge([
            'quantity' => $this->filled('quantity') ? (int) $this->input('quantity') : null,
            'paid_amount' => $total,
            'vendor_id' => $this->input('vendor_id') ?: null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'vendor_id' => ['nullable', 'integer', 'exists:fixed_asset_vendors,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'total_amount' => ['required', 'numeric', 'min:1'],
            'paid_amount' => ['required', 'numeric', 'min:1'],
            'purchase_date' => ['required', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'total_amount.required' => 'Amount is required.',
            'total_amount.min' => 'Amount must be at least 1.',
            'purchase_date.required' => 'Purchase date is required.',
        ];
    }
}
