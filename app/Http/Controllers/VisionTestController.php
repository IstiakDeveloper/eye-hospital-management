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

        // Check if vision test already exists for this visit
        $existingVisionTest = VisionTest::where('visit_id', $visit->id)
            ->where('patient_id', $patient->id)
            ->first();

        if ($existingVisionTest) {
            return back()->withErrors([
                'error' => 'Vision test already exists for this visit. Please create a new visit or edit the existing test.'
            ]);
        }

        $request->validate([
            'complains' => 'nullable|string|max:1000',
            'right_eye_diagnosis' => 'nullable|string|max:500',
            'left_eye_diagnosis' => 'nullable|string|max:500',
            'right_eye_lids' => 'nullable|string|max:500',
            'left_eye_lids' => 'nullable|string|max:500',
            'right_eye_conjunctiva' => 'nullable|string|max:500',
            'left_eye_conjunctiva' => 'nullable|string|max:500',
            'right_eye_cornea' => 'nullable|string|max:500',
            'left_eye_cornea' => 'nullable|string|max:500',
            'right_eye_anterior_chamber' => 'nullable|string|max:500',
            'left_eye_anterior_chamber' => 'nullable|string|max:500',
            'right_eye_iris' => 'nullable|string|max:500',
            'left_eye_iris' => 'nullable|string|max:500',
            'right_eye_pupil' => 'nullable|string|max:500',
            'left_eye_pupil' => 'nullable|string|max:500',
            'right_eye_lens' => 'nullable|string|max:500',
            'left_eye_lens' => 'nullable|string|max:500',
            'right_eye_ocular_movements' => 'nullable|string|max:500',
            'left_eye_ocular_movements' => 'nullable|string|max:500',
            'right_eye_vision_without_glass' => 'nullable|string|max:20',
            'left_eye_vision_without_glass' => 'nullable|string|max:20',
            'right_eye_vision_with_glass' => 'nullable|string|max:20',
            'left_eye_vision_with_glass' => 'nullable|string|max:20',
            'right_eye_iop' => 'nullable|string|max:20',
            'left_eye_iop' => 'nullable|string|max:20',
            'right_eye_ducts' => 'nullable|string|max:500',
            'left_eye_ducts' => 'nullable|string|max:500',
            'blood_pressure' => 'nullable|string|max:20',
            'urine_sugar' => 'nullable|string|max:20',
            'blood_sugar' => 'nullable|string|max:20',
            'right_eye_fundus' => 'nullable|string|max:1000',
            'left_eye_fundus' => 'nullable|string|max:1000',
            'detailed_history' => 'nullable|string|max:2000',
            'is_one_eyed' => 'boolean',
            'is_diabetic' => 'boolean',
            'is_cardiac' => 'boolean',
            'is_asthmatic' => 'boolean',
            'is_hypertensive' => 'boolean',
            'is_thyroid' => 'boolean',
            'other_conditions' => 'nullable|string|max:500',
            'drugs_used' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            // Prepare data for new vision test
            $visionTestData = [
                'patient_id' => $patient->id,
                'visit_id' => $visit->id,
                'performed_by' => auth()->id(),
                'test_date' => now(),
                'complains' => $request->complains,
                'right_eye_diagnosis' => $request->right_eye_diagnosis,
                'left_eye_diagnosis' => $request->left_eye_diagnosis,
                'right_eye_lids' => $request->right_eye_lids,
                'left_eye_lids' => $request->left_eye_lids,
                'right_eye_conjunctiva' => $request->right_eye_conjunctiva,
                'left_eye_conjunctiva' => $request->left_eye_conjunctiva,
                'right_eye_cornea' => $request->right_eye_cornea,
                'left_eye_cornea' => $request->left_eye_cornea,
                'right_eye_anterior_chamber' => $request->right_eye_anterior_chamber,
                'left_eye_anterior_chamber' => $request->left_eye_anterior_chamber,
                'right_eye_iris' => $request->right_eye_iris,
                'left_eye_iris' => $request->left_eye_iris,
                'right_eye_pupil' => $request->right_eye_pupil,
                'left_eye_pupil' => $request->left_eye_pupil,
                'right_eye_lens' => $request->right_eye_lens,
                'left_eye_lens' => $request->left_eye_lens,
                'right_eye_ocular_movements' => $request->right_eye_ocular_movements,
                'left_eye_ocular_movements' => $request->left_eye_ocular_movements,
                'right_eye_vision_without_glass' => $request->right_eye_vision_without_glass,
                'left_eye_vision_without_glass' => $request->left_eye_vision_without_glass,
                'right_eye_vision_with_glass' => $request->right_eye_vision_with_glass,
                'left_eye_vision_with_glass' => $request->left_eye_vision_with_glass,
                'right_eye_iop' => $request->right_eye_iop,
                'left_eye_iop' => $request->left_eye_iop,
                'right_eye_ducts' => $request->right_eye_ducts,
                'left_eye_ducts' => $request->left_eye_ducts,
                'blood_pressure' => $request->blood_pressure,
                'urine_sugar' => $request->urine_sugar,
                'blood_sugar' => $request->blood_sugar,
                'right_eye_fundus' => $request->right_eye_fundus,
                'left_eye_fundus' => $request->left_eye_fundus,
                'detailed_history' => $request->detailed_history,
                'is_one_eyed' => $request->boolean('is_one_eyed'),
                'is_diabetic' => $request->boolean('is_diabetic'),
                'is_cardiac' => $request->boolean('is_cardiac'),
                'is_asthmatic' => $request->boolean('is_asthmatic'),
                'is_hypertensive' => $request->boolean('is_hypertensive'),
                'is_thyroid' => $request->boolean('is_thyroid'),
                'other_conditions' => $request->other_conditions,
                'drugs_used' => $request->drugs_used,
            ];

            // Create new vision test
            $visionTest = VisionTest::create($visionTestData);

            Log::info('New vision test created successfully', [
                'vision_test_id' => $visionTest->id,
                'patient_id' => $patient->id,
                'visit_id' => $visit->id,
            ]);

            // Complete vision test for the visit
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

            // Create appointment
            $appointment = Appointment::create($appointmentData);

            if ($appointment) {
                Log::info('Appointment created successfully', [
                    'appointment_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'doctor_id' => $visit->selected_doctor_id,
                    'serial_number' => $serialNumberFormatted,
                ]);

                // Load the doctor relationship for return
                $appointment->load('doctor.user');
                return $appointment;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Exception during appointment creation', [
                'error' => $e->getMessage(),
                'patient_id' => $patient->id,
                'visit_id' => $visit->id,
                'selected_doctor_id' => $visit->selected_doctor_id,
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
            'complains' => 'nullable|string|max:1000',
            'right_eye_diagnosis' => 'nullable|string|max:500',
            'left_eye_diagnosis' => 'nullable|string|max:500',
            'right_eye_lids' => 'nullable|string|max:500',
            'left_eye_lids' => 'nullable|string|max:500',
            'right_eye_conjunctiva' => 'nullable|string|max:500',
            'left_eye_conjunctiva' => 'nullable|string|max:500',
            'right_eye_cornea' => 'nullable|string|max:500',
            'left_eye_cornea' => 'nullable|string|max:500',
            'right_eye_anterior_chamber' => 'nullable|string|max:500',
            'left_eye_anterior_chamber' => 'nullable|string|max:500',
            'right_eye_iris' => 'nullable|string|max:500',
            'left_eye_iris' => 'nullable|string|max:500',
            'right_eye_pupil' => 'nullable|string|max:500',
            'left_eye_pupil' => 'nullable|string|max:500',
            'right_eye_lens' => 'nullable|string|max:500',
            'left_eye_lens' => 'nullable|string|max:500',
            'right_eye_ocular_movements' => 'nullable|string|max:500',
            'left_eye_ocular_movements' => 'nullable|string|max:500',
            'right_eye_vision_without_glass' => 'nullable|string|max:20',
            'left_eye_vision_without_glass' => 'nullable|string|max:20',
            'right_eye_vision_with_glass' => 'nullable|string|max:20',
            'left_eye_vision_with_glass' => 'nullable|string|max:20',
            'right_eye_iop' => 'nullable|string|max:20',
            'left_eye_iop' => 'nullable|string|max:20',
            'right_eye_ducts' => 'nullable|string|max:500',
            'left_eye_ducts' => 'nullable|string|max:500',
            'blood_pressure' => 'nullable|string|max:20',
            'urine_sugar' => 'nullable|string|max:20',
            'blood_sugar' => 'nullable|string|max:20',
            'right_eye_fundus' => 'nullable|string|max:1000',
            'left_eye_fundus' => 'nullable|string|max:1000',
            'detailed_history' => 'nullable|string|max:2000',
            'is_one_eyed' => 'boolean',
            'is_diabetic' => 'boolean',
            'is_cardiac' => 'boolean',
            'is_asthmatic' => 'boolean',
            'is_hypertensive' => 'boolean',
            'is_thyroid' => 'boolean',
            'other_conditions' => 'nullable|string|max:500',
            'drugs_used' => 'nullable|string|max:1000',
        ]);

        $visionTest->update($request->only([
            'complains',
            'right_eye_diagnosis',
            'left_eye_diagnosis',
            'right_eye_lids',
            'left_eye_lids',
            'right_eye_conjunctiva',
            'left_eye_conjunctiva',
            'right_eye_cornea',
            'left_eye_cornea',
            'right_eye_anterior_chamber',
            'left_eye_anterior_chamber',
            'right_eye_iris',
            'left_eye_iris',
            'right_eye_pupil',
            'left_eye_pupil',
            'right_eye_lens',
            'left_eye_lens',
            'right_eye_ocular_movements',
            'left_eye_ocular_movements',
            'right_eye_vision_without_glass',
            'left_eye_vision_without_glass',
            'right_eye_vision_with_glass',
            'left_eye_vision_with_glass',
            'right_eye_iop',
            'left_eye_iop',
            'right_eye_ducts',
            'left_eye_ducts',
            'blood_pressure',
            'urine_sugar',
            'blood_sugar',
            'right_eye_fundus',
            'left_eye_fundus',
            'detailed_history',
            'is_one_eyed',
            'is_diabetic',
            'is_cardiac',
            'is_asthmatic',
            'is_hypertensive',
            'is_thyroid',
            'other_conditions',
            'drugs_used',
        ]));

        Log::info('Vision test updated', [
            'vision_test_id' => $visionTest->id,
            'updated_by' => auth()->id(),
        ]);

        return redirect()->route('visiontests.show', $id)
            ->with('success', 'Vision test updated successfully!');
    }

    /**
     * Print the vision test report (TSX version)
     */
    public function print($id)
    {
        $visionTest = VisionTest::with(['patient', 'performedBy'])
            ->findOrFail($id);

        // Prepare QR code base64 for frontend
        $qrCodeBase64 = null;
        if ($visionTest->patient->qr_code_image_path) {
            $qrImagePath = storage_path('app/public/' . $visionTest->patient->qr_code_image_path);

            if (file_exists($qrImagePath)) {
                $imageData = file_get_contents($qrImagePath);
                if ($imageData) {
                    $qrCodeBase64 = base64_encode($imageData);
                }
            }
        }

        // Render TSX print page instead of PDF
        return Inertia::render('VisionTests/Print', [
            'visionTest' => [
                'id' => $visionTest->id,
                'test_date' => $visionTest->test_date,
                'complains' => $visionTest->complains,
                'right_eye_diagnosis' => $visionTest->right_eye_diagnosis,
                'left_eye_diagnosis' => $visionTest->left_eye_diagnosis,
                'right_eye_lids' => $visionTest->right_eye_lids,
                'left_eye_lids' => $visionTest->left_eye_lids,
                'right_eye_conjunctiva' => $visionTest->right_eye_conjunctiva,
                'left_eye_conjunctiva' => $visionTest->left_eye_conjunctiva,
                'right_eye_cornea' => $visionTest->right_eye_cornea,
                'left_eye_cornea' => $visionTest->left_eye_cornea,
                'right_eye_anterior_chamber' => $visionTest->right_eye_anterior_chamber,
                'left_eye_anterior_chamber' => $visionTest->left_eye_anterior_chamber,
                'right_eye_iris' => $visionTest->right_eye_iris,
                'left_eye_iris' => $visionTest->left_eye_iris,
                'right_eye_pupil' => $visionTest->right_eye_pupil,
                'left_eye_pupil' => $visionTest->left_eye_pupil,
                'right_eye_lens' => $visionTest->right_eye_lens,
                'left_eye_lens' => $visionTest->left_eye_lens,
                'right_eye_ocular_movements' => $visionTest->right_eye_ocular_movements,
                'left_eye_ocular_movements' => $visionTest->left_eye_ocular_movements,
                'right_eye_vision_without_glass' => $visionTest->right_eye_vision_without_glass,
                'left_eye_vision_without_glass' => $visionTest->left_eye_vision_without_glass,
                'right_eye_vision_with_glass' => $visionTest->right_eye_vision_with_glass,
                'left_eye_vision_with_glass' => $visionTest->left_eye_vision_with_glass,
                'right_eye_iop' => $visionTest->right_eye_iop,
                'left_eye_iop' => $visionTest->left_eye_iop,
                'right_eye_ducts' => $visionTest->right_eye_ducts,
                'left_eye_ducts' => $visionTest->left_eye_ducts,
                'blood_pressure' => $visionTest->blood_pressure,
                'urine_sugar' => $visionTest->urine_sugar,
                'blood_sugar' => $visionTest->blood_sugar,
                'right_eye_fundus' => $visionTest->right_eye_fundus,
                'left_eye_fundus' => $visionTest->left_eye_fundus,
                'detailed_history' => $visionTest->detailed_history,
                'is_one_eyed' => $visionTest->is_one_eyed,
                'is_diabetic' => $visionTest->is_diabetic,
                'is_cardiac' => $visionTest->is_cardiac,
                'is_asthmatic' => $visionTest->is_asthmatic,
                'is_hypertensive' => $visionTest->is_hypertensive,
                'is_thyroid' => $visionTest->is_thyroid,
                'other_conditions' => $visionTest->other_conditions,
                'drugs_used' => $visionTest->drugs_used,
                'patient' => [
                    'id' => $visionTest->patient->id,
                    'patient_id' => $visionTest->patient->patient_id,
                    'name' => $visionTest->patient->name,
                    'phone' => $visionTest->patient->phone,
                    'address' => $visionTest->patient->address,
                    'date_of_birth' => $visionTest->patient->date_of_birth,
                    'gender' => $visionTest->patient->gender,
                    'age' => $visionTest->patient->date_of_birth ?
                        \Carbon\Carbon::parse($visionTest->patient->date_of_birth)->age : null,
                ],
                'performedBy' => [
                    'name' => $visionTest->performedBy->name ?? 'N/A',
                ]
            ],
            'qrCodeBase64' => $qrCodeBase64,
            'hospitalInfo' => [
                'name' => 'নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার',
                'address' => 'সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ।',
                'contact' => 'মোবাইল: ০১৩০৭-৮৮৫৫৬৬; ইমেইল: niehpc@gmail.com'
            ]

        ]);
    }

    /**
     * Download blank vision test report (TSX version)
     */
    public function downloadBlankReport(Patient $patient)
    {
        // Find the active visit
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
            return back()->withErrors([
                'error' => 'No active visit found for this patient.'
            ]);
        }

        // Prepare QR code base64 for frontend
        $qrCodeBase64 = null;
        if ($patient->qr_code_image_path) {
            $qrImagePath = storage_path('app/public/' . $patient->qr_code_image_path);
            if (file_exists($qrImagePath)) {
                $imageData = file_get_contents($qrImagePath);
                if ($imageData) {
                    $qrCodeBase64 = base64_encode($imageData);
                }
            }
        }

        // Render TSX print page with blank data
        return Inertia::render('VisionTests/Print', [
            'visionTest' => [
                'id' => 'DEMO',
                'test_date' => now(),
                'complains' => '',
                'right_eye_diagnosis' => '',
                'left_eye_diagnosis' => '',
                'right_eye_lids' => '',
                'left_eye_lids' => '',
                'right_eye_conjunctiva' => '',
                'left_eye_conjunctiva' => '',
                'right_eye_cornea' => '',
                'left_eye_cornea' => '',
                'right_eye_anterior_chamber' => '',
                'left_eye_anterior_chamber' => '',
                'right_eye_iris' => '',
                'left_eye_iris' => '',
                'right_eye_pupil' => '',
                'left_eye_pupil' => '',
                'right_eye_lens' => '',
                'left_eye_lens' => '',
                'right_eye_ocular_movements' => '',
                'left_eye_ocular_movements' => '',
                'right_eye_vision_without_glass' => '',
                'left_eye_vision_without_glass' => '',
                'right_eye_vision_with_glass' => '',
                'left_eye_vision_with_glass' => '',
                'right_eye_iop' => '',
                'left_eye_iop' => '',
                'right_eye_ducts' => '',
                'left_eye_ducts' => '',
                'blood_pressure' => '',
                'urine_sugar' => '',
                'blood_sugar' => '',
                'right_eye_fundus' => '',
                'left_eye_fundus' => '',
                'detailed_history' => '',
                'is_one_eyed' => false,
                'is_diabetic' => false,
                'is_cardiac' => false,
                'is_asthmatic' => false,
                'is_hypertensive' => false,
                'is_thyroid' => false,
                'other_conditions' => '',
                'drugs_used' => '',
                'patient' => [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                    'address' => $patient->address,
                    'date_of_birth' => $patient->date_of_birth,
                    'gender' => $patient->gender,
                    'age' => $patient->date_of_birth ?
                        \Carbon\Carbon::parse($patient->date_of_birth)->age : null,
                ],
                'performedBy' => [
                    'name' => auth()->user()->name ?? 'N/A',
                ]
            ],
            'qrCodeBase64' => $qrCodeBase64,
            'isBlankReport' => true,
            'hospitalInfo' => [
                'name' => 'নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার',
                'address' => 'সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ।',
                'contact' => 'মোবাইল: ০১৩০৭-৮৮৫৫৬৬; ইমেইল: niehpc@gmail.com'
            ]

        ]);
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
                'Complains',
                'Right Eye Vision (No Glass)',
                'Left Eye Vision (No Glass)',
                'Right Eye Vision (With Glass)',
                'Left Eye Vision (With Glass)',
                'Right Eye IOP',
                'Left Eye IOP',
                'Blood Pressure',
                'Performed By',
                'Diagnosis'
            ]);

            // CSV Data
            foreach ($visionTests as $test) {
                fputcsv($file, [
                    $test->test_date->format('Y-m-d H:i'),
                    $test->patient->name,
                    $test->patient->patient_id,
                    $test->patient->phone,
                    $test->complains,
                    $test->right_eye_vision_without_glass,
                    $test->left_eye_vision_without_glass,
                    $test->right_eye_vision_with_glass,
                    $test->left_eye_vision_with_glass,
                    $test->right_eye_iop,
                    $test->left_eye_iop,
                    $test->blood_pressure,
                    $test->performedBy->name ?? 'Unknown',
                    $test->right_eye_diagnosis . ' | ' . $test->left_eye_diagnosis,
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
