<?php

namespace App\Repositories;

use App\Models\Appointment;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class AppointmentRepository
{
    /**
     * The appointment model instance.
     *
     * @var \App\Models\Appointment
     */
    protected $appointment;

    /**
     * Create a new repository instance.
     *
     * @param  \App\Models\Appointment  $appointment
     * @return void
     */
    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    /**
     * Get all appointments for today.
     *
     * @return Collection
     */
    public function getTodayAppointments(): Collection
    {
        return $this->appointment->with(['patient', 'doctor', 'doctor.user'])
            ->where('appointment_date', today())
            ->orderBy('appointment_time')
            ->get();
    }

    /**
     * Get today's appointments for a doctor.
     *
     * @param  int  $doctorId
     * @return Collection
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
     * Get all appointments for a patient.
     *
     * @param  int  $patientId
     * @return Collection
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
     *
     * @param  int  $perPage
     * @return LengthAwarePaginator
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
     *
     * @param  int  $id
     * @return Appointment|null
     */
    public function findById(int $id): ?Appointment
    {
        return $this->appointment->with(['patient', 'doctor', 'doctor.user'])->find($id);
    }

    /**
     * Create a new appointment.
     *
     * @param  array  $data
     * @return Appointment
     */
    public function create(array $data): Appointment
    {
        return $this->appointment->create($data);
    }

    /**
     * Update an appointment.
     *
     * @param  int  $id
     * @param  array  $data
     * @return bool
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
     *
     * @param  int  $id
     * @param  string  $status
     * @return bool
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
     * Delete an appointment.
     *
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $appointment = $this->findById($id);

        if (!$appointment) {
            return false;
        }

        return $appointment->delete();
    }
}
