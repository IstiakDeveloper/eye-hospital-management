export type EmployeeFormData = {
    employee_code: string;
    name: string;
    phone: string;
    email: string;
    department: string;
    designation: string;
    date_of_join: string;
    is_active: boolean;
    zkteco_user_id: string;
    user_id: string;
    expected_check_in: string;
    expected_check_out: string;
    grace_minutes: number;
    weekend_days: number[];
};

export function buildEmployeeSubmitPayload(data: EmployeeFormData): Record<string, unknown> {
    return {
        ...data,
        employee_code: data.employee_code.trim(),
        zkteco_user_id: data.zkteco_user_id === '' ? null : Number(data.zkteco_user_id),
        user_id: data.user_id === '' ? null : Number(data.user_id),
        grace_minutes: Number(data.grace_minutes),
        phone: data.phone === '' ? null : data.phone,
        email: data.email === '' ? null : data.email,
        department: data.department === '' ? null : data.department,
        designation: data.designation === '' ? null : data.designation,
        date_of_join: data.date_of_join === '' ? null : data.date_of_join,
    };
}

export function validateEmployeeFormClient(data: EmployeeFormData): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.employee_code.trim()) {
        errors.employee_code = 'Employee code is required.';
    }

    if (!data.name.trim()) {
        errors.name = 'Full name is required.';
    }

    if (data.weekend_days.length === 0) {
        errors.weekend_days = 'Select at least one weekend day.';
    }

    if (!data.expected_check_in) {
        errors.expected_check_in = 'Check-in time is required.';
    }

    if (!data.expected_check_out) {
        errors.expected_check_out = 'Check-out time is required.';
    }

    if (data.expected_check_in && data.expected_check_out && data.expected_check_out <= data.expected_check_in) {
        errors.expected_check_out = 'Check-out must be after check-in.';
    }

    return errors;
}
