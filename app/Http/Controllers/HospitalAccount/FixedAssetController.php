<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use App\Http\Requests\HospitalAccount\StoreFixedAssetPurchaseRequest;
use App\Http\Requests\HospitalAccount\StoreFixedAssetRequest;
use App\Models\FixedAsset;
use App\Models\FixedAssetVendor;
use App\Models\HospitalAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FixedAssetController extends Controller
{
    public function index(Request $request): Response
    {
        $query = FixedAsset::with(['createdBy', 'latestPurchase.vendor']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->vendor_id) {
            $query->whereHas('purchases', fn ($q) => $q->where('vendor_id', $request->vendor_id));
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('asset_number', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->date_from) {
            $query->whereHas('purchases', fn ($q) => $q->whereDate('purchase_date', '>=', $request->date_from));
        }

        if ($request->date_to) {
            $query->whereHas('purchases', fn ($q) => $q->whereDate('purchase_date', '<=', $request->date_to));
        }

        $assets = $query->latest('updated_at')->paginate(15);
        $assets->appends(request()->query());

        $vendors = FixedAssetVendor::select('id', 'name', 'company_name')->get();

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

    public function create(): Response
    {
        $vendors = FixedAssetVendor::select('id', 'name', 'company_name', 'phone')->active()->get();

        return Inertia::render('HospitalAccount/FixedAssets/Create', compact('vendors'));
    }

    public function store(StoreFixedAssetRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if ($validated['paid_amount'] > $validated['total_amount']) {
            return back()->withErrors(['paid_amount' => 'Paid amount cannot exceed total amount!']);
        }

        if ($validated['paid_amount'] > 0 && $validated['paid_amount'] > HospitalAccount::getBalance()) {
            return back()->withErrors(['paid_amount' => 'Insufficient hospital balance!']);
        }

        DB::transaction(function () use ($validated) {
            HospitalAccount::createFixedAsset(
                name: $validated['name'],
                description: $validated['description'] ?? '',
                totalAmount: (float) $validated['total_amount'],
                paidAmount: (float) $validated['paid_amount'],
                date: $validated['purchase_date'],
                vendorId: (int) $validated['vendor_id'],
                quantity: isset($validated['quantity']) ? (int) $validated['quantity'] : null
            );
        });

        return redirect()->route('hospital-account.fixed-assets.index')
            ->with('success', 'Fixed asset created successfully!');
    }

    public function show(FixedAsset $fixedAsset): Response
    {
        $fixedAsset->load([
            'createdBy',
            'purchases' => fn ($q) => $q->with(['vendor', 'createdBy'])->latest('purchase_date'),
        ]);

        $vendors = FixedAssetVendor::select('id', 'name', 'company_name', 'phone', 'current_balance')
            ->active()
            ->orderBy('name')
            ->get();

        $defaultVendorId = $fixedAsset->purchases->first()?->vendor_id;

        return Inertia::render('HospitalAccount/FixedAssets/Show', compact('fixedAsset', 'vendors', 'defaultVendorId'));
    }

    public function storePurchase(StoreFixedAssetPurchaseRequest $request, FixedAsset $fixedAsset): RedirectResponse
    {
        $validated = $request->validated();

        $vendorId = $validated['vendor_id']
            ?? $fixedAsset->purchases()->latest('purchase_date')->value('vendor_id');

        if (! $vendorId) {
            return back()->withErrors(['vendor_id' => 'Please select a vendor.']);
        }

        $paidAmount = (float) $validated['paid_amount'];

        if ($paidAmount > HospitalAccount::getBalance()) {
            return back()->withErrors(['total_amount' => 'Insufficient hospital balance!']);
        }

        $quantity = $validated['quantity'] ?? null;
        $description = $quantity
            ? "Added {$quantity} unit(s)"
            : 'Additional purchase';

        DB::transaction(function () use ($validated, $fixedAsset, $vendorId, $quantity, $description) {
            HospitalAccount::addFixedAssetPurchase(
                asset: $fixedAsset,
                vendorId: (int) $vendorId,
                description: $description,
                totalAmount: (float) $validated['total_amount'],
                paidAmount: (float) $validated['paid_amount'],
                date: $validated['purchase_date'],
                quantity: $quantity
            );
        });

        return back()->with('success', 'Purchase added successfully!');
    }

    public function edit(FixedAsset $fixedAsset): Response
    {
        return Inertia::render('HospitalAccount/FixedAssets/Edit', compact('fixedAsset'));
    }

    public function update(Request $request, FixedAsset $fixedAsset): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:active,fully_paid,inactive',
        ]);

        DB::transaction(function () use ($request, $fixedAsset) {
            $fixedAsset->update([
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status,
            ]);
        });

        return redirect()->route('hospital-account.fixed-assets.index')
            ->with('success', 'Fixed asset updated successfully!');
    }

    public function destroy(FixedAsset $fixedAsset): RedirectResponse
    {
        if ($fixedAsset->paid_amount > 0) {
            return back()->withErrors(['error' => 'Cannot delete asset with payments. Set status to inactive instead.']);
        }

        DB::transaction(function () use ($fixedAsset) {
            $fixedAsset->delete();
        });

        return redirect()->route('hospital-account.fixed-assets.index')
            ->with('success', 'Fixed asset deleted successfully!');
    }
}
