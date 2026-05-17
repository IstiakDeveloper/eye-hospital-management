<?php

namespace App\Http\Controllers\Employees;

use App\Enums\AttendanceDayStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employees\ImportEmployeesRequest;
use App\Http\Requests\Employees\StoreEmployeeRequest;
use App\Http\Requests\Employees\StoreManualEmployeeAttendanceRequest;
use App\Http\Requests\Employees\UpdateEmployeeRequest;
use App\Models\AttendanceDayRecord;
use App\Models\Employee;
use App\Models\EmployeeAttendanceSetting;
use App\Models\User;
use App\Services\Attendance\AttendanceDayRecordService;
use App\Services\Employees\EmployeeCsvImportService;
use App\Services\Employees\EmployeeIdentifierService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeController extends Controller
{
    public function __construct(
        protected AttendanceDayRecordService $attendanceDayRecordService,
        protected EmployeeIdentifierService $employeeIdentifierService,
        protected EmployeeCsvImportService $employeeCsvImportService,
    ) {}

    public function index(Request $request): Response
    {
        $query = Employee::query()
            ->with([
                'user' => fn ($q) => $q->select('id', 'name', 'email', 'role_id'),
                'user.role' => fn ($q) => $q->select('id', 'name'),
                'employeeAttendanceSetting',
            ])
            ->orderBy('employee_code');

        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(function ($q) use ($s): void {
                $q->where('name', 'like', '%'.$s.'%')
                    ->orWhere('employee_code', 'like', '%'.$s.'%')
                    ->orWhere('phone', 'like', '%'.$s.'%')
                    ->orWhere('email', 'like', '%'.$s.'%');
            });
        }

        if ($request->filled('is_active') && $request->is_active !== '') {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $employees = $query->paginate(20)->withQueryString();
        $authUser = $request->user();
        $isSuperAdmin = $authUser->isSuperAdmin();

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'filters' => $request->only(['search', 'is_active']),
            'can' => [
                'create' => $authUser->hasPermission('employees.create'),
                'edit' => $authUser->hasPermission('employees.edit'),
                'delete' => $authUser->hasPermission('employees.delete'),
            ],
            'canSetManualAttendance' => $isSuperAdmin,
            'employeeOptions' => $isSuperAdmin ? $this->manualAttendanceEmployeeOptions() : [],
            'statusOptions' => $isSuperAdmin ? $this->attendanceStatusOptions() : [],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Employees/Create', [
            'usersForLink' => $this->usersForLinkOptions(),
            'suggested' => [
                'employee_code' => $this->employeeIdentifierService->suggestEmployeeCode(),
                'zkteco_user_id' => $this->employeeIdentifierService->suggestZktecoUserId(),
            ],
        ]);
    }

    public function downloadImportTemplate(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $this->employeeCsvImportService->streamExampleCsv();
        }, 'employees-import-example.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function import(ImportEmployeesRequest $request): RedirectResponse
    {
        $result = $this->employeeCsvImportService->import($request->file('file'));

        if ($result['created'] === 0 && $result['errors'] !== []) {
            return redirect()->route('employees.index')
                ->with('error', 'No employees were imported. Fix the CSV and try again.')
                ->with('import_errors', $result['errors']);
        }

        $message = $result['created'] === 1
            ? '1 employee imported.'
            : "{$result['created']} employees imported.";

        if ($result['skipped'] > 0) {
            $message .= " {$result['skipped']} row(s) skipped.";
        }

        $redirect = redirect()->route('employees.index')->with('success', $message);

        if ($result['errors'] !== []) {
            $redirect->with('warning', 'Some rows could not be imported. See the list below.')
                ->with('import_errors', $result['errors']);
        }

        return $redirect;
    }

    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $employee = Employee::query()->create([
            'employee_code' => $data['employee_code'],
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'department' => $data['department'] ?? null,
            'designation' => $data['designation'] ?? null,
            'date_of_join' => $data['date_of_join'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'zkteco_user_id' => $data['zkteco_user_id'] ?? null,
            'user_id' => $data['user_id'] ?? null,
        ]);

        $this->syncAttendanceSettings($employee, $data);
        $this->recalculateRecent($employee);

        return redirect()->route('employees.index')
            ->with('success', 'Employee created.');
    }

    public function show(Request $request, Employee $employee): Response
    {
        $employee->load([
            'user' => fn ($q) => $q->select('id', 'name', 'email'),
            'employeeAttendanceSetting',
        ]);

        $setting = $this->attendanceDayRecordService->ensureSettings($employee);
        $tz = config('app.timezone');

        try {
            $sheetFrom = Carbon::parse($request->query('from', now($tz)->startOfMonth()->toDateString()), $tz)->startOfDay();
        } catch (\Throwable) {
            $sheetFrom = now($tz)->startOfMonth()->startOfDay();
        }

        try {
            $sheetTo = Carbon::parse($request->query('to', now($tz)->endOfMonth()->toDateString()), $tz)->startOfDay();
        } catch (\Throwable) {
            $sheetTo = now($tz)->endOfMonth()->startOfDay();
        }

        if ($sheetFrom->gt($sheetTo)) {
            [$sheetFrom, $sheetTo] = [$sheetTo->copy()->startOfDay(), $sheetFrom->copy()->startOfDay()];
        }

        if ($sheetFrom->diffInDays($sheetTo) > 366) {
            $sheetTo = $sheetFrom->copy()->addDays(366)->startOfDay();
        }

        $sheetRows = AttendanceDayRecord::query()
            ->where('employee_id', $employee->id)
            ->whereDate('work_date', '>=', $sheetFrom->toDateString())
            ->whereDate('work_date', '<=', $sheetTo->toDateString())
            ->orderBy('work_date')
            ->get()
            ->map(fn (AttendanceDayRecord $r): array => [
                'work_date' => $r->work_date->format('Y-m-d'),
                'status' => $r->status,
                'first_in_at' => $r->first_in_at?->format('H:i'),
                'last_out_at' => $r->last_out_at?->format('H:i'),
                'minutes_late' => $r->minutes_late,
            ]);

        return Inertia::render('Employees/Show', [
            'employee' => [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'name' => $employee->name,
                'phone' => $employee->phone,
                'email' => $employee->email,
                'department' => $employee->department,
                'designation' => $employee->designation,
                'date_of_join' => $employee->date_of_join?->format('Y-m-d'),
                'is_active' => $employee->is_active,
                'zkteco_user_id' => $employee->zkteco_user_id,
                'linked_user' => $employee->user
                    ? ['id' => $employee->user->id, 'name' => $employee->user->name, 'email' => $employee->user->email]
                    : null,
            ],
            'schedule' => [
                'expected_check_in' => substr((string) $setting->expected_check_in, 0, 5),
                'expected_check_out' => substr((string) $setting->expected_check_out, 0, 5),
                'grace_minutes' => $setting->grace_minutes,
                'weekend_days' => $setting->weekend_days ?? [5, 6],
            ],
            'canEdit' => $request->user()?->hasPermission('employees.edit') ?? false,
            'sheet' => [
                'from' => $sheetFrom->toDateString(),
                'to' => $sheetTo->toDateString(),
                'rows' => $sheetRows,
            ],
        ]);
    }

    public function storeManualAttendance(StoreManualEmployeeAttendanceRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $employee = Employee::query()->findOrFail((int) $data['employee_id']);
        $status = AttendanceDayStatus::from($data['status']);

        $this->attendanceDayRecordService->saveManualDayRecord(
            $employee,
            $data['work_date'],
            $status,
            $data['first_in'] ?? null,
            $data['last_out'] ?? null,
            isset($data['minutes_late']) ? (int) $data['minutes_late'] : null,
        );

        return back()->with('success', 'Attendance saved for '.$employee->name.' on '.$data['work_date'].'.');
    }

    public function attendanceCalendar(Request $request): Response
    {
        $tz = config('app.timezone');

        try {
            $calMonth = Carbon::createFromFormat('Y-m', (string) $request->query('month', now($tz)->format('Y-m')), $tz)->startOfMonth();
        } catch (\Throwable) {
            $calMonth = now($tz)->copy()->startOfMonth();
        }

        $calStart = $calMonth->copy()->startOfMonth();
        $calEnd = $calMonth->copy()->endOfMonth();

        $dayList = [];
        for ($d = $calStart->copy(); $d->lte($calEnd); $d->addDay()) {
            $dayList[] = $d->format('Y-m-d');
        }

        $allEmployees = Employee::query()
            ->where('is_active', true)
            ->orderBy('employee_code')
            ->limit(400)
            ->get(['id', 'employee_code', 'name']);

        $matrixRecords = AttendanceDayRecord::query()
            ->whereIn('employee_id', $allEmployees->pluck('id'))
            ->whereDate('work_date', '>=', $calStart->toDateString())
            ->whereDate('work_date', '<=', $calEnd->toDateString())
            ->get();

        $matrixKey = [];
        foreach ($matrixRecords as $mr) {
            $matrixKey[$mr->employee_id.'_'.$mr->work_date->format('Y-m-d')] = $mr->status;
        }

        $matrixRows = $allEmployees->map(function (Employee $em) use ($dayList, $matrixKey): array {
            $statuses = [];
            foreach ($dayList as $ymd) {
                $statuses[] = $matrixKey[$em->id.'_'.$ymd] ?? null;
            }

            return [
                'employee_id' => $em->id,
                'employee_code' => $em->employee_code,
                'name' => $em->name,
                'statuses' => $statuses,
            ];
        });

        return Inertia::render('Employees/AttendanceCalendar', [
            'calendarMonth' => $calMonth->format('Y-m'),
            'calendarMonthLabel' => $calMonth->translatedFormat('F Y'),
            'matrix' => [
                'day_dates' => $dayList,
                'rows' => $matrixRows,
            ],
        ]);
    }

    public function edit(Employee $employee): Response
    {
        $setting = $this->attendanceDayRecordService->ensureSettings($employee);

        return Inertia::render('Employees/Edit', [
            'employee' => [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'name' => $employee->name,
                'phone' => $employee->phone,
                'email' => $employee->email,
                'department' => $employee->department,
                'designation' => $employee->designation,
                'date_of_join' => $employee->date_of_join?->format('Y-m-d'),
                'is_active' => $employee->is_active,
                'zkteco_user_id' => $employee->zkteco_user_id,
                'user_id' => $employee->user_id,
            ],
            'setting' => [
                'expected_check_in' => substr((string) $setting->expected_check_in, 0, 5),
                'expected_check_out' => substr((string) $setting->expected_check_out, 0, 5),
                'grace_minutes' => $setting->grace_minutes,
                'weekend_days' => $setting->weekend_days ?? [5, 6],
            ],
            'usersForLink' => $this->usersForLinkOptions($employee),
        ]);
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $data = $request->validated();

        $employee->update([
            'employee_code' => $data['employee_code'],
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'department' => $data['department'] ?? null,
            'designation' => $data['designation'] ?? null,
            'date_of_join' => $data['date_of_join'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'zkteco_user_id' => $data['zkteco_user_id'] ?? null,
            'user_id' => $data['user_id'] ?? null,
        ]);

        $this->syncAttendanceSettings($employee, $data);

        $this->recalculateRecent($employee->fresh());

        return redirect()->route('employees.edit', $employee)
            ->with('success', 'Employee updated.');
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        $employee->attendancePunches()->delete();
        $employee->attendanceDayRecords()->delete();
        EmployeeAttendanceSetting::query()->where('employee_id', $employee->id)->delete();
        $employee->delete();

        return redirect()->route('employees.index')
            ->with('success', 'Employee removed.');
    }

    /**
     * @return array<int, array{id: int, name: string, email: string}>
     */
    private function usersForLinkOptions(?Employee $exceptFor = null): array
    {
        return User::query()
            ->when($exceptFor?->user_id, function ($q) use ($exceptFor): void {
                $q->where(function ($q2) use ($exceptFor): void {
                    $q2->whereDoesntHave('employee')
                        ->orWhere('id', $exceptFor->user_id);
                });
            }, function ($q): void {
                $q->whereDoesntHave('employee');
            })
            ->orderBy('name')
            ->limit(500)
            ->get(['id', 'name', 'email'])
            ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncAttendanceSettings(Employee $employee, array $data): void
    {
        $employee->employeeAttendanceSetting()->updateOrCreate(
            ['employee_id' => $employee->id],
            [
                'expected_check_in' => $data['expected_check_in'].':00',
                'expected_check_out' => $data['expected_check_out'].':00',
                'grace_minutes' => (int) $data['grace_minutes'],
                'weekend_days' => array_values(array_map('intval', $data['weekend_days'])),
            ]
        );
    }

    private function recalculateRecent(Employee $employee): void
    {
        $from = now()->subDays(45)->startOfDay();
        $to = now()->addDay()->endOfDay();
        $this->attendanceDayRecordService->recalculateForDateRange(collect([$employee]), $from, $to);
    }

    /**
     * @return array<int, array{value: int, label: string}>
     */
    private function manualAttendanceEmployeeOptions(): array
    {
        return Employee::query()
            ->where('is_active', true)
            ->orderBy('employee_code')
            ->limit(400)
            ->get(['id', 'employee_code', 'name'])
            ->map(fn (Employee $e): array => [
                'value' => $e->id,
                'label' => $e->employee_code.' — '.$e->name,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function attendanceStatusOptions(): array
    {
        return collect(AttendanceDayStatus::cases())->map(fn (AttendanceDayStatus $c): array => [
            'value' => $c->value,
            'label' => ucfirst(str_replace('_', ' ', $c->value)),
        ])->values()->all();
    }
}
