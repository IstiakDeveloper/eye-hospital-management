<?php

namespace App\Http\Requests\HospitalAccount;

use Illuminate\Foundation\Http\FormRequest;

class StoreHospitalDueExpenseRequest extends FormRequest
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
            'vendor_id' => 'required|exists:hospital_expense_vendors,id',
            'expense_category_id' => 'required|exists:hospital_expense_categories,id',
            'total_amount' => 'required|numeric|min:0.01',
            'paid_amount' => 'required|numeric|min:0',
            'description' => 'required|string|max:500',
            'expense_date' => 'required|date',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $total = (float) $this->input('total_amount', 0);
            $paid = (float) $this->input('paid_amount', 0);

            if ($paid > $total) {
                $validator->errors()->add('paid_amount', 'Paid amount cannot exceed total amount.');
            }
        });
    }
}
