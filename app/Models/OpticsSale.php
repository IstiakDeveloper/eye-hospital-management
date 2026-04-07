<?php

namespace App\Models;

use App\Support\OpticsSaleDueCalculator;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class OpticsSale extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'patient_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'seller_id',
        'glass_fitting_price',
        'total_amount',
        'advance_payment',
        'due_amount',
        'status',
        'notes',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($sale) {
            // Use created_at date if set, otherwise current date
            $saleDate = $sale->created_at ? \Carbon\Carbon::parse($sale->created_at) : now();
            $date = $saleDate->format('Ymd');
            $prefix = 'OPT-'.$date.'-';
            $lastSale = static::withTrashed()
                ->where('invoice_number', 'like', $prefix.'%')
                ->orderByDesc('invoice_number')
                ->first();
            if ($lastSale) {
                $lastSeq = (int) substr($lastSale->invoice_number, strlen($prefix));
                $nextSeq = $lastSeq + 1;
            } else {
                $nextSeq = 1;
            }
            $sale->invoice_number = $prefix.str_pad($nextSeq, 4, '0', STR_PAD_LEFT);
        });
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function payments()
    {
        return $this->hasMany(OpticsSalePayment::class);
    }

    public function items()
    {
        return $this->hasMany(OpticsSaleItem::class);
    }

    public function getTotalPaidAttribute(): float
    {
        return max(0, (float) $this->total_amount - (float) $this->due_amount);
    }

    public function getRemainingDueAttribute(): float
    {
        return max(0, (float) $this->due_amount);
    }

    /**
     * Outstanding due from total_amount, advance_payment, and optics_sale_payments (does not persist).
     * Advance is counted once even if recorded both on the sale row and as a payment row (notes like "Advance").
     */
    public function computeOutstandingDue(): float
    {
        $paymentsSum = (float) DB::table('optics_sale_payments')
            ->where('optics_sale_id', $this->id)
            ->sum('amount');

        $advanceInTable = (float) DB::table('optics_sale_payments')
            ->where('optics_sale_id', $this->id)
            ->where('notes', 'like', '%Advance%')
            ->sum('amount');

        return OpticsSaleDueCalculator::outstandingDue(
            (float) $this->total_amount,
            (float) $this->advance_payment,
            $paymentsSum,
            $advanceInTable,
        );
    }

    /**
     * Outstanding due as of end of $asOnDate, using only payments recorded on or before that time.
     * Use this for Balance Sheet / "as on [date]" receivables. The stored {@see $due_amount} column is
     * always **current** outstanding; after later payments it no longer matches a past as-on date.
     */
    public function computeOutstandingDueAsOf(string $asOnDate): float
    {
        $end = $asOnDate.' 23:59:59';

        $paymentsSum = (float) DB::table('optics_sale_payments')
            ->where('optics_sale_id', $this->id)
            ->where('created_at', '<=', $end)
            ->sum('amount');

        $advanceInTable = (float) DB::table('optics_sale_payments')
            ->where('optics_sale_id', $this->id)
            ->where('notes', 'like', '%Advance%')
            ->where('created_at', '<=', $end)
            ->sum('amount');

        return OpticsSaleDueCalculator::outstandingDue(
            (float) $this->total_amount,
            (float) $this->advance_payment,
            $paymentsSum,
            $advanceInTable,
        );
    }

    /**
     * Sum of optics receivables for all non-deleted sales booked on or before $asOnDate, valued as of that date.
     */
    public static function sumOutstandingDueAsOf(string $asOnDate): float
    {
        $total = 0.0;
        $end = $asOnDate.' 23:59:59';

        self::query()
            ->whereNull('deleted_at')
            ->where('created_at', '<=', $end)
            ->orderBy('id')
            ->chunkById(250, function ($sales) use ($asOnDate, &$total): void {
                /** @var \Illuminate\Database\Eloquent\Collection<int, self> $sales */
                foreach ($sales as $sale) {
                    $total += $sale->computeOutstandingDueAsOf($asOnDate);
                }
            });

        return round($total, 2);
    }

    /**
     * Receivable snapshot (as of end of $asOnDate) but only for sales created inside the month period.
     */
    public static function sumOutstandingDueAsOfForSalesCreatedBetween(string $periodStart, string $periodEnd, string $asOnDate): float
    {
        $total = 0.0;
        $start = $periodStart.' 00:00:00';
        $end = $periodEnd.' 23:59:59';

        self::query()
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('id')
            ->chunkById(250, function ($sales) use ($asOnDate, &$total): void {
                /** @var \Illuminate\Database\Eloquent\Collection<int, self> $sales */
                foreach ($sales as $sale) {
                    $total += $sale->computeOutstandingDueAsOf($asOnDate);
                }
            });

        return round($total, 2);
    }

    /**
     * Persist optics_sales.due_amount from payments (single source of truth for stored column).
     */
    public function recalculateDue(): float
    {
        $due = $this->computeOutstandingDue();

        if (abs((float) $this->due_amount - $due) > 0.009) {
            $this->forceFill(['due_amount' => $due])->saveQuietly();
        }

        return (float) $this->due_amount;
    }

    public function getItemsTotalAttribute()
    {
        return $this->items->sum('total_price');
    }

    public function getCustomerNameAttribute($value)
    {
        // If there's a patient, return patient name, otherwise return the stored customer name
        if ($this->patient) {
            return $this->patient->name;
        }

        return $this->attributes['customer_name'] ?? 'Walk-in Customer';
    }

    public function getCustomerPhoneAttribute($value)
    {
        // If there's a patient, return patient phone, otherwise return the stored customer phone
        if ($this->patient) {
            return $this->patient->phone;
        }

        return $this->attributes['customer_phone'] ?? null;
    }

    public function getCustomerEmailAttribute($value)
    {
        // If there's a patient, return patient email, otherwise return the stored customer email
        if ($this->patient) {
            return $this->patient->email;
        }

        return $this->attributes['customer_email'] ?? null;
    }
}
