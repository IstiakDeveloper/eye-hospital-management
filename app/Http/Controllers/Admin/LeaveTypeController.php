<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveTypeController extends Controller
{
    public function index()
    {
        $leaveTypes = LeaveType::orderBy('id', 'asc')->get();

        return Inertia::render('Admin/Attendance/LeaveTypes/Index', [
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:leave_types,name',
            'days_allowed' => 'required|integer|min:0|max:365',
            'is_active' => 'boolean',
        ]);

        LeaveType::create([
            'name' => $request->name,
            'days_allowed' => $request->days_allowed,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Leave type created successfully.');
    }

    public function update(Request $request, LeaveType $leaveType)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:leave_types,name,' . $leaveType->id,
            'days_allowed' => 'required|integer|min:0|max:365',
            'is_active' => 'boolean',
        ]);

        $leaveType->update([
            'name' => $request->name,
            'days_allowed' => $request->days_allowed,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Leave type updated successfully.');
    }

    public function destroy(LeaveType $leaveType)
    {
        $leaveType->delete();

        return back()->with('success', 'Leave type deleted successfully.');
    }
}
