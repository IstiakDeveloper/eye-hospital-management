<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\VisionTest;
use App\Models\Doctor;
use App\Models\Appointment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class VisionTestController extends Controller
{
    /**
     * Display a listing of vision tests
     */
    public function index(Request $request)
    {
        $searchTerm = $request->get('search');
        $dateFilter = $request->get('date_filter');
        $statusFilter = $request->get('status');

        $query = VisionTest::with(['patient', 'performedBy'])
            ->select('vision_tests.*')
            ->join('patients', 'vision_tests.patient_id', '=', 'patients.id');

        // Search functionality
        if ($searchTerm) {
            $query->where(function ($q) use ($searchTerm) {
                $q->where('patients.name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('patients.phone', 'like', '%' . $searchTerm . '%')
                    ->orWhere('patients.patient_id', 'like', '%' . $searchTerm . '%');
            });
        }

        // Date filtering
        if ($dateFilter) {
            switch ($dateFilter) {
                case 'today':
                    $query->whereDate('vision_tests.test_date', today());
                    break;
                case 'week':
                    $query->whereBetween('vision_tests.test_date', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'month':
                    $query->whereMonth('vision_tests.test_date', now()->month)
                        ->whereYear('vision_tests.test_date', now()->year);
                    break;
            }
        }

        $visionTests = $query->orderBy('vision_tests.test_date', 'desc')
            ->paginate(20);

        // Get statistics
        $stats = [
            'total_tests' => VisionTest::count(),
            'tests_today' => VisionTest::whereDate('test_date', today())->count(),
            'tests_this_week' => VisionTest::whereBetween('test_date', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'tests_this_month' => VisionTest::whereMonth('test_date', now()->month)
                ->whereYear('test_date', now()->year)
                ->count(),
        ];

        return Inertia::render('VisionTests/Index', [
            'visionTests' => $visionTests,
            'stats' => $stats,
            'filters' => [
                'search' => $searchTerm,
                'date_filter' => $dateFilter,
                'status' => $statusFilter,
            ],
        ]);
    }

    /**
     * Show the form for creating a new vision test.
     */
    public function create(Patient $patient)
    {
        // Find the most recent active visit for vision test
        $visit = PatientVisit::with(['patient', 'selectedDoctor.user'])
            ->where('patient_id', $patient->id)
            ->where(function ($query) {
                $query->where('vision_test_status', 'in_progress')
                    ->orWhere(function ($subQuery) {
                        $subQuery->where('payment_status', 'paid')
                            ->where('vision_test_status', 'pending')
                            ->where('overall_status', 'vision_test');
                    });
            })
            ->latest()
            ->first();

        if (!$visit) {
            return redirect()->route('refractionist.dashboard')->withErrors([
                'error' => 'No active visit found for vision test.'
            ]);
        }

        // Check if visit payment is completed
        if ($visit->payment_status !== 'paid') {
            return redirect()->route('refractionist.dashboard')->withErrors([
                'error' => 'Visit payment is not completed yet.'
            ]);
        }

        // Check if vision test already completed for this visit
        if ($visit->vision_test_status === 'completed') {
            return redirect()->route('refractionist.dashboard')->withErrors([
                'error' => 'Vision test already completed for this visit.'
            ]);
        }

        // Get the latest vision test for this patient for pre-filling form
        $latestTest = VisionTest::where('patient_id', $patient->id)
            ->orderBy('test_date', 'desc')
            ->first();

        // Get previous vision tests for reference (last 3)
        $previousTests = VisionTest::where('patient_id', $patient->id)
            ->with('performedBy')
            ->orderBy('test_date', 'desc')
            ->limit(3)
            ->get();

        // Load patient with additional info
        $patient->load('registeredBy');

        return Inertia::render('VisionTests/Create', [
            'patient' => $patient,
            'visit' => $visit,
            'latestTest' => $latestTest,
            'previousTests' => $previousTests,
        ]);
    }

    /**
     * Store a newly created vision test in storage.
     */
    public function store(Request $request, Patient $patient)
    {
        // Find the active visit
        $visit = PatientVisit::where('patient_id', $patient->id)
            ->where(function ($query) {
                $query->where('vision_test_status', 'in_progress')
                    ->orWhere(function ($subQuery) {
                        $subQuery->where('payment_status', 'paid')
                            ->where('vision_test_status', 'pending');
                    });
            })
            ->latest()
            ->first();

        if (!$visit) {
            return back()->withErrors([
                'error' => 'No active visit found for vision test.'
            ]);
        }

        // Verify visit belongs to patient
        if ($visit->patient_id !== $patient->id) {
            return back()->withErrors([
                'error' => 'Visit does not belong to this patient.'
            ]);
        }

        // Check if visit payment is completed
        if ($visit->payment_status !== 'paid') {
            return back()->withErrors([
                'error' => 'Visit payment is not completed yet.'
            ]);
        }

        // ✅ NEW CHECK: Ensure we don't already have a vision test for THIS specific visit
        $existingVisionTest = VisionTest::where('visit_id', $visit->id)
            ->where('patient_id', $patient->id)
            ->first();

        if ($existingVisionTest) {
            return back()->withErrors([
                'error' => 'Vision test already exists for this visit. Please create a new visit or edit the existing test.'
            ]);
        }

        $request->validate([
            'right_eye_vision' => 'nullable|string|max:20',
            'left_eye_vision' => 'nullable|string|max:20',
            'right_eye_power' => 'nullable|numeric|between:-30,30',
            'left_eye_power' => 'nullable|numeric|between:-30,30',
            'right_eye_pressure' => 'nullable|string|max:20',
            'left_eye_pressure' => 'nullable|string|max:20',
            'right_eye_sphere' => 'nullable|numeric|between:-20,20',
            'left_eye_sphere' => 'nullable|numeric|between:-20,20',
            'right_eye_cylinder' => 'nullable|numeric|between:-10,10',
            'left_eye_cylinder' => 'nullable|numeric|between:-10,10',
            'right_eye_axis' => 'nullable|integer|between:0,180',
            'left_eye_axis' => 'nullable|integer|between:0,180',
            'pupillary_distance' => 'nullable|numeric|between:50,80',
            'additional_notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            // Prepare data for NEW vision test - ALWAYS CREATE, NEVER UPDATE
            $visionTestData = [
                'patient_id' => $patient->id,
                'visit_id' => $visit->id,  // ✅ Link to specific visit
                'performed_by' => auth()->id(),
                'test_date' => now(),
                'right_eye_vision' => $request->right_eye_vision,
                'left_eye_vision' => $request->left_eye_vision,
                'right_eye_power' => $request->right_eye_power,
                'left_eye_power' => $request->left_eye_power,
                'right_eye_pressure' => $request->right_eye_pressure,
                'left_eye_pressure' => $request->left_eye_pressure,
                'right_eye_sphere' => $request->right_eye_sphere,
                'left_eye_sphere' => $request->left_eye_sphere,
                'right_eye_cylinder' => $request->right_eye_cylinder,
                'left_eye_cylinder' => $request->left_eye_cylinder,
                'right_eye_axis' => $request->right_eye_axis,
                'left_eye_axis' => $request->left_eye_axis,
                'pupillary_distance' => $request->pupillary_distance,
                'additional_notes' => $request->additional_notes,
            ];

            // ✅ ALWAYS CREATE NEW vision test (never update existing)
            $visionTest = VisionTest::create($visionTestData);

            Log::info('NEW vision test created successfully', [
                'vision_test_id' => $visionTest->id,
                'patient_id' => $patient->id,
                'visit_id' => $visit->id,
                'vision_test_visit_id' => $visionTest->visit_id,
                'is_new_record' => true, // ✅ Confirm it's new
            ]);

            // Complete vision test for the visit using model method
            $visit->completeVisionTest();

            Log::info('Visit vision test status updated', [
                'visit_id' => $visit->id,
                'vision_test_status' => $visit->vision_test_status,
                'overall_status' => $visit->overall_status,
            ]);

            // Auto-create appointment with selected doctor if available
            $appointment = $this->createAppointmentWithSelectedDoctor($patient, $visit);

            $message = 'New vision test created successfully!';
            if ($appointment) {
                $message .= ' Appointment has been automatically scheduled with Dr. ' . $appointment->doctor->user->name . ' (Serial: ' . $appointment->serial_number . ')';
            } else {
                $message .= ' Patient is ready for doctor consultation.';
            }

            DB::commit();

            return redirect()->route('refractionist.dashboard')
                ->with('success', $message);
        } catch (\Exception $e) {
            DB::rollback();

            Log::error('Failed to create new vision test', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'patient_id' => $patient->id,
                'visit_id' => $visit->id,
            ]);

            return back()->withErrors([
                'error' => 'Failed to create vision test: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create appointment with the doctor selected during visit registration
     */
    private function createAppointmentWithSelectedDoctor(Patient $patient, PatientVisit $visit)
    {
        try {
            // Only create appointment if doctor was selected for this visit
            if (!$visit->selected_doctor_id) {
                Log::info('No doctor selected for this visit', [
                    'visit_id' => $visit->id,
                    'patient_id' => $patient->id
                ]);
                return null;
            }

            // Load the doctor relationship to verify it exists
            $doctor = Doctor::with('user')->find($visit->selected_doctor_id);

            if (!$doctor) {
                Log::warning('Selected doctor not found', [
                    'visit_id' => $visit->id,
                    'patient_id' => $patient->id,
                    'selected_doctor_id' => $visit->selected_doctor_id
                ]);
                return null;
            }

            Log::info('Doctor found, proceeding with appointment creation', [
                'doctor_id' => $doctor->id,
                'doctor_name' => $doctor->user->name ?? 'Unknown',
            ]);

            // Generate serial number for today
            $today = now()->format('Y-m-d');
            $lastSerial = Appointment::where('appointment_date', $today)
                ->where('doctor_id', $visit->selected_doctor_id)
                ->orderBy('serial_number', 'desc')
                ->first();

            $serialNumber = $lastSerial ? (intval($lastSerial->serial_number) + 1) : 1;
            $serialNumberFormatted = str_pad($serialNumber, 3, '0', STR_PAD_LEFT);

            // Create appointment data
            $appointmentData = [
                'patient_id' => $patient->id,
                'doctor_id' => $visit->selected_doctor_id,
                'appointment_date' => $today,
                'appointment_time' => now()->format('H:i'),
                'serial_number' => $serialNumberFormatted,
                'status' => 'pending',
                'created_by' => auth()->id(),
            ];

            Log::info('Attempting to create appointment with data', $appointmentData);

            // Create appointment
            $appointment = Appointment::create($appointmentData);

            if ($appointment) {
                Log::info('Appointment created successfully', [
                    'appointment_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'doctor_id' => $visit->selected_doctor_id,
                    'appointment_date' => $today,
                    'appointment_time' => now()->format('H:i'),
                    'serial_number' => $serialNumberFormatted,
                ]);

                // Load the doctor relationship for return
                $appointment->load('doctor.user');
                return $appointment;
            } else {
                Log::error('Appointment::create() returned null/false', [
                    'patient_id' => $patient->id,
                    'selected_doctor_id' => $visit->selected_doctor_id,
                    'appointment_data' => $appointmentData,
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error('Exception during appointment creation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'patient_id' => $patient->id,
                'visit_id' => $visit->id,
                'selected_doctor_id' => $visit->selected_doctor_id,
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);
            return null;
        }
    }

    /**
     * Display the specified vision test.
     */
    public function show($id)
    {
        $visionTest = VisionTest::with(['patient', 'performedBy'])
            ->findOrFail($id);

        // Get patient's visit history for context
        $patientVisits = PatientVisit::where('patient_id', $visionTest->patient_id)
            ->with('selectedDoctor.user')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('VisionTests/Show', [
            'visionTest' => $visionTest,
            'patientVisits' => $patientVisits,
        ]);
    }

    /**
     * Show the form for editing the specified vision test.
     */
    public function edit($id)
    {
        $visionTest = VisionTest::with(['patient', 'performedBy'])
            ->findOrFail($id);

        // Check if user can edit this test (same day or admin)
        $canEdit = $visionTest->test_date->isToday() || auth()->user()->hasRole('admin');

        if (!$canEdit) {
            return redirect()->route('visiontests.show', $id)
                ->withErrors(['error' => 'Vision tests can only be edited on the same day.']);
        }

        return Inertia::render('VisionTests/Edit', [
            'visionTest' => $visionTest
        ]);
    }

    /**
     * Update the specified vision test in storage.
     */
    public function update(Request $request, $id)
    {
        $visionTest = VisionTest::findOrFail($id);

        // Check if user can edit this test
        $canEdit = $visionTest->test_date->isToday() || auth()->user()->hasRole('admin');

        if (!$canEdit) {
            return back()->withErrors([
                'error' => 'Vision tests can only be edited on the same day.'
            ]);
        }

        $request->validate([
            'right_eye_vision' => 'nullable|string|max:20',
            'left_eye_vision' => 'nullable|string|max:20',
            'right_eye_power' => 'nullable|numeric|between:-30,30',
            'left_eye_power' => 'nullable|numeric|between:-30,30',
            'right_eye_pressure' => 'nullable|string|max:20',
            'left_eye_pressure' => 'nullable|string|max:20',
            'right_eye_sphere' => 'nullable|numeric|between:-20,20',
            'left_eye_sphere' => 'nullable|numeric|between:-20,20',
            'right_eye_cylinder' => 'nullable|numeric|between:-10,10',
            'left_eye_cylinder' => 'nullable|numeric|between:-10,10',
            'right_eye_axis' => 'nullable|integer|between:0,180',
            'left_eye_axis' => 'nullable|integer|between:0,180',
            'pupillary_distance' => 'nullable|numeric|between:50,80',
            'additional_notes' => 'nullable|string|max:1000',
        ]);

        $visionTest->update($request->only([
            'right_eye_vision',
            'left_eye_vision',
            'right_eye_power',
            'left_eye_power',
            'right_eye_pressure',
            'left_eye_pressure',
            'right_eye_sphere',
            'left_eye_sphere',
            'right_eye_cylinder',
            'left_eye_cylinder',
            'right_eye_axis',
            'left_eye_axis',
            'pupillary_distance',
            'additional_notes',
        ]));

        Log::info('Vision test updated', [
            'vision_test_id' => $visionTest->id,
            'updated_by' => auth()->id(),
        ]);

        return redirect()->route('visiontests.show', $id)
            ->with('success', 'Vision test updated successfully!');
    }

    /**
     * Print the vision test report.
     */
    public function print($id)
    {
        $visionTest = VisionTest::with(['patient', 'performedBy'])
            ->findOrFail($id);

        // Generate PDF with precise settings
        $pdf = Pdf::loadView('vision-tests.print', [
            'visionTest' => $visionTest
        ]);

        $pdf->setPaper('A4', 'portrait');
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled' => true,
            'defaultFont' => 'Arial',
            'dpi' => 96,
            'defaultPaperSize' => 'A4',
            'orientation' => 'portrait',
        ]);

        $filename = 'vision-test-' .
            $visionTest->patient->name . '-' .
            $visionTest->patient->patient_id . '-' .
            $visionTest->test_date->format('Y-m-d') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Get vision test history for a patient
     */
    public function getPatientHistory(Patient $patient)
    {
        $visionTests = VisionTest::where('patient_id', $patient->id)
            ->with('performedBy')
            ->orderBy('test_date', 'desc')
            ->paginate(10);

        return Inertia::render('VisionTests/PatientHistory', [
            'patient' => $patient,
            'visionTests' => $visionTests,
        ]);
    }

    /**
     * Get today's vision test statistics
     */
    public function getTodayStats()
    {
        $today = today();

        $stats = [
            'total_tests_today' => VisionTest::whereDate('test_date', $today)->count(),
            'tests_by_hour' => VisionTest::whereDate('test_date', $today)
                ->selectRaw('HOUR(test_date) as hour, COUNT(*) as count')
                ->groupBy('hour')
                ->orderBy('hour')
                ->pluck('count', 'hour')
                ->toArray(),
            'pending_visits' => PatientVisit::readyForVisionTest()->count(),
            'completed_visits' => PatientVisit::where('vision_test_status', 'completed')
                ->whereDate('vision_test_completed_at', $today)
                ->count(),
        ];

        // Fill missing hours
        $hourlyStats = [];
        for ($hour = 8; $hour <= 18; $hour++) {
            $hourlyStats[] = [
                'hour' => sprintf('%02d:00', $hour),
                'tests' => $stats['tests_by_hour'][$hour] ?? 0,
            ];
        }

        $stats['hourly_breakdown'] = $hourlyStats;

        return response()->json($stats);
    }

    /**
     * Search vision tests
     */
    public function search(Request $request)
    {
        $request->validate([
            'term' => 'required|string|min:2',
        ]);

        $searchTerm = $request->term;

        $visionTests = VisionTest::with(['patient', 'performedBy'])
            ->whereHas('patient', function ($query) use ($searchTerm) {
                $query->where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('phone', 'like', '%' . $searchTerm . '%')
                    ->orWhere('patient_id', 'like', '%' . $searchTerm . '%');
            })
            ->orderBy('test_date', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($test) {
                return [
                    'id' => $test->id,
                    'patient_name' => $test->patient->name,
                    'patient_id' => $test->patient->patient_id,
                    'test_date' => $test->test_date->format('Y-m-d H:i'),
                    'performed_by' => $test->performedBy->name ?? 'Unknown',
                ];
            });

        return response()->json($visionTests);
    }

    /**
     * Export vision tests to CSV
     */
    public function export(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth());
        $dateTo = $request->get('date_to', now()->endOfMonth());

        $visionTests = VisionTest::with(['patient', 'performedBy'])
            ->whereBetween('test_date', [$dateFrom, $dateTo])
            ->orderBy('test_date', 'desc')
            ->get();

        $filename = 'vision-tests-' . now()->format('Y-m-d-H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($visionTests) {
            $file = fopen('php://output', 'w');

            // CSV Headers
            fputcsv($file, [
                'Test Date',
                'Patient Name',
                'Patient ID',
                'Phone',
                'Right Eye Vision',
                'Left Eye Vision',
                'Right Eye Sphere',
                'Left Eye Sphere',
                'Right Eye Cylinder',
                'Left Eye Cylinder',
                'Performed By',
                'Notes'
            ]);

            // CSV Data
            foreach ($visionTests as $test) {
                fputcsv($file, [
                    $test->test_date->format('Y-m-d H:i'),
                    $test->patient->name,
                    $test->patient->patient_id,
                    $test->patient->phone,
                    $test->right_eye_vision,
                    $test->left_eye_vision,
                    $test->right_eye_sphere,
                    $test->left_eye_sphere,
                    $test->right_eye_cylinder,
                    $test->left_eye_cylinder,
                    $test->performedBy->name ?? 'Unknown',
                    $test->additional_notes,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Bulk delete vision tests (admin only)
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:vision_tests,id',
        ]);

        try {
            $deleted = VisionTest::whereIn('id', $request->ids)->delete();

            Log::info('Bulk deleted vision tests', [
                'deleted_count' => $deleted,
                'ids' => $request->ids,
                'deleted_by' => auth()->id(),
            ]);

            return back()->with('success', "Deleted {$deleted} vision tests successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to bulk delete vision tests', [
                'error' => $e->getMessage(),
                'ids' => $request->ids,
            ]);

            return back()->withErrors(['error' => 'Failed to delete vision tests.']);
        }
    }
}
