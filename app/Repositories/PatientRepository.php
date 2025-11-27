<?php

namespace App\Repositories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PatientRepository
{
    protected $patient;

    public function __construct(Patient $patient)
    {
        $this->patient = $patient;
    }

    /**
     * Get all patients.
     */
    public function getAll(): Collection
    {
        return $this->patient->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get all patients with pagination.
     */
    public function getAllPaginated(int $perPage = 10): LengthAwarePaginator
    {
        return $this->patient->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get doctor's patients with pagination.
     */
    public function getDoctorPatientsPaginated(string|int $doctorId, int $perPage = 10): LengthAwarePaginator
    {
        $doctorId = (int) $doctorId;

        return $this->patient
            ->whereExists(function ($query) use ($doctorId) {
                $query->select(DB::raw(1))
                    ->from('appointments')
                    ->whereColumn('appointments.patient_id', 'patients.id')
                    ->where('appointments.doctor_id', $doctorId);
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get doctor's patients (all).
     */
    public function getDoctorPatients(string|int $doctorId): Collection
    {
        $doctorId = (int) $doctorId;

        return $this->patient
            ->whereExists(function ($query) use ($doctorId) {
                $query->select(DB::raw(1))
                    ->from('appointments')
                    ->whereColumn('appointments.patient_id', 'patients.id')
                    ->where('appointments.doctor_id', $doctorId);
            })
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Check if doctor has access to patient.
     */
    public function doctorHasAccessToPatient(string|int $doctorId, string|int $patientId): bool
    {
        return DB::table('appointments')
            ->where('doctor_id', (int) $doctorId)
            ->where('patient_id', (int) $patientId)
            ->exists();
    }

    /**
     * Search doctor's patients.
     */
    public function searchDoctorPatients(string|int $doctorId, string $term): Collection
    {
        $doctorId = (int) $doctorId;

        return $this->patient
            ->whereExists(function ($query) use ($doctorId) {
                $query->select(DB::raw(1))
                    ->from('appointments')
                    ->whereColumn('appointments.patient_id', 'patients.id')
                    ->where('appointments.doctor_id', $doctorId);
            })
            ->where(function ($query) use ($term) {
                $query->where('name', 'like', '%' . $term . '%')
                    ->orWhere('phone', 'like', '%' . $term . '%')
                    ->orWhere('patient_id', 'like', '%' . $term . '%');
            })
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get doctor's recent patients.
     */
    public function getDoctorRecentPatients(string|int $doctorId, int $limit = 5): Collection
    {
        $doctorId = (int) $doctorId;

        return $this->patient
            ->select('patients.*')
            ->join('appointments', 'patients.id', '=', 'appointments.patient_id')
            ->where('appointments.doctor_id', $doctorId)
            ->groupBy('patients.id')
            ->orderBy('patients.created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get doctor's patient count.
     */
    public function getDoctorPatientCount(string|int $doctorId): int
    {
        $doctorId = (int) $doctorId;

        return $this->patient
            ->whereExists(function ($query) use ($doctorId) {
                $query->select(DB::raw(1))
                    ->from('appointments')
                    ->whereColumn('appointments.patient_id', 'patients.id')
                    ->where('appointments.doctor_id', $doctorId);
            })
            ->count();
    }

    /**
     * Get doctor's today's patient count.
     */
    public function getDoctorTodayPatientCount(string|int $doctorId): int
    {
        return DB::table('appointments')
            ->where('doctor_id', (int) $doctorId)
            ->whereDate('appointment_date', today())
            ->distinct('patient_id')
            ->count('patient_id');
    }

    /**
     * Get doctor's monthly patient count.
     */
    public function getDoctorMonthlyPatientCount(string|int $doctorId): int
    {
        return DB::table('appointments')
            ->where('doctor_id', (int) $doctorId)
            ->whereMonth('appointment_date', now()->month)
            ->whereYear('appointment_date', now()->year)
            ->distinct('patient_id')
            ->count('patient_id');
    }

    /**
     * Get doctor's patients with latest appointment.
     */
    public function getDoctorPatientsWithLatestAppointment(string|int $doctorId, int $limit = 10): Collection
    {
        $doctorId = (int) $doctorId;

        return $this->patient
            ->select([
                'patients.*',
                'latest_appointments.appointment_date',
                'latest_appointments.appointment_time',
                'latest_appointments.status as appointment_status'
            ])
            ->joinSub(
                DB::table('appointments')
                    ->select([
                        'patient_id',
                        'appointment_date',
                        'appointment_time',
                        'status',
                        DB::raw('ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY appointment_date DESC, appointment_time DESC) as rn')
                    ])
                    ->where('doctor_id', $doctorId),
                'latest_appointments',
                function ($join) {
                    $join->on('patients.id', '=', 'latest_appointments.patient_id')
                        ->where('latest_appointments.rn', '=', 1);
                }
            )
            ->orderBy('latest_appointments.appointment_date', 'desc')
            ->orderBy('latest_appointments.appointment_time', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get doctor's patients needing follow-up.
     */
    public function getDoctorPatientsNeedingFollowUp(string|int $doctorId): Collection
    {
        $doctorId = (int) $doctorId;

        return $this->patient
            ->join('prescriptions', 'patients.id', '=', 'prescriptions.patient_id')
            ->select('patients.*', 'prescriptions.followup_date', 'prescriptions.diagnosis')
            ->where('prescriptions.doctor_id', $doctorId)
            ->where('prescriptions.followup_date', '<=', today())
            ->whereNull('prescriptions.followup_completed_at')
            ->orderBy('prescriptions.followup_date')
            ->get();
    }

    /**
     * Get doctor's patient statistics.
     */
    public function getDoctorPatientStatistics(string|int $doctorId): array
    {
        $doctorId = (int) $doctorId;

        $baseQuery = $this->patient
            ->whereExists(function ($query) use ($doctorId) {
                $query->select(DB::raw(1))
                    ->from('appointments')
                    ->whereColumn('appointments.patient_id', 'patients.id')
                    ->where('appointments.doctor_id', $doctorId);
            });

        return [
            'total' => $baseQuery->count(),
            'today' => $this->getDoctorTodayPatientCount($doctorId),
            'this_month' => $this->getDoctorMonthlyPatientCount($doctorId),
            'gender_distribution' => $this->getDoctorPatientGenderDistribution($doctorId),
            'age_distribution' => $this->getDoctorPatientAgeDistribution($doctorId)
        ];
    }

    /**
     * Get doctor's patient gender distribution.
     */
    public function getDoctorPatientGenderDistribution(string|int $doctorId): array
    {
        $doctorId = (int) $doctorId;

        return $this->patient
            ->select([
                'gender',
                DB::raw('COUNT(*) as count')
            ])
            ->whereExists(function ($query) use ($doctorId) {
                $query->select(DB::raw(1))
                    ->from('appointments')
                    ->whereColumn('appointments.patient_id', 'patients.id')
                    ->where('appointments.doctor_id', $doctorId);
            })
            ->whereNotNull('gender')
            ->groupBy('gender')
            ->get()
            ->toArray();
    }

    /**
     * Get doctor's patient age distribution.
     */
    public function getDoctorPatientAgeDistribution(string|int $doctorId): array
    {
        $doctorId = (int) $doctorId;

        return $this->patient
            ->select([
                DB::raw('
                    CASE
                        WHEN YEAR(NOW()) - YEAR(date_of_birth) < 18 THEN "Under 18"
                        WHEN YEAR(NOW()) - YEAR(date_of_birth) BETWEEN 18 AND 30 THEN "18-30"
                        WHEN YEAR(NOW()) - YEAR(date_of_birth) BETWEEN 31 AND 50 THEN "31-50"
                        WHEN YEAR(NOW()) - YEAR(date_of_birth) BETWEEN 51 AND 70 THEN "51-70"
                        ELSE "Over 70"
                    END as age_group
                '),
                DB::raw('COUNT(*) as count')
            ])
            ->whereExists(function ($query) use ($doctorId) {
                $query->select(DB::raw(1))
                    ->from('appointments')
                    ->whereColumn('appointments.patient_id', 'patients.id')
                    ->where('appointments.doctor_id', $doctorId);
            })
            ->whereNotNull('date_of_birth')
            ->groupBy('age_group')
            ->get()
            ->toArray();
    }

    // ========== Original Methods ==========

    /**
     * Get recent patients.
     */
    public function getRecent(int $limit = 5): Collection
    {
        return $this->patient->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get the total count of patients.
     */
    public function getCount(): int
    {
        return $this->patient->count();
    }

    /**
     * Get patient by ID.
     */
    public function findById(string|int $id): ?Patient
    {
        return $this->patient->find((int) $id);
    }

    /**
     * Get patient by patient_id.
     */
    public function findByPatientId(string $patientId): ?Patient
    {
        return $this->patient->where('patient_id', $patientId)->first();
    }

    /**
     * Search patients by name, phone or patient_id.
     */
    public function search(string $term): Collection
    {
        return $this->patient->where('name', 'like', '%' . $term . '%')
            ->orWhere('phone', 'like', '%' . $term . '%')
            ->orWhere('patient_id', 'like', '%' . $term . '%')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Create a new patient.
     */
    public function create(array $data): Patient
    {
        return $this->patient->create($data);
    }

    /**
     * Update a patient.
     */
    public function update(string|int $id, array $data): bool
    {
        $patient = $this->findById($id);

        if (!$patient) {
            return false;
        }

        return $patient->update($data);
    }

    /**
     * Delete a patient.
     */
    public function delete(string|int $id): bool
    {
        $patient = $this->findById($id);

        if (!$patient) {
            return false;
        }

        return $patient->delete();
    }

    /**
     * Get today's patient registrations count.
     */
    public function getTodayCount(): int
    {
        return $this->patient->whereDate('created_at', today())->count();
    }

    /**
     * Get monthly patient registrations count.
     */
    public function getMonthlyCount(): int
    {
        return $this->patient
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
    }

    /**
     * Get recent patients with vision test status.
     */
    public function getRecentWithVisionTestStatus(int $limit = 10): Collection
    {
        return $this->patient
            ->select([
                'patients.*',
                DB::raw('(SELECT COUNT(*) FROM vision_tests WHERE vision_tests.patient_id = patients.id) as vision_tests_count'),
                DB::raw('(SELECT MAX(test_date) FROM vision_tests WHERE vision_tests.patient_id = patients.id) as latest_vision_test_date')
            ])
            ->with([
                'visionTests' => function ($query) {
                    $query->latest('test_date')->first();
                }
            ])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get patients without recent vision test.
     */
    public function getPatientsWithoutRecentVisionTest(int $limit = 8): Collection
    {
        $threeMonthsAgo = now()->subMonths(3);

        return $this->patient
            ->leftJoin('vision_tests', function ($join) use ($threeMonthsAgo) {
                $join->on('patients.id', '=', 'vision_tests.patient_id')
                    ->where('vision_tests.test_date', '>=', $threeMonthsAgo);
            })
            ->select([
                'patients.id',
                'patients.patient_id',
                'patients.name',
                'patients.phone',
                'patients.email',
                'patients.address',
                'patients.date_of_birth',
                'patients.gender',
                'patients.medical_history',
                'patients.created_at',
                'patients.updated_at',
                'patients.registered_by'
            ])
            ->whereNull('vision_tests.patient_id')
            ->orderBy('patients.created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get patients with their latest vision test.
     */
    public function getPatientsWithLatestVisionTest(): Collection
    {
        return $this->patient
            ->with([
                'visionTests' => function ($query) {
                    $query->latest('test_date')->limit(1);
                }
            ])
            ->get();
    }

    /**
     * Get patient statistics by month.
     */
    public function getMonthlyStatistics(): array
    {
        return $this->patient
            ->select([
                DB::raw('MONTH(created_at) as month'),
                DB::raw('YEAR(created_at) as year'),
                DB::raw('COUNT(*) as count')
            ])
            ->whereYear('created_at', now()->year)
            ->groupBy('year', 'month')
            ->orderBy('month')
            ->get()
            ->toArray();
    }

    /**
     * Get patients by gender distribution.
     */
    public function getGenderDistribution(): array
    {
        return $this->patient
            ->select([
                'gender',
                DB::raw('COUNT(*) as count')
            ])
            ->whereNotNull('gender')
            ->groupBy('gender')
            ->get()
            ->toArray();
    }

    /**
     * Get patients by age groups.
     */
    public function getAgeGroupDistribution(): array
    {
        return $this->patient
            ->select([
                DB::raw('
                    CASE
                        WHEN YEAR(NOW()) - YEAR(date_of_birth) < 18 THEN "Under 18"
                        WHEN YEAR(NOW()) - YEAR(date_of_birth) BETWEEN 18 AND 30 THEN "18-30"
                        WHEN YEAR(NOW()) - YEAR(date_of_birth) BETWEEN 31 AND 50 THEN "31-50"
                        WHEN YEAR(NOW()) - YEAR(date_of_birth) BETWEEN 51 AND 70 THEN "51-70"
                        ELSE "Over 70"
                    END as age_group
                '),
                DB::raw('COUNT(*) as count')
            ])
            ->whereNotNull('date_of_birth')
            ->groupBy('age_group')
            ->get()
            ->toArray();
    }

    /**
     * Get recently registered patients with basic info.
     */
    public function getRecentWithBasicInfo(int $limit = 10): Collection
    {
        return $this->patient
            ->select(['id', 'patient_id', 'name', 'phone', 'email', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get patients who need follow-up appointments.
     */
    public function getPatientsNeedingFollowUp(): Collection
    {
        return $this->patient
            ->join('prescriptions', 'patients.id', '=', 'prescriptions.patient_id')
            ->select('patients.*', 'prescriptions.followup_date', 'prescriptions.diagnosis')
            ->where('prescriptions.followup_date', '<=', today())
            ->whereNull('prescriptions.followup_completed_at')
            ->orderBy('prescriptions.followup_date')
            ->get();
    }

    /**
     * Search patients with advanced filters.
     */
    public function advancedSearch(array $filters): Collection
    {
        $query = $this->patient->newQuery();

        if (!empty($filters['name'])) {
            $query->where('name', 'like', '%' . $filters['name'] . '%');
        }

        if (!empty($filters['phone'])) {
            $query->where('phone', 'like', '%' . $filters['phone'] . '%');
        }

        if (!empty($filters['patient_id'])) {
            $query->where('patient_id', 'like', '%' . $filters['patient_id'] . '%');
        }

        if (!empty($filters['gender'])) {
            $query->where('gender', $filters['gender']);
        }

        if (!empty($filters['age_from']) && !empty($filters['age_to'])) {
            $query->whereRaw(
                'YEAR(NOW()) - YEAR(date_of_birth) BETWEEN ? AND ?',
                [$filters['age_from'], $filters['age_to']]
            );
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get patient count by registration date range.
     */
    public function getCountByDateRange(string $startDate, string $endDate): int
    {
        return $this->patient
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->count();
    }

    /**
     * Get patients registered this week.
     */
    public function getThisWeekCount(): int
    {
        return $this->patient
            ->whereBetween('created_at', [
                now()->startOfWeek(),
                now()->endOfWeek()
            ])
            ->count();
    }

    /**
     * Search all patients with pagination.
     */
    public function searchPaginated(string $term, int $perPage = 10): LengthAwarePaginator
    {
        return $this->patient->where('name', 'like', '%' . $term . '%')
            ->orWhere('phone', 'like', '%' . $term . '%')
            ->orWhere('patient_id', 'like', '%' . $term . '%')
            ->orWhere('email', 'like', '%' . $term . '%')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Search doctor's patients with pagination.
     */
    public function searchDoctorPatientsPaginated(string|int $doctorId, string $term, int $perPage = 10): LengthAwarePaginator
    {
        $doctorId = (int) $doctorId;

        return $this->patient
            ->whereExists(function ($query) use ($doctorId) {
                $query->select(DB::raw(1))
                    ->from('appointments')
                    ->whereColumn('appointments.patient_id', 'patients.id')
                    ->where('appointments.doctor_id', $doctorId);
            })
            ->where(function ($query) use ($term) {
                $query->where('name', 'like', '%' . $term . '%')
                    ->orWhere('phone', 'like', '%' . $term . '%')
                    ->orWhere('patient_id', 'like', '%' . $term . '%')
                    ->orWhere('email', 'like', '%' . $term . '%');
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }
}
