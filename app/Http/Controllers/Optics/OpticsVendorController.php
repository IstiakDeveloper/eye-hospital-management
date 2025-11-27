<?php

namespace App\Http\Controllers\Optics;

use App\Http\Controllers\Controller;
use App\Models\Glasses;
use App\Models\GlassesPurchase;
use App\Models\StockMovement;
use App\Models\OpticsVendor;
use App\Models\HospitalAccount;
use App\Models\HospitalExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OpticsVendorController extends Controller
{
    /**
     * Vendors List
     */
    public function index()
    {
        $vendors = OpticsVendor::query()
            ->when(
                request('search'),
                fn($q, $search) =>
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
            )
            ->when(request('status') === 'active', fn($q) => $q->where('is_active', true))
            ->when(request('status') === 'inactive', fn($q) => $q->where('is_active', false))
            ->when(request('with_due'), fn($q) => $q->withDue())
            ->when(request('with_advance'), fn($q) => $q->withAdvance())
            ->withCount('purchases')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total_vendors' => OpticsVendor::count(),
            'active_vendors' => OpticsVendor::active()->count(),
            'total_due' => OpticsVendor::where('balance_type', 'due')->sum('current_balance'),
            'total_advance' => OpticsVendor::where('balance_type', 'advance')->sum('current_balance'),
        ];

        return Inertia::render('OpticsCorner/Vendors/Index', compact('vendors', 'stats'));
    }

    /**
     * Create Vendor Form
     */
    public function create()
    {
        return Inertia::render('OpticsCorner/Vendors/Create');
    }

    /**
     * Store New Vendor
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'trade_license' => 'nullable|string|max:255',
            'opening_balance' => 'nullable|numeric|min:0',
            'balance_type' => 'required|in:due,advance',
            'credit_limit' => 'nullable|numeric|min:0',
            'payment_terms_days' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        $validated['current_balance'] = $validated['opening_balance'] ?? 0;

        OpticsVendor::create($validated);

        return redirect()->route('optics.vendors.index')->with('success', 'Vendor added successfully!');
    }

    /**
     * Edit Vendor Form
     */
    public function edit(OpticsVendor $vendor)
    {
        return Inertia::render('OpticsCorner/Vendors/Edit', compact('vendor'));
    }

    /**
     * Update Vendor
     */
    public function update(Request $request, OpticsVendor $vendor)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'trade_license' => 'nullable|string|max:255',
            'credit_limit' => 'nullable|numeric|min:0',
            'payment_terms_days' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $vendor->update($validated);

        return redirect()->route('optics.vendors.index')->with('success', 'Vendor updated successfully!');
    }

    /**
     * Vendor Transactions
     */
    public function transactions(OpticsVendor $vendor)
    {
        $transactions = $vendor->transactions()
            ->with('createdBy', 'paymentMethod')
            ->latest()
            ->paginate(20);

        $purchases = $vendor->purchases()
            ->with('glasses', 'addedBy')
            ->latest()
            ->paginate(10);

        $paymentMethods = \App\Models\PaymentMethod::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('OpticsCorner/Vendors/Transactions', compact('vendor', 'transactions', 'purchases', 'paymentMethods'));
    }

    /**
     * Make Vendor Payment
     */
    public function makePayment(Request $request, OpticsVendor $vendor)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'description' => 'required|string',
            'payment_date' => 'nullable|date',
        ]);

        // Check if payment exceeds due
        if ($vendor->balance_type === 'due' && $validated['amount'] > $vendor->current_balance) {
            return back()->with('error', 'Payment amount cannot exceed due amount!');
        }

        DB::transaction(function () use ($validated, $vendor) {
            $paymentDate = $validated['payment_date'] ?? now()->toDateString();

            // Add payment to vendor account
            $vendor->addPayment(
                $validated['amount'],
                $validated['description'],
                $validated['payment_method_id'],
                $paymentDate
            );

            // Add expense to Hospital Account
            $paymentCategory = HospitalExpenseCategory::firstOrCreate(
                ['name' => 'Optics Vendor Payment'],
                ['is_active' => true]
            );

            HospitalAccount::addExpense(
                $validated['amount'],
                'Optics Vendor Payment',
                "Vendor payment to {$vendor->name} - {$validated['description']}",
                $paymentCategory->id,
                $paymentDate
            );
        });

        return back()->with('success', 'Payment recorded successfully!');
    }

    // =============== GLASSES PURCHASE FROM VENDOR ===============

    /**
     * Purchases List
     */
    public function purchasesIndex()
    {
        $purchases = GlassesPurchase::with('vendor', 'glasses', 'addedBy')
            ->when(request('vendor_id'), fn($q, $vendorId) => $q->where('vendor_id', $vendorId))
            ->when(request('payment_status'), fn($q, $status) => $q->where('payment_status', $status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $vendors = OpticsVendor::active()->get(['id', 'name', 'company_name']);
        $paymentMethods = \App\Models\PaymentMethod::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('OpticsCorner/Purchases/Index', compact('purchases', 'vendors', 'paymentMethods'));
    }

    /**
     * Create Purchase Form
     */
    public function createPurchase()
    {
        $vendors = OpticsVendor::active()->get(['id', 'name', 'company_name', 'current_balance', 'balance_type']);
        $frames = Glasses::active()->get(['id', 'brand', 'model', 'sku', 'purchase_price', 'stock_quantity']);

        return Inertia::render('OpticsCorner/Purchases/Create', compact('vendors', 'frames'));
    }

    /**
     * Store Purchase
     */
    public function storePurchase(Request $request)
    {
        $validated = $request->validate([
            'vendor_id' => 'required|exists:optics_vendors,id',
            'glasses_id' => 'required|exists:glasses,id',
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'purchase_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $totalCost = $validated['unit_cost'] * $validated['quantity'];
            $paidAmount = $validated['paid_amount'] ?? 0;
            $dueAmount = $totalCost - $paidAmount;

            $purchaseDate = $validated['purchase_date'] ?? now()->toDateString();

            // Create purchase record
            $purchase = GlassesPurchase::create([
                'purchase_no' => 'GP-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                'vendor_id' => $validated['vendor_id'],
                'glasses_id' => $validated['glasses_id'],
                'quantity' => $validated['quantity'],
                'unit_cost' => $validated['unit_cost'],
                'total_cost' => $totalCost,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $dueAmount > 0 ? ($paidAmount > 0 ? 'partial' : 'pending') : 'paid',
                'purchase_date' => $purchaseDate,
                'notes' => $validated['notes'],
                'added_by' => auth()->id(),
            ]);

            // Update glasses stock
            $glasses = Glasses::findOrFail($validated['glasses_id']);
            $previousStock = $glasses->stock_quantity;
            $newStock = $previousStock + $validated['quantity'];
            $glasses->update(['stock_quantity' => $newStock]);

            // Create stock movement
            StockMovement::create([
                'item_type' => 'glasses',
                'item_id' => $validated['glasses_id'],
                'movement_type' => 'purchase',
                'quantity' => $validated['quantity'],
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'unit_price' => $validated['unit_cost'],
                'total_amount' => $totalCost,
                'notes' => "Purchase from vendor (#{$purchase->purchase_no})",
                'user_id' => auth()->id(),
            ]);

            // Add to vendor's due if not fully paid
            if ($dueAmount > 0) {
                $vendor = OpticsVendor::findOrFail($validated['vendor_id']);
                $vendor->addPurchase(
                    $dueAmount,
                    "Glasses purchase - {$glasses->full_name} ({$validated['quantity']} pcs)",
                    $purchase->id
                );
            }

            // Handle paid amount - Add to Hospital Account expense
            if ($paidAmount > 0) {
                $purchaseCategory = HospitalExpenseCategory::firstOrCreate(
                    ['name' => 'Optics Purchase'],
                    ['is_active' => true]
                );

                $transaction = HospitalAccount::addExpense(
                    $paidAmount,
                    'Optics Purchase',
                    "Purchase from vendor - {$glasses->full_name} ({$validated['quantity']} pcs)",
                    $purchaseCategory->id,
                    $purchaseDate
                );

                $purchase->update(['optics_transaction_id' => $transaction->id]);
            }
        });

        return redirect()->route('optics.purchases.index')->with('success', 'Purchase recorded successfully!');
    }

    /**
     * Pay Purchase Due
     */
    public function payPurchaseDue(Request $request, GlassesPurchase $purchase)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'payment_date' => 'nullable|date',
        ]);

        if ($validated['amount'] > $purchase->due_amount) {
            return back()->with('error', 'Payment amount cannot exceed due amount!');
        }

        DB::transaction(function () use ($validated, $purchase) {
            $paymentDate = $validated['payment_date'] ?? now()->toDateString();

            // Update purchase payment status
            $purchase->paid_amount += $validated['amount'];
            $purchase->due_amount -= $validated['amount'];

            if ($purchase->due_amount <= 0) {
                $purchase->payment_status = 'paid';
            } elseif ($purchase->paid_amount > 0) {
                $purchase->payment_status = 'partial';
            }

            $purchase->save();

            // Add payment to vendor account
            $vendor = $purchase->vendor;
            $vendor->addPayment(
                $validated['amount'],
                "Payment for purchase #{$purchase->purchase_no}",
                $validated['payment_method_id'],
                $paymentDate
            );

            // Add expense to Hospital Account
            $paymentCategory = HospitalExpenseCategory::firstOrCreate(
                ['name' => 'Optics Vendor Payment'],
                ['is_active' => true]
            );

            HospitalAccount::addExpense(
                $validated['amount'],
                'Optics Vendor Payment',
                "Due payment for purchase #{$purchase->purchase_no} - {$vendor->name}",
                $paymentCategory->id,
                $paymentDate
            );
        });

        return back()->with('success', 'Payment recorded successfully!');
    }
}
