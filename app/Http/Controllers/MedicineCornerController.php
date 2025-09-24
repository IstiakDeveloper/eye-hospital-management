<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\MedicineAccount;
use App\Models\MedicineSale;
use App\Models\MedicineSaleItem;
use App\Models\MedicineStock;
use App\Models\MedicineVendor;
use App\Models\MedicineVendorPayment;
use App\Models\MedicineVendorTransaction;
use App\Models\Patient;
use App\Models\StockTransaction;
use App\Models\StockAlert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Carbon\Carbon;

class MedicineCornerController extends Controller
{
    /**
     * Stock Management Page
     */
    public function stock()
    {
        $stocks = MedicineStock::with(['medicine', 'vendor', 'addedBy'])
            ->where('available_quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->paginate(20);

        $lowStockMedicines = Medicine::with('stockAlert')
            ->whereHas('stockAlert', function ($query) {
                $query->whereRaw('medicines.total_stock <= stock_alerts.minimum_stock');
            })
            ->limit(5)
            ->get();

        $expiringStock = MedicineStock::with(['medicine', 'vendor'])
            ->where('expiry_date', '>', now())
            ->where('expiry_date', '<=', now()->addDays(30))
            ->where('available_quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->limit(10)
            ->get();

        $totalStockValue = MedicineStock::where('available_quantity', '>', 0)
            ->get()
            ->sum(function ($stock) {
                return $stock->available_quantity * $stock->buy_price;
            });

        // Pending payments to vendors
        $pendingVendorPayments = MedicineStock::with(['vendor', 'medicine'])
            ->where('payment_status', '!=', 'paid')
            ->where('due_amount', '>', 0)
            ->orderBy('purchase_date', 'asc')
            ->limit(10)
            ->get();

        return Inertia::render('MedicineCorner/Stock', [
            'stocks' => $stocks,
            'lowStockMedicines' => $lowStockMedicines,
            'expiringStock' => $expiringStock,
            'totalStockValue' => $totalStockValue,
            'pendingVendorPayments' => $pendingVendorPayments,
        ]);
    }

    /**
     * Medicine List Page - Enhanced with proper filtering and search
     */
    public function medicines(Request $request)
    {
        $query = Medicine::with(['stockAlert'])
            ->withCount('stocks');

        // Search functionality
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('generic_name', 'like', "%{$search}%")
                    ->orWhere('manufacturer', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%");
            });
        }

        // Type filter
        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        // Manufacturer filter
        if ($manufacturer = $request->get('manufacturer')) {
            $query->where('manufacturer', 'like', "%{$manufacturer}%");
        }

        // Stock status filters
        if ($stockStatus = $request->get('stock_status')) {
            switch ($stockStatus) {
                case 'in_stock':
                    $query->where('total_stock', '>', 0);
                    break;
                case 'low_stock':
                    $query->whereHas('stockAlert', function ($q) {
                        $q->whereRaw('medicines.total_stock <= stock_alerts.minimum_stock')
                            ->where('medicines.total_stock', '>', 0);
                    });
                    break;
                case 'out_of_stock':
                    $query->where('total_stock', '<=', 0);
                    break;
                case 'reorder_level':
                    $query->whereHas('stockAlert', function ($q) {
                        $q->whereRaw('medicines.total_stock <= stock_alerts.reorder_level')
                            ->whereRaw('medicines.total_stock > stock_alerts.minimum_stock');
                    });
                    break;
            }
        }

        // Active status filter
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Sort options
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        switch ($sortBy) {
            case 'stock':
                $query->orderBy('total_stock', $sortOrder);
                break;
            case 'price':
                $query->orderBy('standard_sale_price', $sortOrder);
                break;
            case 'type':
                $query->orderBy('type', $sortOrder)->orderBy('name', 'asc');
                break;
            default:
                $query->orderBy('name', $sortOrder);
        }

        $medicines = $query->paginate(20)->withQueryString();

        // Get filter options
        $filterOptions = [
            'types' => Medicine::distinct()->pluck('type')->filter()->sort()->values(),
            'manufacturers' => Medicine::distinct()->pluck('manufacturer')->filter()->sort()->values(),
        ];

        // Statistics
        $stats = [
            'total_medicines' => Medicine::count(),
            'active_medicines' => Medicine::where('is_active', true)->count(),
            'in_stock' => Medicine::where('total_stock', '>', 0)->count(),
            'low_stock' => Medicine::whereHas('stockAlert', function ($q) {
                $q->whereRaw('medicines.total_stock <= stock_alerts.minimum_stock')
                    ->where('medicines.total_stock', '>', 0);
            })->count(),
            'out_of_stock' => Medicine::where('total_stock', '<=', 0)->count(),
            'total_stock_value' => $this->calculateTotalStockValue(),
        ];

        return Inertia::render('MedicineCorner/Medicines', [
            'medicines' => $medicines,
            'filterOptions' => $filterOptions,
            'stats' => $stats,
            'filters' => $request->only(['search', 'type', 'manufacturer', 'stock_status', 'active', 'sort_by', 'sort_order']),
        ]);
    }

    /**
     * Get Medicine Details with Stock - Fixed route
     */
    public function getMedicineDetails($id)
    {
        try {
            $medicine = Medicine::with([
                'stocks' => function ($query) {
                    $query->where('available_quantity', '>', 0)
                        ->with('vendor')
                        ->orderBy('expiry_date', 'asc');
                },
                'stockAlert'
            ])->findOrFail($id);

            // Calculate stock summary
            $stockSummary = [
                'total_batches' => $medicine->stocks->count(),
                'total_quantity' => $medicine->stocks->sum('available_quantity'),
                'earliest_expiry' => $medicine->stocks->min('expiry_date'),
                'average_buy_price' => $medicine->stocks->avg('buy_price'),
                'total_value' => $medicine->stocks->sum(function ($stock) {
                    return $stock->available_quantity * $stock->buy_price;
                }),
            ];

            return response()->json([
                'success' => true,
                'medicine' => $medicine,
                'stockSummary' => $stockSummary,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Medicine not found',
            ], 404);
        }
    }

