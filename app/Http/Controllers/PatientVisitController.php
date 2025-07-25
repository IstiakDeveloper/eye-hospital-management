<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\PatientPayment;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PatientVisitController extends Controller
{
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
                    'created_by' => auth()->id(),
                ]);

                // Process payment if amount provided
                if ($request->payment_amount > 0) {
                    $payment = PatientPayment::create([
                        'patient_id' => $patient->id,
                        'visit_id' => $visit->id,
                        'amount' => $request->payment_amount,
                        'payment_method_id' => 1, // Default to Cash
                        'payment_date' => today(),
                        'notes' => 'New visit registration payment',
                        'received_by' => auth()->id(),
                    ]);

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

                return response()->json([
                    'success' => true,
                    'message' => 'New visit created successfully!',
                    'visit' => $visit->fresh(['patient', 'selectedDoctor.user', 'payments']),
                    'redirect_url' => route('visits.show', $visit),
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Visit creation failed: ' . $e->getMessage(),
            ], 422);
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
     * Show visit receipt
     */
    public function receipt(PatientVisit $visit)
    {
        $visit->load([
            'patient',
            'selectedDoctor.user',
            'payments' => function ($query) {
                $query->latest();
            }
        ]);

        return Inertia::render('Visits/Receipt', [
            'visit' => $visit,
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
