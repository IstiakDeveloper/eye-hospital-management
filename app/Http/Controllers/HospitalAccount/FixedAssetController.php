<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{FixedAsset, FixedAssetPayment, FixedAssetVendor, HospitalAccount};
use Inertia\Inertia;
use DB;

class FixedAssetController extends Controller
{
    /**
     * Display a listing of fixed assets.
     */
    public function index(Request $request)
    {
        $query = FixedAsset::with(['vendor', 'createdBy']);

        // Apply filters
        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->vendor_id) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('asset_number', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->date_from) {
            $query->whereDate('purchase_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('purchase_date', '<=', $request->date_to);
        }

        $assets = $query->latest('purchase_date')->paginate(15);
        $assets->appends(request()->query());

        // Get vendors for filter dropdown
        $vendors = FixedAssetVendor::select('id', 'name', 'company_name')->get();

        // Calculate totals
        $totals = [
            'total_assets' => FixedAsset::count(),
            'total_amount' => FixedAsset::sum('total_amount'),
            'total_paid' => FixedAsset::sum('paid_amount'),
            'total_due' => FixedAsset::sum('due_amount'),
        ];

        $filters = [
            'status' => $request->status,
            'vendor_id' => $request->vendor_id,
            'search' => $request->search,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
        ];

        return Inertia::render('HospitalAccount/FixedAssets/Index', compact('assets', 'vendors', 'totals', 'filters'));
    }

    /**
     * Show the form for creating a new fixed asset.
     */
    public function create()
    {
        $vendors = FixedAssetVendor::select('id', 'name', 'company_name', 'phone')->active()->get();
        return Inertia::render('HospitalAccount/FixedAssets/Create', compact('vendors'));
    }

    /**
     * Store a newly created fixed asset.
     */
    public function store(Request $request)
    {
        $request->validate([
            'vendor_id' => 'required|exists:fixed_asset_vendors,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'total_amount' => 'required|numeric|min:1',
            'paid_amount' => 'required|numeric|min:0',
            'purchase_date' => 'required|date',
        ]);

        // Validate that paid amount is not greater than total amount
        if ($request->paid_amount > $request->total_amount) {
            return back()->withErrors(['paid_amount' => 'Paid amount cannot exceed total amount!']);
        }

        // Check if hospital has sufficient balance for initial payment
        if ($request->paid_amount > 0) {
            $balance = HospitalAccount::getBalance();
            if ($request->paid_amount > $balance) {
                return back()->withErrors(['paid_amount' => 'Insufficient hospital balance!']);
            }
        }

        DB::transaction(function () use ($request) {
            HospitalAccount::createFixedAsset(
                name: $request->name,
                description: $request->description ?? '',
                totalAmount: $request->total_amount,
                paidAmount: $request->paid_amount,
                date: $request->purchase_date,
                vendorId: $request->vendor_id
            );
        });

        return redirect()->route('hospital-account.fixed-assets.index')
            ->with('success', 'Fixed asset created successfully!');
    }

    /**
     * Display the specified fixed asset.
     */
    public function show(FixedAsset $fixedAsset)
    {
        $fixedAsset->load(['createdBy', 'payments.createdBy']);

        return Inertia::render('HospitalAccount/FixedAssets/Show', compact('fixedAsset'));
    }

    /**
     * Show the form for editing the specified fixed asset.
     */
    public function edit(FixedAsset $fixedAsset)
    {
        return Inertia::render('HospitalAccount/FixedAssets/Edit', compact('fixedAsset'));
    }

    /**
     * Update the specified fixed asset.
     */
    public function update(Request $request, FixedAsset $fixedAsset)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'total_amount' => 'required|numeric|min:1',
            'purchase_date' => 'required|date',
            'status' => 'required|in:active,fully_paid,inactive',
        ]);

        // Don't allow changing total_amount to less than already paid
        if ($request->total_amount < $fixedAsset->paid_amount) {
            return back()->withErrors(['total_amount' => 'Total amount cannot be less than already paid amount!']);
        }

        DB::transaction(function () use ($request, $fixedAsset) {
            $fixedAsset->update([
                'name' => $request->name,
                'description' => $request->description,
                'total_amount' => $request->total_amount,
                'due_amount' => $request->total_amount - $fixedAsset->paid_amount,
                'purchase_date' => $request->purchase_date,
                'status' => $request->status,
            ]);
        });

        return redirect()->route('hospital-account.fixed-assets.index')
            ->with('success', 'Fixed asset updated successfully!');
    }

    /**
     * Remove the specified fixed asset.
     */
    public function destroy(FixedAsset $fixedAsset)
    {
        // Only allow deletion if no payments have been made
        if ($fixedAsset->paid_amount > 0) {
            return back()->withErrors(['error' => 'Cannot delete asset with payments. Set status to inactive instead.']);
        }

        DB::transaction(function () use ($fixedAsset) {
            $fixedAsset->delete();
        });

        return redirect()->route('hospital-account.fixed-assets.index')
            ->with('success', 'Fixed asset deleted successfully!');
    }

    /**
     * Make a payment for the fixed asset.
     */
    public function makePayment(Request $request, FixedAsset $fixedAsset)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'description' => 'nullable|string|max:500',
            'payment_date' => 'required|date',
        ]);

        // Validate payment amount
        if ($request->amount > $fixedAsset->due_amount) {
            return back()->withErrors(['amount' => 'Payment amount cannot exceed due amount!']);
        }

        // Check hospital balance
        $balance = HospitalAccount::getBalance();
        if ($request->amount > $balance) {
            return back()->withErrors(['amount' => 'Insufficient hospital balance!']);
        }

        DB::transaction(function () use ($request, $fixedAsset) {
            $fixedAsset->makePayment(
                amount: $request->amount,
                description: $request->description ?? 'Payment for fixed asset',
                date: $request->payment_date
            );
        });

        return back()->with('success', 'Payment made successfully!');
    }

    /**
     * Show payment history for a fixed asset.
     */
    public function payments(FixedAsset $fixedAsset)
    {
        $fixedAsset->load(['createdBy', 'payments.createdBy']);
        $payments = $fixedAsset->payments()->latest('payment_date')->paginate(15);

        return Inertia::render('HospitalAccount/FixedAssets/Payments', compact('fixedAsset', 'payments'));
    }
}
