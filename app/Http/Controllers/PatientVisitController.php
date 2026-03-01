<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\HospitalAccount;
use App\Models\HospitalTransaction;
use App\Models\Patient;
use App\Models\PatientPayment;
use App\Models\PatientVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PatientVisitController extends Controller
{
    public function index(Request $request)
    {
        $query = PatientVisit::with([
            'patient',
            'selectedDoctor.user',
            'payments.paymentMethod',
            'createdBy',
        ]);

        // Filter by patient name or ID
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('patient_id', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Filter by overall status
        if ($request->filled('overall_status')) {
            $query->where('overall_status', $request->overall_status);
        }

        // Filter by vision test status
        if ($request->filled('vision_test_status')) {
            $query->where('vision_test_status', $request->vision_test_status);
        }

        // Filter by prescription status
        if ($request->filled('prescription_status')) {
            $query->where('prescription_status', $request->prescription_status);
        }

        // Filter by doctor
        if ($request->filled('doctor_id')) {
            $query->where('selected_doctor_id', $request->doctor_id);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Sort by latest first
        $query->orderBy('created_at', 'desc');

        // Paginate results
        $visits = $query->paginate(15)->withQueryString();

        // Get doctors for filter dropdown
        $doctors = Doctor::with('user')->get()->map(function ($doctor) {
            return [
                'id' => $doctor->id,
                'name' => $doctor->user->name ?? 'Unknown Doctor',
            ];
        });

        return Inertia::render('Visits/Index', [
            'visits' => $visits,
            'doctors' => $doctors,
            'filters' => $request->only([
                'search',
                'payment_status',
                'overall_status',
                'vision_test_status',
                'prescription_status',
                'doctor_id',
                'date_from',
                'date_to',
            ]),
        ]);
    }

    /**
     * Store a new visit for existing patient
     */
    public function store(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'chief_complaint' => 'required|string|max:500',
            'selected_doctor_id' => 'nullable|exists:doctors,id',
            'is_followup' => 'nullable|boolean',
            'discount_type' => 'nullable|in:percentage,amount',
            'discount_value' => 'nullable|numeric|min:0',
            'payment_amount' => 'required|numeric|min:0',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $patient = Patient::findOrFail($request->patient_id);

                // Check if patient has active visit
                $activeVisit = $patient->visits()
                    ->whereNotIn('overall_status', ['completed'])
                    ->first();

                if ($activeVisit) {
                    throw new \Exception('This patient already has an active visit. Please complete the current visit first.');
                }

                // Create new visit
                $visit = PatientVisit::create([
                    'patient_id' => $patient->id,
                    'selected_doctor_id' => $request->selected_doctor_id,
                    'is_followup' => $request->is_followup ?? false,
                    'discount_type' => $request->discount_type,
                    'discount_value' => $request->discount_value ?? 0,
                    'chief_complaint' => $request->chief_complaint,
                    'created_by' => Auth::id(),
                ]);

                // Process payment if amount provided
                if ($request->payment_amount >= 0) {
                    $payment = PatientPayment::create([
                        'patient_id' => $patient->id,
                        'visit_id' => $visit->id,
                        'amount' => $request->payment_amount,
                        'payment_method_id' => 1, // Default to Cash
                        'payment_date' => today(),
                        'notes' => 'New visit registration payment',
                        'received_by' => Auth::id(),
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

                    // Check if visit is fully paid and update status
                    if ($visit->total_due <= 0 && $visit->payment_status !== 'paid') {
                        $visit->update([
                            'payment_status' => 'paid',
                            'overall_status' => 'vision_test',
                            'payment_completed_at' => now(),
                        ]);
                    }
                }

                return redirect()->route('visits.show', $visit->id)
                    ->with('success', 'New visit created successfully!');
            });
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Visit creation failed: '.$e->getMessage());
        }
    }

    /**
     * Show visit details
     */
    public function show(PatientVisit $visit)
    {
        $visit->load([
            'patient',
            'selectedDoctor.user',
            'payments.paymentMethod',
            'payments.receivedBy',
        ]);

        return Inertia::render('Visits/Show', [
            'visit' => $visit,
        ]);
    }

    /**
     * Show visit receipt - Fixed to pass all data properly
     */
    public function receipt(PatientVisit $visit)
    {
        // Load visit with all necessary relationships
        $visit->load([
            'patient', // Load patient details
            'selectedDoctor.user', // Load doctor with user relationship
            'payments' => function ($query) {
                $query->with(['paymentMethod', 'receivedBy']) // Load payment methods and who received
                    ->orderBy('payment_date', 'desc'); // Latest payments first
            },
        ]);

        $latestPayment = $visit->payments->first();

        return Inertia::render('Visits/Receipt', [
            'patient' => $visit->patient,
            'visit' => $visit,
            'payment' => $latestPayment,
            'csrfToken' => csrf_token(),
        ]);
    }

    /**
     * Alternative receipt method that takes Patient and finds latest visit
     */
    public function receiptByPatient(Patient $patient)
    {
        // Get the latest visit for this patient
        $latestVisit = $patient->visits()->with([
            'selectedDoctor.user',
            'payments' => function ($query) {
                $query->with(['paymentMethod', 'receivedBy'])
                    ->orderBy('payment_date', 'desc');
            },
        ])->latest()->first();

        if (! $latestVisit) {
            return redirect()->back()->with('error', 'No visits found for this patient.');
        }

        // Get the latest payment for this visit
        $latestPayment = $latestVisit->payments->first();

        return Inertia::render('Visits/Receipt', [
            'patient' => $patient,
            'visit' => $latestVisit,
            'payment' => $latestPayment,
            'csrfToken' => csrf_token(),
        ]);
    }

    /**
     * Get visits ready for vision test
     */
    public function readyForVisionTest()
    {
        $visits = PatientVisit::where('payment_status', 'paid')
            ->where('vision_test_status', 'pending')
            ->where('overall_status', 'vision_test')
            ->with(['patient', 'selectedDoctor.user'])
            ->orderBy('payment_completed_at', 'asc')
            ->get();

        return Inertia::render('Visits/VisionTestQueue', [
            'visits' => $visits,
        ]);
    }

    /**
     * Get visits ready for prescription
     */
    public function readyForPrescription()
    {
        $visits = PatientVisit::where('vision_test_status', 'completed')
            ->where('prescription_status', 'pending')
            ->where('overall_status', 'prescription')
            ->with(['patient', 'selectedDoctor.user'])
            ->orderBy('vision_test_completed_at', 'asc')
            ->get();

        return Inertia::render('Visits/PrescriptionQueue', [
            'visits' => $visits,
        ]);
    }

    /**
     * Show edit form for visit
     */
    public function edit(PatientVisit $visit)
    {
        $visit->load([
            'patient',
            'selectedDoctor.user',
            'payments.paymentMethod',
            'payments.receivedBy',
        ]);

        // Get all doctors for dropdown
        $doctors = Doctor::with('user')->get()->map(function ($doctor) {
            return [
                'id' => $doctor->id,
                'name' => $doctor->user->name ?? 'Unknown Doctor',
                'consultation_fee' => $doctor->consultation_fee,
                'follow_up_fee' => $doctor->follow_up_fee ?? 0,
            ];
        });

        // Get the first payment (registration payment)
        $firstPayment = $visit->payments()->orderBy('created_at', 'asc')->first();

        return Inertia::render('Visits/Edit', [
            'visit' => $visit,
            'doctors' => $doctors,
            'firstPayment' => $firstPayment,
        ]);
    }

    /**
     * Update visit details and payment
     */
    public function update(Request $request, PatientVisit $visit)
    {
        \Log::info('🚀 UPDATE METHOD CALLED!', [
            'visit_id' => $visit->id,
            'request_data' => $request->all(),
            'user_id' => auth()->id(),
            'user_email' => auth()->user()->email ?? 'N/A',
        ]);

        $request->validate([
            'selected_doctor_id' => 'nullable|exists:doctors,id',
            'is_followup' => 'nullable|boolean',
            'discount_type' => 'nullable|in:percentage,amount',
            'discount_value' => 'nullable|numeric|min:0',
            'payment_amount' => 'nullable|numeric|min:0',
            'chief_complaint' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        \Log::info('✅ Validation passed');

        try {
            return DB::transaction(function () use ($request, $visit) {
                // Update visit details (doctor, discount, complaint)
                // This will trigger calculateFees() automatically via model events
                $visit->update([
                    'selected_doctor_id' => $request->selected_doctor_id ?? $visit->selected_doctor_id,
                    'is_followup' => $request->has('is_followup') ? $request->is_followup : $visit->is_followup,
                    'discount_type' => $request->discount_type ?? $visit->discount_type,
                    'discount_value' => $request->discount_value ?? $visit->discount_value,
                    'chief_complaint' => $request->chief_complaint ?? $visit->chief_complaint,
                    'visit_notes' => $request->notes ?? $visit->visit_notes,
                ]);

                // Refresh to get updated calculated fees from model observers
                $visit->refresh();

                // Handle payment update if provided
                if ($request->filled('payment_amount')) {
                    $newPaymentAmount = (float) $request->payment_amount;

                    // Get the first payment (registration payment)
                    $payment = $visit->payments()->orderBy('created_at', 'asc')->first();

                    if ($payment) {
                        $oldPaymentAmount = (float) $payment->amount;

                        if ($newPaymentAmount != $oldPaymentAmount) {
                            // Calculate the difference for updates
                            $paymentDiff = $newPaymentAmount - $oldPaymentAmount;

                            // Update payment record
                            $payment->update([
                                'amount' => $newPaymentAmount,
                                'notes' => 'Updated visit registration payment',
                            ]);

                            // Update hospital transaction and main account if linked
                            if ($payment->hospital_transaction_id) {
                                $hospitalTransaction = HospitalTransaction::find($payment->hospital_transaction_id);

                                if ($hospitalTransaction) {
                                    // Update hospital transaction and main account voucher
                                    HospitalAccount::updatePatientPayment(
                                        $hospitalTransaction,
                                        $newPaymentAmount,
                                        "Updated visit payment from Patient: {$visit->patient->name} (ID: {$visit->patient->patient_id})"
                                    );
                                }
                            } else {
                                // Try to find hospital transaction by payment reference
                                $hospitalTransaction = HospitalTransaction::where('reference_type', 'patient_payments')
                                    ->where('reference_id', $payment->id)
                                    ->first();

                                if ($hospitalTransaction) {
                                    // Link it for future use
                                    $payment->update(['hospital_transaction_id' => $hospitalTransaction->id]);

                                    // Update hospital transaction and main account voucher
                                    HospitalAccount::updatePatientPayment(
                                        $hospitalTransaction,
                                        $newPaymentAmount,
                                        "Updated visit payment from Patient: {$visit->patient->name} (ID: {$visit->patient->patient_id})"
                                    );
                                } else {
                                    // Fallback: Just update hospital account balance
                                    $account = HospitalAccount::firstOrCreate([]);
                                    $account->increment('balance', $paymentDiff);
                                }
                            }

                            // Update patient totals
                            $patient = $visit->patient;
                            $patient->increment('total_paid', $paymentDiff);
                            $patient->decrement('total_due', $paymentDiff);
                        }
                    }
                }

                // Recalculate visit totals after all updates (uses updated final_amount)
                $visit->updateTotals();
                $visit->refresh();

                return redirect()->route('visits.show', $visit->id)
                    ->with('success', 'Visit updated successfully!');
            });
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Visit update failed: '.$e->getMessage())
                ->withInput();
        }
    }

    /**
     * Delete a visit and reverse all related financial transactions.
     * Blocked if the patient has optics sales, operation bookings, or medicine sales.
     */
    public function destroy(PatientVisit $visit): \Illuminate\Http\RedirectResponse
    {
        $patient = $visit->patient;
        $patientId = $patient->id;
        $visitId = $visit->id;
        $visitNo = $visit->visit_id;

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

            \Log::warning('Visit delete blocked', [
                'visit_id' => $visitId,
                'visit_no' => $visitNo,
                'patient_id' => $patientId,
                'patient_name' => $patient->name,
                'reason' => $reason,
            ]);

            return back()->with(
                'warning',
                "Cannot delete Visit #{$visitNo} — patient \"$patient->name\" has {$reason}. "
                .'Please remove or reassign these records first.'
            );
        }
        // ─────────────────────────────────────────────────────────────────────

        try {
            return DB::transaction(function () use ($visit, $patient, $patientId, $visitId, $visitNo) {
                // Reverse hospital transactions for OPD payments on this visit
                foreach ($visit->payments as $payment) {
                    if ($payment->hospital_transaction_id) {
                        $tx = HospitalTransaction::find($payment->hospital_transaction_id);
                        if ($tx) {
                            HospitalAccount::reversePatientPayment($tx);
                        }
                    }
                }

                // Medical test payments go first (no visit_id, linked via test_group_id)
                $testGroupIds = DB::table('patient_test_groups')
                    ->where('visit_id', $visitId)
                    ->pluck('id');
                if ($testGroupIds->isNotEmpty()) {
                    DB::table('patient_medical_test_payments')
                        ->whereIn('test_group_id', $testGroupIds)
                        ->delete();
                }

                // Delete all child records by visit_id
                DB::table('patient_payments')->where('visit_id', $visitId)->delete();
                DB::table('vision_tests')->where('visit_id', $visitId)->delete();
                DB::table('prescriptions')->where('visit_id', $visitId)->delete();
                DB::table('patient_invoices')->where('visit_id', $visitId)->delete();
                DB::table('appointments')->where('visit_id', $visitId)->delete();
                DB::table('patient_medical_tests')->where('visit_id', $visitId)->delete();
                DB::table('patient_test_groups')->where('visit_id', $visitId)->delete();

                $visit->delete();

                \Log::info('Visit deleted', [
                    'visit_id' => $visitId,
                    'visit_no' => $visitNo,
                    'patient_id' => $patientId,
                    'patient_name' => $patient->name,
                ]);

                return redirect()->route('patients.show', $patientId)
                    ->with('success', "Visit #{$visitNo} deleted and all transactions reversed successfully!");
            });
        } catch (\Exception $e) {
            \Log::error('Visit deletion failed', [
                'visit_id' => $visitId,
                'visit_no' => $visitNo,
                'patient_id' => $patientId,
                'patient_name' => $patient->name,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Visit deletion failed: '.$e->getMessage());
        }
    }

    /**
     * Update visit status
     */
    public function updateStatus(Request $request, PatientVisit $visit)
    {
        $request->validate([
            'status_type' => 'required|in:vision_test,prescription,overall',
            'status_value' => 'required|string',
        ]);

        $updateData = [];

        switch ($request->status_type) {
            case 'vision_test':
                $updateData['vision_test_status'] = $request->status_value;
                if ($request->status_value === 'completed') {
                    $updateData['vision_test_completed_at'] = now();
                    $updateData['overall_status'] = 'prescription';
                } elseif ($request->status_value === 'in_progress') {
                    $updateData['overall_status'] = 'vision_test';
                }
                break;

            case 'prescription':
                $updateData['prescription_status'] = $request->status_value;
                if ($request->status_value === 'completed') {
                    $updateData['prescription_completed_at'] = now();
                    $updateData['overall_status'] = 'completed';
                }
                break;

            case 'overall':
                $updateData['overall_status'] = $request->status_value;
                break;
        }

        $visit->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Visit status updated successfully!',
            'visit' => $visit->fresh(),
        ]);
    }
}
