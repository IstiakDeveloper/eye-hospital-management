<?php

namespace App\Repositories;

use App\Models\VisionTest;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class VisionTestRepository
{
    protected $visionTest;

    public function __construct(VisionTest $visionTest)
    {
        $this->visionTest = $visionTest;
    }

    /**
     * Get all vision tests for a patient.
     */
    public function getAllForPatient(int $patientId): Collection
    {
        return $this->visionTest->where('patient_id', $patientId)
            ->orderBy('test_date', 'desc')
            ->get();
    }

    /**
     * Get latest vision test for a patient.
     */
    public function getLatestForPatient(int $patientId): ?VisionTest
    {
        return $this->visionTest->where('patient_id', $patientId)
            ->orderBy('test_date', 'desc')
            ->first();
    }

    /**
     * Get vision test by ID.
     */
    public function findById(int $id): ?VisionTest
    {
        return $this->visionTest->find($id);
    }

    /**
     * Create a new vision test.
     */
    public function create(array $data): VisionTest
    {
        return $this->visionTest->create($data);
    }

    /**
     * Update a vision test.
     */
    public function update(int $id, array $data): bool
    {
        $visionTest = $this->findById($id);

        if (!$visionTest) {
            return false;
        }

        return $visionTest->update($data);
    }

    /**
     * Delete a vision test.
     */
    public function delete(int $id): bool
    {
        $visionTest = $this->findById($id);

        if (!$visionTest) {
            return false;
        }

        return $visionTest->delete();
    }

    // ========== Dashboard Specific Methods ==========

    /**
     * Get recent vision tests.
     */
    public function getRecent(int $limit = 5): Collection
    {
        return $this->visionTest
            ->with(['patient', 'performedBy'])
            ->orderBy('test_date', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get recent vision tests with patient details.
     */
    public function getRecentWithPatientDetails(int $limit = 6): Collection
    {
        return $this->visionTest
            ->with(['patient', 'performedBy'])
            ->orderBy('test_date', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get today's vision tests count.
     */
    public function getTodayCount(): int
    {
        return $this->visionTest->whereDate('test_date', today())->count();
    }

    /**
     * Get this week's vision tests count.
     */
    public function getThisWeekCount(): int
    {
        return $this->visionTest
            ->whereBetween('test_date', [
                now()->startOfWeek(),
                now()->endOfWeek()
            ])
            ->count();
    }

    /**
     * Get monthly vision tests count.
     */
    public function getMonthlyCount(): int
    {
        return $this->visionTest
            ->whereMonth('test_date', now()->month)
            ->whereYear('test_date', now()->year)
            ->count();
    }

    /**
     * Get vision tests by performer.
     */
    public function getTestsByPerformer(int $userId): Collection
    {
        return $this->visionTest
            ->with(['patient'])
            ->where('performed_by', $userId)
            ->orderBy('test_date', 'desc')
            ->get();
    }

    /**
     * Get vision test statistics.
     */
    public function getVisionTestStatistics(): array
    {
        return [
            'total_tests' => $this->visionTest->count(),
            'today_tests' => $this->getTodayCount(),
            'this_week_tests' => $this->getThisWeekCount(),
            'this_month_tests' => $this->getMonthlyCount(),
            'tests_with_power_issues' => $this->getTestsWithPowerIssues(),
            'tests_with_pressure_issues' => $this->getTestsWithPressureIssues(),
        ];
    }

    /**
     * Get tests with power issues (refractive errors).
     */
    public function getTestsWithPowerIssues(): int
    {
        return $this->visionTest
            ->where(function($query) {
                $query->where('right_eye_sphere', '!=', 0)
                      ->orWhere('left_eye_sphere', '!=', 0)
                      ->orWhere('right_eye_cylinder', '!=', 0)
                      ->orWhere('left_eye_cylinder', '!=', 0);
            })
            ->count();
    }

    /**
     * Get tests with pressure issues.
     */
    public function getTestsWithPressureIssues(): int
    {
        return $this->visionTest
            ->where(function($query) {
                $query->whereRaw('CAST(SUBSTRING_INDEX(right_eye_pressure, " ", 1) AS DECIMAL) > 21')
                      ->orWhereRaw('CAST(SUBSTRING_INDEX(left_eye_pressure, " ", 1) AS DECIMAL) > 21');
            })
            ->count();
    }

    /**
     * Get patients needing follow-up vision tests.
     */
    public function getPatientsNeedingFollowUp(): Collection
    {
        $sixMonthsAgo = now()->subMonths(6);

        return $this->visionTest
            ->select('patient_id', DB::raw('MAX(test_date) as last_test_date'))
            ->with(['patient'])
            ->groupBy('patient_id')
            ->having('last_test_date', '<', $sixMonthsAgo)
            ->get();
    }

    /**
     * Get vision tests by date range.
     */
    public function getTestsByDateRange(string $startDate, string $endDate): Collection
    {
        return $this->visionTest
            ->with(['patient', 'performedBy'])
            ->whereDate('test_date', '>=', $startDate)
            ->whereDate('test_date', '<=', $endDate)
            ->orderBy('test_date', 'desc')
            ->get();
    }

    /**
     * Get monthly vision test trends.
     */
    public function getMonthlyTrends(): array
    {
        return $this->visionTest
            ->select([
                DB::raw('MONTH(test_date) as month'),
                DB::raw('YEAR(test_date) as year'),
                DB::raw('COUNT(*) as count')
            ])
            ->whereYear('test_date', now()->year)
            ->groupBy('year', 'month')
            ->orderBy('month')
            ->get()
            ->toArray();
    }

    /**
     * Get vision tests by performer statistics.
     */
    public function getPerformerStatistics(): array
    {
        return $this->visionTest
            ->select([
                'users.name as performer_name',
                DB::raw('COUNT(*) as total_tests'),
                DB::raw('COUNT(CASE WHEN DATE(test_date) = CURDATE() THEN 1 END) as today_tests'),
                DB::raw('COUNT(CASE WHEN MONTH(test_date) = MONTH(NOW()) THEN 1 END) as month_tests')
            ])
            ->join('users', 'vision_tests.performed_by', '=', 'users.id')
            ->groupBy('users.id', 'users.name')
            ->orderBy('total_tests', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Search vision tests with filters.
     */
    public function searchTests(array $filters): Collection
    {
        $query = $this->visionTest->with(['patient', 'performedBy']);

        if (!empty($filters['patient_name'])) {
            $query->whereHas('patient', function($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['patient_name'] . '%');
            });
        }

        if (!empty($filters['patient_id'])) {
            $query->whereHas('patient', function($q) use ($filters) {
                $q->where('patient_id', 'like', '%' . $filters['patient_id'] . '%');
            });
        }

        if (!empty($filters['performed_by'])) {
            $query->where('performed_by', $filters['performed_by']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('test_date', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('test_date', '<=', $filters['date_to']);
        }

        if (!empty($filters['has_power_issues'])) {
            $query->where(function($q) {
                $q->where('right_eye_sphere', '!=', 0)
                  ->orWhere('left_eye_sphere', '!=', 0)
                  ->orWhere('right_eye_cylinder', '!=', 0)
                  ->orWhere('left_eye_cylinder', '!=', 0);
            });
        }

        return $query->orderBy('test_date', 'desc')->get();
    }

    /**
     * Get average vision scores.
     */
    public function getAverageVisionScores(): array
    {
        // This is a simplified calculation - you might want to make it more sophisticated
        $results = $this->visionTest
            ->selectRaw('
                AVG(CASE
                    WHEN right_eye_vision = "6/6" THEN 100
                    WHEN right_eye_vision = "6/9" THEN 80
                    WHEN right_eye_vision = "6/12" THEN 60
                    WHEN right_eye_vision = "6/18" THEN 40
                    WHEN right_eye_vision = "6/24" THEN 30
                    WHEN right_eye_vision = "6/36" THEN 20
                    WHEN right_eye_vision = "6/60" THEN 10
                    ELSE 5
                END) as avg_right_eye_score,
                AVG(CASE
                    WHEN left_eye_vision = "6/6" THEN 100
                    WHEN left_eye_vision = "6/9" THEN 80
                    WHEN left_eye_vision = "6/12" THEN 60
                    WHEN left_eye_vision = "6/18" THEN 40
                    WHEN left_eye_vision = "6/24" THEN 30
                    WHEN left_eye_vision = "6/36" THEN 20
                    WHEN left_eye_vision = "6/60" THEN 10
                    ELSE 5
                END) as avg_left_eye_score
            ')
            ->first();

        return [
            'right_eye_average' => round($results->avg_right_eye_score ?? 0, 2),
            'left_eye_average' => round($results->avg_left_eye_score ?? 0, 2),
        ];
    }
}
