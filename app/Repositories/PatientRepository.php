<?php

namespace App\Repositories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class PatientRepository
{
    /**
     * The patient model instance.
     *
     * @var \App\Models\Patient
     */
    protected $patient;

    /**
     * Create a new repository instance.
     *
     * @param  \App\Models\Patient  $patient
     * @return void
     */
    public function __construct(Patient $patient)
    {
        $this->patient = $patient;
    }

    /**
     * Get all patients.
     *
     * @return Collection
     */
    public function getAll(): Collection
    {
        return $this->patient->orderBy('created_at', 'desc')->get();
    }

    public function getRecent(int $limit = 5): Collection
    {
        return $this->patient->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get the total count of patients.
     *
     * @return int
     */
    public function getCount(): int
    {
        return $this->patient->count();
    }


    /**
     * Get all patients with pagination.
     *
     * @param  int  $perPage
     * @return LengthAwarePaginator
     */
    public function getAllPaginated(int $perPage = 10): LengthAwarePaginator
    {
        return $this->patient->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get patient by ID.
     *
     * @param  int  $id
     * @return Patient|null
     */
    public function findById(int $id): ?Patient
    {
        return $this->patient->find($id);
    }

    /**
     * Get patient by patient_id.
     *
     * @param  string  $patientId
     * @return Patient|null
     */
    public function findByPatientId(string $patientId): ?Patient
    {
        return $this->patient->where('patient_id', $patientId)->first();
    }

    /**
     * Search patients by name, phone or patient_id.
     *
     * @param  string  $term
     * @return Collection
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
     *
     * @param  array  $data
     * @return Patient
     */
    public function create(array $data): Patient
    {
        return $this->patient->create($data);
    }

    /**
     * Update a patient.
     *
     * @param  int  $id
     * @param  array  $data
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        $patient = $this->findById($id);

        if (!$patient) {
            return false;
        }

        return $patient->update($data);
    }

    /**
     * Delete a patient.
     *
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $patient = $this->findById($id);

        if (!$patient) {
            return false;
        }

        return $patient->delete();
    }
}
