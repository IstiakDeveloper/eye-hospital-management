<?php

namespace App\Services;

use App\Models\PatientPayment;
use App\Models\PatientInvoice;
use App\Models\Transaction;
use App\Models\DoctorCommission;
use App\Models\ServiceCharge;
use App\Models\AccountCategory;
use App\Models\Patient;
use App\Models\PaymentInstallment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class PaymentService
{
    /**
     * Process patient payment
     *
     * @param array $paymentData
     * @return PatientPayment
     * @throws Exception
     */
    public function processPayment(array $paymentData): PatientPayment
    {
        return DB::transaction(function () use ($paymentData) {
            try {
                // Validate payment data
                $this->validatePaymentData($paymentData);

                // Create patient payment record
                $payment = PatientPayment::create([
                    'patient_id' => $paymentData['patient_id'],
                    'invoice_id' => $paymentData['invoice_id'] ?? null,
                    'amount' => $paymentData['amount'],
                    'payment_method_id' => $paymentData['payment_method_id'],
                    'payment_date' => $paymentData['payment_date'] ?? today(),
                    'notes' => $paymentData['notes'] ?? '',
                    'receipt_number' => $paymentData['receipt_number'] ?? null,
                    'received_by' => auth()->id(),
                ]);

                // Create income transaction
                $this->createIncomeTransaction($payment);

                // Update invoice if provided
                if ($payment->invoice_id) {
                    $this->updateInvoicePayment($payment);
                }

                // Update patient payment status
                $this->updatePatientPaymentStatus($payment->patient);

                // Calculate and create doctor commission if applicable
                if ($payment->invoice_id) {
                    $this->calculateDoctorCommission($payment);
                }

                // Log payment activity
                Log::info('Payment processed successfully', [
                    'payment_id' => $payment->id,
                    'patient_id' => $payment->patient_id,
                    'amount' => $payment->amount,
                    'user_id' => auth()->id()
                ]);

                return $payment->fresh(['patient', 'invoice', 'paymentMethod']);

            } catch (Exception $e) {
                Log::error('Payment processing failed', [
                    'error' => $e->getMessage(),
                    'payment_data' => $paymentData,
                    'user_id' => auth()->id()
                ]);
                throw $e;
            }
        });
    }

    /**
     * Process registration payment specifically
     *
     * @param Patient $patient
     * @param array $paymentData
     * @return PatientPayment
     */
    public function processRegistrationPayment(Patient $patient, array $paymentData): PatientPayment
    {
        return DB::transaction(function () use ($patient, $paymentData) {
            // Get registration invoice
            $invoice = $patient->invoices()
                              ->where('invoice_type', 'registration')
                              ->first();

            if (!$invoice) {
                throw new Exception('Registration invoice not found for patient');
            }

            // Process payment
            $payment = $this->processPayment([
                'patient_id' => $patient->id,
                'invoice_id' => $invoice->id,
                'amount' => $paymentData['amount'],
                'payment_method_id' => $paymentData['payment_method_id'],
                'payment_date' => $paymentData['payment_date'] ?? today(),
                'notes' => $paymentData['notes'] ?? 'Registration payment',
            ]);

            // Update patient registration status based on payment
            $this->updatePatientRegistrationStatus($patient);

            return $payment;
        });
    }

    /**
     * Process installment payment
     *
     * @param int $installmentId
     * @param float $amount
     * @param array $paymentData
     * @return PatientPayment
     */
    public function processInstallmentPayment(int $installmentId, float $amount, array $paymentData): PatientPayment
    {
        return DB::transaction(function () use ($installmentId, $amount, $paymentData) {
            $installment = PaymentInstallment::findOrFail($installmentId);

            // Validate installment payment
            if ($installment->status === 'paid') {
                throw new Exception('This installment has already been paid');
            }

            if ($amount > $installment->balance) {
                throw new Exception('Payment amount exceeds installment balance');
            }

            // Create payment
            $payment = $this->processPayment([
                'patient_id' => $installment->invoice->patient_id,
                'invoice_id' => $installment->invoice_id,
                'amount' => $amount,
                'payment_method_id' => $paymentData['payment_method_id'],
                'payment_date' => $paymentData['payment_date'] ?? today(),
                'notes' => "Installment payment for Invoice #{$installment->invoice->invoice_number}",
            ]);

            // Update installment
            $installment->paid_amount += $amount;
            if ($installment->paid_amount >= $installment->installment_amount) {
                $installment->status = 'paid';
                $installment->paid_date = today();
            }
            $installment->save();

            return $payment;
        });
    }

    /**
     * Process partial payment
     *
     * @param PatientInvoice $invoice
     * @param array $paymentData
     * @return PatientPayment
     */
    public function processPartialPayment(PatientInvoice $invoice, array $paymentData): PatientPayment
    {
        if ($invoice->status === 'paid') {
            throw new Exception('Invoice is already fully paid');
        }

        if ($paymentData['amount'] > $invoice->due_amount) {
            throw new Exception('Payment amount exceeds due amount');
        }

        return $this->processPayment([
            'patient_id' => $invoice->patient_id,
            'invoice_id' => $invoice->id,
            'amount' => $paymentData['amount'],
            'payment_method_id' => $paymentData['payment_method_id'],
            'payment_date' => $paymentData['payment_date'] ?? today(),
            'notes' => $paymentData['notes'] ?? 'Partial payment',
        ]);
    }

    /**
     * Process refund
     *
     * @param PatientPayment $originalPayment
     * @param array $refundData
     * @return PatientPayment
     */
    public function processRefund(PatientPayment $originalPayment, array $refundData): PatientPayment
    {
        return DB::transaction(function () use ($originalPayment, $refundData) {
            // Create refund payment (negative amount)
            $refund = PatientPayment::create([
                'patient_id' => $originalPayment->patient_id,
                'invoice_id' => $originalPayment->invoice_id,
                'amount' => -abs($refundData['amount']), // Negative amount for refund
                'payment_method_id' => $refundData['payment_method_id'],
                'payment_date' => $refundData['refund_date'] ?? today(),
                'notes' => 'Refund for payment #' . $originalPayment->payment_number . '. Reason: ' . ($refundData['reason'] ?? 'No reason provided'),
                'receipt_number' => $refundData['receipt_number'] ?? null,
                'received_by' => auth()->id(),
            ]);

            // Create expense transaction for refund
            Transaction::create([
                'type' => 'expense',
                'amount' => abs($refundData['amount']),
                'description' => "Refund to patient {$originalPayment->patient->name}",
                'account_category_id' => $this->getRefundCategoryId(),
                'payment_method_id' => $refundData['payment_method_id'],
                'transaction_date' => $refundData['refund_date'] ?? today(),
                'reference_type' => 'patient_refund',
                'reference_id' => $refund->id,
                'metadata' => [
                    'original_payment_id' => $originalPayment->id,
                    'refund_reason' => $refundData['reason'] ?? null
                ],
                'created_by' => auth()->id(),
            ]);

            // Update invoice if applicable
            if ($refund->invoice_id) {
                $this->updateInvoicePayment($refund);
            }

            return $refund;
        });
    }

    /**
     * Get payment summary for a patient
     *
     * @param int $patientId
     * @return array
     */
    public function getPatientPaymentSummary(int $patientId): array
    {
        $patient = Patient::findOrFail($patientId);

        $totalPaid = $patient->payments()->sum('amount');
        $totalDue = $patient->invoices()->sum('due_amount');
        $totalInvoiced = $patient->invoices()->sum('total_amount');

        $recentPayments = $patient->payments()
                                 ->with(['paymentMethod', 'invoice'])
                                 ->orderBy('payment_date', 'desc')
                                 ->limit(5)
                                 ->get();

        $outstandingInvoices = $patient->invoices()
                                      ->where('status', '!=', 'paid')
                                      ->where('due_amount', '>', 0)
                                      ->with('invoiceItems')
                                      ->get();

        return [
            'total_paid' => $totalPaid,
            'total_due' => $totalDue,
            'total_invoiced' => $totalInvoiced,
            'payment_percentage' => $totalInvoiced > 0 ? round(($totalPaid / $totalInvoiced) * 100, 2) : 0,
            'recent_payments' => $recentPayments,
            'outstanding_invoices' => $outstandingInvoices,
            'has_outstanding_balance' => $totalDue > 0,
        ];
    }

    /**
     * Get daily payment summary
     *
     * @param string|null $date
     * @return array
     */
    public function getDailyPaymentSummary(?string $date = null): array
    {
        $date = $date ?? today()->toDateString();

        $payments = PatientPayment::with(['patient', 'paymentMethod', 'invoice'])
                                  ->whereDate('payment_date', $date)
                                  ->get();

        $totalAmount = $payments->sum('amount');
        $totalCount = $payments->count();

        $paymentMethodBreakdown = $payments->groupBy('paymentMethod.name')
                                          ->map(function ($group) {
                                              return [
                                                  'count' => $group->count(),
                                                  'total' => $group->sum('amount')
                                              ];
                                          });

        $hourlyBreakdown = $payments->groupBy(function ($payment) {
                                     return $payment->created_at->format('H:00');
                                   })
                                   ->map(function ($group) {
                                       return [
                                           'count' => $group->count(),
                                           'total' => $group->sum('amount')
                                       ];
                                   });

        return [
            'date' => $date,
            'total_amount' => $totalAmount,
            'total_count' => $totalCount,
            'average_payment' => $totalCount > 0 ? round($totalAmount / $totalCount, 2) : 0,
            'payment_method_breakdown' => $paymentMethodBreakdown,
            'hourly_breakdown' => $hourlyBreakdown,
            'payments' => $payments,
        ];
    }

    /**
     * Create income transaction for payment
     *
     * @param PatientPayment $payment
     * @return Transaction
     */
    private function createIncomeTransaction(PatientPayment $payment): Transaction
    {
        // Determine account category based on payment type
        $categoryId = $this->getIncomeCategoryId($payment);

        return Transaction::create([
            'type' => 'income',
            'amount' => $payment->amount,
            'description' => "Payment from {$payment->patient->name} ({$payment->patient->patient_id})",
            'account_category_id' => $categoryId,
            'payment_method_id' => $payment->payment_method_id,
            'transaction_date' => $payment->payment_date,
            'reference_type' => 'patient_payment',
            'reference_id' => $payment->id,
            'metadata' => [
                'patient_id' => $payment->patient_id,
                'invoice_id' => $payment->invoice_id,
                'payment_number' => $payment->payment_number
            ],
            'created_by' => auth()->id(),
        ]);
    }

    /**
     * Update invoice payment status
     *
     * @param PatientPayment $payment
     * @return void
     */
    private function updateInvoicePayment(PatientPayment $payment): void
    {
        if (!$payment->invoice) {
            return;
        }

        $invoice = $payment->invoice;
        $totalPaid = $invoice->patientPayments()->sum('amount');

        $invoice->paid_amount = $totalPaid;
        $invoice->due_amount = max(0, $invoice->total_amount - $totalPaid);

        // Update status
        if ($invoice->due_amount <= 0) {
            $invoice->status = 'paid';
        } elseif ($invoice->paid_amount > 0) {
            $invoice->status = 'partially_paid';
        } else {
            $invoice->status = 'pending';
        }

        $invoice->save();
    }

    /**
     * Update patient payment status
     *
     * @param Patient $patient
     * @return void
     */
    private function updatePatientPaymentStatus(Patient $patient): void
    {
        $totalDue = $patient->invoices()->sum('due_amount');
        $totalPaid = $patient->payments()->sum('amount');

        if ($totalDue <= 0) {
            $patient->payment_status = 'paid';
        } elseif ($totalPaid > 0) {
            $patient->payment_status = 'partial';
        } else {
            $patient->payment_status = 'pending';
        }

        $patient->save();
    }

    /**
     * Update patient registration status
     *
     * @param Patient $patient
     * @return void
     */
    private function updatePatientRegistrationStatus(Patient $patient): void
    {
        $registrationInvoice = $patient->invoices()
                                      ->where('invoice_type', 'registration')
                                      ->first();

        if ($registrationInvoice && $registrationInvoice->status === 'paid') {
            $patient->registration_status = 'completed';
            $patient->payment_status = 'paid';
        } elseif ($registrationInvoice && $registrationInvoice->paid_amount > 0) {
            $patient->payment_status = 'partial';
        }

        $patient->save();
    }

    /**
     * Calculate doctor commission
     *
     * @param PatientPayment $payment
     * @return void
     */
    private function calculateDoctorCommission(PatientPayment $payment): void
    {
        $invoice = $payment->invoice;
        if (!$invoice || !$invoice->appointment) {
            return;
        }

        $appointment = $invoice->appointment;
        $doctor = $appointment->doctor;

        if (!$doctor) {
            return;
        }

        // Get commission rate from service charges or default
        $consultationItem = $invoice->invoiceItems()
                                   ->where('item_type', 'consultation')
                                   ->first();

        if ($consultationItem) {
            $serviceCharge = ServiceCharge::where('service_type', 'consultation')->first();

            if ($serviceCharge) {
                $commissionAmount = $serviceCharge->doctor_fee;
                $commissionPercentage = ($serviceCharge->doctor_fee / $serviceCharge->base_price) * 100;
            } else {
                // Default commission calculation (60% of payment)
                $commissionAmount = $payment->amount * 0.6;
                $commissionPercentage = 60;
            }

            // Only create commission if it doesn't already exist for this payment
            $existingCommission = DoctorCommission::where('patient_payment_id', $payment->id)->first();

            if (!$existingCommission) {
                DoctorCommission::create([
                    'doctor_id' => $doctor->id,
                    'patient_payment_id' => $payment->id,
                    'commission_amount' => $commissionAmount,
                    'commission_percentage' => $commissionPercentage,
                    'earned_date' => $payment->payment_date,
                    'status' => 'pending',
                ]);
            }
        }
    }

    /**
     * Get income category ID based on payment type
     *
     * @param PatientPayment $payment
     * @return int
     */
    private function getIncomeCategoryId(PatientPayment $payment): int
    {
        if ($payment->invoice && $payment->invoice->invoice_type) {
            $categoryName = match($payment->invoice->invoice_type) {
                'registration' => 'Patient Registration',
                'consultation' => 'Patient Consultation',
                'vision_test' => 'Vision Test',
                'medicine' => 'Medicine Sales',
                default => 'Patient Consultation'
            };
        } else {
            $categoryName = 'Patient Consultation';
        }

        $category = AccountCategory::where('name', $categoryName)
                                  ->where('type', 'income')
                                  ->first();

        return $category ? $category->id : $this->getDefaultIncomeCategoryId();
    }

    /**
     * Get default income category ID
     *
     * @return int
     */
    private function getDefaultIncomeCategoryId(): int
    {
        $category = AccountCategory::where('type', 'income')->first();
        return $category ? $category->id : 1; // Fallback to ID 1
    }

    /**
     * Get refund category ID
     *
     * @return int
     */
    private function getRefundCategoryId(): int
    {
        $category = AccountCategory::where('name', 'LIKE', '%refund%')
                                  ->where('type', 'expense')
                                  ->first();

        if (!$category) {
            // Create refund category if it doesn't exist
            $category = AccountCategory::create([
                'name' => 'Patient Refunds',
                'type' => 'expense',
                'description' => 'Refunds to patients',
                'is_active' => true
            ]);
        }

        return $category->id;
    }

    /**
     * Validate payment data
     *
     * @param array $paymentData
     * @return void
     * @throws Exception
     */
    private function validatePaymentData(array $paymentData): void
    {
        if (empty($paymentData['patient_id'])) {
            throw new Exception('Patient ID is required');
        }

        if (empty($paymentData['amount']) || $paymentData['amount'] <= 0) {
            throw new Exception('Payment amount must be greater than zero');
        }

        if (empty($paymentData['payment_method_id'])) {
            throw new Exception('Payment method is required');
        }

        // Validate patient exists
        $patient = Patient::find($paymentData['patient_id']);
        if (!$patient) {
            throw new Exception('Patient not found');
        }

        // Validate invoice if provided
        if (!empty($paymentData['invoice_id'])) {
            $invoice = PatientInvoice::find($paymentData['invoice_id']);
            if (!$invoice) {
                throw new Exception('Invoice not found');
            }

            if ($invoice->patient_id != $paymentData['patient_id']) {
                throw new Exception('Invoice does not belong to this patient');
            }

            if ($paymentData['amount'] > $invoice->due_amount) {
                throw new Exception('Payment amount exceeds invoice due amount');
            }
        }
    }
}
