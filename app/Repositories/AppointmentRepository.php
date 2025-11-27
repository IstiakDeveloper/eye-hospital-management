<?php

namespace App\Repositories;

use App\Models\Appointment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AppointmentRepository
{
    protected $appointment;

    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    /**
     * Get all appointments for today.
     */
    public function getTodayAppointments(): Collection
    {
        return $this->appointment->with(['patient', 'doctor', 'doctor.user'])
            ->where('appointment_date', today())
            ->orderBy('appointment_time')
            ->get();
    }

    /**
     * Get today's appointments with detailed information.
     */
    public function getTodayAppointmentsWithDetails(): Collection
    {
        return $this->appointment->with(['patient', 'doctor.user'])
            ->where('appointment_date', today())
            ->orderBy('appointment_time')
            ->get();
    }

    /**
     * Get today's appointments for a doctor.
     */
    public function getTodayAppointmentsForDoctor(int $doctorId): Collection
    {
        return $this->appointment->with(['patient'])
            ->where('appointment_date', today())
            ->where('doctor_id', $doctorId)
            ->orderBy('appointment_time')
            ->get();
    }

    /**
     * Get upcoming appointments for a doctor.
     */
    public function getUpcomingAppointmentsForDoctor(int $doctorId, int $limit = 10): Collection
    {
        return $this->appointment->with(['patient'])
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', '>', today())
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit($limit)
            ->get();
    }

    /**
     * Get recent appointments for a doctor.
     */
    public function getRecentAppointmentsForDoctor(int $doctorId, int $limit = 5): Collection
    {
        return $this->appointment->with(['patient'])
            ->where('doctor_id', $doctorId)
            ->where('appointment_date', '<=', today())
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get upcoming appointments.
     */
    public function getUpcomingAppointments(int $limit = 10): Collection
    {
        return $this->appointment->with(['patient', 'doctor.user'])
            ->where('appointment_date', '>', today())
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit($limit)
            ->get();
    }

    /**
     * Get all appointments for a patient.
     */
    public function getAllForPatient(int $patientId): Collection
    {
        return $this->appointment->with(['doctor', 'doctor.user'])
            ->where('patient_id', $patientId)
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->get();
    }

    /**
     * Get all appointments with pagination.
     */
    public function getAllPaginated(int $perPage = 10): LengthAwarePaginator
    {
        return $this->appointment->with(['patient', 'doctor', 'doctor.user'])
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get appointment by ID.
     */
    public function findById(int $id): ?Appointment
    {
        return $this->appointment->with(['patient', 'doctor', 'doctor.user'])->find($id);
    }

    /**
     * Create a new appointment.
     */
    public function create(array $data): Appointment
    {
        return $this->appointment->create($data);
    }

    /**
     * Update an appointment.
     */
    public function update(int $id, array $data): bool
    {
        $appointment = $this->findById($id);

        if (!$appointment) {
            return false;
        }

        return $appointment->update($data);
    }

    /**
     * Update appointment status.
     */
    public function updateStatus(int $id, string $status): bool
    {
        $appointment = $this->findById($id);

        if (!$appointment) {
            return false;
        }

        return $appointment->update(['status' => $status]);
    }

    /**
     * Mark appointment as completed.
     */
    public function markAsCompleted(int $id): bool
    {
        return $this->updateStatus($id, 'completed');
    }

    /**
     * Delete an appointment.
     */
    public function delete(int $id): bool
    {
        $appointment = $this->findById($id);

        if (!$appointment) {
            return false;
        }

        return $appointment->delete();
    }

    // ========== Dashboard Specific Methods ==========

    /**
     * Get today's appointments count.
     */
    public function getTodayAppointmentsCount(): int
    {
        return $this->appointment->where('appointment_date', today())->count();
    }

    /**
     * Get today's appointments count for a doctor.
     */
    public function getTodayAppointmentsCountForDoctor(int $doctorId): int
    {
        return $this->appointment
            ->where('appointment_date', today())
            ->where('doctor_id', $doctorId)
            ->count();
    }

    /**
     * Get pending appointments count.
     */
    public function getPendingAppointmentsCount(): int
    {
        return $this->appointment->where('status', 'pending')->count();
    }

    /**
     * Get completed appointments count.
     */
    public function getCompletedAppointmentsCount(): int
    {
        return $this->appointment->where('status', 'completed')->count();
    }

    /**
     * Get completed appointments today for a doctor.
     */
    public function getCompletedTodayForDoctor(int $doctorId): int
    {
        return $this->appointment
            ->where('appointment_date', today())
            ->where('doctor_id', $doctorId)
            ->where('status', 'completed')
            ->count();
    }

    /**
     * Get pending appointments today for a doctor.
     */
    public function getPendingTodayForDoctor(int $doctorId): int
    {
        return $this->appointment
            ->where('appointment_date', today())
            ->where('doctor_id', $doctorId)
            ->where('status', 'pending')
            ->count();
    }

    /**
     * Get total patients for a doctor.
     */
    public function getTotalPatientsForDoctor(int $doctorId): int
    {
        return $this->appointment
            ->where('doctor_id', $doctorId)
            ->distinct('patient_id')
            ->count('patient_id');
    }

    /**
     * Get monthly patients for a doctor.
     */
    public function getMonthlyPatientsForDoctor(int $doctorId): int
    {
        return $this->appointment
            ->where('doctor_id', $doctorId)
            ->whereMonth('appointment_date', now()->month)
            ->whereYear('appointment_date', now()->year)
            ->distinct('patient_id')
            ->count('patient_id');
    }

    /**
     * Get average consultation time for a doctor.
     */
    public function getAverageConsultationTime(int $doctorId): int
    {
        // This is a placeholder - you might need to add consultation_duration to appointments table
        // For now, returning a default value
        return 15; // 15 minutes average
    }

    /**
     * Get monthly revenue.
     */
    public function getMonthlyRevenue(): float
    {
        return $this->appointment
            ->join('doctors', 'appointments.doctor_id', '=', 'doctors.id')
            ->where('appointments.status', 'completed')
            ->whereMonth('appointments.appointment_date', now()->month)
            ->whereYear('appointments.appointment_date', now()->year)
            ->sum('doctors.consultation_fee');
    }

    /**
     * Get waiting patients count.
     */
    public function getWaitingPatientsCount(): int
    {
        return $this->appointment
            ->where('appointment_date', today())
            ->where('status', 'pending')
            ->count();
    }

    /**
     * Get today's appointments by doctor.
     */
    public function getTodayAppointmentsByDoctor(): array
    {
        return $this->appointment
            ->select([
                'users.name as doctor_name',
                DB::raw('COUNT(*) as appointments_count'),
                DB::raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as completed_count')
            ])
            ->join('doctors', 'appointments.doctor_id', '=', 'doctors.id')
            ->join('users', 'doctors.user_id', '=', 'users.id')
            ->where('appointment_date', today())
            ->groupBy('doctors.id', 'users.name')
            ->get()
            ->toArray();
    }
}