    /**
     * Calculate total stock value
     */
    private function calculateTotalStockValue()
    {
        return MedicineStock::where('available_quantity', '>', 0)
            ->get()
            ->sum(function ($stock) {
                return $stock->available_quantity * $stock->buy_price;
            });
    }

    /**
     * Purchase Entry Page - Updated to include vendors
     */
    public function purchase()
    {
        $medicines = Medicine::active()
            ->with(['stocks' => function ($query) {
                $query->orderBy('created_at', 'desc')->limit(1);
            }])
            ->orderBy('name')
            ->get(['id', 'name', 'generic_name', 'standard_sale_price'])
            ->map(function ($medicine) {
                $latestStock = $medicine->stocks->first();
                return [
                    'id' => $medicine->id,
                    'name' => $medicine->name,
                    'generic_name' => $medicine->generic_name,
                    'standard_sale_price' => $medicine->standard_sale_price,
                    'latest_buy_price' => $latestStock ? $latestStock->buy_price : 0,
                    'latest_sale_price' => $latestStock ? $latestStock->sale_price : $medicine->standard_sale_price,
                ];
            });
        // Get active vendors
        $vendors = MedicineVendor::active()
            ->orderBy('name')
            ->get(['id', 'name', 'company_name', 'current_balance', 'credit_limit', 'payment_terms_days']);

        $recentPurchases = StockTransaction::with(['medicineStock.medicine', 'medicineStock.vendor', 'createdBy'])
            ->where('type', 'purchase')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $todayPurchases = StockTransaction::where('type', 'purchase')
            ->whereDate('created_at', today())
            ->sum('total_amount');

        // Vendors with pending dues
        $vendorsWithDues = MedicineVendor::withDues()
            ->limit(5)
            ->get(['id', 'name', 'current_balance']);

        return Inertia::render('MedicineCorner/Purchase', [
            'medicines' => $medicines,
            'vendors' => $vendors,
            'recentPurchases' => $recentPurchases,
            'todayPurchases' => $todayPurchases,
            'vendorsWithDues' => $vendorsWithDues,
        ]);
    }


    /**
     * Alerts Page
     */
    public function alerts()
    {
        $lowStockMedicines = Medicine::with(['stockAlert'])
            ->whereHas('stockAlert', function ($query) {
                $query->where('low_stock_alert', true)
                    ->whereRaw('medicines.total_stock <= stock_alerts.minimum_stock');
            })
            ->get();

        $expiringMedicines = MedicineStock::with(['medicine'])
            ->where('expiry_date', '>', now())
            ->where('expiry_date', '<=', now()->addDays(30))
            ->where('available_quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->get();

        $expiredMedicines = MedicineStock::with(['medicine'])
            ->where('expiry_date', '<=', now())
            ->where('available_quantity', '>', 0)
            ->orderBy('expiry_date', 'desc')
            ->get();

        return Inertia::render('MedicineCorner/Alerts', [
            'lowStockMedicines' => $lowStockMedicines,
            'expiringMedicines' => $expiringMedicines,
            'expiredMedicines' => $expiredMedicines,
        ]);
    }

    /**
     * Updated Add Stock Method (replace the existing one)
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
                throw new \Exception("Credit limit exceeded for {$vendor->name}. Current due: ৳{$vendor->current_balance}, Credit limit: ৳{$vendor->credit_limit}");
            }

            // If immediate payment, check medicine account balance
            if ($paidAmount > 0) {
                $medicineBalance = MedicineAccount::getBalance();
                if ($medicineBalance < $paidAmount) {
                    throw new \Exception("Insufficient balance in Medicine Account. Available: ৳{$medicineBalance}, Required: ৳{$paidAmount}");
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
                'payment_status' => $dueAmount > 0 ? ($paidAmount > 0 ? 'partial' : 'pending') : 'paid',
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
                'purchase_date' => now()->toDateString(),
                'notes' => $request->notes,
                'added_by' => auth()->id(),
            ]);


            // Create stock transaction
            StockTransaction::create([
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

                // Deduct from medicine account
                MedicineAccount::addExpense(
                    $paidAmount,
                    'vendor_payment',
                    "Payment to {$vendor->name} for {$medicine->name}",
                    1
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
                $message .= ", Due to {$vendor->name}: ৳{$dueAmount}";
            }

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Failed to add stock: ' . $e->getMessage());
        }
    }

    /**
     * Store New Medicine
     */
    public function storeMedicine(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'type' => 'required|string|max:100',
            'manufacturer' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'standard_sale_price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'minimum_stock' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $medicine = Medicine::create([
                'name' => $request->name,
                'generic_name' => $request->generic_name,
                'type' => $request->type,
                'manufacturer' => $request->manufacturer,
                'description' => $request->description,
                'standard_sale_price' => $request->standard_sale_price,
                'unit' => $request->unit,
                'is_active' => true,
                'track_stock' => true,
            ]);

