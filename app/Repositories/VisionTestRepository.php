<?php

namespace App\Repositories;

use App\Models\VisionTest;
use Illuminate\Database\Eloquent\Collection;

class VisionTestRepository
{
    /**
     * The vision test model instance.
     *
     * @var \App\Models\VisionTest
     */
    protected $visionTest;

    /**
     * Create a new repository instance.
     *
     * @param  \App\Models\VisionTest  $visionTest
     * @return void
     */
    public function __construct(VisionTest $visionTest)
    {
        $this->visionTest = $visionTest;
    }

    /**
     * Get all vision tests for a patient.
     *
     * @param  int  $patientId
     * @return Collection
     */
    public function getAllForPatient(int $patientId): Collection
    {
        return $this->visionTest->where('patient_id', $patientId)
            ->orderBy('test_date', 'desc')
            ->get();
    }

    /**
     * Get latest vision test for a patient.
     *
     * @param  int  $patientId
     * @return VisionTest|null
     */
    public function getLatestForPatient(int $patientId): ?VisionTest
    {
        return $this->visionTest->where('patient_id', $patientId)
            ->orderBy('test_date', 'desc')
            ->first();
    }

    /**
     * Get vision test by ID.
     *
     * @param  int  $id
     * @return VisionTest|null
     */
    public function findById(int $id): ?VisionTest
    {
        return $this->visionTest->find($id);
    }

    /**
     * Create a new vision test.
     *
     * @param  array  $data
     * @return VisionTest
     */
    public function create(array $data): VisionTest
    {
        return $this->visionTest->create($data);
    }

    /**
     * Update a vision test.
     *
     * @param  int  $id
     * @param  array  $data
     * @return bool
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
     *
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $visionTest = $this->findById($id);

        if (!$visionTest) {
            return false;
        }

        return $visionTest->delete();
    }
}
