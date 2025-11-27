<?php
// app/Http/Controllers/MedicineVendorController.php
namespace App\Http\Controllers;

use App\Models\{MedicineVendor, MedicineVendorTransaction, MedicineVendorPayment, MedicineStock, Medicine, HospitalAccount, HospitalExpenseCategory};
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Validator};
use Inertia\Inertia;
use Carbon\Carbon;

class MedicineVendorController extends Controller
{
    /**
     * Vendors List
     */
    public function index(Request $request)
    {
        $vendors = MedicineVendor::with(['transactions' => function($query) {
                $query->where('type', 'purchase')->where('payment_status', '!=', 'paid');
            }])
            ->when($request->search, function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('company_name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
            })
            ->when($request->status, function($query, $status) {
                if ($status === 'active') {
                    $query->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                } elseif ($status === 'with_dues') {
                    $query->where('current_balance', '>', 0)->where('balance_type', 'due');
                }
            })
            ->orderBy('name')
            ->paginate(20);

        // Summary statistics
        $totalVendors = MedicineVendor::active()->count();
        $totalDues = MedicineVendor::where('balance_type', 'due')->sum('current_balance');
        $overdueAmount = MedicineVendorTransaction::where('type', 'purchase')
            ->where('payment_status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->sum('due_amount');
        $vendorsWithDues = MedicineVendor::withDues()->count();

        return Inertia::render('MedicineVendor/Index', [
            'vendors' => $vendors,
            'filters' => $request->only(['search', 'status']),
            'statistics' => [
                'total_vendors' => $totalVendors,
                'total_dues' => $totalDues,
                'overdue_amount' => $overdueAmount,
                'vendors_with_dues' => $vendorsWithDues,
            ],
        ]);
    }

    /**
     * Store New Vendor
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20|unique:medicine_vendors,phone',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'trade_license' => 'nullable|string|max:255',
            'opening_balance' => 'nullable|numeric|min:0',
            'credit_limit' => 'nullable|numeric|min:0',
            'payment_terms_days' => 'nullable|integer|min:1|max:365',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $vendor = MedicineVendor::create([
                'name' => $request->name,
                'company_name' => $request->company_name,
                'contact_person' => $request->contact_person,
                'phone' => $request->phone,
                'email' => $request->email,
                'address' => $request->address,
                'trade_license' => $request->trade_license,
                'opening_balance' => $request->opening_balance ?? 0,
                'current_balance' => $request->opening_balance ?? 0,
                'credit_limit' => $request->credit_limit ?? 0,
                'payment_terms_days' => $request->payment_terms_days ?? 30,
                'notes' => $request->notes,
            ]);

            return redirect()->back()->with('success', 'Vendor added successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to add vendor: ' . $e->getMessage());
        }
    }

    /**
     * Update Vendor
     */
    public function update(Request $request, MedicineVendor $vendor)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20|unique:medicine_vendors,phone,' . $vendor->id,
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'trade_license' => 'nullable|string|max:255',
            'credit_limit' => 'nullable|numeric|min:0',
            'payment_terms_days' => 'nullable|integer|min:1|max:365',
            'is_active' => 'required|boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $vendor->update($request->validated());
            return response()->json(['success' => true, 'message' => 'Vendor updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update vendor'], 500);
        }
    }

    /**
     * Vendor Details with Transactions
     */
    public function show(MedicineVendor $vendor)
    {
        $vendor->load([
            'transactions' => function($query) {
                $query->with('createdBy')->orderBy('created_at', 'desc');
            },
            'payments' => function($query) {
                $query->with('createdBy')->orderBy('created_at', 'desc');
            },
            'stocks.medicine'
        ]);

        // Get overdue transactions
        $overdueTransactions = $vendor->transactions()
            ->where('type', 'purchase')
            ->where('payment_status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->with('createdBy')
            ->get();

        // Recent purchases
        $recentPurchases = $vendor->stocks()
            ->with(['medicine', 'addedBy'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('MedicineVendor/Show', [
            'vendor' => $vendor,
            'overdueTransactions' => $overdueTransactions,
            'recentPurchases' => $recentPurchases,
        ]);
    }

    /**
     * Purchase from Vendor (Updated addStock method)
     */
    public function addStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vendor_id' => 'required|exists:medicine_vendors,id',
            'medicine_id' => 'required|exists:medicines,id',
            'batch_number' => 'required|string|max:255',
            'expiry_date' => 'required|date|after:today',
            'quantity' => 'required|integer|min:1',
            'buy_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|in:cash,bank_transfer,cheque,credit',
            'cheque_no' => 'nullable|string|max:255',
            'cheque_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $vendor = MedicineVendor::findOrFail($request->vendor_id);
            $medicine = Medicine::findOrFail($request->medicine_id);
            $totalPurchaseAmount = $request->quantity * $request->buy_price;
            $paidAmount = $request->paid_amount ?? 0;
            $dueAmount = $totalPurchaseAmount - $paidAmount;

            // Check credit limit
            if ($dueAmount > 0 && ($vendor->current_balance + $dueAmount) > $vendor->credit_limit && $vendor->credit_limit > 0) {
                throw new \Exception("Credit limit exceeded. Current due: ৳{$vendor->current_balance}, Credit limit: ৳{$vendor->credit_limit}");
            }

            // If immediate payment, check hospital account balance
            if ($paidAmount > 0) {
                $hospitalBalance = HospitalAccount::getBalance();
                if ($hospitalBalance < $paidAmount) {
                    throw new \Exception("Insufficient balance in Hospital Account. Available: ৳{$hospitalBalance}, Required: ৳{$paidAmount}");
                }
            }

            // Create vendor transaction
            $vendorTransaction = MedicineVendorTransaction::create([
                'transaction_no' => MedicineVendorTransaction::generateTransactionNo(),
                'vendor_id' => $vendor->id,
                'type' => 'purchase',
                'amount' => $totalPurchaseAmount,
                'due_amount' => $dueAmount,
                'paid_amount' => $paidAmount,
                'payment_status' => $dueAmount > 0 ? 'partial' : 'paid',
                'reference_type' => 'medicine_purchase',
                'payment_method' => $request->payment_method,
                'cheque_no' => $request->cheque_no,
                'cheque_date' => $request->cheque_date,
                'description' => "Medicine purchase - {$medicine->name} (Batch: {$request->batch_number})",
                'transaction_date' => now()->toDateString(),
                'due_date' => now()->addDays($vendor->payment_terms_days)->toDateString(),
                'created_by' => auth()->id(),
            ]);

            // Create medicine stock
            $stock = MedicineStock::create([
                'medicine_id' => $request->medicine_id,
                'vendor_id' => $vendor->id,
                'batch_number' => $request->batch_number,
                'expiry_date' => $request->expiry_date,
                'quantity' => $request->quantity,
                'available_quantity' => $request->quantity,
                'buy_price' => $request->buy_price,
                'sale_price' => $request->sale_price,
                'due_amount' => $dueAmount,
                'payment_status' => $dueAmount > 0 ? 'partial' : 'paid',
                'purchase_date' => now()->toDateString(),
                'notes' => $request->notes,
                'added_by' => auth()->id(),
            ]);

            // Create stock transaction
            $stockTransaction = StockTransaction::create([
                'medicine_stock_id' => $stock->id,
                'type' => 'purchase',
                'quantity' => $request->quantity,
                'unit_price' => $request->buy_price,
                'total_amount' => $totalPurchaseAmount,
                'vendor_transaction_id' => $vendorTransaction->id,
                'reason' => 'Stock purchase - Batch: ' . $request->batch_number,
                'created_by' => auth()->id(),
            ]);

            // Update vendor transaction reference
            $vendorTransaction->update(['reference_id' => $stock->id]);

            // Handle immediate payment
            if ($paidAmount > 0) {
                // Create vendor payment record
                MedicineVendorPayment::create([
                    'payment_no' => MedicineVendorPayment::generatePaymentNo(),
                    'vendor_id' => $vendor->id,
                    'amount' => $paidAmount,
                    'payment_method' => $request->payment_method ?? 'cash',
                    'reference_no' => $request->cheque_no,
                    'payment_date' => now()->toDateString(),
                    'description' => "Payment for purchase - {$medicine->name}",
                    'allocated_transactions' => [$vendorTransaction->id],
                    'created_by' => auth()->id(),
                ]);

                // Add expense to Hospital Account with Medicine Purchase category
                $purchaseCategory = HospitalExpenseCategory::firstOrCreate(
                    ['name' => 'Medicine Purchase'],
                    ['is_active' => true]
                );

                HospitalAccount::addExpense(
                    $paidAmount,
                    'Medicine Purchase',
                    "Purchase payment to {$vendor->name} for {$medicine->name} (Batch: {$request->batch_number})",
                    $purchaseCategory->id,
                    now()->toDateString()
                );
            }

            // Update vendor balance
            $vendor->updateBalance();

            // Update medicine totals
            $medicine->updateTotalStock();
            $medicine->updateAverageBuyPrice();

            DB::commit();

            $message = "Stock added successfully! Total: ৳{$totalPurchaseAmount}";
            if ($paidAmount > 0) {
                $message .= ", Paid: ৳{$paidAmount}";
            }
            if ($dueAmount > 0) {
                $message .= ", Due: ৳{$dueAmount}";
            }

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Failed to add stock: ' . $e->getMessage());
        }
    }

    /**
     * Make Payment to Vendor
     */
    public function makePayment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vendor_id' => 'required|exists:medicine_vendors,id',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string|in:cash,bank_transfer,cheque,mobile_banking',
            'reference_no' => 'nullable|string|max:255',
            'payment_date' => 'required|date',
            'description' => 'required|string|max:500',
            'allocated_transactions' => 'nullable|array',
            'allocated_transactions.*' => 'exists:medicine_vendor_transactions,id',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $vendor = MedicineVendor::findOrFail($request->vendor_id);

            // Check hospital account balance
            $hospitalBalance = HospitalAccount::getBalance();
            if ($hospitalBalance < $request->amount) {
                throw new \Exception("Insufficient balance in Hospital Account. Available: ৳{$hospitalBalance}, Required: ৳{$request->amount}");
            }

            // Check if payment amount doesn't exceed due amount
            if ($request->amount > $vendor->current_balance && $vendor->balance_type === 'due') {
                throw new \Exception("Payment amount exceeds due amount. Due: ৳{$vendor->current_balance}");
            }

            // Create payment record
            $payment = MedicineVendorPayment::create([
                'payment_no' => MedicineVendorPayment::generatePaymentNo(),
                'vendor_id' => $vendor->id,
                'amount' => $request->amount,
                'payment_method' => $request->payment_method,
                'reference_no' => $request->reference_no,
                'payment_date' => $request->payment_date,
                'description' => $request->description,
                'allocated_transactions' => $request->allocated_transactions ?? [],
                'created_by' => auth()->id(),
            ]);

            // Update allocated transactions
            if (!empty($request->allocated_transactions)) {
                $remainingAmount = $request->amount;

                foreach ($request->allocated_transactions as $transactionId) {
                    if ($remainingAmount <= 0) break;

                    $transaction = MedicineVendorTransaction::findOrFail($transactionId);
                    $paymentForTransaction = min($remainingAmount, $transaction->due_amount);

                    $transaction->paid_amount += $paymentForTransaction;
                    $transaction->due_amount -= $paymentForTransaction;

                    if ($transaction->due_amount <= 0) {
                        $transaction->payment_status = 'paid';
                    } elseif ($transaction->paid_amount > 0) {
                        $transaction->payment_status = 'partial';
                    }

                    $transaction->save();
                    $remainingAmount -= $paymentForTransaction;

                    // Update related stock payment status
                    if ($transaction->reference_type === 'medicine_purchase' && $transaction->reference_id) {
                        $stock = MedicineStock::find($transaction->reference_id);
                        if ($stock) {
                            $stock->due_amount = $transaction->due_amount;
                            $stock->payment_status = $transaction->payment_status;
                            $stock->save();
                        }
                    }
                }
            }

            // Add expense to Hospital Account with Medicine Vendor Payment category
            $paymentCategory = HospitalExpenseCategory::firstOrCreate(
                ['name' => 'Medicine Vendor Payment'],
                ['is_active' => true]
            );

            HospitalAccount::addExpense(
                $request->amount,
                'Medicine Vendor Payment',
                "Payment to {$vendor->name} - {$request->description}",
                $paymentCategory->id,
                $request->payment_date
            );

            // Update vendor balance
            $vendor->updateBalance();

            DB::commit();

            return redirect()->back()->with('success', "Payment of ৳{$request->amount} made successfully to {$vendor->name}");
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Failed to make payment: ' . $e->getMessage());
        }
    }

    /**
     * Vendor Due Report
     */
    public function dueReport(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        $vendorsWithDues = MedicineVendor::with([
                'transactions' => function($query) use ($dateFrom, $dateTo) {
                    $query->where('type', 'purchase')
                          ->where('payment_status', '!=', 'paid')
                          ->whereBetween('transaction_date', [$dateFrom, $dateTo]);
                }
            ])
            ->withDues()
            ->get()
            ->map(function($vendor) {
                $overdueAmount = $vendor->transactions
                    ->where('due_date', '<', now())
                    ->sum('due_amount');

                $vendor->overdue_amount = $overdueAmount;
                return $vendor;
            })
            ->sortByDesc('current_balance');

        // Summary statistics
        $totalDues = $vendorsWithDues->sum('current_balance');
        $totalOverdue = $vendorsWithDues->sum('overdue_amount');
        $vendorCount = $vendorsWithDues->count();

        // Aging analysis
        $agingAnalysis = [
            'current' => 0,
            '1_30_days' => 0,
            '31_60_days' => 0,
            '61_90_days' => 0,
            'over_90_days' => 0,
        ];

        foreach ($vendorsWithDues as $vendor) {
            foreach ($vendor->transactions as $transaction) {
                $daysPastDue = now()->diffInDays($transaction->due_date, false);

                if ($daysPastDue <= 0) {
                    $agingAnalysis['current'] += $transaction->due_amount;
                } elseif ($daysPastDue <= 30) {
                    $agingAnalysis['1_30_days'] += $transaction->due_amount;
                } elseif ($daysPastDue <= 60) {
                    $agingAnalysis['31_60_days'] += $transaction->due_amount;
                } elseif ($daysPastDue <= 90) {
                    $agingAnalysis['61_90_days'] += $transaction->due_amount;
                } else {
                    $agingAnalysis['over_90_days'] += $transaction->due_amount;
                }
            }
        }

        return Inertia::render('MedicineVendor/DueReport', [
            'vendorsWithDues' => $vendorsWithDues,
            'filters' => ['date_from' => $dateFrom, 'date_to' => $dateTo],
            'summary' => [
                'total_dues' => $totalDues,
                'total_overdue' => $totalOverdue,
                'vendor_count' => $vendorCount,
            ],
            'agingAnalysis' => $agingAnalysis,
        ]);
    }

    /**
     * Payment History
     */
    public function paymentHistory(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        $payments = MedicineVendorPayment::with(['vendor', 'createdBy'])
            ->whereBetween('payment_date', [$dateFrom, $dateTo])
            ->when($request->vendor_id, function($query, $vendorId) {
                $query->where('vendor_id', $vendorId);
            })
            ->when($request->payment_method, function($query, $method) {
                $query->where('payment_method', $method);
            })
            ->orderBy('payment_date', 'desc')
            ->paginate(20);

        $vendors = MedicineVendor::active()->orderBy('name')->get(['id', 'name']);

        $totalPayments = MedicineVendorPayment::whereBetween('payment_date', [$dateFrom, $dateTo])->sum('amount');

        return Inertia::render('MedicineVendor/PaymentHistory', [
            'payments' => $payments,
            'vendors' => $vendors,
            'filters' => $request->only(['date_from', 'date_to', 'vendor_id', 'payment_method']),
            'totalPayments' => $totalPayments,
        ]);
    }

    /**
     * Vendor Analytics
     */
    public function analytics(Request $request)
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month', now()->month);

        // Top vendors by purchase volume
        $topVendors = MedicineVendor::with(['transactions' => function($query) use ($year, $month) {
                $query->where('type', 'purchase')
                      ->whereYear('transaction_date', $year)
                      ->whereMonth('transaction_date', $month);
            }])
            ->get()
            ->map(function($vendor) {
                $totalPurchases = $vendor->transactions->sum('amount');
                return [
                    'name' => $vendor->name,
                    'company_name' => $vendor->company_name,
                    'total_purchases' => $totalPurchases,
                    'transaction_count' => $vendor->transactions->count(),
                    'current_due' => $vendor->current_balance,
                ];
            })
            ->sortByDesc('total_purchases')
            ->take(10)
            ->values();

        // Monthly purchase trend
        $monthlyTrend = MedicineVendorTransaction::where('type', 'purchase')
            ->where('created_at', '>=', now()->subMonths(12))
            ->selectRaw('
                YEAR(transaction_date) as year,
                MONTH(transaction_date) as month,
                SUM(amount) as total_purchases,
                COUNT(*) as transaction_count
            ')
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->limit(12)
            ->get();

        // Payment method analysis
        $paymentMethods = MedicineVendorPayment::whereYear('payment_date', $year)
            ->whereMonth('payment_date', $month)
            ->selectRaw('payment_method, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('payment_method')
            ->get();

        // Vendor performance metrics
        $vendorMetrics = [
            'total_active_vendors' => MedicineVendor::active()->count(),
            'vendors_with_dues' => MedicineVendor::withDues()->count(),
            'average_payment_terms' => MedicineVendor::active()->avg('payment_terms_days'),
            'total_credit_limit' => MedicineVendor::active()->sum('credit_limit'),
        ];

        return Inertia::render('MedicineVendor/Analytics', [
            'topVendors' => $topVendors,
            'monthlyTrend' => $monthlyTrend,
            'paymentMethods' => $paymentMethods,
            'vendorMetrics' => $vendorMetrics,
            'filters' => ['year' => $year, 'month' => $month],
        ]);
    }

    /**
     * Adjust Vendor Balance
     */
    public function adjustBalance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vendor_id' => 'required|exists:medicine_vendors,id',
            'adjustment_type' => 'required|in:increase,decrease',
            'amount' => 'required|numeric|min:1',
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $vendor = MedicineVendor::findOrFail($request->vendor_id);

            // Create adjustment transaction
            MedicineVendorTransaction::create([
                'transaction_no' => MedicineVendorTransaction::generateTransactionNo(),
                'vendor_id' => $vendor->id,
                'type' => 'adjustment',
                'amount' => $request->amount,
                'due_amount' => $request->adjustment_type === 'increase' ? $request->amount : 0,
                'paid_amount' => $request->adjustment_type === 'decrease' ? $request->amount : 0,
                'payment_status' => 'paid',
                'description' => $request->reason,
                'transaction_date' => now()->toDateString(),
                'created_by' => auth()->id(),
            ]);

            // Update vendor balance
            if ($request->adjustment_type === 'increase') {
                $vendor->current_balance += $request->amount;
                $vendor->balance_type = 'due';
            } else {
                $vendor->current_balance = max(0, $vendor->current_balance - $request->amount);
            }

            $vendor->save();

            DB::commit();

            return redirect()->back()->with('success', 'Vendor balance adjusted successfully');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Failed to adjust balance: ' . $e->getMessage());
        }
    }

    /**
     * Get Vendor for Purchase (AJAX)
     */
    public function getVendorsForPurchase()
    {
        $vendors = MedicineVendor::active()
            ->select('id', 'name', 'company_name', 'current_balance', 'credit_limit', 'payment_terms_days')
            ->orderBy('name')
            ->get();

        return response()->json(['vendors' => $vendors]);
    }

    /**
     * Get Vendor Pending Transactions (AJAX)
     */
    public function getVendorPendingTransactions(MedicineVendor $vendor)
    {
        $pendingTransactions = $vendor->transactions()
            ->where('type', 'purchase')
            ->where('payment_status', '!=', 'paid')
            ->where('due_amount', '>', 0)
            ->orderBy('due_date', 'asc')
            ->get(['id', 'transaction_no', 'amount', 'due_amount', 'transaction_date', 'due_date']);

        return response()->json(['transactions' => $pendingTransactions]);
    }

    /**
     * Export Vendor Reports
     */
    public function exportReport(Request $request)
    {
        $type = $request->get('type', 'vendors');
        $format = $request->get('format', 'excel');

        // Implementation for exporting reports
        // You can use Laravel Excel or similar package

        return response()->json([
            'success' => true,
            'message' => 'Export functionality to be implemented',
            'type' => $type,
            'format' => $format
        ]);
    }
}