            // Create stock alert
            StockAlert::create([
                'medicine_id' => $medicine->id,
                'minimum_stock' => $request->minimum_stock,
                'reorder_level' => $request->reorder_level,
                'low_stock_alert' => true,
                'expiry_alert' => true,
                'expiry_alert_days' => 30,
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Medicine added successfully');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Failed to add medicine: ' . $e->getMessage());
        }
    }

    /**
     * Adjust Stock
     */
    public function adjustStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'stock_id' => 'required|exists:medicine_stocks,id',
            'adjustment_type' => 'required|in:add,reduce,expired,damaged',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $stock = MedicineStock::findOrFail($request->stock_id);
            $originalQuantity = $stock->available_quantity;

            switch ($request->adjustment_type) {
                case 'add':
                    $stock->available_quantity += $request->quantity;
                    $transactionType = 'adjustment';
                    $transactionQuantity = $request->quantity;
                    break;

                case 'reduce':
                    if ($stock->available_quantity < $request->quantity) {
                        return redirect()->back()->with('error', 'Cannot reduce more than available quantity');
                    }
                    $stock->available_quantity -= $request->quantity;
                    $transactionType = 'adjustment';
                    $transactionQuantity = -$request->quantity;
                    break;

                case 'expired':
                    if ($stock->available_quantity < $request->quantity) {
                        return redirect()->back()->with('error', 'Cannot mark more than available quantity as expired');
                    }
                    $stock->available_quantity -= $request->quantity;
                    $transactionType = 'expired';
                    $transactionQuantity = -$request->quantity;
                    break;

                case 'damaged':
                    if ($stock->available_quantity < $request->quantity) {
                        return redirect()->back()->with('error', 'Cannot mark more than available quantity as damaged');
                    }
                    $stock->available_quantity -= $request->quantity;
                    $transactionType = 'damaged';
                    $transactionQuantity = -$request->quantity;
                    break;
            }

            $stock->save();

            // Create transaction record
            StockTransaction::create([
                'medicine_stock_id' => $stock->id,
                'type' => $transactionType,
                'quantity' => abs($request->quantity),
                'unit_price' => $stock->buy_price,
                'total_amount' => abs($request->quantity) * $stock->buy_price,
                'reason' => $request->reason,
                'created_by' => auth()->id(),
            ]);

            // Update medicine totals
            $medicine = $stock->medicine;
            $medicine->updateTotalStock();
            $medicine->updateAverageBuyPrice();

            DB::commit();

            return redirect()->back()->with('success', 'Stock adjusted successfully');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Failed to adjust stock: ' . $e->getMessage());
        }
    }

    /**
     * Update Medicine
     */
    public function updateMedicine(Request $request, Medicine $medicine)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'type' => 'required|string|max:100',
            'manufacturer' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'standard_sale_price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'is_active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $medicine->update($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Medicine updated successfully',
                'medicine' => $medicine
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update medicine: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update Stock Alert Settings
     */
    public function updateStockAlert(Request $request, Medicine $medicine)
    {
        $validator = Validator::make($request->all(), [
            'minimum_stock' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'low_stock_alert' => 'required|boolean',
            'expiry_alert' => 'required|boolean',
            'expiry_alert_days' => 'required|integer|min:1|max:365',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $medicine->stockAlert()->updateOrCreate(
                ['medicine_id' => $medicine->id],
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock alert settings updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update stock alert: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Export Reports
     */
    public function exportReports(Request $request)
    {
        // This would handle Excel/PDF export
        // You can implement using Laravel Excel or similar package

        return response()->json([
            'success' => true,
            'message' => 'Export functionality to be implemented'
        ]);
    }

    /**
     * Sales List Page
     */
    public function sales(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());
        $status = $request->get('status', 'all');
        $search = $request->get('search');

        $salesQuery = MedicineSale::with(['patient', 'soldBy', 'items.medicineStock.medicine'])
            ->whereBetween('sale_date', [$dateFrom, $dateTo]);

        if ($status !== 'all') {
            $salesQuery->where('payment_status', $status);
        }

        if ($search) {
            $salesQuery->where(function ($query) use ($search) {
                $query->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        $sales = $salesQuery->orderBy('created_at', 'desc')->paginate(20);

        // Summary statistics
        $totalSales = MedicineSale::whereBetween('sale_date', [$dateFrom, $dateTo])->sum('total_amount');
        $totalProfit = MedicineSale::whereBetween('sale_date', [$dateFrom, $dateTo])->sum('total_profit');
        $pendingDues = MedicineSale::whereBetween('sale_date', [$dateFrom, $dateTo])
            ->where('payment_status', '!=', 'paid')
            ->sum('due_amount');
        $todaySales = MedicineSale::whereDate('sale_date', today())->count();

        return Inertia::render('MedicineCorner/Sales', [
            'sales' => $sales,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'status' => $status,
                'search' => $search,
            ],
            'statistics' => [
                'total_sales' => $totalSales,
                'total_profit' => $totalProfit,
                'pending_dues' => $pendingDues,
                'today_sales' => $todaySales,
            ],
        ]);
    }

    /**
     * Sale Details Page
     */
    public function saleDetails(MedicineSale $sale)
    {
        $sale->load([
            'patient',
            'soldBy',
            'prescription',
            'items.medicineStock.medicine'
        ]);

        return Inertia::render('MedicineCorner/SaleDetails', [
            'sale' => $sale,
        ]);
    }

    /**
     * Edit Sale Page
     */
    public function editSale(MedicineSale $sale)
    {
        $sale->load([
            'patient',
            'soldBy',
            'items.medicineStock.medicine'
        ]);

        $medicines = Medicine::with(['stocks' => function ($query) {
            $query->where('available_quantity', '>', 0)
                ->where('expiry_date', '>', now())
                ->where('is_active', true)
                ->orderBy('expiry_date', 'asc');
        }])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $patients = Patient::orderBy('created_at', 'desc')
            ->limit(50)
            ->get(['id', 'name', 'phone', 'email']);

        return Inertia::render('MedicineCorner/EditSale', [
            'sale' => $sale,
            'medicines' => $medicines,
            'patients' => $patients,
        ]);
    }

    /**
     * Update Sale
     */
    public function updateSale(Request $request, MedicineSale $sale)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.medicine_stock_id' => 'required|exists:medicine_stocks,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'patient_id' => 'nullable|exists:patients,id',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            // Store original items for stock adjustment
            $originalItems = $sale->items()->with('medicineStock')->get();

            // Restore original stock quantities
            foreach ($originalItems as $originalItem) {
                $originalItem->medicineStock->available_quantity += $originalItem->quantity;
                $originalItem->medicineStock->save();
                $originalItem->medicineStock->medicine->updateTotalStock();
            }

            // Delete original items
            $sale->items()->delete();

            // Calculate new totals
            $subtotal = 0;
            $totalProfit = 0;

            foreach ($request->items as $item) {
                $stock = MedicineStock::findOrFail($item['medicine_stock_id']);

                // Check stock availability
                if ($stock->available_quantity < $item['quantity']) {
                    throw new \Exception("Insufficient stock for {$stock->medicine->name}. Available: {$stock->available_quantity}");
                }

                $lineTotal = $item['quantity'] * $item['unit_price'];
                $lineProfit = ($item['unit_price'] - $stock->buy_price) * $item['quantity'];

                $subtotal += $lineTotal;
                $totalProfit += $lineProfit;

                // Create new sale item
                MedicineSaleItem::create([
                    'medicine_sale_id' => $sale->id,
                    'medicine_stock_id' => $item['medicine_stock_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'buy_price' => $stock->buy_price,
                ]);

                // Update stock
                $stock->available_quantity -= $item['quantity'];
                $stock->save();
                $stock->medicine->updateTotalStock();

                // Create/Update stock transaction
                StockTransaction::create([
                    'medicine_stock_id' => $stock->id,
                    'type' => 'sale_update',
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_amount' => $lineTotal,
                    'reference_type' => 'medicine_sale',
                    'reference_id' => $sale->id,
                    'reason' => 'Sale update - Invoice: ' . $sale->invoice_number,
                    'created_by' => auth()->id(),
                ]);
            }

            $discount = $request->discount ?? 0;
            $tax = $request->tax ?? 0;
            $totalAmount = $subtotal - $discount + $tax;
            $dueAmount = max(0, $totalAmount - $request->paid_amount);

            // Update sale record
            $sale->update([
                'patient_id' => $request->patient_id,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total_amount' => $totalAmount,
                'paid_amount' => $request->paid_amount,
                'due_amount' => $dueAmount,
                'total_profit' => $totalProfit,
                'payment_status' => $dueAmount > 0 ? 'partial' : 'paid',
                'notes' => $request->notes,
                'updated_by' => auth()->id(),
            ]);

            DB::commit();

            return redirect()->route('medicine-corner.sale-details', $sale->id)
                ->with('success', 'Sale updated successfully!');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Failed to update sale: ' . $e->getMessage());
        }
    }

    /**
     * Update Payment Status
     */
    public function updatePayment(Request $request, MedicineSale $sale)
    {
        $validator = Validator::make($request->all(), [
            'paid_amount' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string',
            'payment_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $dueAmount = max(0, $sale->total_amount - $request->paid_amount);
            $paymentStatus = $dueAmount > 0 ? 'partial' : 'paid';

            $sale->update([
                'paid_amount' => $request->paid_amount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'payment_method' => $request->payment_method,
                'payment_notes' => $request->payment_notes,
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment updated successfully',
                'sale' => $sale->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete Sale
     */
    public function deleteSale(MedicineSale $sale)
    {
        DB::beginTransaction();
        try {
            // Restore stock quantities
            foreach ($sale->items as $item) {
                $item->medicineStock->available_quantity += $item->quantity;
                $item->medicineStock->save();
                $item->medicineStock->medicine->updateTotalStock();

                // Create reverse stock transaction
                StockTransaction::create([
                    'medicine_stock_id' => $item->medicine_stock_id,
                    'type' => 'sale_cancellation',
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total_amount' => $item->quantity * $item->unit_price,
                    'reference_type' => 'medicine_sale',
                    'reference_id' => $sale->id,
                    'reason' => 'Sale cancellation - Invoice: ' . $sale->invoice_number,
                    'created_by' => auth()->id(),
                ]);
            }

            // Delete sale items and sale
            $sale->items()->delete();
            $sale->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Sale deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete sale: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk Actions on Sales
     */
    public function bulkAction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:mark_paid,export,delete',
            'sale_ids' => 'required|array|min:1',
            'sale_ids.*' => 'exists:medicine_sales,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $sales = MedicineSale::whereIn('id', $request->sale_ids);

            switch ($request->action) {
                case 'mark_paid':
                    $sales->update([
                        'payment_status' => 'paid',
                        'due_amount' => 0,
                        'updated_by' => auth()->id(),
                    ]);
                    $message = 'Selected sales marked as paid successfully';
                    break;

                case 'export':
                    // Implement export functionality
                    $message = 'Export functionality to be implemented';
                    break;

                case 'delete':
                    // Note: This is dangerous - implement with proper authorization
                    $message = 'Delete functionality requires individual confirmation';
                    break;
            }

            return response()->json([
                'success' => true,
                'message' => $message
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bulk action failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sales Analytics
     */
    public function salesAnalytics(Request $request)
    {
        $period = $request->get('period', '30'); // days

        $startDate = now()->subDays($period);

        // Daily sales trend
        $dailySales = MedicineSale::where('sale_date', '>=', $startDate)
            ->selectRaw('DATE(sale_date) as date, COUNT(*) as count, SUM(total_amount) as amount, SUM(total_profit) as profit')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Top selling medicines
        $topMedicines = DB::table('medicine_sale_items')
            ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
            ->join('medicine_stocks', 'medicine_sale_items.medicine_stock_id', '=', 'medicine_stocks.id')
            ->join('medicines', 'medicine_stocks.medicine_id', '=', 'medicines.id')
            ->where('medicine_sales.sale_date', '>=', $startDate)
            ->select(
                'medicines.name',
                DB::raw('SUM(medicine_sale_items.quantity) as total_quantity'),
                DB::raw('SUM(medicine_sale_items.quantity * medicine_sale_items.unit_price) as total_amount')
            )
            ->groupBy('medicines.id', 'medicines.name')
            ->orderBy('total_amount', 'desc')
            ->limit(10)
            ->get();

        // Payment status distribution
        $paymentStatus = MedicineSale::where('sale_date', '>=', $startDate)
            ->selectRaw('payment_status, COUNT(*) as count, SUM(total_amount) as amount')
            ->groupBy('payment_status')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'daily_sales' => $dailySales,
                'top_medicines' => $topMedicines,
                'payment_status' => $paymentStatus,
            ]
        ]);
    }



    /**
     * Enhanced Reports with Vendor Information
     */
    public function reports(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        // Purchase Summary with vendor breakdown
        $purchaseSummary = StockTransaction::with(['medicineStock.vendor'])
            ->where('type', 'purchase')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();

        // Top Vendors by Purchase Volume
        $topVendors = DB::table('medicine_vendor_transactions')
            ->join('medicine_vendors', 'medicine_vendor_transactions.vendor_id', '=', 'medicine_vendors.id')
            ->where('medicine_vendor_transactions.type', 'purchase')
            ->whereBetween('medicine_vendor_transactions.transaction_date', [$dateFrom, $dateTo])
            ->select(
                'medicine_vendors.name as vendor_name',
                'medicine_vendors.company_name',
                DB::raw('SUM(medicine_vendor_transactions.amount) as total_amount'),
                DB::raw('COUNT(*) as transaction_count'),
                DB::raw('SUM(medicine_vendor_transactions.due_amount) as total_due')
            )
            ->groupBy('medicine_vendors.id', 'medicine_vendors.name', 'medicine_vendors.company_name')
            ->orderBy('total_amount', 'desc')
            ->limit(10)
            ->get();

        // Vendor Due Summary
        $vendorDueSummary = MedicineVendor::withDues()
            ->select('name', 'current_balance', 'credit_limit')
            ->orderBy('current_balance', 'desc')
            ->limit(10)
            ->get();

        // Payment Summary
        $paymentSummary = MedicineVendorPayment::whereBetween('payment_date', [$dateFrom, $dateTo])
            ->selectRaw('DATE(payment_date) as date, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();

        // Stock Valuation with vendor breakdown
        $stockValuation = Medicine::with(['stocks' => function ($query) {
            $query->where('available_quantity', '>', 0)->with('vendor');
        }])
            ->get()
            ->map(function ($medicine) {
                $totalValue = $medicine->stocks->sum(function ($stock) {
                    return $stock->available_quantity * $stock->buy_price;
                });
                return [
                    'name' => $medicine->name,
                    'total_stock' => $medicine->total_stock,
                    'total_value' => $totalValue,
                    'average_price' => $medicine->total_stock > 0 ? $totalValue / $medicine->total_stock : 0,
                    'vendors' => $medicine->stocks->groupBy('vendor.name')->map(function ($stocks, $vendorName) {
                        return [
                            'vendor' => $vendorName ?? 'Unknown',
                            'quantity' => $stocks->sum('available_quantity'),
                            'value' => $stocks->sum(function ($stock) {
                                return $stock->available_quantity * $stock->buy_price;
                            })
                        ];
                    })->values()
                ];
            })
            ->sortByDesc('total_value')
            ->values();

        return Inertia::render('MedicineCorner/Reports', [
            'purchaseSummary' => $purchaseSummary,
            'topVendors' => $topVendors,
            'vendorDueSummary' => $vendorDueSummary,
            'paymentSummary' => $paymentSummary,
            'stockValuation' => $stockValuation,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'totalPurchase' => $purchaseSummary->sum('total'),
            'totalPayments' => $paymentSummary->sum('total'),
            'totalVendorDues' => $vendorDueSummary->sum('current_balance'),
        ]);
    }

    /**
     * Vendor Due Payment Page
     */
    public function vendorDues()
    {
        $vendorsWithDues = MedicineVendor::with([
            'transactions' => function ($query) {
                $query->where('type', 'purchase')
                    ->where('payment_status', '!=', 'paid')
                    ->orderBy('due_date', 'asc');
            }
        ])
            ->withDues()
            ->orderBy('current_balance', 'desc')
            ->get();

        // Summary
        $totalDues = $vendorsWithDues->sum('current_balance');
        $overdueAmount = 0;
        $nearDueAmount = 0;

        foreach ($vendorsWithDues as $vendor) {
            foreach ($vendor->transactions as $transaction) {
                if ($transaction->due_date < now()) {
                    $overdueAmount += $transaction->due_amount;
                } elseif ($transaction->due_date <= now()->addDays(7)) {
                    $nearDueAmount += $transaction->due_amount;
                }
            }
        }

        return Inertia::render('MedicineCorner/VendorDues', [
            'vendorsWithDues' => $vendorsWithDues,
            'summary' => [
                'total_dues' => $totalDues,
                'overdue_amount' => $overdueAmount,
                'near_due_amount' => $nearDueAmount,
                'vendor_count' => $vendorsWithDues->count(),
            ],
        ]);
    }

    /**
     * Make Payment to Vendor (from Medicine Corner)
     */
    public function makeVendorPayment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vendor_id' => 'required|exists:medicine_vendors,id',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string|in:cash,bank_transfer,cheque,mobile_banking',
            'reference_no' => 'nullable|string|max:255',
            'description' => 'required|string|max:500',
            'allocated_transactions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $vendor = MedicineVendor::findOrFail($request->vendor_id);

            // Check medicine account balance
            $medicineBalance = MedicineAccount::getBalance();
            if ($medicineBalance < $request->amount) {
                throw new \Exception("Insufficient balance in Medicine Account. Available: ৳{$medicineBalance}, Required: ৳{$request->amount}");
            }

            // Create payment record
            $payment = MedicineVendorPayment::create([
                'payment_no' => MedicineVendorPayment::generatePaymentNo(),
                'vendor_id' => $vendor->id,
                'amount' => $request->amount,
                'payment_method' => $request->payment_method,
                'reference_no' => $request->reference_no,
                'payment_date' => now()->toDateString(),
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

            // Deduct from medicine account
            MedicineAccount::addExpense(
                $request->amount,
                'vendor_payment',
                "Payment to {$vendor->name} - {$request->description}",
                1
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
     * Get Vendor Purchase History (AJAX)
     */
    public function getVendorPurchaseHistory(Request $request)
    {
        $vendorId = $request->get('vendor_id');

        if (!$vendorId) {
            return response()->json(['error' => 'Vendor ID required'], 400);
        }

        $purchases = MedicineStock::with(['medicine', 'vendor'])
            ->where('vendor_id', $vendorId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get(['id', 'medicine_id', 'batch_number', 'quantity', 'buy_price', 'sale_price', 'purchase_date', 'due_amount', 'payment_status']);

        return response()->json(['purchases' => $purchases]);
    }

    /**
     * Update Stock Payment Status
     */
    public function updateStockPaymentStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'stock_id' => 'required|exists:medicine_stocks,id',
            'payment_status' => 'required|in:pending,partial,paid',
            'due_amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $stock = MedicineStock::findOrFail($request->stock_id);
            $stock->update([
                'payment_status' => $request->payment_status,
                'due_amount' => $request->due_amount,
            ]);

            // Update vendor balance
            if ($stock->vendor) {
                $stock->vendor->updateBalance();
            }

            return response()->json(['success' => true, 'message' => 'Payment status updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update payment status'], 500);
        }
    }

    /**
     * Vendor Purchase Analytics
     */
    public function vendorPurchaseAnalytics(Request $request)
    {
        $period = $request->get('period', '30'); // days
        $startDate = now()->subDays($period);

        // Vendor wise purchase summary
        $vendorPurchases = DB::table('medicine_vendor_transactions')
            ->join('medicine_vendors', 'medicine_vendor_transactions.vendor_id', '=', 'medicine_vendors.id')
            ->where('medicine_vendor_transactions.type', 'purchase')
            ->where('medicine_vendor_transactions.transaction_date', '>=', $startDate)
            ->select(
                'medicine_vendors.name as vendor_name',
                'medicine_vendors.id as vendor_id',
                DB::raw('SUM(medicine_vendor_transactions.amount) as total_amount'),
                DB::raw('SUM(medicine_vendor_transactions.due_amount) as total_due'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->groupBy('medicine_vendors.id', 'medicine_vendors.name')
            ->orderBy('total_amount', 'desc')
            ->get();

        // Daily purchase trend
        $dailyPurchases = MedicineVendorTransaction::where('type', 'purchase')
            ->where('transaction_date', '>=', $startDate)
            ->selectRaw('DATE(transaction_date) as date, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Payment method distribution
        $paymentMethods = MedicineVendorPayment::where('payment_date', '>=', $startDate)
            ->selectRaw('payment_method, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('payment_method')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'vendor_purchases' => $vendorPurchases,
                'daily_purchases' => $dailyPurchases,
                'payment_methods' => $paymentMethods,
            ]
        ]);
    }


    /**
     * Show Edit Stock Form
     */
    public function editStock($id)
    {
        $stock = MedicineStock::with(['medicine', 'vendor', 'addedBy'])->findOrFail($id);

        // Find existing vendor transaction
        $vendorTransaction = MedicineVendorTransaction::where([
            'reference_type' => 'medicine_purchase',
            'reference_id' => $stock->id
        ])->first();

        $medicines = Medicine::active()
            ->orderBy('name')
            ->get(['id', 'name', 'generic_name', 'standard_sale_price']);

        $vendors = MedicineVendor::active()
            ->orderBy('name')
            ->get(['id', 'name', 'company_name', 'current_balance', 'credit_limit', 'payment_terms_days']);

        // Build stock data with null safety
        $stockData = [
            'id' => $stock->id,
            'vendor_id' => $stock->vendor_id,
            'medicine_id' => $stock->medicine_id,
            'batch_number' => $stock->batch_number,
            'expiry_date' => $stock->expiry_date,
            'quantity' => $stock->quantity,
            'available_quantity' => $stock->available_quantity,
            'buy_price' => $stock->buy_price,
            'sale_price' => $stock->sale_price,
            'notes' => $stock->notes,
            'purchase_date' => $stock->purchase_date,
            'paid_amount' => $vendorTransaction ? $vendorTransaction->paid_amount : 0,
            'payment_method' => $vendorTransaction ? $vendorTransaction->payment_method : 'credit',
            'cheque_no' => $vendorTransaction ? $vendorTransaction->cheque_no : '',
            'cheque_date' => $vendorTransaction ? $vendorTransaction->cheque_date : '',
            'medicine' => $stock->medicine ? [
                'id' => $stock->medicine->id,
                'name' => $stock->medicine->name,
                'generic_name' => $stock->medicine->generic_name,
                'standard_sale_price' => $stock->medicine->standard_sale_price,
            ] : null,
            'vendor' => $stock->vendor ? [
                'id' => $stock->vendor->id,
                'name' => $stock->vendor->name,
                'company_name' => $stock->vendor->company_name,
                'current_balance' => $stock->vendor->current_balance,
                'credit_limit' => $stock->vendor->credit_limit,
                'payment_terms_days' => $stock->vendor->payment_terms_days,
            ] : null,
            'total_purchase_amount' => $stock->quantity * $stock->buy_price,
            'due_amount' => $vendorTransaction ? $vendorTransaction->due_amount : 0,
            'payment_status' => $vendorTransaction ? $vendorTransaction->payment_status : 'pending',
        ];

        return Inertia::render('MedicineCorner/EditStock', [
            'stock' => $stockData,
            'medicines' => $medicines,
            'vendors' => $vendors,
        ]);
    }

    /**
     * Update Stock Entry - Complete Fixed Version with Null Handling
     */
    public function updateStock(Request $request, $id)
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
            $stock = MedicineStock::with(['medicine', 'vendor', 'addedBy'])->findOrFail($id);

            // Find existing vendor transaction manually
            $vendorTransaction = MedicineVendorTransaction::where([
                'reference_type' => 'medicine_purchase',
                'reference_id' => $stock->id
            ])->first();

            // Handle potential null relationships
            $oldVendor = $stock->vendor;
            $oldMedicine = $stock->medicine;

            // Store original values with null safety
            $originalQuantity = $stock->quantity;
            $originalBuyPrice = $stock->buy_price;
            $originalTotalAmount = $originalQuantity * $originalBuyPrice;
            $originalPaidAmount = $vendorTransaction ? $vendorTransaction->paid_amount : 0;
            $originalDueAmount = $vendorTransaction ? $vendorTransaction->due_amount : $originalTotalAmount;

            // Calculate new values
            $newVendor = MedicineVendor::findOrFail($request->vendor_id);
            $newMedicine = Medicine::findOrFail($request->medicine_id);
            $newTotalAmount = $request->quantity * $request->buy_price;
            $newPaidAmount = $request->paid_amount ?? 0;
            $newDueAmount = $newTotalAmount - $newPaidAmount;

            // Check if available quantity allows the change
            $quantityDifference = $request->quantity - $originalQuantity;
            if ($quantityDifference < 0 && abs($quantityDifference) > $stock->available_quantity) {
                throw new \Exception("Cannot reduce quantity below available stock. Available: {$stock->available_quantity}");
            }

            // Check new vendor credit limit with null safety
            if ($newDueAmount > 0) {
                $newVendorCurrentDue = $newVendor->current_balance;

                // If same vendor and vendor exists, subtract the old due amount first
                if ($oldVendor && $newVendor->id == $oldVendor->id && $vendorTransaction) {
                    $newVendorCurrentDue -= $originalDueAmount;
                }

                if (($newVendorCurrentDue + $newDueAmount) > $newVendor->credit_limit && $newVendor->credit_limit > 0) {
                    throw new \Exception("Credit limit exceeded for {$newVendor->name}. Current due: ৳{$newVendorCurrentDue}, Credit limit: ৳{$newVendor->credit_limit}");
                }
            }

            // Handle payment changes
            $paymentDifference = $newPaidAmount - $originalPaidAmount;
            if ($paymentDifference > 0) {
                // Additional payment required
                $medicineBalance = MedicineAccount::getBalance();
                if ($medicineBalance < $paymentDifference) {
                    throw new \Exception("Insufficient balance in Medicine Account. Available: ৳{$medicineBalance}, Required: ৳{$paymentDifference}");
                }
            }

            // Update or Create vendor transaction
            if ($vendorTransaction) {
                // UPDATE existing transaction
                $vendorTransaction->update([
                    'vendor_id' => $newVendor->id,
                    'amount' => $newTotalAmount,
                    'due_amount' => $newDueAmount,
                    'paid_amount' => $newPaidAmount,
                    'payment_status' => $newDueAmount > 0 ? ($newPaidAmount > 0 ? 'partial' : 'pending') : 'paid',
                    'payment_method' => $request->payment_method,
                    'cheque_no' => $request->cheque_no,
                    'cheque_date' => $request->cheque_date,
                    'description' => "Medicine purchase - {$newMedicine->name} (Batch: {$request->batch_number}) - Updated",
                    'due_date' => now()->addDays($newVendor->payment_terms_days)->toDateString(),
                    'updated_by' => auth()->id(),
                ]);
            } else {
                // Create new transaction if none exists
                $vendorTransaction = MedicineVendorTransaction::create([
                    'transaction_no' => MedicineVendorTransaction::generateTransactionNo(),
                    'vendor_id' => $newVendor->id,
                    'type' => 'purchase',
                    'amount' => $newTotalAmount,
                    'due_amount' => $newDueAmount,
                    'paid_amount' => $newPaidAmount,
                    'payment_status' => $newDueAmount > 0 ? ($newPaidAmount > 0 ? 'partial' : 'pending') : 'paid',
                    'reference_type' => 'medicine_purchase',
                    'reference_id' => $stock->id,
                    'payment_method' => $request->payment_method,
                    'cheque_no' => $request->cheque_no,
                    'cheque_date' => $request->cheque_date,
                    'description' => "Medicine purchase - {$newMedicine->name} (Batch: {$request->batch_number})",
                    'transaction_date' => $stock->purchase_date,
                    'due_date' => now()->addDays($newVendor->payment_terms_days)->toDateString(),
                    'created_by' => auth()->id(),
                ]);
            }

            // Update medicine stock
            $stock->update([
                'medicine_id' => $request->medicine_id,
                'vendor_id' => $newVendor->id,
                'batch_number' => $request->batch_number,
                'expiry_date' => $request->expiry_date,
                'quantity' => $request->quantity,
                'available_quantity' => $stock->available_quantity + $quantityDifference,
                'buy_price' => $request->buy_price,
                'sale_price' => $request->sale_price,
                'notes' => $request->notes,
                'updated_by' => auth()->id(),
            ]);

            // Create stock transaction for audit trail
            StockTransaction::create([
                'medicine_stock_id' => $stock->id,
                'type' => 'adjustment',
                'quantity' => $request->quantity,
                'unit_price' => $request->buy_price,
                'total_amount' => $newTotalAmount,
                'vendor_transaction_id' => $vendorTransaction->id,
                'reason' => 'Stock purchase updated - Batch: ' . $request->batch_number,
                'created_by' => auth()->id(),
            ]);

            // Handle payment difference
            if ($paymentDifference != 0) {
                if ($paymentDifference > 0) {
                    // Additional payment made
                    MedicineVendorPayment::create([
                        'payment_no' => MedicineVendorPayment::generatePaymentNo(),
                        'vendor_id' => $newVendor->id,
                        'amount' => $paymentDifference,
                        'payment_method' => $request->payment_method ?? 'cash',
                        'reference_no' => $request->cheque_no,
                        'payment_date' => now()->toDateString(),
                        'description' => "Additional payment for stock update - {$newMedicine->name}",
                        'allocated_transactions' => [$vendorTransaction->id],
                        'created_by' => auth()->id(),
                    ]);

                    // Deduct from medicine account
                    MedicineAccount::addExpense(
                        $paymentDifference,
                        'vendor_payment',
                        "Additional payment to {$newVendor->name} for {$newMedicine->name} (Stock Update)",
                        1
                    );
                } else {
                    // Payment was reduced
                    MedicineAccount::addIncome(
                        abs($paymentDifference),
                        'payment_adjustment',
                        "Payment reduction for {$newMedicine->name} stock update",
                        1
                    );
                }
            }

            // Update vendor balances with null safety
            if ($oldVendor && $oldVendor->id !== $newVendor->id) {
                // Different vendors - update both
                $oldVendor->updateBalance();
            }
            $newVendor->updateBalance();

            // Update medicine totals with null safety
            if ($oldMedicine && $oldMedicine->id !== $newMedicine->id) {
                // Different medicines - update both
                $oldMedicine->updateTotalStock();
                $oldMedicine->updateAverageBuyPrice();
            }
            $newMedicine->updateTotalStock();
            $newMedicine->updateAverageBuyPrice();

            DB::commit();

            $message = "Stock updated successfully! Total: ৳{$newTotalAmount}";
            if ($newPaidAmount > 0) {
                $message .= ", Paid: ৳{$newPaidAmount}";
            }
            if ($newDueAmount > 0) {
                $message .= ", Due to {$newVendor->name}: ৳{$newDueAmount}";
            }

            return redirect()->route('medicine-corner.stock')->with('success', $message);
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Failed to update stock: ' . $e->getMessage());
        }
    }

    public function getStockForEdit($id)
    {
        try {
            $stock = MedicineStock::with([
                'medicine',
                'vendor',
                'vendorTransaction',
                'addedBy'
            ])->findOrFail($id);

            $vendorTransaction = $stock->vendorTransaction;

            return response()->json([
                'success' => true,
                'stock' => [
                    'id' => $stock->id,
                    'vendor_id' => $stock->vendor_id,
                    'medicine_id' => $stock->medicine_id,
                    'batch_number' => $stock->batch_number,
                    'expiry_date' => $stock->expiry_date,
                    'quantity' => $stock->quantity,
                    'available_quantity' => $stock->available_quantity,
                    'buy_price' => $stock->buy_price,
                    'sale_price' => $stock->sale_price,
                    'notes' => $stock->notes,
                    'purchase_date' => $stock->purchase_date,
                    'paid_amount' => $vendorTransaction ? $vendorTransaction->paid_amount : 0,
                    'payment_method' => $vendorTransaction ? $vendorTransaction->payment_method : 'credit',
                    'cheque_no' => $vendorTransaction ? $vendorTransaction->cheque_no : null,
                    'cheque_date' => $vendorTransaction ? $vendorTransaction->cheque_date : null,
                    'medicine' => [
                        'id' => $stock->medicine->id,
                        'name' => $stock->medicine->name,
                        'generic_name' => $stock->medicine->generic_name,
                        'standard_sale_price' => $stock->medicine->standard_sale_price,
                    ],
                    'vendor' => [
                        'id' => $stock->vendor->id,
                        'name' => $stock->vendor->name,
                        'company_name' => $stock->vendor->company_name,
                        'current_balance' => $stock->vendor->current_balance,
                        'credit_limit' => $stock->vendor->credit_limit,
                        'payment_terms_days' => $stock->vendor->payment_terms_days,
                    ],
                    'total_purchase_amount' => $stock->quantity * $stock->buy_price,
                    'due_amount' => $vendorTransaction ? $vendorTransaction->due_amount : 0,
                    'payment_status' => $vendorTransaction ? $vendorTransaction->payment_status : 'pending',
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Stock not found',
            ], 404);
        }
    }
}
