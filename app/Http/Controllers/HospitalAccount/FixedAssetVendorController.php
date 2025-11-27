<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{FixedAssetVendor, FixedAssetVendorPayment, HospitalAccount};
use Inertia\Inertia;
use DB;

class FixedAssetVendorController extends Controller
{
    /**
     * Display a listing of vendors.
     */
    public function index(Request $request)
    {
        $query = FixedAssetVendor::withCount('assets')
            ->withSum('assets', 'total_amount')
            ->withSum('payments', 'amount');

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('company_name', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('with_due') && $request->with_due) {
            $query->withDue();
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $vendors = $query->latest()->paginate(15);
        $vendors->appends(request()->query());

        // Calculate totals
        $totals = [
            'total_vendors' => FixedAssetVendor::count(),
            'total_due' => FixedAssetVendor::sum('current_balance'),
            'total_purchased' => FixedAssetVendor::withSum('assets', 'total_amount')->get()->sum('assets_sum_total_amount'),
            'total_paid' => FixedAssetVendorPayment::sum('amount'),
        ];

        $filters = [
            'search' => $request->search,
            'with_due' => $request->with_due,
            'is_active' => $request->is_active,
        ];

        return Inertia::render('HospitalAccount/FixedAssetVendors/Index', compact('vendors', 'totals', 'filters'));
    }

    /**
     * Show the form for creating a new vendor.
     */
    public function create()
    {
        return Inertia::render('HospitalAccount/FixedAssetVendors/Create');
    }

    /**
     * Store a newly created vendor.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($request) {
            FixedAssetVendor::create($request->all());
        });

        return redirect()->route('hospital-account.fixed-asset-vendors.index')
            ->with('success', 'Vendor created successfully!');
    }

    /**
     * Display the specified vendor.
     */
    public function show(FixedAssetVendor $fixedAssetVendor)
    {
        $fixedAssetVendor->load(['assets', 'payments.createdBy']);

        $assets = $fixedAssetVendor->assets()
            ->with('createdBy')
            ->latest('purchase_date')
            ->paginate(10, ['*'], 'assets_page');

        $payments = $fixedAssetVendor->payments()
            ->with('createdBy')
            ->latest('payment_date')
            ->paginate(10, ['*'], 'payments_page');

        return Inertia::render('HospitalAccount/FixedAssetVendors/Show', [
            'vendor' => $fixedAssetVendor,
            'assets' => $assets,
            'payments' => $payments,
        ]);
    }

    /**
     * Show the form for editing the specified vendor.
     */
    public function edit(FixedAssetVendor $fixedAssetVendor)
    {
        return Inertia::render('HospitalAccount/FixedAssetVendors/Edit', [
            'vendor' => $fixedAssetVendor
        ]);
    }

    /**
     * Update the specified vendor.
     */
    public function update(Request $request, FixedAssetVendor $fixedAssetVendor)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]);

        DB::transaction(function () use ($request, $fixedAssetVendor) {
            $fixedAssetVendor->update($request->all());
        });

        return redirect()->route('hospital-account.fixed-asset-vendors.index')
            ->with('success', 'Vendor updated successfully!');
    }

    /**
     * Remove the specified vendor.
     */
    public function destroy(FixedAssetVendor $fixedAssetVendor)
    {
        // Only allow deletion if no assets or payments
        if ($fixedAssetVendor->assets()->count() > 0 || $fixedAssetVendor->payments()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete vendor with assets or payments. Set status to inactive instead.']);
        }

        DB::transaction(function () use ($fixedAssetVendor) {
            $fixedAssetVendor->delete();
        });

        return redirect()->route('hospital-account.fixed-asset-vendors.index')
            ->with('success', 'Vendor deleted successfully!');
    }

    /**
     * Make a payment to the vendor.
     */
    public function makePayment(Request $request, FixedAssetVendor $fixedAssetVendor)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|in:cash,bank_transfer,cheque',
            'reference_no' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:500',
            'payment_date' => 'required|date',
        ]);

        // Validate payment amount
        if ($request->amount > $fixedAssetVendor->current_balance) {
            return back()->withErrors(['amount' => 'Payment amount cannot exceed due amount!']);
        }

        // Check hospital balance
        $balance = HospitalAccount::getBalance();
        if ($request->amount > $balance) {
            return back()->withErrors(['amount' => 'Insufficient hospital balance!']);
        }

        DB::transaction(function () use ($request, $fixedAssetVendor) {
            $fixedAssetVendor->makePayment(
                amount: $request->amount,
                description: $request->description ?? 'Vendor payment',
                paymentMethod: $request->payment_method,
                referenceNo: $request->reference_no,
                date: $request->payment_date
            );
        });

        return back()->with('success', 'Payment made successfully!');
    }
}
