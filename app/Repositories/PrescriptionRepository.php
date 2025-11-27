<?php

namespace App\Repositories;

use App\Models\Prescription;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PrescriptionRepository
{
    protected $prescription;

    public function __construct(Prescription $prescription)
    {
        $this->prescription = $prescription;
    }

    /**
     * Get all prescriptions.
     */
    public function getAll(): Collection
    {
        return $this->prescription
            ->with(['patient', 'doctor.user', 'appointment'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get all prescriptions with pagination.
     */
    public function getAllPaginated(int $perPage = 10): LengthAwarePaginator
    {
        return $this->prescription
            ->with(['patient', 'doctor.user', 'appointment'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get prescription by ID.
     */
    public function findById(int $id): ?Prescription
    {
        return $this->prescription
            ->with(['patient', 'doctor.user', 'appointment', 'prescriptionMedicines.medicine'])
            ->find($id);
    }

    /**
     * Get all prescriptions for a patient.
     */
    public function getAllForPatient(int $patientId): Collection
    {
        return $this->prescription
            ->with(['doctor.user', 'appointment', 'prescriptionMedicines.medicine'])
            ->where('patient_id', $patientId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get all prescriptions for a doctor.
     */
    public function getAllForDoctor(int $doctorId): Collection
    {
        return $this->prescription
            ->with(['patient', 'appointment', 'prescriptionMedicines.medicine'])
            ->where('doctor_id', $doctorId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Create a new prescription.
     */
    public function create(array $data): Prescription
    {
        return $this->prescription->create($data);
    }

    /**
     * Create a new prescription with medicines.
     */
    public function createWithMedicines(array $prescriptionData, array $medicines): ?Prescription
    {
        try {
            DB::beginTransaction();

            // Create prescription
            $prescription = $this->prescription->create($prescriptionData);

            // Add medicines to prescription
            foreach ($medicines as $medicineData) {
                $prescription->prescriptionMedicines()->create([
                    'medicine_id' => $medicineData['medicine_id'],
                    'dosage' => $medicineData['dosage'],
                    'duration' => $medicineData['duration'] ?? null,
                    'instructions' => $medicineData['instructions'] ?? null,
                ]);
            }

            DB::commit();

            return $prescription->fresh(['patient', 'doctor.user', 'appointment', 'prescriptionMedicines.medicine']);
        } catch (\Exception $e) {
            DB::rollBack();
            return null;
        }
    }

    /**
     * Update a prescription.
     */
    public function update(int $id, array $data): bool
    {
        $prescription = $this->findById($id);

        if (!$prescription) {
            return false;
        }

        return $prescription->update($data);
    }

    /**
     * Update a prescription with medicines.
     */
    public function updateWithMedicines(int $id, array $prescriptionData, array $medicines): bool
    {
        try {
            DB::beginTransaction();

            $prescription = $this->findById($id);

            if (!$prescription) {
                return false;
            }

            // Update prescription
            $prescription->update($prescriptionData);

            // Delete existing prescription medicines
            $prescription->prescriptionMedicines()->delete();

            // Add new medicines to prescription
            foreach ($medicines as $medicineData) {
                $prescription->prescriptionMedicines()->create([
                    'medicine_id' => $medicineData['medicine_id'],
                    'dosage' => $medicineData['dosage'],
                    'duration' => $medicineData['duration'] ?? null,
                    'instructions' => $medicineData['instructions'] ?? null,
                ]);
            }

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            return false;
        }
    }

    /**
     * Delete a prescription.
     */
    public function delete(int $id): bool
    {
        $prescription = $this->findById($id);

        if (!$prescription) {
            return false;
        }

        return $prescription->delete();
    }

    // ========== Dashboard Specific Methods ==========

    /**
     * Get recent prescriptions for a doctor.
     */
    public function getRecentForDoctor(int $doctorId, int $limit = 5): Collection
    {
        return $this->prescription
            ->with(['patient', 'appointment'])
            ->where('doctor_id', $doctorId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get follow-up patients for a doctor.
     */
    public function getFollowUpPatientsForDoctor(int $doctorId): Collection
    {
        return $this->prescription
            ->select([
                'patients.id',
                'patients.name',
                'patients.patient_id',
                'prescriptions.followup_date',
                'prescriptions.diagnosis'
            ])
            ->join('patients', 'prescriptions.patient_id', '=', 'patients.id')
            ->where('prescriptions.doctor_id', $doctorId)
            ->where('prescriptions.followup_date', '<=', today())
            ->whereNotNull('prescriptions.followup_date')
            // Removed followup_completed_at check for now
            ->orderBy('prescriptions.followup_date')
            ->get();
    }

    /**
     * Get today's prescriptions count.
     */
    public function getTodayCount(): int
    {
        return $this->prescription->whereDate('created_at', today())->count();
    }

    /**
     * Get this week's prescriptions count.
     */
    public function getThisWeekCount(): int
    {
        return $this->prescription
            ->whereBetween('created_at', [
                now()->startOfWeek(),
                now()->endOfWeek()
            ])
            ->count();
    }

    /**
     * Get monthly prescriptions count.
     */
    public function getMonthlyCount(): int
    {
        return $this->prescription
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
    }

    /**
     * Get today's prescriptions count for a doctor.
     */
    public function getTodayCountForDoctor(int $doctorId): int
    {
        return $this->prescription
            ->where('doctor_id', $doctorId)
            ->whereDate('created_at', today())
            ->count();
    }

    /**
     * Get recent prescriptions.
     */
    public function getRecent(int $limit = 10): Collection
    {
        return $this->prescription
            ->with(['patient', 'doctor.user'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get prescription statistics.
     */
    public function getPrescriptionStatistics(): array
    {
        return [
            'total_prescriptions' => $this->prescription->count(),
            'today_prescriptions' => $this->getTodayCount(),
            'this_week_prescriptions' => $this->getThisWeekCount(),
            'this_month_prescriptions' => $this->getMonthlyCount(),
            'prescriptions_with_followup' => $this->getPrescriptionsWithFollowUp(),
            'overdue_followups' => $this->getOverdueFollowUps(),
        ];
    }

    /**
     * Get prescriptions with follow-up dates.
     */
    public function getPrescriptionsWithFollowUp(): int
    {
        return $this->prescription
            ->whereNotNull('followup_date')
            ->count();
    }

    /**
     * Get overdue follow-ups.
     */
    public function getOverdueFollowUps(): int
    {
        return $this->prescription
            ->where('followup_date', '<', today())
            ->whereNotNull('followup_date')
            // Removed followup_completed_at check for now
            ->count();
    }

    /**
     * Get prescriptions by doctor statistics.
     */
    public function getPrescriptionsByDoctorStats(): array
    {
        return $this->prescription
            ->select([
                'users.name as doctor_name',
                DB::raw('COUNT(*) as total_prescriptions'),
                DB::raw('COUNT(CASE WHEN DATE(prescriptions.created_at) = CURDATE() THEN 1 END) as today_prescriptions'),
                DB::raw('COUNT(CASE WHEN MONTH(prescriptions.created_at) = MONTH(NOW()) THEN 1 END) as month_prescriptions'),
                DB::raw('COUNT(CASE WHEN prescriptions.followup_date IS NOT NULL THEN 1 END) as prescriptions_with_followup')
            ])
            ->join('doctors', 'prescriptions.doctor_id', '=', 'doctors.id')
            ->join('users', 'doctors.user_id', '=', 'users.id')
            ->groupBy('doctors.id', 'users.name')
            ->orderBy('total_prescriptions', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Get common diagnoses.
     */
    public function getCommonDiagnoses(int $limit = 10): array
    {
        return $this->prescription
            ->select([
                'diagnosis',
                DB::raw('COUNT(*) as count')
            ])
            ->whereNotNull('diagnosis')
            ->where('diagnosis', '!=', '')
            ->groupBy('diagnosis')
            ->orderBy('count', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get monthly prescription trends.
     */
    public function getMonthlyTrends(): array
    {
        return $this->prescription
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
     * Search prescriptions with filters.
     */
    public function searchPrescriptions(array $filters): Collection
    {
        $query = $this->prescription->with(['patient', 'doctor.user', 'appointment']);

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

        if (!empty($filters['doctor_id'])) {
            $query->where('doctor_id', $filters['doctor_id']);
        }

        if (!empty($filters['diagnosis'])) {
            $query->where('diagnosis', 'like', '%' . $filters['diagnosis'] . '%');
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['has_followup'])) {
            if ($filters['has_followup'] === 'yes') {
                $query->whereNotNull('followup_date');
            } else {
                $query->whereNull('followup_date');
            }
        }

        if (!empty($filters['followup_status'])) {
            if ($filters['followup_status'] === 'overdue') {
                $query->where('followup_date', '<', today())
                      ->whereNotNull('followup_date');
            } elseif ($filters['followup_status'] === 'upcoming') {
                $query->where('followup_date', '>=', today())
                      ->whereNotNull('followup_date');
            } elseif ($filters['followup_status'] === 'completed') {
                // For now, we consider completed if followup_date is null after being set
                // Later you can use followup_completed_at column
                $query->whereNull('followup_date');
            }
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get prescriptions by date range.
     */
    public function getPrescriptionsByDateRange(string $startDate, string $endDate): Collection
    {
        return $this->prescription
            ->with(['patient', 'doctor.user', 'medicines'])
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Mark follow-up as completed.
     */
    public function markFollowUpCompleted(int $id): bool
    {
        $prescription = $this->findById($id);

        if (!$prescription) {
            return false;
        }

        // For now, we'll update followup_date to null to mark as completed
        // Later you can add followup_completed_at column
        return $prescription->update(['followup_date' => null]);
    }

    /**
     * Get patients with upcoming follow-ups.
     */
    public function getUpcomingFollowUps(int $days = 7): Collection
    {
        return $this->prescription
            ->with(['patient', 'doctor.user'])
            ->where('followup_date', '>=', today())
            ->where('followup_date', '<=', today()->addDays($days))
            ->whereNotNull('followup_date')
            // Removed followup_completed_at check for now
            ->orderBy('followup_date')
            ->get();
    }
}
