<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Repositories\MedicineRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicineController extends Controller
{
    protected $medicineRepository;

    public function __construct(MedicineRepository $medicineRepository)
    {
        $this->medicineRepository = $medicineRepository;
    }

    /**
     * Display a listing of the medicines with filters.
     */
    public function index(Request $request)
    {
        // Get filter parameters from request
        $filters = [
            'search' => $request->input('search'),
            'type' => $request->input('type'),
            'status' => $request->input('status'),
            'manufacturer' => $request->input('manufacturer'),
            'sort_by' => $request->input('sort_by', 'name'),
            'sort_order' => $request->input('sort_order', 'asc'),
        ];

        // Get paginated medicines with filters
        $medicines = $this->medicineRepository->getAllPaginated($filters);

        // Get filter options
        $filterOptions = [
            'types' => Medicine::distinct('type')
                ->whereNotNull('type')
                ->where('type', '!=', '')
                ->orderBy('type')
                ->pluck('type')
                ->toArray(),
            'manufacturers' => Medicine::distinct('manufacturer')
                ->whereNotNull('manufacturer')
                ->where('manufacturer', '!=', '')
                ->orderBy('manufacturer')
                ->pluck('manufacturer')
                ->toArray(),
        ];

        // Get statistics
        $stats = [
            'total_medicines' => Medicine::count(),
            'active_medicines' => Medicine::where('is_active', true)->count(),
            'inactive_medicines' => Medicine::where('is_active', false)->count(),
            'unique_types' => Medicine::distinct('type')->whereNotNull('type')->where('type', '!=', '')->count(),
            'unique_manufacturers' => Medicine::distinct('manufacturer')->whereNotNull('manufacturer')->where('manufacturer', '!=', '')->count(),
        ];

        return Inertia::render('Medicines/Index', [
            'medicines' => $medicines,
            'filterOptions' => $filterOptions,
            'stats' => $stats,
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        $types = Medicine::distinct('type')
            ->whereNotNull('type')
            ->where('type', '!=', '')
            ->pluck('type')
            ->toArray();

        $manufacturers = Medicine::distinct('manufacturer')
            ->whereNotNull('manufacturer')
            ->where('manufacturer', '!=', '')
            ->pluck('manufacturer')
            ->toArray();

        return Inertia::render('Medicines/Create', [
            'types' => $types,
            'manufacturers' => $manufacturers,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'type' => 'required|string|max:100',
            'manufacturer' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $medicine = $this->medicineRepository->create($request->all());

        return redirect()->route('medicines.index')
            ->with('success', 'Medicine added successfully!');
    }

    public function edit($id)
    {
        $medicine = $this->medicineRepository->findById($id);

        if (!$medicine) {
            abort(404, 'Medicine not found');
        }

        $types = Medicine::distinct('type')
            ->whereNotNull('type')
            ->where('type', '!=', '')
            ->pluck('type')
            ->toArray();

        $manufacturers = Medicine::distinct('manufacturer')
            ->whereNotNull('manufacturer')
            ->where('manufacturer', '!=', '')
            ->pluck('manufacturer')
            ->toArray();

        return Inertia::render('Medicines/Edit', [
            'medicine' => $medicine,
            'types' => $types,
            'manufacturers' => $manufacturers,
        ]);
    }

    public function update(Request $request, $id)
    {
        $medicine = $this->medicineRepository->findById($id);

        if (!$medicine) {
            abort(404, 'Medicine not found');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'type' => 'required|string|max:100',
            'manufacturer' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $success = $this->medicineRepository->update($id, $request->all());

        if (!$success) {
            return back()->with('error', 'Failed to update medicine.');
        }

        return redirect()->route('medicines.index')
            ->with('success', 'Medicine updated successfully!');
    }

    public function toggleStatus($id)
    {
        $medicine = $this->medicineRepository->findById($id);

        if (!$medicine) {
            abort(404, 'Medicine not found');
        }

        $success = $this->medicineRepository->toggleStatus($id);

        if (!$success) {
            return back()->with('error', 'Failed to update medicine status.');
        }

        return back()->with('success', 'Medicine status updated successfully!');
    }

    /**
     * Handle bulk actions on medicines.
     */
    public function bulkAction(Request $request)
    {
        $request->validate([
            'action' => 'required|in:activate,deactivate,delete',
            'medicine_ids' => 'required|array',
            'medicine_ids.*' => 'exists:medicines,id',
        ]);

        $action = $request->input('action');
        $medicineIds = $request->input('medicine_ids');

        switch ($action) {
            case 'activate':
                Medicine::whereIn('id', $medicineIds)->update(['is_active' => true]);
                $message = 'Medicines activated successfully!';
                break;
            case 'deactivate':
                Medicine::whereIn('id', $medicineIds)->update(['is_active' => false]);
                $message = 'Medicines deactivated successfully!';
                break;
            case 'delete':
                Medicine::whereIn('id', $medicineIds)->delete();
                $message = 'Medicines deleted successfully!';
                break;
        }

        return back()->with('success', $message);
    }
}
