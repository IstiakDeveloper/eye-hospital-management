<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Operation extends Model
{
    protected $fillable = [
        'operation_code',
        'name',
        'type',
        'price',
        'description',
        'status',
        'created_by',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    // Relationships
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(OperationBooking::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // Accessors
    public function getFormattedPriceAttribute(): string
    {
        return number_format((float) $this->price, 2);
    }

    // Static Methods
    public static function generateOperationCode(): string
    {
        $lastOperation = self::orderBy('id', 'desc')->first();
        $nextNumber = $lastOperation ? ((int) substr($lastOperation->operation_code, 3)) + 1 : 1;

        return 'OP-'.str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    // Boot method for auto-generating operation code
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($operation) {
            if (empty($operation->operation_code)) {
                $operation->operation_code = self::generateOperationCode();
            }
        });
    }

    // Statistics
    public function getTotalBookingsAttribute(): int
    {
        return $this->bookings()->count();
    }

    public function getCompletedBookingsAttribute(): int
    {
        return $this->bookings()->where('status', 'completed')->count();
    }

    public function getTotalRevenueAttribute(): float
    {
        return $this->bookings()
            ->where('status', 'completed')
            ->sum('total_amount');
    }

    /**
     * Get Income Report for operations in a specific date range
     * Now uses transaction_date (when payment was received) instead of booking created_at
     * This makes it consistent with Receipt & Payment Report (cash-based accounting)
     * Returns patient-wise detailed receipt list
     */
    public static function getIncomeReport($fromDate, $toDate, $search = null)
    {
        // Get all transaction receipts with patient and operation details
        $query = \DB::table('hospital_transactions')
            ->join('operation_bookings', 'hospital_transactions.reference_id', '=', 'operation_bookings.id')
            ->join('patients', 'operation_bookings.patient_id', '=', 'patients.id')
            ->join('operations', 'operation_bookings.operation_id', '=', 'operations.id')
            ->leftJoin('doctors', 'operation_bookings.doctor_id', '=', 'doctors.id')
            ->leftJoin('users as doctor_users', 'doctors.user_id', '=', 'doctor_users.id')
            ->where('hospital_transactions.type', 'income')
            ->where('hospital_transactions.category', 'Operation Income')
            ->whereBetween('hospital_transactions.transaction_date', [$fromDate, $toDate]);

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('patients.name', 'like', "%{$search}%")
                    ->orWhere('operations.name', 'like', "%{$search}%")
                    ->orWhere('operation_bookings.booking_no', 'like', "%{$search}%")
                    ->orWhere('patients.patient_id', 'like', "%{$search}%");
            });
        }

        $transactions = $query->select(
            'hospital_transactions.id as transaction_id',
            'hospital_transactions.transaction_date',
            'hospital_transactions.amount as payment_received',
            'hospital_transactions.transaction_no',
            'operation_bookings.id as booking_id',
            'operation_bookings.booking_no',
            'operation_bookings.base_amount',
            'operation_bookings.discount_amount',
            'operation_bookings.total_amount as total_bill',
            'operation_bookings.advance_payment as total_paid_so_far',
            'operation_bookings.due_amount as remaining_due',
            'operation_bookings.scheduled_date',
            'operation_bookings.status',
            'patients.patient_id',
            'patients.name as patient_name',
            'patients.date_of_birth',
            'patients.gender as patient_gender',
            'operations.name as operation_name',
            'operations.operation_code',
            'operations.type as operation_type',
            'doctor_users.name as doctor_name'
        )
            ->orderBy('hospital_transactions.transaction_date', 'asc')
            ->orderBy('hospital_transactions.id', 'asc')
            ->get();

        $reportData = [];
        $sl = 1;

        foreach ($transactions as $transaction) {
            // Calculate age from date_of_birth
            $age = null;
            if ($transaction->date_of_birth) {
                $dob = new \DateTime($transaction->date_of_birth);
                $now = new \DateTime;
                $age = $dob->diff($now)->y;
            }

            $reportData[] = [
                'sl' => $sl++,
                'transaction_id' => $transaction->transaction_id,
                'receipt_date' => $transaction->transaction_date,
                'transaction_no' => $transaction->transaction_no,
                'booking_no' => $transaction->booking_no,
                'patient_id' => $transaction->patient_id,
                'patient_name' => $transaction->patient_name,
                'patient_age' => $age ?? 0,
                'patient_gender' => $transaction->patient_gender,
                'operation_name' => $transaction->operation_name,
                'operation_code' => $transaction->operation_code,
                'operation_type' => $transaction->operation_type ?? 'General',
                'doctor_name' => $transaction->doctor_name,
                'scheduled_date' => $transaction->scheduled_date,
                'base_amount' => round($transaction->base_amount, 2),
                'discount' => round($transaction->discount_amount, 2),
                'total_bill' => round($transaction->total_bill, 2),
                'payment_received' => round($transaction->payment_received, 2),
                'total_paid' => round($transaction->total_paid_so_far, 2),
                'remaining_due' => round($transaction->remaining_due, 2),
                'status' => $transaction->status,
            ];
        }

        return $reportData;
    }

    /**
     * Get summary statistics for the income report
     */
    public static function getIncomeReportSummary($fromDate, $toDate)
    {
        $transactions = \DB::table('hospital_transactions')
            ->join('operation_bookings', 'hospital_transactions.reference_id', '=', 'operation_bookings.id')
            ->where('hospital_transactions.type', 'income')
            ->where('hospital_transactions.category', 'Operation Income')
            ->whereBetween('hospital_transactions.transaction_date', [$fromDate, $toDate])
            ->select(
                'operation_bookings.base_amount',
                'operation_bookings.discount_amount',
                'operation_bookings.total_amount',
                'hospital_transactions.amount as payment_received'
            )
            ->get();

        return [
            'total_receipts' => $transactions->count(),
            'total_base_amount' => round($transactions->sum('base_amount'), 2),
            'total_discount' => round($transactions->sum('discount_amount'), 2),
            'total_bill' => round($transactions->sum('total_amount'), 2),
            'total_received' => round($transactions->sum('payment_received'), 2),
        ];
    }
}
