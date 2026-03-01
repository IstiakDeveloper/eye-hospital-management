<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\HospitalAccount;
use App\Models\Patient;
use App\Models\PatientPayment;
use App\Models\PatientVisit;
use App\Models\PaymentMethod;
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
        $user = auth()->user();
        $query = Patient::query()->with('registeredBy');

        // If user is a doctor, only show their associated patients
        if ($user->role->name == 'Doctor' && $user->doctor) {
            $query->where(function ($q) use ($user) {
                $q->whereHas('visits', function ($visitQuery) use ($user) {
                    $visitQuery->where('selected_doctor_id', $user->doctor->id);
                })
                    ->orWhereHas('prescriptions', function ($prescriptionQuery) use ($user) {
                        $prescriptionQuery->where('doctor_id', $user->doctor->id);
                    })
                    ->orWhereHas('appointments', function ($appointmentQuery) use ($user) {
                        $appointmentQuery->where('doctor_id', $user->doctor->id);
                    });
            });
        }

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

        // Date filtering functionality
        if ($request->filled('date_filter_type')) {
            $dateFilterType = $request->get('date_filter_type');
            $dateField = $request->get('date_field', 'created_at');

            switch ($dateFilterType) {
                case 'specific':
                    if ($request->filled('specific_date')) {
                        $specificDate = $request->get('specific_date');
                        $query->whereDate($dateField, $specificDate);
                    }
                    break;

                case 'range':
                    if ($request->filled('start_date')) {
                        $startDate = $request->get('start_date');
                        $query->whereDate($dateField, '>=', $startDate);
                    }
                    if ($request->filled('end_date')) {
                        $endDate = $request->get('end_date');
                        $query->whereDate($dateField, '<=', $endDate);
                    }
                    break;

                case 'preset':
                    $preset = $request->get('date_preset');
                    $now = now();

                    switch ($preset) {
                        case 'today':
                            $query->whereDate($dateField, $now->toDateString());
                            break;
                        case 'yesterday':
                            $query->whereDate($dateField, $now->subDay()->toDateString());
                            break;
                        case 'this_week':
                            $query->whereBetween($dateField, [
                                $now->startOfWeek()->toDateString(),
                                $now->endOfWeek()->toDateString(),
                            ]);
                            break;
                        case 'last_week':
                            $lastWeekStart = $now->subWeek()->startOfWeek();
                            $lastWeekEnd = $now->endOfWeek();
                            $query->whereBetween($dateField, [
                                $lastWeekStart->toDateString(),
                                $lastWeekEnd->toDateString(),
                            ]);
                            break;
                        case 'this_month':
                            $query->whereMonth($dateField, $now->month)
                                ->whereYear($dateField, $now->year);
                            break;
                        case 'last_month':
                            $lastMonth = $now->subMonth();
                            $query->whereMonth($dateField, $lastMonth->month)
                                ->whereYear($dateField, $lastMonth->year);
                            break;
                        case 'this_year':
                            $query->whereYear($dateField, $now->year);
                            break;
                        case 'last_7_days':
                            $query->whereDate($dateField, '>=', $now->subDays(7)->toDateString());
                            break;
                        case 'last_30_days':
                            $query->whereDate($dateField, '>=', $now->subDays(30)->toDateString());
                            break;
                        case 'last_90_days':
                            $query->whereDate($dateField, '>=', $now->subDays(90)->toDateString());
                            break;
                    }
                    break;
            }
        }

        // Get patients with visits and calculate totals
        $patients = $query->with(['visits' => function ($q) {
            $q->with(['selectedDoctor', 'payments']);
        }])
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Add calculated fields to each patient
        $patients->getCollection()->transform(function ($patient) {
            // Calculate total paid
            $totalPaid = $patient->visits->sum('total_paid');

            // Get most recent doctor (from latest visit)
            $latestVisit = $patient->visits->sortByDesc('created_at')->first();
            $lastDoctor = $latestVisit && $latestVisit->selectedDoctor
                ? $latestVisit->selectedDoctor->name
                : null;

            // Get all unique doctors this patient has visited
            $allDoctors = $patient->visits
                ->filter(fn ($v) => $v->selectedDoctor)
                ->pluck('selectedDoctor.name')
                ->unique()
                ->values();

            $patient->total_paid = $totalPaid;
            $patient->last_doctor = $lastDoctor;
            $patient->all_doctors = $allDoctors;
            $patient->total_visits = $patient->visits->count();

            return $patient;
        });

        return Inertia::render('Patients/Index', [
            'patients' => $patients,
            'filters' => $request->only([
                'search',
                'gender',
                'date_filter_type',
                'date_field',
                'specific_date',
                'start_date',
                'end_date',
                'date_preset',
            ]),
            'userRole' => $user->role,
            'isDoctorView' => $user->role->name === 'Doctor',
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
            'nid_card' => 'nullable|string|max:20|unique:patients,nid_card',
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
                // Create new patient every time (no phone check)
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
                if ($request->payment_amount >= 0) {
                    $payment = PatientPayment::create([
                        'patient_id' => $patient->id,
                        'visit_id' => $visit->id,
                        'amount' => $request->payment_amount,
                        'payment_method_id' => 1, // Cash
                        'payment_date' => today(),
                        'notes' => 'Visit registration payment',
                        'received_by' => auth()->id(),
                    ]);

                    // ✅ ADD TO HOSPITAL ACCOUNT with OPD Income category
                    $opdCategory = \App\Models\HospitalIncomeCategory::firstOrCreate(
                        ['name' => 'OPD Income'],
                        ['is_active' => true]
                    );

                    $hospitalTransaction = HospitalAccount::addIncome(
                        $request->payment_amount,
                        'OPD Income',
                        "Visit payment from Patient: {$patient->name} (ID: {$patient->patient_id})",
                        'patient_payments',
                        $payment->id,
                        null,
                        $opdCategory->id
                    );

                    // Link payment to hospital transaction
                    $payment->update(['hospital_transaction_id' => $hospitalTransaction->id]);

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
            return back()->withErrors(['error' => 'Registration failed: '.$e->getMessage()]);
        }
    }

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
                        },
                    ]);
            },
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
            },
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
            },
        ]);

        $latestPayment = $visit->payments->first();

        return Inertia::render('Patients/VisitReceipt', [
            'patient' => $patient,
            'visit' => $visit,
            'payment' => $latestPayment,
        ]);
    }

    /**
     * Show edit form for patient
     */
    public function edit(Patient $patient)
    {
        return Inertia::render('Patients/Edit', [
            'patient' => $patient,
        ]);
    }

    /**
     * Update patient information
     */
    public function update(Request $request, Patient $patient)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:patients,phone,'.$patient->id,
            'nid_card' => 'nullable|string|max:20|unique:patients,nid_card,'.$patient->id,
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
            'medical_history',
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
            return back()->withErrors(['error' => 'Payment failed: '.$e->getMessage()]);
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

        $registrationFee = 0; // No registration fee
        $doctorFee = 0;

        if ($request->doctor_id) {
            $doctor = Doctor::find($request->doctor_id);
            $doctorFee = $doctor ? $doctor->consultation_fee : 0;
        }

        $totalAmount = $doctorFee; // Only doctor fee
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
     * Delete a patient and all related data, reversing financial transactions.
     * Blocked if the patient has optics sales, operation bookings, or medicine sales.
     */
    public function destroy(Patient $patient): \Illuminate\Http\RedirectResponse
    {
        $patientId = $patient->id;
        $patientName = $patient->name;

        // ── Blocking checks ──────────────────────────────────────────────────
        $opticsSalesCount = DB::table('optics_sales')
            ->where('patient_id', $patientId)
            ->count();

        $bookingsCount = DB::table('operation_bookings')
            ->where('patient_id', $patientId)
            ->count();

        $medicineSalesCount = DB::table('medicine_sales')
            ->where('patient_id', $patientId)
            ->count();

        if ($opticsSalesCount > 0 || $bookingsCount > 0 || $medicineSalesCount > 0) {
            $reasons = [];
            if ($opticsSalesCount > 0) {
                $reasons[] = "{$opticsSalesCount} optics sale(s)";
            }
            if ($bookingsCount > 0) {
                $reasons[] = "{$bookingsCount} operation booking(s)";
            }
            if ($medicineSalesCount > 0) {
                $reasons[] = "{$medicineSalesCount} medicine sale(s)";
            }

            $reason = implode(', ', $reasons);

            \Log::warning('Patient delete blocked', [
                'patient_id' => $patientId,
                'patient_name' => $patientName,
                'reason' => $reason,
            ]);

            return back()->with(
                'warning',
                "Cannot delete patient \"$patientName\" — they have {$reason}. "
                .'Please remove or reassign these records first.'
            );
        }
        // ─────────────────────────────────────────────────────────────────────

        try {
            return DB::transaction(function () use ($patientId, $patientName) {
                // Reverse hospital account transactions before deleting payments
                $payments = DB::table('patient_payments')
                    ->where('patient_id', $patientId)
                    ->whereNotNull('hospital_transaction_id')
                    ->get();

                foreach ($payments as $payment) {
                    $tx = \App\Models\HospitalTransaction::find($payment->hospital_transaction_id);
                    if ($tx) {
                        \App\Models\HospitalAccount::reversePatientPayment($tx);
                    }
                }

                // Delete deepest dependents first, then parents
                DB::table('patient_payments')->where('patient_id', $patientId)->delete();
                DB::table('vision_tests')->where('patient_id', $patientId)->delete();
                DB::table('prescriptions')->where('patient_id', $patientId)->delete();
                DB::table('patient_invoices')->where('patient_id', $patientId)->delete();
                DB::table('appointments')->where('patient_id', $patientId)->delete();

                // Medical tests (payments must go before test_groups)
                $testGroupIds = DB::table('patient_test_groups')
                    ->where('patient_id', $patientId)
                    ->pluck('id');
                if ($testGroupIds->isNotEmpty()) {
                    DB::table('patient_medical_test_payments')
                        ->whereIn('test_group_id', $testGroupIds)
                        ->delete();
                }
                DB::table('patient_medical_tests')->where('patient_id', $patientId)->delete();
                DB::table('patient_test_groups')->where('patient_id', $patientId)->delete();

                // Operations (no sales here — already blocked above)
                DB::table('operation_payments')->where('patient_id', $patientId)->delete();

                // Finally delete visits and the patient row
                DB::table('patient_visits')->where('patient_id', $patientId)->delete();
                DB::table('patients')->where('id', $patientId)->delete();

                \Log::info('Patient deleted', ['patient_id' => $patientId, 'patient_name' => $patientName]);

                return redirect()->route('patients.index')
                    ->with('success', "Patient \"{$patientName}\" and all related records deleted successfully!");
            });
        } catch (\Exception $e) {
            \Log::error('Patient deletion failed', [
                'patient_id' => $patientId,
                'patient_name' => $patientName,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Patient deletion failed: '.$e->getMessage());
        }
    }

    /**
     * Search patients for autocomplete
     */
    public function search(Request $request)
    {
        $request->validate(['term' => 'required|string|min:2']);

        $patients = Patient::where('name', 'like', '%'.$request->term.'%')
            ->orWhere('phone', 'like', '%'.$request->term.'%')
            ->orWhere('patient_id', 'like', '%'.$request->term.'%')
            ->orWhere('nid_card', 'like', '%'.$request->term.'%')
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
            'vision_test_status' => 'pending',
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
            'is_followup' => 'nullable|boolean',
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
                    'is_followup' => $request->is_followup ?? false,
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
            return back()->withErrors(['error' => 'Return visit creation failed: '.$e->getMessage()]);
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
            },
        ]);

        return Inertia::render('Patients/Print', [
            'patient' => $patient,
        ]);
    }

    /**
     * Mark visit as completed manually (for walk-in/simple cases)
     */
    public function markVisitComplete(Request $request, PatientVisit $visit)
    {
        $request->validate([
            'completion_type' => 'required|in:vision_only,prescription_only,both,simple_complete',
            'notes' => 'nullable|string|max:500',
            'skip_vision_test' => 'boolean',
            'skip_prescription' => 'boolean',
        ]);

        try {
            return DB::transaction(function () use ($request, $visit) {
                $completionType = $request->completion_type;
                $notes = $request->notes;

                // Check if visit is already completed
                if ($visit->overall_status === 'completed') {
                    return back()->with('error', 'Visit is already completed!');
                }

                switch ($completionType) {
                    case 'vision_only':
                        // Mark only vision test as completed
                        $visit->update([
                            'vision_test_status' => 'completed',
                            'vision_test_completed_at' => now(),
                            'overall_status' => $request->skip_prescription ? 'completed' : 'prescription',
                            'visit_notes' => $notes ? 'Manual Vision Test Completion: '.$notes : 'Vision test completed manually by receptionist',
                        ]);
                        break;

                    case 'prescription_only':
                        // Mark only prescription as completed
                        $visit->update([
                            'prescription_status' => 'completed',
                            'prescription_completed_at' => now(),
                            'overall_status' => 'completed',
                            'visit_notes' => $notes ? 'Manual Prescription Completion: '.$notes : 'Prescription completed manually by receptionist',
                        ]);
                        break;

                    case 'both':
                        // Mark both vision test and prescription as completed
                        $visit->update([
                            'vision_test_status' => 'completed',
                            'vision_test_completed_at' => now(),
                            'prescription_status' => 'completed',
                            'prescription_completed_at' => now(),
                            'overall_status' => 'completed',
                            'visit_notes' => $notes ? 'Manual Complete Visit: '.$notes : 'Vision test and prescription completed manually by receptionist',
                        ]);
                        break;

                    case 'simple_complete':
                        // Simple completion for walk-in or basic cases
                        $visit->update([
                            'vision_test_status' => 'completed',
                            'vision_test_completed_at' => now(),
                            'prescription_status' => 'completed',
                            'prescription_completed_at' => now(),
                            'overall_status' => 'completed',
                            'visit_notes' => $notes ? 'Simple Visit Completion: '.$notes : 'Visit completed manually - simple consultation',
                        ]);
                        break;
                }

                return back()->with('success', 'Visit status updated successfully!');
            });
        } catch (\Exception $e) {
            \Log::error('Visit completion failed: '.$e->getMessage());

            return back()->withErrors(['error' => 'Failed to update visit: '.$e->getMessage()]);
        }
    }

    /**
     * Get pending/active visits for manual management
     */
    /**
     * Get pending/active visits for manual management
     */
    public function getPendingVisits(Request $request)
    {
        $query = PatientVisit::with(['patient', 'selectedDoctor.user', 'createdBy'])
            ->where(function ($q) {
                $q->where('overall_status', '!=', 'completed')
                    ->orWhere('overall_status', 'vision_test')
                    ->orWhere('overall_status', 'prescription');
            });

        // Filter by status if provided
        if ($request->filled('status_filter')) {
            $query->where('overall_status', $request->status_filter);
        }

        // Filter by payment status
        if ($request->filled('payment_filter')) {
            $query->where('payment_status', $request->payment_filter);
        }

        // Date filtering
        if ($request->filled('date_filter')) {
            $dateFilter = $request->date_filter;
            switch ($dateFilter) {
                case 'today':
                    $query->whereDate('created_at', today());
                    break;
                case 'yesterday':
                    $query->whereDate('created_at', yesterday());
                    break;
                case 'this_week':
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'last_week':
                    $query->whereBetween('created_at', [now()->subWeek()->startOfWeek(), now()->subWeek()->endOfWeek()]);
                    break;
            }
        }

        // Get per_page value from request, default to 20, allow 10, 20, 50, 100
        $perPage = $request->get('per_page', 20);
        $allowedPerPage = [10, 20, 50, 100];

        if (! in_array($perPage, $allowedPerPage)) {
            $perPage = 20;
        }

        $visits = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Add per_page to pagination links
        $visits->appends($request->except('page'));

        return Inertia::render('Patients/PendingVisits', [
            'visits' => $visits,
            'filters' => $request->only(['status_filter', 'payment_filter', 'date_filter', 'per_page']),
            'statistics' => [
                'total_pending' => PatientVisit::where('overall_status', '!=', 'completed')->count(),
                'ready_for_vision_test' => PatientVisit::readyForVisionTest()->count(),
                'ready_for_prescription' => PatientVisit::readyForPrescription()->count(),
                'payment_pending' => PatientVisit::where('payment_status', '!=', 'paid')->count(),
            ],
        ]);
    }

    /**
     * Bulk complete visits - Fixed version
     */
    public function bulkCompleteVisits(Request $request)
    {
        // Debug logging
        \Log::info('Bulk complete request data:', $request->all());

        $request->validate([
            'visit_ids' => 'required|array|min:1',
            'visit_ids.*' => 'exists:patient_visits,id',
            'completion_type' => 'required|in:simple_complete,both',
            'bulk_notes' => 'nullable|string|max:500',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $visitIds = $request->visit_ids;
                $completionType = $request->completion_type;
                $notes = $request->bulk_notes ?: 'Bulk completion by receptionist';

                // Check if any visits are already completed
                $alreadyCompleted = PatientVisit::whereIn('id', $visitIds)
                    ->where('overall_status', 'completed')
                    ->count();

                if ($alreadyCompleted > 0) {
                    return back()->withErrors(['error' => "{$alreadyCompleted} visits are already completed!"]);
                }

                $updateData = [
                    'vision_test_status' => 'completed',
                    'vision_test_completed_at' => now(),
                    'prescription_status' => 'completed',
                    'prescription_completed_at' => now(),
                    'overall_status' => 'completed',
                    'visit_notes' => 'Bulk completion: '.$notes,
                    'updated_at' => now(),
                ];

                $updatedCount = PatientVisit::whereIn('id', $visitIds)
                    ->where('overall_status', '!=', 'completed')
                    ->update($updateData);

                if ($updatedCount === 0) {
                    return back()->withErrors(['error' => 'No visits were updated. They may already be completed.']);
                }

                return back()->with('success', "{$updatedCount} visits completed successfully!");
            });
        } catch (\Exception $e) {
            \Log::error('Bulk completion failed: '.$e->getMessage(), [
                'visit_ids' => $request->visit_ids,
                'request_data' => $request->all(),
            ]);

            return back()->withErrors(['error' => 'Bulk completion failed: '.$e->getMessage()]);
        }
    }
}
