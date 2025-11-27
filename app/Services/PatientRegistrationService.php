<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\PatientInvoice;
use App\Models\InvoiceItem;
use App\Models\PatientPayment;
use App\Models\Doctor;
use Illuminate\Support\Facades\DB;

class PatientRegistrationService
{
    /**
     * Register new patient with payment calculation
     */
    public function registerPatient(array $patientData, ?int $doctorId = null, array $discountData = [])
    {
        return DB::transaction(function () use ($patientData, $doctorId, $discountData) {

            // Create patient with selected doctor
            $patient = Patient::create(array_merge($patientData, [
                'selected_doctor_id' => $doctorId,
                'discount_type' => $discountData['type'] ?? null,
                'discount_value' => $discountData['value'] ?? 0,
                'registered_by' => auth()->id(),
            ]));

            // Create registration invoice
            $invoice = $this->createRegistrationInvoice($patient);

            return [
                'patient' => $patient->fresh(),
                'invoice' => $invoice,
                'payment_required' => $patient->final_amount
            ];
        });
    }

    /**
     * Create registration invoice
     */
    private function createRegistrationInvoice(Patient $patient)
    {
        $invoice = PatientInvoice::create([
            'patient_id' => $patient->id,
            'invoice_type' => 'registration',
            'subtotal' => $patient->total_amount,
            'discount_amount' => $patient->discount_amount,
            'total_amount' => $patient->final_amount,
            'due_amount' => $patient->final_amount,
            'issue_date' => today(),
            'due_date' => today(),
            'notes' => 'Patient Registration Invoice',
            'created_by' => auth()->id(),
        ]);

        // Add registration fee item
        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'item_type' => 'registration',
            'item_name' => 'Patient Registration Fee',
            'description' => 'New patient registration',
            'quantity' => 1,
            'unit_price' => $patient->registration_fee,
            'total_price' => $patient->registration_fee,
        ]);

        // Add doctor consultation item if doctor selected
        if ($patient->selected_doctor_id && $patient->doctor_fee > 0) {
            // ✅ Fixed: Load doctor with user relationship
            $doctor = Doctor::with('user')->find($patient->selected_doctor_id);

            if ($doctor && $doctor->user) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'item_type' => 'consultation',
                    'item_name' => 'Doctor Consultation Fee',
                    'description' => 'Consultation with Dr. ' . $doctor->user->name,
                    'quantity' => 1,
                    'unit_price' => $patient->doctor_fee,
                    'total_price' => $patient->doctor_fee,
                    'reference_id' => $patient->selected_doctor_id,
                ]);
            }
        }

        return $invoice;
    }

    /**
     * Process registration payment
     */
    public function processRegistrationPayment(Patient $patient, array $paymentData)
    {
        return DB::transaction(function () use ($patient, $paymentData) {

            // Get registration invoice
            $invoice = $patient->invoices()->latest()->first();

            if (!$invoice) {
                throw new \Exception('No invoice found for this patient');
            }

            // Create payment record
            $payment = PatientPayment::create([
                'patient_id' => $patient->id,
                'invoice_id' => $invoice->id,
                'amount' => $paymentData['amount'],
                'payment_method_id' => 1, // Cash
                'payment_date' => today(),
                'notes' => 'Registration payment (Cash)',
                'received_by' => auth()->id(),
            ]);

            // Update patient payment status
            $totalPaid = $patient->payments()->sum('amount');

            if ($totalPaid >= $patient->final_amount) {
                // Payment completed - move to vision test stage
                $patient->update([
                    'payment_status' => 'paid',
                    'registration_status' => 'completed',
                    'overall_status' => 'vision_test', // Move to next stage
                    'payment_completed_at' => now(), // Track when payment was completed
                ]);
            } elseif ($totalPaid > 0) {
                $patient->update(['payment_status' => 'partial']);
            }

            return $payment;
        });
    }

    /**
     * Get available doctors for selection
     */
    public function getAvailableDoctors()
    {
        return Doctor::with('user')
            ->where('is_available', true)
            ->get()
            ->map(function ($doctor) {
                // ✅ Fixed: Add null check
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->user ? $doctor->user->name : 'Unknown Doctor',
                    'specialization' => $doctor->specialization ?? 'General',
                    'consultation_fee' => $doctor->consultation_fee ?? 0,
                ];
            });
    }

    /**
     * Calculate registration costs
     */
    public function calculateCosts(?int $doctorId = null, array $discountData = [])
    {
        $registrationFee = 0.00; // No registration fee
        $doctorFee = 0;

        if ($doctorId) {
            $doctor = Doctor::find($doctorId);
            $doctorFee = $doctor ? $doctor->consultation_fee : 0;
        }

        $totalAmount = $doctorFee; // Only doctor fee
        $discountAmount = 0;

        if (!empty($discountData['value']) && $discountData['value'] > 0) {
            if ($discountData['type'] === 'percentage') {
                $discountAmount = ($totalAmount * $discountData['value']) / 100;
            } else {
                $discountAmount = min($discountData['value'], $totalAmount);
            }
        }

        $finalAmount = $totalAmount - $discountAmount;

        return [
            'registration_fee' => $registrationFee,
            'doctor_fee' => $doctorFee,
            'total_amount' => $totalAmount,
            'discount_amount' => $discountAmount,
            'final_amount' => $finalAmount,
        ];
    }
}
