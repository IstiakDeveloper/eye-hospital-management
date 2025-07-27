<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\PatientPayment;
use App\Models\Doctor;
use App\Models\PaymentMethod;
use App\Models\PatientInvoice;
use App\Models\InvoiceItem;
use App\Models\Prescription;
use App\Models\VisionTest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PatientController extends Controller
{
    /**
     * Display patient listing with search and filters
     */
    public function index(Request $request)
    {
        $query = Patient::query()->with('registeredBy');

        // Search functionality
        if ($request->filled('search')) {
            $searchTerm = $request->get('search');

            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('phone', 'like', "%{$searchTerm}%")
                    ->orWhere('nid_card', 'like', "%{$searchTerm}%")
                    ->orWhere('patient_id', 'like', "%{$searchTerm}%")
                    ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        // Filter by gender if provided
        if ($request->filled('gender')) {
            $query->where('gender', $request->get('gender'));
        }

        // Sort by created_at descending by default
        $patients = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Patients/Index', [
            'patients' => $patients,
            'filters' => $request->only(['search', 'gender']),
        ]);
    }

    /**
     * Show registration form
     */
    public function create()
    {
        $doctors = Doctor::with('user')
            ->where('is_available', true)
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->user ? $doctor->user->name : 'Unknown Doctor',
                    'specialization' => $doctor->specialization ?? 'General',
                    'consultation_fee' => $doctor->consultation_fee ?? 0,
                ];
            });

        $paymentMethods = PaymentMethod::where('is_active', true)->get();

        return Inertia::render('Patients/Create', [
            'doctors' => $doctors,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    /**
     * Store new patient registration or create new visit for existing patient
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'nid_card' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other',
            'medical_history' => 'nullable|string',
            'chief_complaint' => 'nullable|string|max:500',
            'selected_doctor_id' => 'nullable|exists:doctors,id',
            'discount_type' => 'nullable|in:percentage,amount',
            'discount_value' => 'nullable|numeric|min:0',
            'payment_amount' => 'required|numeric|min:0',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // Check if patient already exists by phone
                $existingPatient = Patient::where('phone', $request->phone)->first();

                // Check NID uniqueness if provided
                if ($request->nid_card) {
                    $nidPatient = Patient::where('nid_card', $request->nid_card)->first();
                    if ($nidPatient && (!$existingPatient || $nidPatient->id !== $existingPatient->id)) {
                        throw new \Exception('Patient with this NID already exists.');
                    }
                }

                if ($existingPatient) {
                    // Check if patient has active visit
                    $activeVisit = $existingPatient->visits()
                        ->whereNotIn('overall_status', ['completed'])
                        ->first();

                    if ($activeVisit) {
                        throw new \Exception('This patient already has an active visit. Please complete the current visit first.');
                    }

                    $patient = $existingPatient;
                    $message = 'New visit created for existing patient!';
                } else {
                    // Create new patient
                    $patient = Patient::create([
                        'name' => $request->name,
                        'phone' => $request->phone,
                        'nid_card' => $request->nid_card,
                        'email' => $request->email,
                        'address' => $request->address,
                        'date_of_birth' => $request->date_of_birth,
                        'gender' => $request->gender,
                        'medical_history' => $request->medical_history,
                        'registered_by' => auth()->id(),
                    ]);
                    $message = 'New patient registered successfully!';
                }

                // Create new visit
                $visit = PatientVisit::create([
                    'patient_id' => $patient->id,
                    'selected_doctor_id' => $request->selected_doctor_id,
                    'discount_type' => $request->discount_type,
                    'discount_value' => $request->discount_value ?? 0,
                    'chief_complaint' => $request->chief_complaint,
                    'created_by' => auth()->id(),
                ]);

                // Process payment if amount provided
                if ($request->payment_amount > 0) {
                    $payment = PatientPayment::create([
                        'patient_id' => $patient->id,
                        'visit_id' => $visit->id,
                        'amount' => $request->payment_amount,
                        'payment_method_id' => 1, // Cash
                        'payment_date' => today(),
                        'notes' => 'Visit registration payment',
                        'received_by' => auth()->id(),
                    ]);

                    // Update visit totals
                    $visit->updateTotals();

                    // Force refresh from database to get updated values
                    $visit->refresh();

                    // Check if visit is fully paid and manually update if needed
                    if ($visit->total_due <= 0 && $visit->payment_status !== 'paid') {
                        $visit->update([
                            'payment_status' => 'paid',
                            'overall_status' => 'vision_test',
                            'payment_completed_at' => now(),
                        ]);
                    }
                }

                return redirect()->route('patients.receipt', $patient)
                    ->with('success', $message);
            });
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Registration failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Show patient details with visits
     */
    /**
     * Show patient details with visits
     */
    public function show(Patient $patient)
    {
        // Load patient with all necessary relationships
        $patient->load([
            'registeredBy',
            'visits' => function ($query) {
                $query->orderBy('created_at', 'desc')
                    ->with([
                        'selectedDoctor',
                        'createdBy',
                        'visionTests' => function ($visionQuery) {
                            $visionQuery->with('performedBy')
                                ->orderBy('test_date', 'desc');
                        },
                        'prescriptions' => function ($prescQuery) {
                            $prescQuery->with(['doctor', 'createdBy'])
                                ->orderBy('created_at', 'desc');
                        },
                        'payments' => function ($paymentQuery) {
                            $paymentQuery->with(['paymentMethod', 'receivedBy'])
                                ->orderBy('payment_date', 'desc');
                        }
                    ]);
            }
        ]);

        // Calculate summary statistics
        $totalVisits = $patient->visits->count();
        $completedVisits = $patient->visits->where('overall_status', 'completed')->count();
        $pendingVisits = $patient->visits->where('overall_status', '!=', 'completed')->count();
        $totalPaid = $patient->visits->sum('total_paid');
        $totalDue = $patient->visits->sum('total_due');

        // Get all vision tests for this patient (including those without visit_id)
        $allVisionTests = VisionTest::where('patient_id', $patient->id)
            ->with(['performedBy'])
            ->orderBy('test_date', 'desc')
            ->get();



        // Get all prescriptions for this patient (including those without visit_id)
        $allPrescriptions = Prescription::where('patient_id', $patient->id)
            ->with(['doctor', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->get();
        // Attach vision tests and prescriptions to visits if visit_id exists
        // Otherwise, keep them as standalone items
        foreach ($patient->visits as $visit) {
            // Get vision tests for this specific visit
            $visitVisionTests = $allVisionTests->where('visit_id', $visit->id);
            $visit->visionTests = $visitVisionTests->values();

            // Get prescriptions for this specific visit
            $visitPrescriptions = $allPrescriptions->where('visit_id', $visit->id);
            $visit->prescriptions = $visitPrescriptions->values();
        }

        // Get standalone vision tests and prescriptions (those without visit_id)
        $standaloneVisionTests = $allVisionTests->whereNull('visit_id');
        $standalonePrescriptions = $allPrescriptions->whereNull('visit_id');

        // dd([
        //     'patient' => $patient,
        //     'statistics' => [
        //         'total_visits' => $totalVisits,
        //         'completed_visits' => $completedVisits,
        //         'pending_visits' => $pendingVisits,
        //         'total_paid' => $totalPaid,
        //         'total_due' => $totalDue,
        //     ],
        //     'standalone_vision_tests' => $standaloneVisionTests,
        //     'standalone_prescriptions' => $standalonePrescriptions,
        //     'all_vision_tests' => $allVisionTests,
        //     'all_prescriptions' => $allPrescriptions,
        // ]);
        return Inertia::render('Patients/Show', [
            'patient' => $patient,
            'statistics' => [
                'total_visits' => $totalVisits,
                'completed_visits' => $completedVisits,
                'pending_visits' => $pendingVisits,
                'total_paid' => $totalPaid,
                'total_due' => $totalDue,
            ],
            'standalone_vision_tests' => $standaloneVisionTests,
            'standalone_prescriptions' => $standalonePrescriptions,
            'all_vision_tests' => $allVisionTests,
            'all_prescriptions' => $allPrescriptions,
        ]);
    }

    /**
     * Show patient receipt
     */
    public function receipt(Patient $patient)
    {
        $latestVisit = $patient->visits()->with([
            'selectedDoctor.user',
            'payments' => function ($query) {
                $query->latest();
            }
        ])->latest()->first();

        $latestPayment = $latestVisit ? $latestVisit->payments->first() : null;

        return Inertia::render('Patients/Receipt', [
            'patient' => $patient,
            'visit' => $latestVisit,
            'payment' => $latestPayment,
            'csrfToken' => csrf_token(),
        ]);
    }

    /**
     * Show specific visit receipt
     */
    public function visitReceipt(Patient $patient, PatientVisit $visit)
    {
        $visit->load([
            'selectedDoctor.user',
            'payments' => function ($query) {
                $query->latest();
            }
        ]);

        $latestPayment = $visit->payments->first();

        return Inertia::render('Patients/VisitReceipt', [
            'patient' => $patient,
            'visit' => $visit,
            'payment' => $latestPayment,
        ]);
    }

    /**
     * Update patient information
     */
    public function update(Request $request, Patient $patient)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:patients,phone,' . $patient->id,
            'nid_card' => 'nullable|string|max:20|unique:patients,nid_card,' . $patient->id,
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other',
            'medical_history' => 'nullable|string',
        ]);

        $patient->update($request->only([
            'name',
            'phone',
            'nid_card',
            'email',
            'address',
            'date_of_birth',
            'gender',
            'medical_history'
        ]));

        return back()->with('success', 'Patient information updated successfully!');
    }

    /**
     * Process additional payment for a visit
     */
    public function processPayment(Request $request, Patient $patient)
    {
        $request->validate([
            'visit_id' => 'required|exists:patient_visits,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'notes' => 'nullable|string|max:255',
        ]);

        try {
            return DB::transaction(function () use ($request, $patient) {
                $visit = PatientVisit::findOrFail($request->visit_id);

                // Verify visit belongs to patient
                if ($visit->patient_id !== $patient->id) {
                    throw new \Exception('Visit does not belong to this patient.');
                }

                // Create payment
                $payment = PatientPayment::create([
                    'patient_id' => $patient->id,
                    'visit_id' => $visit->id,
                    'amount' => $request->amount,
                    'payment_method_id' => $request->payment_method_id,
                    'payment_date' => today(),
                    'notes' => $request->notes ?? 'Additional payment',
                    'received_by' => auth()->id(),
                ]);

                // Update visit totals
                $visit->updateTotals();

                // Check if visit is now fully paid
                if ($visit->total_due <= 0 && $visit->payment_status !== 'paid') {
                    $visit->completePayment();
                }

                return back()->with('success', 'Payment processed successfully!');
            });
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Payment failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Calculate costs for registration
     */
    public function calculateCosts(Request $request)
    {
        $request->validate([
            'doctor_id' => 'nullable|exists:doctors,id',
            'discount_type' => 'nullable|in:percentage,amount',
            'discount_value' => 'nullable|numeric|min:0',
        ]);

        $registrationFee = 200.00;
        $doctorFee = 0;

        if ($request->doctor_id) {
            $doctor = Doctor::find($request->doctor_id);
            $doctorFee = $doctor ? $doctor->consultation_fee : 0;
        }

        $totalAmount = $registrationFee + $doctorFee;
        $discountAmount = 0;

        if ($request->discount_value > 0) {
            if ($request->discount_type === 'percentage') {
                $discountAmount = ($totalAmount * $request->discount_value) / 100;
            } else {
                $discountAmount = min($request->discount_value, $totalAmount);
            }
        }

        $finalAmount = $totalAmount - $discountAmount;

        return response()->json([
            'registration_fee' => $registrationFee,
            'doctor_fee' => $doctorFee,
            'total_amount' => $totalAmount,
            'discount_amount' => $discountAmount,
            'final_amount' => $finalAmount,
        ]);
    }

    /**
     * Search patients for autocomplete
     */
    public function search(Request $request)
    {
        $request->validate(['term' => 'required|string|min:2']);

        $patients = Patient::where('name', 'like', '%' . $request->term . '%')
            ->orWhere('phone', 'like', '%' . $request->term . '%')
            ->orWhere('patient_id', 'like', '%' . $request->term . '%')
            ->orWhere('nid_card', 'like', '%' . $request->term . '%')
            ->with(['visits' => function ($q) {
                $q->latest()->limit(1);
            }])
            ->limit(10)
            ->get()
            ->map(function ($patient) {
                $latestVisit = $patient->visits->first();
                return [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                    'nid_card' => $patient->nid_card,
                    'has_active_visit' => $latestVisit && $latestVisit->overall_status !== 'completed',
                    'latest_visit_status' => $latestVisit ? $latestVisit->overall_status : null,
                    'created_at' => $patient->created_at,
                ];
            });

        return response()->json($patients);
    }

    /**
     * Get patients ready for vision test
     */
    public function readyForVisionTest()
    {
        $visits = PatientVisit::readyForVisionTest()
            ->with(['patient', 'selectedDoctor.user'])
            ->orderBy('payment_completed_at', 'asc')
            ->paginate(15);

        return Inertia::render('Patients/ReadyForVisionTest', [
            'visits' => $visits,
        ]);
    }

    /**
     * Get registration dashboard stats
     */
    public function getRegistrationStats()
    {
        $today = today();

        $stats = [
            'today_registrations' => PatientVisit::whereDate('created_at', $today)->count(),
            'today_new_patients' => Patient::whereDate('created_at', $today)->count(),
            'pending_payments' => PatientVisit::where('payment_status', 'pending')->count(),
            'completed_visits' => PatientVisit::where('overall_status', 'completed')->count(),
            'total_revenue_today' => PatientPayment::whereDate('payment_date', $today)->sum('amount'),
            'pending_revenue' => PatientVisit::where('payment_status', '!=', 'paid')->sum('total_due'),
            'active_visits' => PatientVisit::whereNotIn('overall_status', ['completed'])->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Mark visit as ready for vision test (manual override)
     */
    public function markReadyForVisionTest(PatientVisit $visit)
    {
        if ($visit->payment_status !== 'paid') {
            return back()->withErrors(['error' => 'Visit payment must be completed first']);
        }

        $visit->update([
            'overall_status' => 'vision_test',
            'vision_test_status' => 'pending'
        ]);

        return back()->with('success', 'Visit marked as ready for vision test!');
    }

    /**
     * Get patient visits history
     */
    public function visits(Patient $patient)
    {
        $visits = $patient->visits()
            ->with(['selectedDoctor.user', 'payments', 'visionTests'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Patients/Visits', [
            'patient' => $patient,
            'visits' => $visits,
        ]);
    }

    /**
     * Create return visit for existing patient
     */
    public function createReturnVisit(Patient $patient)
    {
        // Check if patient has active visit
        $activeVisit = $patient->visits()
            ->whereNotIn('overall_status', ['completed'])
            ->first();

        if ($activeVisit) {
            return back()->withErrors(['error' => 'Patient has an active visit. Complete current visit first.']);
        }

        $doctors = Doctor::with('user')
            ->where('is_available', true)
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->user ? $doctor->user->name : 'Unknown Doctor',
                    'specialization' => $doctor->specialization ?? 'General',
                    'consultation_fee' => $doctor->consultation_fee ?? 0,
                ];
            });

        $paymentMethods = PaymentMethod::where('is_active', true)->get();

        return Inertia::render('Patients/ReturnVisit', [
            'patient' => $patient,
            'doctors' => $doctors,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    /**
     * Store return visit
     */
    public function storeReturnVisit(Request $request, Patient $patient)
    {
        $request->validate([
            'chief_complaint' => 'required|string|max:500',
            'selected_doctor_id' => 'nullable|exists:doctors,id',
            'discount_type' => 'nullable|in:percentage,amount',
            'discount_value' => 'nullable|numeric|min:0',
            'payment_amount' => 'required|numeric|min:0',
        ]);

        try {
            return DB::transaction(function () use ($request, $patient) {
                // Check if patient has active visit
                $activeVisit = $patient->visits()
                    ->whereNotIn('overall_status', ['completed'])
                    ->first();

                if ($activeVisit) {
                    throw new \Exception('Patient has an active visit. Complete current visit first.');
                }

                // Create new visit
                $visit = PatientVisit::create([
                    'patient_id' => $patient->id,
                    'selected_doctor_id' => $request->selected_doctor_id,
                    'discount_type' => $request->discount_type,
                    'discount_value' => $request->discount_value ?? 0,
                    'chief_complaint' => $request->chief_complaint,
                    'created_by' => auth()->id(),
                ]);

                // Process payment
                if ($request->payment_amount > 0) {
                    PatientPayment::create([
                        'patient_id' => $patient->id,
                        'visit_id' => $visit->id,
                        'amount' => $request->payment_amount,
                        'payment_method_id' => 1, // Cash
                        'payment_date' => today(),
                        'notes' => 'Return visit payment',
                        'received_by' => auth()->id(),
                    ]);

                    // Update visit totals
                    $visit->updateTotals();

                    // Check if visit is fully paid
                    if ($visit->total_due <= 0) {
                        $visit->completePayment();
                    }
                }

                return redirect()->route('patients.receipt', $patient)
                    ->with('success', 'Return visit created successfully!');
            });
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Return visit creation failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Print patient information
     */
    public function print(Patient $patient)
    {
        $patient->load([
            'visits' => function ($query) {
                $query->with(['selectedDoctor.user', 'payments', 'visionTests'])
                    ->orderBy('created_at', 'desc');
            },
            'visionTests' => function ($query) {
                $query->orderBy('test_date', 'desc');
            }
        ]);

        return Inertia::render('Patients/Print', [
            'patient' => $patient,
        ]);
    }
}
