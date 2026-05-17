<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HospitalDueExpense extends Model
{
    protected $fillable = [
        'expense_no',
        'vendor_id',
        'expense_category_id',
        'total_amount',
        'paid_amount',
        'due_amount',
        'description',
        'expense_date',
        'hospital_transaction_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_amount' => 'decimal:2',
            'expense_date' => 'date',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(HospitalExpenseVendor::class, 'vendor_id');
    }

    public function expenseCategory(): BelongsTo
    {
        return $this->belongsTo(HospitalExpenseCategory::class, 'expense_category_id');
    }

    public function hospitalTransaction(): BelongsTo
    {
        return $this->belongsTo(HospitalTransaction::class, 'hospital_transaction_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function generateExpenseNo(): string
    {
        $date = now()->format('Ymd');
        $sequence = self::query()->whereDate('created_at', today())->count() + 1;

        do {
            $expenseNo = 'HDE-'.$date.'-'.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
            $sequence++;
        } while (self::query()->where('expense_no', $expenseNo)->exists());

        return $expenseNo;
    }
}
