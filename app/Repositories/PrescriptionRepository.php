<?php

namespace App\Repositories;

use App\Models\Prescription;
use App\Models\PrescriptionMedicine;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PrescriptionRepository
{
    /**
     * The prescription model instance.
     *
     * @var \App\Models\Prescription
     */
    protected $prescription;

    /**
     * The prescription medicine model instance.
     *
     * @var \App\Models\PrescriptionMedicine
     */
    protected $prescriptionMedicine;

    /**
     * Create a new repository instance.
     *
     * @param  \App\Models\Prescription  $prescription
     * @param  \App\Models\PrescriptionMedicine  $prescriptionMedicine
     * @return void
     */
    public function __construct(Prescription $prescription, PrescriptionMedicine $prescriptionMedicine)
    {
        $this->prescription = $prescription;
        $this->prescriptionMedicine = $prescriptionMedicine;
    }

    /**
     * Get all prescriptions for a patient.
     *
     * @param  int  $patientId
     * @return Collection
     */
    public function getAllForPatient(int $patientId): Collection
    {
        return $this->prescription->with(['doctor', 'doctor.user', 'prescriptionMedicines', 'prescriptionMedicines.medicine'])
            ->where('patient_id', $patientId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get prescription by ID.
     *
     * @param  int  $id
     * @return Prescription|null
     */
    public function findById(int $id): ?Prescription
    {
        return $this->prescription->with(['patient', 'doctor', 'doctor.user', 'prescriptionMedicines', 'prescriptionMedicines.medicine'])
            ->find($id);
    }

    /**
     * Create a new prescription with medicines.
     *
     * @param  array  $prescriptionData
     * @param  array  $medicinesData
     * @return Prescription|null
     */
    public function createWithMedicines(array $prescriptionData, array $medicinesData): ?Prescription
    {
        try {
            DB::beginTransaction();

            // Create prescription
            $prescription = $this->prescription->create($prescriptionData);

            // Create prescription medicines
            foreach ($medicinesData as $medicineData) {
                $this->prescriptionMedicine->create([
                    'prescription_id' => $prescription->id,
                    'medicine_id' => $medicineData['medicine_id'],
                    'dosage' => $medicineData['dosage'],
                    'duration' => $medicineData['duration'],
                    'instructions' => $medicineData['instructions'],
                ]);
            }

            DB::commit();

            return $prescription->fresh(['prescriptionMedicines', 'prescriptionMedicines.medicine']);
        } catch (\Exception $e) {
            DB::rollBack();
            return null;
        }
    }

    /**
     * Update a prescription with medicines.
     *
     * @param  int  $id
     * @param  array  $prescriptionData
     * @param  array  $medicinesData
     * @return bool
     */
    public function updateWithMedicines(int $id, array $prescriptionData, array $medicinesData): bool
    {
        try {
            DB::beginTransaction();

            // Update prescription
            $prescription = $this->findById($id);

            if (!$prescription) {
                return false;
            }

            $prescription->update($prescriptionData);

            // Delete existing prescription medicines
            $this->prescriptionMedicine->where('prescription_id', $id)->delete();

            // Create new prescription medicines
            foreach ($medicinesData as $medicineData) {
                $this->prescriptionMedicine->create([
                    'prescription_id' => $prescription->id,
                    'medicine_id' => $medicineData['medicine_id'],
                    'dosage' => $medicineData['dosage'],
                    'duration' => $medicineData['duration'],
                    'instructions' => $medicineData['instructions'],
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
     *
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $prescription = $this->findById($id);

        if (!$prescription) {
            return false;
        }

        return $prescription->delete();
    }
}
