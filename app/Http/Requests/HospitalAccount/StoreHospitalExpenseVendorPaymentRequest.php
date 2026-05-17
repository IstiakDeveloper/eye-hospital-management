<?php

namespace App\Http\Requests\HospitalAccount;

use Illuminate\Foundation\Http\FormRequest;

class StoreHospitalExpenseVendorPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank_transfer,cheque',
            'reference_no' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:500',
            'payment_date' => 'required|date',
        ];
    }
}
