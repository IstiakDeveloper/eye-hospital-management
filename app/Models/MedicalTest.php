<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicalTest extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'price',
        'category',
        'duration_minutes',
        'is_active'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'duration_minutes' => 'integer'
    ];

    // Relationships
    public function patientTests(): HasMany
    {
        return $this->hasMany(PatientMedicalTest::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    // Helper Methods
    public static function getCategories(): array
    {
        return [
            'Laboratory' => 'Laboratory Tests',
            'Radiology' => 'Radiology/Imaging',
            'Cardiology' => 'Cardiology',
            'Pathology' => 'Pathology',
            'Ophthalmology' => 'Eye Tests',
            'Other' => 'Other Tests'
        ];
    }

    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 2);
    }

    /**
     * Get Income Report for medical tests in a specific date range
     */
    public static function getIncomeReport($fromDate, $toDate, $search = null)
    {
        $query = self::query()->where('is_active', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $tests = $query->get();
        $reportData = [];

        foreach ($tests as $test) {
            // Get all performed tests in the date range
            $performedTests = \DB::table('patient_medical_tests')
                ->where('medical_test_id', $test->id)
                ->whereBetween('test_date', [$fromDate, $toDate])
                ->whereIn('test_status', ['completed', 'in_progress', 'pending']) // Include all booked tests
                ->select(
                    'id',
                    'test_group_id',
                    'original_price',
                    'discount_amount',
                    'final_price'
                )
                ->get();

            if ($performedTests->isEmpty()) {
                continue; // Skip tests with no activity
            }

            $totalTests = $performedTests->count();
            $totalOriginalPrice = $performedTests->sum('original_price');
            $totalDiscount = $performedTests->sum('discount_amount');
            $totalIncome = $performedTests->sum('final_price');

            // Calculate proportional paid/due from test groups
            // Since payments are tracked at group level, we need to calculate this test's share
            $totalPaid = 0;
            $totalDue = 0;

            foreach ($performedTests as $performedTest) {
                // Get the test group for this test
                $testGroup = \DB::table('patient_test_groups')
                    ->where('id', $performedTest->test_group_id)
                    ->first();

                if ($testGroup) {
                    // Calculate this test's proportion of the group's final amount
                    $groupFinalAmount = $testGroup->final_amount;
                    if ($groupFinalAmount > 0) {
                        $testProportion = $performedTest->final_price / $groupFinalAmount;
                        $totalPaid += $testGroup->paid_amount * $testProportion;
                        $totalDue += $testGroup->due_amount * $testProportion;
                    }
                }
            }

            // Calculate average price per test
            $avgOriginalPrice = $totalTests > 0 ? $totalOriginalPrice / $totalTests : 0;
            $avgDiscount = $totalTests > 0 ? $totalDiscount / $totalTests : 0;
            $avgIncome = $totalTests > 0 ? $totalIncome / $totalTests : 0;

            $reportData[] = [
                'id' => $test->id,
                'sl' => null,
                'name' => $test->name,
                'code' => $test->code,
                'category' => $test->category ?? 'Other',
                'standard_price' => $test->price,

                // Test Information
                'total_tests' => $totalTests,
                'avg_original_price' => round($avgOriginalPrice, 2),
                'total_original_price' => round($totalOriginalPrice, 2),

                // Discount Information
                'avg_discount' => round($avgDiscount, 2),
                'total_discount' => round($totalDiscount, 2),

                // Income Information
                'avg_income' => round($avgIncome, 2),
                'total_income' => round($totalIncome, 2),
                'total_paid' => round($totalPaid, 2),
                'total_due' => round($totalDue, 2),
            ];
        }

        return $reportData;
    }
}
