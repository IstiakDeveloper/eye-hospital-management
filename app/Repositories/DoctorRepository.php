<?php

namespace App\Repositories;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DoctorRepository
{
    /**
     * The doctor model instance.
     *
     * @var \App\Models\Doctor
     */
    protected $doctor;

    /**
     * The user model instance.
     *
     * @var \App\Models\User
     */
    protected $user;

    /**
     * Create a new repository instance.
     *
     * @param  \App\Models\Doctor  $doctor
     * @param  \App\Models\User  $user
     * @return void
     */
    public function __construct(Doctor $doctor, User $user)
    {
        $this->doctor = $doctor;
        $this->user = $user;
    }

    /**
     * Get all doctors.
     *
     * @return Collection
     */
    public function getAll(): Collection
    {
        return $this->doctor->with('user')->get();
    }

    /**
     * Get all active doctors.
     *
     * @return Collection
     */
    public function getAllActive(): Collection
    {
        return $this->doctor->with('user')
            ->where('is_available', true)
            ->get();
    }

    /**
     * Get all doctors with pagination.
     *
     * @param  int  $perPage
     * @return LengthAwarePaginator
     */
    public function getAllPaginated(int $perPage = 10): LengthAwarePaginator
    {
        return $this->doctor->with('user')->paginate($perPage);
    }

    /**
     * Get doctor by ID.
     *
     * @param  int  $id
     * @return Doctor|null
     */
    public function findById(int $id): ?Doctor
    {
        return $this->doctor->with('user')->find($id);
    }

    /**
     * Get doctor by user ID.
     *
     * @param  int  $userId
     * @return Doctor|null
     */
    public function findByUserId(int $userId): ?Doctor
    {
        return $this->doctor->where('user_id', $userId)->with('user')->first();
    }

    /**
     * Create a new doctor with user.
     *
     * @param  array  $userData
     * @param  array  $doctorData
     * @return Doctor|null
     */
    public function createWithUser(array $userData, array $doctorData): ?Doctor
    {
        try {
            DB::beginTransaction();

            // Create user
            $userData['password'] = Hash::make($userData['password']);
            $userData['role_id'] = 2; // Doctor role
            $user = $this->user->create($userData);

            // Create doctor profile
            $doctorData['user_id'] = $user->id;
            $doctor = $this->doctor->create($doctorData);

            DB::commit();

            return $doctor->fresh('user');
        } catch (\Exception $e) {
            DB::rollBack();
            return null;
        }
    }

    /**
     * Update a doctor with user.
     *
     * @param  int  $id
     * @param  array  $userData
     * @param  array  $doctorData
     * @return bool
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
     *
     * @param  int  $id
     * @param  bool  $isAvailable
     * @return bool
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
     *
     * @param  int  $id
     * @return bool
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


    public function getCount(): int
    {
        return $this->doctor->count();
    }
}
