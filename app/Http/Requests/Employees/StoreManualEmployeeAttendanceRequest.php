<?php

namespace App\Http\Requests\Employees;

use App\Enums\AttendanceDayStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreManualEmployeeAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    /**
     * @return array<string, array<int, mixed|string>>
     */
    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'work_date' => ['required', 'date'],
            'status' => ['required', 'string', Rule::in(array_map(fn (AttendanceDayStatus $c) => $c->value, AttendanceDayStatus::cases()))],
            'first_in' => ['nullable', 'date_format:H:i'],
            'last_out' => ['nullable', 'date_format:H:i'],
            'minutes_late' => ['nullable', 'integer', 'min:0', 'max:1440'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_id.required' => 'Select an employee.',
            'work_date.required' => 'Select the work date.',
            'status.required' => 'Select a status.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $m = $this->input('minutes_late');
        if ($m === '' || $m === null) {
            $this->merge(['minutes_late' => null]);
        }
        $fi = $this->input('first_in');
        if ($fi === '') {
            $this->merge(['first_in' => null]);
        }
        $lo = $this->input('last_out');
        if ($lo === '') {
            $this->merge(['last_out' => null]);
        }
    }
}
