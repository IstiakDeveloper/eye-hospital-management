<?php

namespace App\Http\Controllers;

use App\Models\Operation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OperationController extends Controller
{
    /**
     * Display operation types list
     * Permission: operations.view
     */
    public function index()
    {
        $operations = Operation::orderBy('type')
            ->orderBy('name')
            ->paginate(15);

        $authUser = auth()->user();

        return Inertia::render('Operations/Index', [
            'operations' => $operations,
            'operationTypes' => Operation::select('type')
                ->distinct()
                ->whereNotNull('type')
                ->orderBy('type')
                ->pluck('type'),
            'filters' => request()->only(['search', 'status']),
            'can' => [
                'create' => $authUser->hasPermission('operations.create'),
                'edit' => $authUser->hasPermission('operations.edit'),
                'delete' => $authUser->hasPermission('operations.delete'),
            ]
        ]);
    }

    /**
     * Show the form for creating a new operation type
     * Permission: operations.create
     */
    public function create()
    {
        return Inertia::render('Operations/Create', [
            'operationTypes' => Operation::select('type')
                ->distinct()
                ->whereNotNull('type')
                ->orderBy('type')
                ->pluck('type')
        ]);
    }

    /**
     * Store a newly created operation type
     * Permission: operations.create
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'operation_name' => 'required|string|max:255',
            'operation_type' => 'required|string|max:100',
            'base_price' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean'
        ]);

        // Map frontend fields to database columns
        $data = [
            'name' => $validated['operation_name'],
            'type' => $validated['operation_type'],
            'price' => $validated['base_price'],
            'description' => $validated['description'] ?? null,
            'status' => ($validated['is_active'] ?? true) ? 'active' : 'inactive',
            'created_by' => auth()->id()
        ];

        $operation = Operation::create($data);

        return redirect()->route('operations.index')
            ->with('success', 'Operation type created successfully! Code: ' . $operation->operation_code);
    }

    /**
     * Display the specified operation type
     * Permission: operations.view
     */
    public function show(Operation $operation)
    {
        $operation->load(['bookings' => function ($query) {
            $query->latest()->limit(10);
        }]);

        $authUser = auth()->user();

        return Inertia::render('Operations/Show', [
            'operation' => [
                'id' => $operation->id,
                'operation_name' => $operation->name,
                'operation_type' => $operation->type,
                'base_price' => $operation->price,
                'description' => $operation->description,
                'is_active' => $operation->status === 'active',
                'created_at' => $operation->created_at,
                'updated_at' => $operation->updated_at
            ],
            'recentBookings' => $operation->bookings,
            'totalBookings' => $operation->bookings()->count(),
            'completedBookings' => $operation->bookings()->where('status', 'completed')->count(),
            'can' => [
                'edit' => $authUser->hasPermission('operations.edit'),
                'delete' => $authUser->hasPermission('operations.delete'),
                'createBooking' => $authUser->hasPermission('operation-bookings.create'),
            ]
        ]);
    }

    /**
     * Show the form for editing the specified operation type
     * Permission: operations.edit
     */
    public function edit(Operation $operation)
    {
        return Inertia::render('Operations/Edit', [
            'operation' => [
                'id' => $operation->id,
                'operation_name' => $operation->name,
                'operation_type' => $operation->type,
                'base_price' => $operation->price,
                'description' => $operation->description,
                'is_active' => $operation->status === 'active'
            ],
            'operationTypes' => Operation::select('type')
                ->distinct()
                ->whereNotNull('type')
                ->orderBy('type')
                ->pluck('type')
        ]);
    }

    /**
     * Update the specified operation type
     * Permission: operations.edit
     */
    public function update(Request $request, Operation $operation)
    {
        $validated = $request->validate([
            'operation_name' => 'required|string|max:255',
            'operation_type' => 'required|string|max:100',
            'base_price' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'required|boolean'
        ]);

        // Map frontend fields to database columns
        $data = [
            'name' => $validated['operation_name'],
            'type' => $validated['operation_type'],
            'price' => $validated['base_price'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['is_active'] ? 'active' : 'inactive'
        ];

        $operation->update($data);

        return redirect()->route('operations.index')
            ->with('success', 'Operation type updated successfully!');
    }

    /**
     * Toggle operation status (active/inactive)
     * Permission: operations.edit
     */
    public function toggleStatus(Operation $operation)
    {
        $operation->update([
            'status' => $operation->status === 'active' ? 'inactive' : 'active'
        ]);

        return back()->with('success', 'Operation status updated successfully!');
    }

    /**
     * Remove the specified operation type
     * Permission: operations.delete
     */
    public function destroy(Operation $operation)
    {
        // Check if operation has bookings
        if ($operation->bookings()->exists()) {
            return back()->with('error', 'Cannot delete operation type with existing bookings!');
        }

        $operation->delete();

        return redirect()->route('operations.index')
            ->with('success', 'Operation type deleted successfully!');
    }

    /**
     * Get active operations for booking form
     * Permission: operations.view
     */
    public function getActiveOperations()
    {
        $operations = Operation::active()
            ->orderBy('type')
            ->orderBy('name')
            ->get(['id', 'operation_code', 'name as operation_name', 'type as operation_type', 'price as base_price']);

        return response()->json($operations);
    }
}
