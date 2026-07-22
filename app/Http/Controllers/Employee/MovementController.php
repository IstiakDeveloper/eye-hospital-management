<?php

namespace App\Http\Controllers\Employee;

use App\Enums\AttendanceDayStatus;
use App\Http\Controllers\Controller;
use App\Models\AttendanceDayRecord;
use App\Models\EmployeeMovement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MovementController extends Controller
{
    public function index(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return redirect()->route('dashboard')->with('error', 'No employee record found.');
        }

        $movements = EmployeeMovement::where('employee_id', $employee->id)
            ->latest('date')
            ->latest('id')
            ->paginate(15);

        $activeMovement = EmployeeMovement::where('employee_id', $employee->id)
            ->whereNull('end_time')
            ->first();

        return Inertia::render('EmployeePortal/Movements/Index', [
            'movements' => $movements,
            'activeMovement' => $activeMovement,
        ]);
    }

    public function create(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return redirect()->route('dashboard')->with('error', 'No employee record found.');
        }

        $activeMovement = EmployeeMovement::where('employee_id', $employee->id)
            ->whereNull('end_time')
            ->first();

        return Inertia::render('EmployeePortal/Movements/Create', [
            'activeMovement' => $activeMovement,
        ]);
    }

    public function store(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return redirect()->route('dashboard')->with('error', 'No employee record found.');
        }

        // Check if there is an active movement currently open
        $activeMovement = EmployeeMovement::where('employee_id', $employee->id)
            ->whereNull('end_time')
            ->first();

        if ($activeMovement) {
            return back()->with('error', 'You currently have an active movement. Please end your current movement before starting a new one.');
        }

        $request->validate([
            'date' => 'required|date',
            'start_time' => 'required|string',
            'purpose' => 'required|string|max:500',
            'location' => 'nullable|string|max:255',
        ]);

        $dateYmd = Carbon::parse($request->input('date'))->toDateString();
        $timeHi = substr((string) $request->input('start_time'), 0, 5);
        $startDateTime = Carbon::parse("{$dateYmd} {$timeHi}");
        $allowedEarliest = now()->subMinutes(5);

        if ($startDateTime->lt($allowedEarliest)) {
            return back()->withErrors([
                'start_time' => 'Movement start time cannot be more than 5 minutes in the past.',
            ]);
        }

        $movement = EmployeeMovement::create([
            'employee_id' => $employee->id,
            'date' => $request->input('date'),
            'start_time' => $request->input('start_time'),
            'end_time' => null, // Stays open until employee closes it
            'purpose' => $request->input('purpose'),
            'location' => $request->input('location'),
            'status' => 'approved', // Auto-approved, no manual admin approval needed
        ]);

        // Auto-sync Attendance: Mark as Present & set First Check In if absent/null
        $this->syncAttendanceFromMovement($employee, $movement->date, $movement->start_time);

        return redirect()->route('employee.movements.index')->with('success', 'Movement started successfully & attendance marked Present.');
    }

    public function close(Request $request, EmployeeMovement $movement)
    {
        $employee = $request->user()->employee;
        if (!$employee || $movement->employee_id !== $employee->id) {
            return back()->with('error', 'Unauthorized action.');
        }

        if ($movement->end_time !== null) {
            return back()->with('info', 'Movement is already closed.');
        }

        $endTimeNow = now()->format('H:i:s');
        $movement->update([
            'end_time' => $endTimeNow,
        ]);

        // Auto-sync Attendance: Set Last Check Out & calculate duration
        $this->syncAttendanceFromMovement($employee, $movement->date, $movement->start_time, $endTimeNow);

        return back()->with('success', 'Movement completed & attendance updated successfully.');
    }

    /**
     * Helper to auto-sync Movement data to AttendanceDayRecord.
     * Earliest movement start_time = Check-In time.
     * Latest movement end_time = Check-Out time.
     */
    private function syncAttendanceFromMovement($employee, mixed $workDate, string $startTime, ?string $endTime = null): void
    {
        $dateYmd = Carbon::parse($workDate)->toDateString();
        $startHi = substr((string) $startTime, 0, 5);
        $endHi = $endTime ? substr((string) $endTime, 0, 5) : null;

        $startCarbon = Carbon::parse("{$dateYmd} {$startHi}");
        $endCarbon = $endHi ? Carbon::parse("{$dateYmd} {$endHi}") : null;

        $record = AttendanceDayRecord::firstOrCreate(
            [
                'employee_id' => $employee->id,
                'work_date' => $dateYmd,
            ],
            [
                'status' => AttendanceDayStatus::Present->value,
                'first_in_at' => $startCarbon,
                'last_out_at' => $endCarbon,
            ]
        );

        // Update first_in_at if it's null OR if movement's start_time is earlier
        if (!$record->first_in_at || $startCarbon->lt(Carbon::parse($record->first_in_at))) {
            $record->first_in_at = $startCarbon;
        }

        // Update last_out_at if endCarbon is provided and it's later
        if ($endCarbon) {
            if (!$record->last_out_at || $endCarbon->gt(Carbon::parse($record->last_out_at))) {
                $record->last_out_at = $endCarbon;
            }
        }

        // Ensure status is Present if previously absent or incomplete
        if (in_array($record->status, ['absent', 'incomplete', null, ''])) {
            $record->status = AttendanceDayStatus::Present->value;
        }

        // Calculate total worked minutes if both first_in_at and last_out_at exist
        if ($record->first_in_at && $record->last_out_at) {
            $inTime = Carbon::parse($record->first_in_at);
            $outTime = Carbon::parse($record->last_out_at);
            $record->minutes_worked = max(0, $inTime->diffInMinutes($outTime));
        }

        $record->save();
    }
}
