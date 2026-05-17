<?php

namespace App\Http\Requests\Employees;

use App\Models\Employee;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('employees.edit') ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Employee $employee */
        $employee = $this->route('employee');

        return [
            'employee_code' => ['required', 'string', 'max:32', Rule::unique('employees', 'employee_code')->ignore($employee->id)],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:255'],
            'department' => ['nullable', 'string', 'max:120'],
            'designation' => ['nullable', 'string', 'max:120'],
            'date_of_join' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'zkteco_user_id' => [
                'nullable',
                'integer',
                'min:1',
                'max:999999',
                Rule::unique('employees', 'zkteco_user_id')->ignore($employee->id),
            ],
            'user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
                Rule::unique('employees', 'user_id')->ignore($employee->id),
            ],
            'expected_check_in' => ['required', 'date_format:H:i'],
            'expected_check_out' => ['required', 'date_format:H:i', 'after:expected_check_in'],
            'grace_minutes' => ['required', 'integer', 'min:0', 'max:180'],
            'weekend_days' => ['required', 'array', 'min:1'],
            'weekend_days.*' => ['integer', Rule::in([0, 1, 2, 3, 4, 5, 6])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'employee_code.required' => 'Employee code is required.',
            'employee_code.unique' => 'This employee code is already in use.',
            'name.required' => 'Full name is required.',
            'user_id.unique' => 'This user account is already linked to another employee.',
            'zkteco_user_id.unique' => 'This ZKTeco user id is already assigned.',
            'expected_check_in.required' => 'Check-in time is required.',
            'expected_check_out.required' => 'Check-out time is required.',
            'expected_check_out.after' => 'Check-out must be after check-in.',
            'weekend_days.required' => 'Select at least one weekend day.',
            'weekend_days.min' => 'Select at least one weekend day.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $v = $this->input('zkteco_user_id');
        if ($v === '' || $v === null) {
            $this->merge(['zkteco_user_id' => null]);
        }
        $u = $this->input('user_id');
        if ($u === '' || $u === null) {
            $this->merge(['user_id' => null]);
        }
    }
}
