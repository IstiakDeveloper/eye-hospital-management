<?php

namespace App\Repositories;

use App\Models\Medicine;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class MedicineRepository
{
    /**
     * The medicine model instance.
     *
     * @var \App\Models\Medicine
     */
    protected $medicine;

    /**
     * Create a new repository instance.
     *
     * @param  \App\Models\Medicine  $medicine
     * @return void
     */
    public function __construct(Medicine $medicine)
    {
        $this->medicine = $medicine;
    }

    /**
     * Get all medicines.
     *
     * @return Collection
     */
    public function getAll(): Collection
    {
        return $this->medicine->orderBy('name')->get();
    }

    /**
     * Get all active medicines.
     *
     * @return Collection
     */
    public function getAllActive(): Collection
    {
        return $this->medicine->active()->orderBy('name')->get();
    }

    /**
     * Get all medicines with pagination and filters.
     *
     * @param  array  $filters
     * @param  int  $perPage
     * @return LengthAwarePaginator
     */
    public function getAllPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->medicine->query();

        // Search filter - searches across multiple fields
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('generic_name', 'like', "%{$search}%")
                    ->orWhere('manufacturer', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Type filter
        if (!empty($filters['type']) && $filters['type'] !== 'all') {
            $query->where('type', $filters['type']);
        }

        // Status filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $isActive = $filters['status'] === 'active';
            $query->where('is_active', $isActive);
        }

        // Manufacturer filter
        if (!empty($filters['manufacturer']) && $filters['manufacturer'] !== 'all') {
            $query->where('manufacturer', $filters['manufacturer']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortOrder = $filters['sort_order'] ?? 'asc';

        // Handle different sort fields
        switch ($sortBy) {
            case 'status':
                $query->orderBy('is_active', $sortOrder);
                break;
            case 'created_at':
                $query->orderBy('created_at', $sortOrder);
                break;
            default:
                $query->orderBy($sortBy, $sortOrder);
                break;
        }

        // Add secondary sort by name for consistent ordering
        if ($sortBy !== 'name') {
            $query->orderBy('name', 'asc');
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get medicine by ID.
     *
     * @param  int  $id
     * @return Medicine|null
     */
    public function findById(int $id): ?Medicine
    {
        return $this->medicine->find($id);
    }

    /**
     * Get medicines by type.
     *
     * @param  string  $type
     * @return Collection
     */
    public function getByType(string $type): Collection
    {
        return $this->medicine->ofType($type)->orderBy('name')->get();
    }

    /**
     * Search medicines by name or generic name.
     *
     * @param  string  $term
     * @return Collection
     */
    public function search(string $term): Collection
    {
        return $this->medicine->where('name', 'like', '%' . $term . '%')
            ->orWhere('generic_name', 'like', '%' . $term . '%')
            ->orderBy('name')
            ->get();
    }

    /**
     * Create a new medicine.
     *
     * @param  array  $data
     * @return Medicine
     */
    public function create(array $data): Medicine
    {
        return $this->medicine->create($data);
    }

    /**
     * Update a medicine.
     *
     * @param  int  $id
     * @param  array  $data
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        $medicine = $this->findById($id);

        if (!$medicine) {
            return false;
        }

        return $medicine->update($data);
    }

    /**
     * Toggle the active status of a medicine.
     *
     * @param  int  $id
     * @return bool
     */
    public function toggleStatus(int $id): bool
    {
        $medicine = $this->findById($id);

        if (!$medicine) {
            return false;
        }

        return $medicine->update(['is_active' => !$medicine->is_active]);
    }

    /**
     * Delete a medicine.
     *
     * @param  int  $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $medicine = $this->findById($id);

        if (!$medicine) {
            return false;
        }

        return $medicine->delete();
    }
}
