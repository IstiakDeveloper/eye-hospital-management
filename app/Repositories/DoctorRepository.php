<?php

namespace App\Repositories;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class DoctorRepository
{
    protected $doctor;
    protected $user;

    public function __construct(Doctor $doctor, User $user)
    {
        $this->doctor = $doctor;
        $this->user = $user;
    }

    /**
     * Get all doctors.
     */
    public function getAll(): Collection
    {
        return $this->doctor->with('user')->get();
    }

    /**
     * Get all active doctors.
     */
    public function getAllActive(): Collection
    {
        return $this->doctor->with('user')
            ->where('is_available', true)
            ->get();
    }

    /**
     * Get all doctors with pagination.
     */
    public function getAllPaginated(int $perPage = 10): LengthAwarePaginator
    {
        return $this->doctor->with('user')->paginate($perPage);
    }

    /**
     * Get doctor by ID.
     */
    public function findById(int $id): ?Doctor
    {
        return $this->doctor->with('user')->find($id);
    }

    /**
     * Get doctor by user ID.
     */
    public function findByUserId(int $userId): ?Doctor
    {
        return $this->doctor->where('user_id', $userId)->with('user')->first();
    }

    public function createWithUser(array $userData, array $doctorData): ?Doctor
    {
        try {
            DB::beginTransaction();

            // Validate required fields
            if (empty($userData['name']) || empty($userData['email'])) {
                throw new \Exception('Name and email are required');
            }

            // Check if email already exists
            $existingUser = $this->user->where('email', $userData['email'])->first();
            if ($existingUser) {
                throw new \Exception('Email already exists');
            }

            // Set default password if not provided
            if (empty($userData['password'])) {
                $userData['password'] = 'doctor123'; // Default password
            }

            // Create user
            $userData['password'] = Hash::make($userData['password']);
            $userData['role_id'] = 2; // Doctor role

            Log::info('Creating user with data:', $userData);
            $user = $this->user->create($userData);

            if (!$user) {
                throw new \Exception('Failed to create user');
            }

            // Prepare doctor data
            $doctorData['user_id'] = $user->id;

            // Set default values for required fields
            $doctorData['specialization'] = $doctorData['specialization'] ?? 'General Practitioner';
            $doctorData['consultation_fee'] = $doctorData['consultation_fee'] ?? 500;
            $doctorData['is_available'] = $doctorData['is_available'] ?? true;

            Log::info('Creating doctor with data:', $doctorData);
            $doctor = $this->doctor->create($doctorData);

            if (!$doctor) {
                throw new \Exception('Failed to create doctor profile');
            }

            DB::commit();

            return $doctor->fresh('user');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Doctor creation failed: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            throw $e; // Re-throw to handle in controller
        }
    }

