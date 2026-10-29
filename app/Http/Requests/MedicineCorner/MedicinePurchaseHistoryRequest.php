<?php

namespace App\Http\Requests\MedicineCorner;

use Illuminate\Foundation\Http\FormRequest;

class MedicinePurchaseHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'from_date' => $this->input('from_date') ?: now()->startOfMonth()->toDateString(),
            'to_date' => $this->input('to_date') ?: now()->toDateString(),
        ]);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'from_date' => ['required', 'date'],
            'to_date' => ['required', 'date', 'after_or_equal:from_date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'to_date.after_or_equal' => 'To date must be on or after the from date.',
        ];
    }
}
