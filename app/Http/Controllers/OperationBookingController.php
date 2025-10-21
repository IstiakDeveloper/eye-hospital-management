<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\Operation;
use App\Models\OperationAccount;
use App\Models\OperationBooking;
use App\Models\OperationPayment;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OperationBookingController extends Controller
{
    /**
     * Display operation bookings list
     * Permission: operation-bookings.view
     */
    public function index(Request $request)
    {
        $query = OperationBooking::with(['patient', 'doctor.user', 'operation', 'bookedBy'])
            ->latest();

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by payment status
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->whereDate('scheduled_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('scheduled_date', '<=', $request->end_date);
        }

        // Search by booking number or patient name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('booking_no', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('patient_id', 'like', "%{$search}%");
                    });
            });
        }

        $bookings = $query->paginate(20);

        $authUser = auth()->user();

        return Inertia::render('OperationBookings/Index', [
            'bookings' => $bookings,
            'filters' => $request->only(['status', 'payment_status', 'start_date', 'end_date', 'search']),
            'statistics' => [
                'total' => OperationBooking::count(),
                'scheduled' => OperationBooking::scheduled()->count(),
                'confirmed' => OperationBooking::confirmed()->count(),
                'completed' => OperationBooking::completed()->count(),
                'today' => OperationBooking::today()->count(),
            ],
            'can' => [
                'create' => $authUser->hasPermission('operation-bookings.create'),
                'edit' => $authUser->hasPermission('operation-bookings.edit'),
                'delete' => $authUser->hasPermission('operation-bookings.delete'),
                'payment' => $authUser->hasPermission('operation-bookings.payment'),
                'confirm' => $authUser->hasPermission('operation-bookings.confirm'),
                'complete' => $authUser->hasPermission('operation-bookings.complete'),
                'cancel' => $authUser->hasPermission('operation-bookings.cancel'),
            ]
        ]);
    }

    /**
     * Display today's operations
     * Permission: operation-bookings.view
     */
    public function today()
    {
        $bookings = OperationBooking::with(['patient', 'doctor.user', 'operation', 'bookedBy'])
            ->today()
            ->orderBy('scheduled_time')
            ->get();

        $authUser = auth()->user();

        return Inertia::render('OperationBookings/Today', [
            'bookings' => $bookings,
            'statistics' => [
                'total' => $bookings->count(),
                'confirmed' => $bookings->where('status', 'confirmed')->count(),
                'completed' => $bookings->where('status', 'completed')->count(),
                'pending_confirmation' => $bookings->where('status', 'scheduled')->count(),
            ],
            'can' => [
                'payment' => $authUser->hasPermission('operation-bookings.payment'),
                'confirm' => $authUser->hasPermission('operation-bookings.confirm'),
                'complete' => $authUser->hasPermission('operation-bookings.complete'),
            ]
        ]);
    }

    /**
     * Show the form for creating a new booking
     * Permission: operation-bookings.create
     */
    public function create(Request $request)
    {
        $patient = null;
        if ($request->filled('patient_id')) {
            $patient = Patient::find($request->patient_id);
        }

        return Inertia::render('OperationBookings/Create', [
            'patient' => $patient,
            'operations' => Operation::active()->orderBy('type')->orderBy('name')->get(),
            'doctors' => Doctor::where('is_available', true)
                ->with('user')
                ->get()
                ->sortBy('user.name')
                ->values(),
        ]);
    }

    /**
     * Store a newly created booking
     * Permission: operation-bookings.create
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'operation_id' => 'required|exists:operations,id',
            'scheduled_date' => 'required|date|after_or_equal:today',
            'scheduled_time' => 'required|date_format:H:i',
            'doctor_id' => 'required|exists:doctors,id',
            'total_amount' => 'required|numeric|min:0',
            'advance_payment' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:cash,card,mobile_banking,bank_transfer',
            'payment_reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            // Eye surgery specific fields
            'surgery_type' => 'nullable|string|max:100',
            'eye_side' => 'nullable|in:left,right',
            'lens_type' => 'nullable|string|max:100',
            'power' => 'nullable|string|max:50',
            'surgery_remarks' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $operation = Operation::findOrFail($validated['operation_id']);

            // Calculate amounts
            $totalAmount = $validated['total_amount'];
            $advancePayment = $validated['advance_payment'] ?? 0;
            $dueAmount = $totalAmount - $advancePayment;

            // Determine payment status
            $paymentStatus = 'unpaid';
            if ($advancePayment > 0) {
                $paymentStatus = $advancePayment >= $totalAmount ? 'paid' : 'partial';
            }

            // Create booking
            $booking = OperationBooking::create([
                'patient_id' => $validated['patient_id'],
                'operation_id' => $validated['operation_id'],
                'operation_name' => $operation->name,
                'operation_price' => $operation->price,  // Added: Store operation price snapshot
                'scheduled_date' => $validated['scheduled_date'],
                'scheduled_time' => $validated['scheduled_time'],
                'doctor_id' => $validated['doctor_id'],
                'status' => 'scheduled',
                'total_amount' => $totalAmount,
                'advance_payment' => $advancePayment,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'notes' => $validated['notes'] ?? null,
                'booked_by' => auth()->id(),
                // Eye surgery specific fields
                'surgery_type' => $validated['surgery_type'] ?? null,
                'eye_side' => $validated['eye_side'] ?? null,
                'lens_type' => $validated['lens_type'] ?? null,
                'power' => $validated['power'] ?? null,
                'surgery_remarks' => $validated['surgery_remarks'] ?? null,
            ]);

            // Record advance payment if any
            if ($advancePayment > 0) {
                OperationPayment::create([
                    'operation_booking_id' => $booking->id,
                    'patient_id' => $validated['patient_id'],  // Added: Required patient_id field
                    'amount' => $advancePayment,
                    'payment_method' => $validated['payment_method'] ?? 'cash',
                    'payment_type' => $paymentStatus === 'paid' ? 'full' : 'advance',
                    'payment_reference' => $validated['payment_reference'] ?? null,
                    'payment_date' => now()->toDateString(),
                    'notes' => 'Advance payment during booking',
                    'received_by' => auth()->id(),
                ]);

                // Add income to operation account
                OperationAccount::addIncome(
                    amount: $advancePayment,
                    category: 'Operation Booking',
                    description: "Advance payment for {$operation->name} - Booking: {$booking->booking_no}",  // Fixed: operation_name to name
                    referenceType: 'OperationBooking',
                    referenceId: $booking->id,
                    date: now()->toDateString()
                );
            }

            DB::commit();

            return redirect()->route('operation-bookings.show', $booking->id)
                ->with('success', 'Operation booked successfully! Booking No: ' . $booking->booking_no);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'Failed to create booking: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified booking
     * Permission: operation-bookings.view
     */
    public function show(OperationBooking $operationBooking)
    {
        $operationBooking->load([
            'patient',
            'doctor.user',
            'operation',
            'bookedBy',
            'performedBy',
            'payments.receivedBy'
        ]);

        $authUser = auth()->user();

        return Inertia::render('OperationBookings/Show', [
            'booking' => $operationBooking,
            'payments' => $operationBooking->payments()->latest()->get(),
            'can' => [
                'edit' => $authUser->hasPermission('operation-bookings.edit'),
                'delete' => $authUser->hasPermission('operation-bookings.delete'),
                'payment' => $authUser->hasPermission('operation-bookings.payment'),
                'confirm' => $authUser->hasPermission('operation-bookings.confirm'),
                'complete' => $authUser->hasPermission('operation-bookings.complete'),
                'cancel' => $authUser->hasPermission('operation-bookings.cancel'),
                'reschedule' => $authUser->hasPermission('operation-bookings.reschedule'),
            ]
        ]);
    }

    /**
     * Show the form for editing the specified booking
     * Permission: operation-bookings.edit
     */
    public function edit(OperationBooking $operationBooking)
    {
        $operationBooking->load(['patient', 'operation', 'doctor.user']);

        return Inertia::render('OperationBookings/Edit', [
            'booking' => $operationBooking,
            'operations' => Operation::active()->orderBy('type')->orderBy('name')->get(),
            'doctors' => Doctor::where('is_available', true)
                ->with('user')
                ->get()
                ->sortBy('user.name')
                ->values(),
        ]);
    }

    /**
     * Update the specified booking
     * Permission: operation-bookings.edit
     */
    public function update(Request $request, OperationBooking $operationBooking)
    {
        $validated = $request->validate([
            'operation_id' => 'required|exists:operations,id',
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'required|date_format:H:i',
            'doctor_id' => 'required|exists:doctors,id',
            'total_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            // Eye surgery specific fields
            'surgery_type' => 'nullable|string|max:100',
            'eye_side' => 'nullable|in:left,right',
            'lens_type' => 'nullable|string|max:100',
            'power' => 'nullable|string|max:50',
            'surgery_remarks' => 'nullable|string|max:500',
        ]);

        $operation = Operation::findOrFail($validated['operation_id']);

        // Recalculate due amount if total amount changed
        $dueAmount = $validated['total_amount'] - $operationBooking->advance_payment;

        $operationBooking->update([
            'operation_id' => $validated['operation_id'],
            'operation_name' => $operation->name,  // Fixed: Changed from operation_name to name
            'operation_price' => $operation->price,  // Added: Update operation price snapshot
            'scheduled_date' => $validated['scheduled_date'],
            'scheduled_time' => $validated['scheduled_time'],
            'doctor_id' => $validated['doctor_id'],
            'total_amount' => $validated['total_amount'],
            'due_amount' => $dueAmount,
            'notes' => $validated['notes'],
            // Eye surgery specific fields
            'surgery_type' => $validated['surgery_type'] ?? null,
            'eye_side' => $validated['eye_side'] ?? null,
            'lens_type' => $validated['lens_type'] ?? null,
            'power' => $validated['power'] ?? null,
            'surgery_remarks' => $validated['surgery_remarks'] ?? null,
        ]);

        return redirect()->route('operation-bookings.show', $operationBooking->id)
            ->with('success', 'Booking updated successfully!');
    }

    /**
     * Add payment to booking
     * Permission: operation-bookings.payment
     */
    public function addPayment(Request $request, OperationBooking $operationBooking)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,card,mobile_banking,bank_transfer',
            'payment_reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        // Check if payment exceeds due amount
        if ($validated['amount'] > $operationBooking->due_amount) {
            return back()->with('error', 'Payment amount cannot exceed due amount!');
        }

        DB::beginTransaction();
        try {
            // Add payment using model method
            $operationBooking->addPayment(
                amount: $validated['amount'],
                paymentMethod: $validated['payment_method'],
                paymentReference: $validated['payment_reference'] ?? null,
                notes: $validated['notes'] ?? null
            );

            // Add income to operation account
            OperationAccount::addIncome(
                amount: $validated['amount'],
                category: 'Operation Payment',
                description: "Payment for {$operationBooking->operation_name} - Booking: {$operationBooking->booking_no}",
                referenceType: 'OperationBooking',
                referenceId: $operationBooking->id,
                date: now()->toDateString()
            );

            DB::commit();

            return back()->with('success', 'Payment recorded successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to record payment: ' . $e->getMessage());
        }
    }

    /**
     * Confirm booking
     * Permission: operation-bookings.confirm
     */
    public function confirm(OperationBooking $operationBooking)
    {
        if ($operationBooking->status !== 'scheduled') {
            return back()->with('error', 'Only scheduled bookings can be confirmed!');
        }

        $operationBooking->confirmBooking();

        return back()->with('success', 'Booking confirmed successfully!');
    }

    /**
     * Mark booking as completed
     * Permission: operation-bookings.complete
     */
    public function complete(Request $request, OperationBooking $operationBooking)
    {
        if (!in_array($operationBooking->status, ['scheduled', 'confirmed'])) {
            return back()->with('error', 'Only scheduled or confirmed bookings can be completed!');
        }

        // Mark as completed (will use auth()->id() in the model)
        $operationBooking->markAsCompleted();

        return back()->with('success', 'Operation marked as completed!');
    }

    /**
     * Cancel booking
     * Permission: operation-bookings.cancel
     */
    public function cancel(Request $request, OperationBooking $operationBooking)
    {
        if ($operationBooking->status === 'completed') {
            return back()->with('error', 'Cannot cancel completed operations!');
        }

        $validated = $request->validate([
            'cancellation_reason' => 'required|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $operationBooking->cancel($validated['cancellation_reason']);

            DB::commit();

            return back()->with('success', 'Booking cancelled successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to cancel booking: ' . $e->getMessage());
        }
    }

    /**
     * Reschedule booking
     * Permission: operation-bookings.reschedule
     */
    public function reschedule(Request $request, OperationBooking $operationBooking)
    {
        if ($operationBooking->status === 'completed') {
            return back()->with('error', 'Cannot reschedule completed operations!');
        }

        if ($operationBooking->status === 'cancelled') {
            return back()->with('error', 'Cannot reschedule cancelled operations!');
        }

        $validated = $request->validate([
            'scheduled_date' => 'required|date|after_or_equal:today',
            'scheduled_time' => 'required|date_format:H:i',
        ]);

        $operationBooking->reschedule(
            $validated['scheduled_date'],
            $validated['scheduled_time']
        );

        return back()->with('success', 'Booking rescheduled successfully!');
    }

    /**
     * Print booking receipt
     * Permission: operation-bookings.view
     */
    public function receipt(OperationBooking $operationBooking)
    {
        $operationBooking->load([
            'patient',
            'doctor.user',
            'operation',
            'bookedBy',
            'payments.receivedBy'
        ]);

        return Inertia::render('OperationBookings/Receipt', [
            'booking' => $operationBooking,
            'payments' => $operationBooking->payments()->latest()->get(),
        ]);
    }

    /**
     * Remove the specified booking
     * Permission: operation-bookings.delete
     */
    public function destroy(OperationBooking $operationBooking)
    {
        // Only allow deletion of cancelled bookings
        if ($operationBooking->status !== 'cancelled') {
            return back()->with('error', 'Only cancelled bookings can be deleted!');
        }

        // Check if there are payments
        if ($operationBooking->payments()->exists()) {
            return back()->with('error', 'Cannot delete booking with payment records!');
        }

        $operationBooking->delete();

        return redirect()->route('operation-bookings.index')
            ->with('success', 'Booking deleted successfully!');
    }

    /**
     * Search patients for booking
     * Permission: operation-bookings.create
     */
    public function searchPatients(Request $request)
    {
        $search = $request->input('search');

        $patients = Patient::where('name', 'like', "%{$search}%")
            ->orWhere('patient_id', 'like', "%{$search}%")
            ->orWhere('phone', 'like', "%{$search}%")
            ->limit(10)
            ->get(['id', 'patient_id', 'name', 'phone', 'date_of_birth', 'gender']);

        // Add computed age
        $patients->each(function ($patient) {
            if ($patient->date_of_birth) {
                $patient->age = \Carbon\Carbon::parse($patient->date_of_birth)->age;
            }
        });

        return response()->json($patients);
    }
}