    /**
     * Create doctor from existing user.
     */
    public function createFromExistingUser(int $userId, array $doctorData): ?Doctor
    {
        try {
            DB::beginTransaction();

            // Find the user
            $user = $this->user->find($userId);
            if (!$user) {
                throw new \Exception('User not found');
            }

            // Check if user already has doctor profile
            $existingDoctor = $this->doctor->where('user_id', $userId)->first();
            if ($existingDoctor) {
                throw new \Exception('User already has a doctor profile');
            }

            // Update user role to doctor
            $user->update(['role_id' => 2]);

            // Create doctor profile
            $doctorData['user_id'] = $userId;

            // Set default values
            $doctorData['specialization'] = $doctorData['specialization'] ?? 'General Practitioner';
            $doctorData['consultation_fee'] = $doctorData['consultation_fee'] ?? 500;
            $doctorData['is_available'] = $doctorData['is_available'] ?? true;

            $doctor = $this->doctor->create($doctorData);

            DB::commit();

            return $doctor->fresh('user');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Doctor profile creation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update a doctor with user.
     */
    public function updateWithUser(int $id, array $userData, array $doctorData): bool
    {
        try {
            DB::beginTransaction();

            $doctor = $this->findById($id);

            if (!$doctor) {
                return false;
            }

            // Update user
            if (isset($userData['password']) && $userData['password']) {
                $userData['password'] = Hash::make($userData['password']);
            } else {
                unset($userData['password']);
            }

            $doctor->user->update($userData);

            // Update doctor profile
            $doctor->update($doctorData);

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            return false;
        }
    }

    /**
     * Update doctor availability.
     */
    public function updateAvailability(int $id, bool $isAvailable): bool
    {
        $doctor = $this->findById($id);

        if (!$doctor) {
            return false;
        }

        return $doctor->update(['is_available' => $isAvailable]);
    }

    /**
     * Delete a doctor with user.
     */
    public function deleteWithUser(int $id): bool
    {
        try {
            DB::beginTransaction();

            $doctor = $this->findById($id);

            if (!$doctor) {
                return false;
            }

            $userId = $doctor->user_id;

            // Delete doctor profile
            $doctor->delete();

            // Delete user
            $this->user->find($userId)->delete();

            DB::commit();

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            return false;
        }
    }

    /**
     * Get total doctor count.
     */
    public function getCount(): int
    {
        return $this->doctor->count();
    }

    // ========== Dashboard Specific Methods ==========

    /**
     * Get active doctor count.
     */
    public function getActiveCount(): int
    {
        return $this->doctor->where('is_available', true)->count();
    }

    /**
     * Get doctor performance statistics.
     */
    public function getDoctorStats(): array
    {
        return $this->doctor
            ->select([
                'users.name as doctor_name',
                'doctors.specialization',
                DB::raw('COUNT(DISTINCT appointments.patient_id) as total_patients'),
                DB::raw('COUNT(CASE WHEN MONTH(appointments.appointment_date) = MONTH(NOW()) AND YEAR(appointments.appointment_date) = YEAR(NOW()) THEN appointments.id END) as monthly_patients'),
                DB::raw('ROUND(AVG(CASE WHEN appointments.status = "completed" THEN 100 ELSE 0 END), 2) as completion_rate'),
                DB::raw('15 as average_consultation_time') // Placeholder - adjust based on your needs
            ])
            ->join('users', 'doctors.user_id', '=', 'users.id')
            ->leftJoin('appointments', 'doctors.id', '=', 'appointments.doctor_id')
            ->where('doctors.is_available', true)
            ->groupBy('doctors.id', 'users.name', 'doctors.specialization')
            ->get()
            ->toArray();
    }

    /**
     * Get doctors with their appointment counts.
     */
    public function getDoctorsWithAppointmentCounts(): Collection
    {
        return $this->doctor
            ->select([
                'doctors.*',
                'users.name as doctor_name',
                DB::raw('COUNT(appointments.id) as total_appointments'),
                DB::raw('COUNT(CASE WHEN appointments.status = "completed" THEN 1 END) as completed_appointments'),
                DB::raw('COUNT(CASE WHEN appointments.status = "pending" THEN 1 END) as pending_appointments')
            ])
            ->join('users', 'doctors.user_id', '=', 'users.id')
            ->leftJoin('appointments', 'doctors.id', '=', 'appointments.doctor_id')
            ->groupBy('doctors.id', 'users.name')
            ->get();
    }

    /**
     * Get top performing doctors.
     */
    public function getTopPerformingDoctors(int $limit = 5): Collection
    {
        return $this->doctor
            ->select([
                'doctors.*',
                'users.name as doctor_name',
                DB::raw('COUNT(DISTINCT appointments.patient_id) as unique_patients'),
                DB::raw('COUNT(appointments.id) as total_appointments'),
                DB::raw('ROUND(AVG(CASE WHEN appointments.status = "completed" THEN 100 ELSE 0 END), 2) as completion_rate')
            ])
            ->join('users', 'doctors.user_id', '=', 'users.id')
            ->leftJoin('appointments', 'doctors.id', '=', 'appointments.doctor_id')
            ->where('doctors.is_available', true)
            ->groupBy('doctors.id', 'users.name')
            ->orderBy('completion_rate', 'desc')
            ->orderBy('unique_patients', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get doctors by specialization.
     */
    public function getDoctorsBySpecialization(): array
    {
        return $this->doctor
            ->select([
                'specialization',
                DB::raw('COUNT(*) as count')
            ])
            ->whereNotNull('specialization')
            ->groupBy('specialization')
            ->get()
            ->toArray();
    }

    /**
     * Get monthly revenue by doctor.
     */
    public function getMonthlyRevenueByDoctor(): array
    {
        return $this->doctor
            ->select([
                'users.name as doctor_name',
                'doctors.consultation_fee',
                DB::raw('COUNT(CASE WHEN appointments.status = "completed" AND MONTH(appointments.appointment_date) = MONTH(NOW()) THEN 1 END) as completed_appointments'),
                DB::raw('(doctors.consultation_fee * COUNT(CASE WHEN appointments.status = "completed" AND MONTH(appointments.appointment_date) = MONTH(NOW()) THEN 1 END)) as monthly_revenue')
            ])
            ->join('users', 'doctors.user_id', '=', 'users.id')
            ->leftJoin('appointments', 'doctors.id', '=', 'appointments.doctor_id')
            ->groupBy('doctors.id', 'users.name', 'doctors.consultation_fee')
            ->orderBy('monthly_revenue', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Search doctors with filters.
     */
    public function searchDoctors(array $filters): Collection
    {
        $query = $this->doctor->with('user');

        if (!empty($filters['name'])) {
            $query->whereHas('user', function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['name'] . '%');
            });
        }

        if (!empty($filters['specialization'])) {
            $query->where('specialization', 'like', '%' . $filters['specialization'] . '%');
        }

        if (!empty($filters['is_available'])) {
            $query->where('is_available', $filters['is_available']);
        }

        if (!empty($filters['min_fee'])) {
            $query->where('consultation_fee', '>=', $filters['min_fee']);
        }

        if (!empty($filters['max_fee'])) {
            $query->where('consultation_fee', '<=', $filters['max_fee']);
        }

        return $query->get();
    }
}
