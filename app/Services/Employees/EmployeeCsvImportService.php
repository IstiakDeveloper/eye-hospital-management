<?php

namespace App\Services\Employees;

use App\Models\Employee;
use App\Models\User;
use App\Services\Attendance\AttendanceDayRecordService;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class EmployeeCsvImportService
{
    public const int MAX_ROWS = 500;

    /**
     * 0 = Sunday … 6 = Saturday (PHP date('w')).
     *
     * @var array<string, int>
     */
    private const array WEEKEND_DAY_NAMES = [
        'sun' => 0,
        'sunday' => 0,
        'mon' => 1,
        'monday' => 1,
        'tue' => 2,
        'tues' => 2,
        'tuesday' => 2,
        'wed' => 3,
        'wednesday' => 3,
        'thu' => 4,
        'thur' => 4,
        'thurs' => 4,
        'thursday' => 4,
        'fri' => 5,
        'friday' => 5,
        'sat' => 6,
        'saturday' => 6,
    ];

    /**
     * @var list<string>
     */
    public const array HEADERS = [
        'employee_code',
        'name',
        'phone',
        'email',
        'department',
        'designation',
        'date_of_join',
        'is_active',
        'zkteco_user_id',
        'user_email',
        'expected_check_in',
        'expected_check_out',
        'grace_minutes',
        'weekend_days',
    ];

    public function __construct(
        protected AttendanceDayRecordService $attendanceDayRecordService,
    ) {}

    /**
     * @return array{created: int, skipped: int, errors: list<array{row: int, message: string}>}
     */
    public function import(UploadedFile $file): array
    {
        $headerError = $this->headerValidationError($file);
        if ($headerError !== null) {
            return [
                'created' => 0,
                'skipped' => 0,
                'errors' => [['row' => 1, 'message' => $headerError]],
            ];
        }

        $rows = $this->parseFile($file);
        $created = 0;
        $skipped = 0;
        $errors = [];
        $seenCodes = [];
        $seenZkIds = [];
        $seenUserIds = [];
        $importedEmployees = collect();

        foreach ($rows as $lineNumber => $rawRow) {
            $rowNumber = $lineNumber + 2;

            if ($this->rowIsEmpty($rawRow)) {
                continue;
            }

            $normalized = $this->normalizeRow($rawRow);
            $validation = $this->validateRow($normalized, $rowNumber, $seenCodes, $seenZkIds, $seenUserIds);

            if ($validation['errors'] !== []) {
                $skipped++;
                foreach ($validation['errors'] as $message) {
                    $errors[] = ['row' => $rowNumber, 'message' => $message];
                }

                continue;
            }

            $normalized = $validation['data'];

            $employee = DB::transaction(function () use ($normalized): Employee {
                $employee = Employee::query()->create([
                    'employee_code' => $normalized['employee_code'],
                    'name' => $normalized['name'],
                    'phone' => $normalized['phone'],
                    'email' => $normalized['email'],
                    'department' => $normalized['department'],
                    'designation' => $normalized['designation'],
                    'date_of_join' => $normalized['date_of_join'],
                    'is_active' => $normalized['is_active'],
                    'zkteco_user_id' => $normalized['zkteco_user_id'],
                    'user_id' => $normalized['user_id'],
                ]);

                $employee->employeeAttendanceSetting()->create([
                    'expected_check_in' => $normalized['expected_check_in'].':00',
                    'expected_check_out' => $normalized['expected_check_out'].':00',
                    'grace_minutes' => $normalized['grace_minutes'],
                    'weekend_days' => $normalized['weekend_days'],
                ]);

                return $employee;
            });

            $seenCodes[] = $normalized['employee_code'];
            if ($normalized['zkteco_user_id'] !== null) {
                $seenZkIds[] = $normalized['zkteco_user_id'];
            }
            if ($normalized['user_id'] !== null) {
                $seenUserIds[] = $normalized['user_id'];
            }

            $importedEmployees->push($employee);
            $created++;
        }

        if ($importedEmployees->isNotEmpty()) {
            $from = now()->subDays(45)->startOfDay();
            $to = now()->addDay()->endOfDay();
            $this->attendanceDayRecordService->recalculateForDateRange($importedEmployees, $from, $to);
        }

        return [
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * @return list<list<string|null>>
     */
    public function exampleRows(): array
    {
        return [
            self::HEADERS,
            [
                'EMP001',
                'Rahim Uddin',
                '01700000001',
                'rahim@example.com',
                'Nursing',
                'Staff Nurse',
                '2024-01-15',
                'yes',
                '101',
                '',
                '09:00',
                '18:00',
                '10',
                'Fri,Sat',
            ],
            [
                'EMP002',
                'Karima Begum',
                '01700000002',
                'karima@example.com',
                'Admin',
                'Receptionist',
                '2024-06-01',
                'yes',
                '102',
                '',
                '09:00',
                '18:00',
                '10',
                'Friday,Saturday',
            ],
        ];
    }

    public function streamExampleCsv(): void
    {
        $handle = fopen('php://output', 'w');
        if ($handle === false) {
            return;
        }

        fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

        foreach ($this->exampleRows() as $row) {
            fputcsv($handle, $row);
        }

        fclose($handle);
    }

    private function headerValidationError(UploadedFile $file): ?string
    {
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            return 'Could not read the CSV file.';
        }

        $firstLine = fgets($handle);
        fclose($handle);

        if ($firstLine === false || trim($firstLine) === '') {
            return 'The CSV file is empty.';
        }

        $firstLine = $this->stripBom($firstLine);
        $delimiter = $this->detectDelimiter($firstLine);
        $headerCells = str_getcsv($firstLine, $delimiter);
        $headerMap = $this->buildHeaderMap($headerCells);

        if ($headerMap === []) {
            return 'Missing required columns: employee_code and name (see the example CSV).';
        }

        return null;
    }

    /**
     * @return list<array<string, string|null>>
     */
    private function parseFile(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            return [];
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);

            return [];
        }

        $firstLine = $this->stripBom($firstLine);
        $delimiter = $this->detectDelimiter($firstLine);
        $headerCells = str_getcsv($firstLine, $delimiter);
        $headerMap = $this->buildHeaderMap($headerCells);

        if ($headerMap === []) {
            fclose($handle);

            return [];
        }

        $rows = [];
        $dataRowCount = 0;

        while (($cells = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($this->cellsAreEmpty($cells)) {
                continue;
            }

            $dataRowCount++;
            if ($dataRowCount > self::MAX_ROWS) {
                break;
            }

            $assoc = [];
            foreach ($headerMap as $index => $key) {
                $assoc[$key] = isset($cells[$index]) ? trim((string) $cells[$index]) : '';
            }

            $rows[] = $assoc;
        }

        fclose($handle);

        return $rows;
    }

    /**
     * @param  list<string>  $headerCells
     * @return array<int, string>
     */
    private function buildHeaderMap(array $headerCells): array
    {
        $aliases = [
            'code' => 'employee_code',
            'employee_id' => 'employee_code',
            'full_name' => 'name',
            'employee_name' => 'name',
            'join_date' => 'date_of_join',
            'joining_date' => 'date_of_join',
            'active' => 'is_active',
            'zkteco_id' => 'zkteco_user_id',
            'zk_user_id' => 'zkteco_user_id',
            'linked_user_email' => 'user_email',
            'check_in' => 'expected_check_in',
            'check_out' => 'expected_check_out',
            'weekends' => 'weekend_days',
        ];

        $map = [];
        foreach ($headerCells as $index => $cell) {
            $key = strtolower(trim($cell));
            $key = str_replace([' ', '-'], '_', $key);
            $key = $aliases[$key] ?? $key;

            if (in_array($key, self::HEADERS, true)) {
                $map[$index] = $key;
            }
        }

        if (! in_array('employee_code', $map, true) || ! in_array('name', $map, true)) {
            return [];
        }

        return $map;
    }

    /**
     * @param  array<string, string|null>  $row
     * @return array<string, mixed>
     */
    private function normalizeRow(array $row): array
    {
        return [
            'employee_code' => trim((string) ($row['employee_code'] ?? '')),
            'name' => trim((string) ($row['name'] ?? '')),
            'phone' => $this->nullableString($row['phone'] ?? null),
            'email' => $this->nullableString($row['email'] ?? null),
            'department' => $this->nullableString($row['department'] ?? null),
            'designation' => $this->nullableString($row['designation'] ?? null),
            'date_of_join' => $this->parseDate($row['date_of_join'] ?? null),
            'is_active' => $this->parseBoolean($row['is_active'] ?? null, true),
            'zkteco_user_id' => $this->parseNullableInt($row['zkteco_user_id'] ?? null),
            'user_email' => $this->nullableString($row['user_email'] ?? null),
            'expected_check_in' => $this->parseTime($row['expected_check_in'] ?? null) ?? '09:00',
            'expected_check_out' => $this->parseTime($row['expected_check_out'] ?? null) ?? '18:00',
            'grace_minutes' => $this->parseInt($row['grace_minutes'] ?? null) ?? 10,
            'weekend_days' => $this->parseWeekendDays($row['weekend_days'] ?? null) ?? [5, 6],
        ];
    }

    /**
     * @param  array<string, mixed>  $normalized
     * @param  list<string>  $seenCodes
     * @param  list<int>  $seenZkIds
     * @param  list<int>  $seenUserIds
     * @return array{errors: list<string>, data: array<string, mixed>}
     */
    private function validateRow(
        array $normalized,
        int $rowNumber,
        array $seenCodes,
        array $seenZkIds,
        array $seenUserIds,
    ): array {
        if ($normalized['date_of_join'] === false) {
            return [
                'errors' => ["Row {$rowNumber}: date_of_join is not a valid date (use YYYY-MM-DD)."],
                'data' => $normalized,
            ];
        }

        $userId = null;
        if ($normalized['user_email'] !== null) {
            $user = User::query()->where('email', $normalized['user_email'])->first();
            if ($user === null) {
                return [
                    'errors' => ["Row {$rowNumber}: user_email does not match any system user."],
                    'data' => $normalized,
                ];
            }
            $userId = $user->id;
        }

        $normalized['user_id'] = $userId;

        $validator = Validator::make($normalized, [
            'employee_code' => ['required', 'string', 'max:32', Rule::unique('employees', 'employee_code')],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:255'],
            'department' => ['nullable', 'string', 'max:120'],
            'designation' => ['nullable', 'string', 'max:120'],
            'date_of_join' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'zkteco_user_id' => ['nullable', 'integer', 'min:1', 'max:999999', Rule::unique('employees', 'zkteco_user_id')],
            'user_id' => ['nullable', 'integer', 'exists:users,id', Rule::unique('employees', 'user_id')],
            'expected_check_in' => ['required', 'date_format:H:i'],
            'expected_check_out' => ['required', 'date_format:H:i', 'after:expected_check_in'],
            'grace_minutes' => ['required', 'integer', 'min:0', 'max:180'],
            'weekend_days' => ['required', 'array', 'min:1'],
            'weekend_days.*' => ['integer', Rule::in([0, 1, 2, 3, 4, 5, 6])],
        ]);

        if ($validator->fails()) {
            return [
                'errors' => collect($validator->errors()->all())
                    ->map(fn (string $msg): string => "Row {$rowNumber}: {$msg}")
                    ->values()
                    ->all(),
                'data' => $normalized,
            ];
        }

        if (in_array($normalized['employee_code'], $seenCodes, true)) {
            return [
                'errors' => ["Row {$rowNumber}: duplicate employee_code in this file."],
                'data' => $normalized,
            ];
        }

        if ($normalized['zkteco_user_id'] !== null && in_array($normalized['zkteco_user_id'], $seenZkIds, true)) {
            return [
                'errors' => ["Row {$rowNumber}: duplicate zkteco_user_id in this file."],
                'data' => $normalized,
            ];
        }

        if ($userId !== null && in_array($userId, $seenUserIds, true)) {
            return [
                'errors' => ["Row {$rowNumber}: duplicate user_email in this file."],
                'data' => $normalized,
            ];
        }

        return ['errors' => [], 'data' => $normalized];
    }

    /**
     * @param  array<string, string|null>  $row
     */
    private function rowIsEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  list<string|null>  $cells
     */
    private function cellsAreEmpty(array $cells): bool
    {
        foreach ($cells as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    private function stripBom(string $line): string
    {
        if (str_starts_with($line, "\xEF\xBB\xBF")) {
            return substr($line, 3);
        }

        return $line;
    }

    private function detectDelimiter(string $line): string
    {
        $comma = substr_count($line, ',');
        $semicolon = substr_count($line, ';');

        return $semicolon > $comma ? ';' : ',';
    }

    private function nullableString(?string $value): ?string
    {
        $trimmed = trim((string) $value);

        return $trimmed === '' ? null : $trimmed;
    }

    private function parseNullableInt(?string $value): ?int
    {
        $trimmed = trim((string) $value);
        if ($trimmed === '') {
            return null;
        }

        if (! ctype_digit($trimmed)) {
            return null;
        }

        return (int) $trimmed;
    }

    private function parseInt(?string $value): ?int
    {
        $trimmed = trim((string) $value);
        if ($trimmed === '') {
            return null;
        }

        if (! ctype_digit($trimmed)) {
            return null;
        }

        return (int) $trimmed;
    }

    private function parseBoolean(?string $value, bool $default): bool
    {
        $trimmed = strtolower(trim((string) $value));
        if ($trimmed === '') {
            return $default;
        }

        if (in_array($trimmed, ['1', 'yes', 'y', 'true', 'active'], true)) {
            return true;
        }

        if (in_array($trimmed, ['0', 'no', 'n', 'false', 'inactive'], true)) {
            return false;
        }

        return $default;
    }

    /**
     * @return string|false|null false when invalid non-empty value
     */
    private function parseDate(?string $value): string|false|null
    {
        $trimmed = trim((string) $value);
        if ($trimmed === '') {
            return null;
        }

        foreach (['Y-m-d', 'd-m-Y', 'd/m/Y', 'm/d/Y'] as $format) {
            try {
                return Carbon::createFromFormat($format, $trimmed)->format('Y-m-d');
            } catch (\Throwable) {
                continue;
            }
        }

        try {
            return Carbon::parse($trimmed)->format('Y-m-d');
        } catch (\Throwable) {
            return false;
        }
    }

    private function parseTime(?string $value): ?string
    {
        $trimmed = trim((string) $value);
        if ($trimmed === '') {
            return null;
        }

        if (preg_match('/^\d{1,2}:\d{2}$/', $trimmed) === 1) {
            $parts = explode(':', $trimmed);
            $hour = (int) $parts[0];
            $minute = (int) $parts[1];
            if ($hour >= 0 && $hour <= 23 && $minute >= 0 && $minute <= 59) {
                return sprintf('%02d:%02d', $hour, $minute);
            }
        }

        if (preg_match('/^\d{1,2}:\d{2}:\d{2}$/', $trimmed) === 1) {
            return substr($trimmed, 0, 5);
        }

        return null;
    }

    /**
     * Accepts numbers (0–6) or day names (e.g. Fri, Friday, Sat).
     *
     * @return list<int>|null null when invalid
     */
    private function parseWeekendDays(?string $value): ?array
    {
        $trimmed = trim((string) $value);
        if ($trimmed === '') {
            return null;
        }

        $parts = preg_split('/[,;|]+/', $trimmed) ?: [];
        $days = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }

            $day = $this->parseWeekendDayToken($part);
            if ($day === null) {
                return null;
            }

            $days[] = $day;
        }

        $days = array_values(array_unique($days));
        sort($days);

        return $days === [] ? null : $days;
    }

    private function parseWeekendDayToken(string $token): ?int
    {
        if (ctype_digit($token)) {
            $day = (int) $token;
            if ($day >= 0 && $day <= 6) {
                return $day;
            }

            return null;
        }

        $key = strtolower($token);

        return self::WEEKEND_DAY_NAMES[$key] ?? null;
    }
}
