<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\PatientPayment;
use App\Models\Doctor;
use App\Models\HospitalAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PatientVisitController extends Controller
{
    /**
     * Show the form for editing the specified visit
     */
    public function edit(PatientVisit $visit)
    {
        $visit->load([
            'patient',
            'selectedDoctor.user',
            'payments.paymentMethod',
            'payments.receivedBy',
        ]);

        $doctors = Doctor::with('user')->get()->map(function ($doctor) {
            return [
                'id' => $doctor->id,
                'name' => $doctor->user->name ?? 'Unknown Doctor',
                'specialization' => $doctor->specialization ?? '',
            ];
        });

        return Inertia::render('Visits/Edit', [
            'visit' => $visit,
            'doctors' => $doctors,
        ]);
    }

    /**
     * Update the specified visit in storage
     */
    public function update(Request $request, PatientVisit $visit)
    {
        $request->validate([
            'chief_complaint' => 'required|string|max:500',
            'selected_doctor_id' => 'nullable|exists:doctors,id',
            'discount_type' => 'nullable|in:percentage,amount',
            'discount_value' => 'nullable|numeric|min:0',
            'payment_amount' => 'required|numeric|min:0',
        ]);

        try {
            return DB::transaction(function () use ($request, $visit) {
                // Update visit fields
                $visit->chief_complaint = $request->chief_complaint;
                $visit->selected_doctor_id = $request->selected_doctor_id;
                $visit->discount_type = $request->discount_type;
                $visit->discount_value = $request->discount_value ?? 0;
                $visit->save();

                // Recalculate fees and totals
                $visit->refresh();
                $visit->updateTotals();

                // Payment update logic: always match payment_amount to payments
                $paymentAmount = (float) $request->payment_amount;
                $alreadyPaid = (float) $visit->payments()->sum('amount');
                if ($paymentAmount !== $alreadyPaid) {
                    $originalPaymentDate = null;
                    foreach ($visit->payments as $oldPayment) {
                        if (!$originalPaymentDate) {
                            $originalPaymentDate = $oldPayment->payment_date;
                        }
                        $hospitalTransaction = null;
                        if ($oldPayment->hospital_transaction_id) {
                            $hospitalTransaction = \App\Models\HospitalTransaction::find($oldPayment->hospital_transaction_id);
                        }
                        if (!$hospitalTransaction) {
                            $hospitalTransaction = \App\Models\HospitalTransaction::where('reference_type', 'patient_payments')
                                ->where('reference_id', $oldPayment->id)
                                ->first();
                        }
                        if ($hospitalTransaction) {
                            // Use updateIncome if payment is being edited (not deleted)
                            if ($paymentAmount > 0) {
                                \App\Models\HospitalAccount::updateIncome(
                                    $hospitalTransaction,
                                    $paymentAmount,
                                    'patient_payment',
                                    "Visit payment update from Patient: {$visit->patient->name} (ID: {$visit->patient->patient_id})"
                                );
                                $oldPayment->update([
                                    'amount' => $paymentAmount,
                                    'payment_date' => $originalPaymentDate ?? today(),
                                    'notes' => 'Visit payment edited',
                                    'received_by' => Auth::id(),
                                ]);
                                $oldPayment->refresh();
                                $oldPayment->hospital_transaction_id = $hospitalTransaction->id;
                                $oldPayment->save();
                            } else {
                                // If payment is being deleted (amount set to 0), delete as before
                                $voucher = \App\Models\MainAccountVoucher::where('source_reference_id', $hospitalTransaction->id)
                                    ->where('source_account', 'hospital')
                                    ->where('source_transaction_type', 'patient_payment')
                                    ->first();
                                if ($voucher) {
                                    $voucher->delete();
                                }
                                $hospitalAccount = \App\Models\HospitalAccount::first();
                                if ($hospitalAccount) {
                                    if ($hospitalTransaction->type === 'income') {
                                        $hospitalAccount->decrement('balance', (float) $hospitalTransaction->amount);
                                    } else {
                                        $hospitalAccount->increment('balance', (float) $hospitalTransaction->amount);
                                    }
                                }
                                $hospitalTransaction->delete();
                                $oldPayment->delete();
                            }
                        }
                    }
                    // If there was no previous payment, create new
                    if ($visit->payments->isEmpty() && $paymentAmount > 0) {
                        $payment = PatientPayment::create([
                            'patient_id' => $visit->patient_id,
                            'visit_id' => $visit->id,
                            'amount' => $paymentAmount,
                            'payment_method_id' => 1, // Default to Cash
                            'payment_date' => $originalPaymentDate ?? today(),
                            'notes' => 'Visit payment edited',
                            'received_by' => Auth::id(),
                        ]);
                        $hospitalTransaction = HospitalAccount::addIncome(
                            $paymentAmount,
                            'patient_payment',
                            "Visit payment update from Patient: {$visit->patient->name} (ID: {$visit->patient->patient_id})",
                            'patient_payments',
                            $payment->id,
                            $originalPaymentDate ?? today()
                        );
                        $payment->update(['hospital_transaction_id' => $hospitalTransaction->id]);
                    }
                }


                // Recalculate totals again after payment
                $visit->refresh();
                $visit->updateTotals();


                // Update payment/overall status if needed
                if ($visit->total_due <= 0 && $visit->payment_status !== 'paid') {
                    $visit->update([
                        'payment_status' => 'paid',
                        'overall_status' => 'vision_test',
                        'payment_completed_at' => now(),
                    ]);
                }

                return redirect()->route('visits.show', $visit->id)
                    ->with('success', 'Visit updated successfully!');
            });
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Visit update failed: ' . $e->getMessage());
        }
    }
    /**
     * Display a listing of patient visits with filters
     */
    public function index(Request $request)
    {
        $query = PatientVisit::with([
            'patient',
            'selectedDoctor.user',
            'payments.paymentMethod',
            'createdBy'
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
                'date_to'
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

                    // ✅ ADD TO HOSPITAL ACCOUNT
                    $hospitalTransaction = HospitalAccount::addIncome(
                        $request->payment_amount,
                        'patient_payment',
                        "Visit payment from Patient: {$patient->name} (ID: {$patient->patient_id})",
                        'patient_payments',
                        $payment->id
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
                ->with('error', 'Visit creation failed: ' . $e->getMessage());
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
            'payments.receivedBy'
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
            }
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
            }
        ])->latest()->first();

        if (!$latestVisit) {
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
