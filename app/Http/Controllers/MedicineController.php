<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Repositories\MedicineRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicineController extends Controller
{
    /**
     * The medicine repository instance.
     *
     * @var \App\Repositories\MedicineRepository
     */
    protected $medicineRepository;

    /**
     * Create a new controller instance.
     *
     * @param  \App\Repositories\MedicineRepository  $medicineRepository
     * @return void
     */
    public function __construct(MedicineRepository $medicineRepository)
    {
        $this->medicineRepository = $medicineRepository;
    }

    /**
     * Display a listing of the medicines with advanced search and filters.
     *
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Start with base query
        $query = Medicine::query();

        // Search functionality
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Type filter
        if ($type = $request->get('type')) {
            if ($type !== 'all') {
                $query->where('type', $type);
            }
        }

        // Status filter
        if ($status = $request->get('status')) {
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
            // 'all' means no filter applied
        }

        // Manufacturer filter
        if ($manufacturer = $request->get('manufacturer')) {
            if ($manufacturer !== 'all') {
                $query->where('manufacturer', 'like', "%{$manufacturer}%");
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        switch ($sortBy) {
            case 'type':
                $query->orderBy('type', $sortOrder)->orderBy('name', 'asc');
                break;
            case 'manufacturer':
                $query->orderBy('manufacturer', $sortOrder)->orderBy('name', 'asc');
                break;
            case 'status':
                $query->orderBy('is_active', $sortOrder)->orderBy('name', 'asc');
                break;
            case 'created_at':
                $query->orderBy('created_at', $sortOrder);
                break;
            default:
                $query->orderBy('name', $sortOrder);
        }

        // Paginate results with query string preservation
        $medicines = $query->paginate(20)->withQueryString();

        // Get filter options for dropdowns
        $filterOptions = [
            'types' => Medicine::distinct()
                ->whereNotNull('type')
                ->where('type', '!=', '')
                ->pluck('type')
                ->sort()
                ->values(),
            'manufacturers' => Medicine::distinct()
                ->whereNotNull('manufacturer')
                ->where('manufacturer', '!=', '')
                ->pluck('manufacturer')
                ->sort()
                ->values(),
        ];

        // Calculate statistics
        $stats = [
            'total_medicines' => Medicine::count(),
            'active_medicines' => Medicine::where('is_active', true)->count(),
            'inactive_medicines' => Medicine::where('is_active', false)->count(),
            'unique_types' => Medicine::distinct()->whereNotNull('type')->count('type'),
            'unique_manufacturers' => Medicine::distinct()->whereNotNull('manufacturer')->count('manufacturer'),
        ];

        return Inertia::render('Medicines/Index', [
            'medicines' => $medicines,
            'filterOptions' => $filterOptions,
            'stats' => $stats,
            'filters' => [
                'search' => $request->get('search', ''),
                'type' => $request->get('type', 'all'),
                'status' => $request->get('status', 'all'),
                'manufacturer' => $request->get('manufacturer', 'all'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Show the form for creating a new medicine.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        $filterOptions = [
            'types' => Medicine::distinct()
                ->whereNotNull('type')
                ->where('type', '!=', '')
                ->pluck('type')
                ->sort()
                ->values(),
            'manufacturers' => Medicine::distinct()
                ->whereNotNull('manufacturer')
                ->where('manufacturer', '!=', '')
                ->pluck('manufacturer')
                ->sort()
                ->values(),
        ];

        return Inertia::render('Medicines/Create', [
            'filterOptions' => $filterOptions,
        ]);
    }

    /**
     * Store a newly created medicine in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:medicines,name',
            'generic_name' => 'nullable|string|max:255',
            'type' => 'required|string|max:100',
            'manufacturer' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $data = $request->all();
        $data['is_active'] = $request->boolean('is_active', true);

        $medicine = $this->medicineRepository->create($data);

        return redirect()->route('medicines.index')
            ->with('success', 'Medicine added successfully!');
    }

    /**
     * Display the specified medicine.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function show($id)
    {
        $medicine = $this->medicineRepository->findById($id);

        if (!$medicine) {
            abort(404, 'Medicine not found');
        }

        return Inertia::render('Medicines/Show', [
            'medicine' => $medicine,
        ]);
    }

    /**
     * Show the form for editing the specified medicine.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function edit($id)
    {
        $medicine = $this->medicineRepository->findById($id);

        if (!$medicine) {
            abort(404, 'Medicine not found');
        }

        $filterOptions = [
            'types' => Medicine::distinct()
                ->whereNotNull('type')
                ->where('type', '!=', '')
                ->pluck('type')
                ->sort()
                ->values(),
            'manufacturers' => Medicine::distinct()
                ->whereNotNull('manufacturer')
                ->where('manufacturer', '!=', '')
                ->pluck('manufacturer')
                ->sort()
                ->values(),
        ];

        return Inertia::render('Medicines/Edit', [
            'medicine' => $medicine,
            'filterOptions' => $filterOptions,
        ]);
    }

    /**
     * Update the specified medicine in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, $id)
    {
        $medicine = $this->medicineRepository->findById($id);

        if (!$medicine) {
            abort(404, 'Medicine not found');
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:medicines,name,' . $id,
            'generic_name' => 'nullable|string|max:255',
            'type' => 'required|string|max:100',
            'manufacturer' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        $data = $request->all();
        $data['is_active'] = $request->boolean('is_active', true);

        $success = $this->medicineRepository->update($id, $data);

        if (!$success) {
            return back()->with('error', 'Failed to update medicine.');
        }

        return redirect()->route('medicines.index')
            ->with('success', 'Medicine updated successfully!');
    }

    /**
     * Toggle the active status of the specified medicine.
     *
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
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

        $newStatus = !$medicine->is_active ? 'activated' : 'deactivated';
        return back()->with('success', "Medicine {$newStatus} successfully!");
    }

    /**
     * Remove the specified medicine from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy($id)
    {
        $medicine = $this->medicineRepository->findById($id);

        if (!$medicine) {
            abort(404, 'Medicine not found');
        }

        try {
            $medicine->delete();
            return back()->with('success', 'Medicine deleted successfully!');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete medicine. It may be referenced in other records.');
        }
    }

    /**
     * Bulk operations on medicines
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function bulkAction(Request $request)
    {
        $request->validate([
            'action' => 'required|in:activate,deactivate,delete',
            'medicine_ids' => 'required|array|min:1',
            'medicine_ids.*' => 'exists:medicines,id',
        ]);

        $medicineIds = $request->medicine_ids;
        $action = $request->action;

        try {
            switch ($action) {
                case 'activate':
                    Medicine::whereIn('id', $medicineIds)->update(['is_active' => true]);
                    $message = 'Selected medicines activated successfully!';
                    break;
                case 'deactivate':
                    Medicine::whereIn('id', $medicineIds)->update(['is_active' => false]);
                    $message = 'Selected medicines deactivated successfully!';
                    break;
                case 'delete':
                    Medicine::whereIn('id', $medicineIds)->delete();
                    $message = 'Selected medicines deleted successfully!';
                    break;
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to perform bulk action: ' . $e->getMessage());
        }
    }

    /**
     * Export medicines data
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function export(Request $request)
    {
        // This method can be implemented to export medicines to Excel/CSV
        // For now, return a JSON response indicating the feature is not implemented
        return response()->json([
            'message' => 'Export functionality will be implemented soon.',
            'filters' => $request->all()
        ]);
    }
}
