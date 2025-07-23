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
     * Display a listing of the medicines.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $medicines = $this->medicineRepository->getAllPaginated();

        return Inertia::render('Medicines/Index', [
            'medicines' => $medicines
        ]);
    }

    /**
     * Show the form for creating a new medicine.
     *
     * @return \Inertia\Response
     */
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

    /**
     * Store a newly created medicine in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
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

        return Inertia::render('Medicines/Edit', [
            'medicine' => $medicine
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

        return back()->with('success', 'Medicine status updated successfully!');
    }
}
