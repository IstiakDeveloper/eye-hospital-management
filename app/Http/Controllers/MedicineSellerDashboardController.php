<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\MedicineAccount;
use App\Models\MedicineStock;
use App\Models\MedicineSale;
use App\Models\MedicineSaleItem;
use App\Models\StockTransaction;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\HospitalAccount;
use App\Models\HospitalIncomeCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Carbon\Carbon;

class MedicineSellerDashboardController extends Controller
{
    /**
     * Medicine Seller Dashboard
     */
    public function index()
    {
        // Today's sales summary
        $todaySales = MedicineSale::whereDate('sale_date', today())
            ->where('sold_by', auth()->id())
            ->sum('total_amount');

        $todayProfit = MedicineSale::whereDate('sale_date', today())
            ->where('sold_by', auth()->id())
            ->sum('total_profit');

        $todaySalesCount = MedicineSale::whereDate('sale_date', today())
            ->where('sold_by', auth()->id())
            ->count();

        // This month's summary
        $monthSales = MedicineSale::whereMonth('sale_date', now()->month)
            ->whereYear('sale_date', now()->year)
            ->where('sold_by', auth()->id())
            ->sum('total_amount');

        $monthProfit = MedicineSale::whereMonth('sale_date', now()->month)
            ->whereYear('sale_date', now()->year)
            ->where('sold_by', auth()->id())
            ->sum('total_profit');

        // Yesterday comparison
        $yesterdaySales = MedicineSale::whereDate('sale_date', Carbon::yesterday())
            ->where('sold_by', auth()->id())
            ->sum('total_amount');

        // Recent sales
        $recentSales = MedicineSale::with(['patient', 'items.medicineStock.medicine'])
            ->where('sold_by', auth()->id())
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Low stock medicines (available for sale)
        $lowStockMedicines = Medicine::with(['stockAlert'])
            ->whereHas('stocks', function ($query) {
                $query->where('available_quantity', '>', 0)
                    ->where('expiry_date', '>', now());
            })
            ->whereHas('stockAlert', function ($query) {
                $query->where('low_stock_alert', true)
                    ->whereRaw('medicines.total_stock <= stock_alerts.minimum_stock');
            })
            ->limit(5)
            ->get();

        // Expiring medicines (next 30 days)
        $expiringMedicines = MedicineStock::with(['medicine'])
            ->where('available_quantity', '>', 0)
            ->where('expiry_date', '>', now())
            ->where('expiry_date', '<=', now()->addDays(30))
            ->orderBy('expiry_date', 'asc')
            ->limit(5)
            ->get();

        // Daily sales trend (last 7 days)
        $dailySalesTrend = MedicineSale::where('sold_by', auth()->id())
            ->where('sale_date', '>=', now()->subDays(7))
            ->selectRaw('DATE(sale_date) as date, SUM(total_amount) as total, SUM(total_profit) as profit, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // Top selling medicines (this month)
        $topSellingMedicines = DB::table('medicine_sale_items')
            ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
            ->join('medicine_stocks', 'medicine_sale_items.medicine_stock_id', '=', 'medicine_stocks.id')
            ->join('medicines', 'medicine_stocks.medicine_id', '=', 'medicines.id')
            ->where('medicine_sales.sold_by', auth()->id())
            ->whereMonth('medicine_sales.sale_date', now()->month)
            ->whereYear('medicine_sales.sale_date', now()->year)
            ->select(
                'medicines.name',
                'medicines.unit',
                DB::raw('SUM(medicine_sale_items.quantity) as total_quantity'),
                DB::raw('SUM(medicine_sale_items.total_price) as total_amount'),
                DB::raw('COUNT(DISTINCT medicine_sales.id) as sales_count')
            )
            ->groupBy('medicines.id', 'medicines.name', 'medicines.unit')
            ->orderBy('total_amount', 'desc')
            ->limit(5)
            ->get();

        // Pending payments
        $pendingPayments = MedicineSale::where('sold_by', auth()->id())
            ->whereIn('payment_status', ['pending', 'partial'])
            ->sum('total_amount') - MedicineSale::where('sold_by', auth()->id())
            ->whereIn('payment_status', ['pending', 'partial'])
            ->sum('paid_amount');

        // Performance metrics
        $salesGrowth = $yesterdaySales > 0 ? (($todaySales - $yesterdaySales) / $yesterdaySales) * 100 : 0;

        return Inertia::render('MedicineSeller/Dashboard', [
            // Today's metrics
            'todaySales' => $todaySales,
            'todayProfit' => $todayProfit,
            'todaySalesCount' => $todaySalesCount,
            'salesGrowth' => $salesGrowth,

            // Monthly metrics
            'monthSales' => $monthSales,
            'monthProfit' => $monthProfit,
            'pendingPayments' => $pendingPayments,

            // Data collections
            'recentSales' => $recentSales,
            'lowStockMedicines' => $lowStockMedicines,
            'expiringMedicines' => $expiringMedicines,
            'dailySalesTrend' => $dailySalesTrend,
            'topSellingMedicines' => $topSellingMedicines,
        ]);
    }

    /**
     * POS System - Point of Sale (Simplified with Average Price)
     */
    public function pos()
    {
        // Available medicines with actual stock prices from MedicineStock table
        $medicines = Medicine::with(['stockAlert', 'stocks' => function ($query) {
                $query->where('available_quantity', '>', 0)
                      ->where('expiry_date', '>', now())
                      ->orderBy('expiry_date', 'asc'); // FIFO - first expiry first
            }])
            ->where('is_active', true)
            ->where('total_stock', '>', 0)
            ->orderBy('name')
            ->get()
            ->map(function ($medicine) {
                // Get actual stocks from MedicineStock table with real prices
                $stocksData = $medicine->stocks->map(function ($stock) {
                    return [
                        'id' => $stock->id,
                        'available_quantity' => $stock->available_quantity,
                        'sale_price' => $stock->sale_price ?? $stock->mrp ?? 0,
                        'expiry_date' => $stock->expiry_date,
                    ];
                })->toArray();

                // Fallback to standard price if no stocks available
                $salePrice = $medicine->standard_sale_price ?? 0;
                if (empty($stocksData)) {
                    $stocksData = [[
                        'id' => $medicine->id,
                        'available_quantity' => $medicine->total_stock,
                        'sale_price' => $salePrice,
                        'expiry_date' => now()->addYear()->format('Y-m-d'),
                    ]];
                }

                return [
                    'id' => $medicine->id,
                    'name' => $medicine->name,
                    'generic_name' => $medicine->generic_name,
                    'type' => $medicine->type,
                    'unit' => $medicine->unit,
                    'total_stock' => $medicine->total_stock,
                    'average_buy_price' => $medicine->average_buy_price ?? 0,
                    'standard_sale_price' => $salePrice,
                    'minimum_stock_level' => $medicine->stockAlert?->minimum_stock ?? 0,
                    'stocks' => $stocksData,
                ];
            });

        // Recent customers for search
        $recentCustomers = Patient::orderBy('created_at', 'desc')
            ->limit(50)
            ->get(['id', 'patient_id', 'name', 'phone', 'email']);

        // Quick stats for POS
        $todaySalesCount = MedicineSale::whereDate('sale_date', today())
            ->where('sold_by', auth()->id())
            ->count();

        $lastInvoiceNumber = MedicineSale::where('sold_by', auth()->id())
            ->orderBy('created_at', 'desc')
            ->first()?->invoice_number ?? 'N/A';

        return Inertia::render('MedicineSeller/POS', [
            'medicines' => $medicines,
            'recentCustomers' => $recentCustomers,
            'todaySalesCount' => $todaySalesCount,
            'lastInvoiceNumber' => $lastInvoiceNumber,
        ]);
    }

    /**
     * Process Medicine Sale (Simplified Average Price Based)
     */
    public function processSale(Request $request)
    {
        // Validate sale data
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email|max:255',
            'patient_id' => 'nullable|exists:patients,id',
            'payment_method' => 'nullable|in:cash,card,mobile,bank_transfer',
            'payment_status' => 'nullable|in:paid,unpaid,partial',
            'paid_amount' => 'required|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|in:amount,percent',
            'tax' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.medicine_stock_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'sale_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $totalCost = 0;
            $totalSaleAmount = 0;

            // Validate stock availability and calculate totals FIRST
            foreach ($validated['items'] as $item) {
                // Get medicine from medicine_stock_id
                $stock = MedicineStock::findOrFail($item['medicine_stock_id']);
                $medicine = $stock->medicine;

                if ($stock->available_quantity < $item['quantity']) {
                    DB::rollBack();
                    return back()->withErrors([
                        'stock' => "Insufficient stock for {$medicine->name}. Available: {$stock->available_quantity}, Requested: {$item['quantity']}"
                    ]);
                }

                // Calculate totals
                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'];
                $buyPrice = $medicine->average_buy_price ?? $stock->unit_cost ?? 0;

                $totalCost += $buyPrice * $quantity;
                $totalSaleAmount += $quantity * $unitPrice;
            }

            // Calculate final amounts BEFORE creating sale
            $discountAmount = $validated['discount'] ?? 0;
            if (($validated['discount_type'] ?? 'amount') === 'percent') {
                $discountAmount = ($totalSaleAmount * $discountAmount) / 100;
            }

            $taxAmount = $validated['tax'] ?? 0;
            $finalAmount = $totalSaleAmount - $discountAmount + $taxAmount;
            $paidAmount = $validated['paid_amount'];
            $dueAmount = max(0, $finalAmount - $paidAmount);
            $totalProfit = $finalAmount - $totalCost;

            // Determine payment status
            $paymentStatus = 'paid';
            if ($paidAmount == 0) {
                $paymentStatus = 'pending';
            } elseif ($paidAmount < $finalAmount) {
                $paymentStatus = 'partial';
            }

            // Generate invoice number
            $latestSale = MedicineSale::latest('id')->first();
            $invoiceNumber = 'MEDSAL-' . date('Ymd') . '-' . str_pad(($latestSale?->id ?? 0) + 1, 6, '0', STR_PAD_LEFT);

            // Create sale record with ALL required fields
            $sale = MedicineSale::create([
                'invoice_number' => $invoiceNumber,
                'patient_id' => $validated['patient_id'] ?? null,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'] ?? null,
                'customer_email' => $validated['customer_email'] ?? null,
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'payment_status' => $paymentStatus,
                'sale_date' => $validated['sale_date'] ?? now(),
                'notes' => $validated['notes'] ?? null,
                'sold_by' => auth()->id(),
                'subtotal' => $totalSaleAmount,
                'discount' => $discountAmount,
                'tax' => $taxAmount,
                'total_amount' => $finalAmount,
                'paid_amount' => $paidAmount,
                'total_profit' => $totalProfit,
            ]);

            // Process each sale item
            foreach ($validated['items'] as $item) {
                // Get medicine stock
                $stock = MedicineStock::findOrFail($item['medicine_stock_id']);
                $medicine = $stock->medicine;

                $quantity = $item['quantity'];
                $unitPrice = $item['unit_price'];

                // Use medicine average_buy_price for profit calculation
                $buyPrice = $medicine->average_buy_price ?? $stock->unit_cost ?? 0;

                // Create sale item (using fillable fields only)
                MedicineSaleItem::create([
                    'medicine_sale_id' => $sale->id,
                    'medicine_stock_id' => $stock->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'buy_price' => $buyPrice,
                ]);

                // Deduct from stock
                $stock->decrement('available_quantity', $quantity);

                // Update total stock
                $medicine->decrement('total_stock', $quantity);
            }

            // Record transaction in Medicine Account
            MedicineAccount::addIncome(
                $finalAmount,
                'medicine_sale',
                "Medicine Sale: {$invoiceNumber}",
                'medicine_sale',
                $sale->id,
                $validated['sale_date'] ?? now()->toDateString()
            );

            // Record transaction in Hospital Account with Medicine Income Category
            $medicineIncomeCategory = \App\Models\HospitalIncomeCategory::firstOrCreate(
                ['name' => 'Medicine Income'],
                ['is_active' => true]
            );

            \App\Models\HospitalAccount::addIncome(
                amount: $finalAmount,
                category: 'Medicine Income',
                description: "Medicine Sale: {$invoiceNumber} - Customer: {$validated['customer_name']}",
                referenceType: 'medicine_sale',
                referenceId: $sale->id,
                date: $validated['sale_date'] ?? now()->toDateString(),
                incomeCategoryId: $medicineIncomeCategory->id
            );

            DB::commit();

            return redirect()
                ->route('medicine-seller.pos')
                ->with('success', "Sale completed successfully! Invoice: {$invoiceNumber}, Total: ৳{$finalAmount}");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Medicine Sale Error: ' . $e->getMessage());
            return back()
                ->withErrors(['error' => 'Sale processing failed: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Internal FIFO Stock Deduction (Hidden from seller interface)
     * Deducts from oldest batches first while maintaining batch tracking
     */
    private function deductStockFIFO(int $medicineId, int $quantityToDeduct): void
    {
        $remainingQty = $quantityToDeduct;

        // Get oldest non-expired batches first
        $stocks = MedicineStock::where('medicine_id', $medicineId)
            ->where('quantity', '>', 0)
            ->where('is_active', true)
            ->where('expiry_date', '>', now())
            ->orderBy('expiry_date', 'asc') // FIFO: Oldest expiry first
            ->orderBy('created_at', 'asc')
            ->get();

        foreach ($stocks as $stock) {
            if ($remainingQty <= 0) break;

            $deductQty = min($remainingQty, $stock->quantity);
            $stock->decrement('quantity', $deductQty);
            $remainingQty -= $deductQty;
        }

        // If still remaining (shouldn't happen due to validation), log error
        if ($remainingQty > 0) {
            Log::error("FIFO Stock Deduction Failed: Medicine ID {$medicineId}, Remaining Qty: {$remainingQty}");
        }
    }

    /**
     * Sales History
     */
    public function salesHistory(Request $request)
    {
        $query = MedicineSale::with(['patient', 'items.medicineStock.medicine'])
            ->where('sold_by', auth()->id());

        // Date filtering
        if ($request->filled('date_from')) {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        // Payment status filtering
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        // Due filter
        if ($request->filled('due')) {
            if ($request->due === 'with_due') {
                $query->whereRaw('total_amount > paid_amount');
            } elseif ($request->due === 'no_due') {
                $query->whereRaw('total_amount <= paid_amount');
            }
        }

        // Search by invoice number
        if ($request->filled('search')) {
            $query->where('invoice_number', 'LIKE', '%' . $request->search . '%');
        }

        $sales = $query->orderBy('created_at', 'desc')->paginate(15);

        // Summary statistics for current query
        $totalSales = $query->sum('total_amount');
        $totalProfit = $query->sum('total_profit');
        $salesCount = $query->count();

        return Inertia::render('MedicineSeller/SalesHistory', [
            'sales' => $sales,
            'totalSales' => $totalSales,
            'totalProfit' => $totalProfit,
            'salesCount' => $salesCount,
            'filters' => $request->only(['date_from', 'date_to', 'payment_status', 'search', 'due']),
        ]);
    }

    /**
     * Sale Invoice Details
     */
    public function saleDetails(MedicineSale $sale)
    {
        // Check if this sale belongs to current user
        if ($sale->sold_by !== auth()->id()) {
            abort(403, 'Unauthorized access to sale record');
        }

        $sale->load(['patient', 'items.medicineStock.medicine', 'soldBy']);

        return Inertia::render('MedicineSeller/SaleDetails', [
            'sale' => $sale,
        ]);
    }

    /**
     * Search Patients for POS
     */
    public function searchPatients(Request $request)
    {
        $query = $request->get('q', '');

        if (strlen($query) < 1) {
            return response()->json([]);
        }

        $patients = Patient::where(function ($q) use ($query) {
                // Search by patient_id (exact or partial match)
                if (is_numeric($query)) {
                    $q->where('patient_id', '=', $query)
                        ->orWhere('patient_id', 'LIKE', "%{$query}%")
                        ->orWhere('phone', 'LIKE', "%{$query}%");
                }
                // Search by phone
                $q->orWhere('phone', 'LIKE', "%{$query}%")
                    // Search by name
                    ->orWhere('name', 'LIKE', "%{$query}%")
                    // Search by email
                    ->orWhere('email', 'LIKE', "%{$query}%");
            })
            ->orderBy('patient_id', 'desc')
            ->limit(10)
            ->get(['id', 'patient_id', 'name', 'phone', 'email']);

        return response()->json($patients);
    }

    /**
     * Search Medicines for POS
     */
    public function searchMedicines(Request $request)
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $medicines = Medicine::with(['stocks' => function ($stockQuery) {
            $stockQuery->where('available_quantity', '>', 0)
                ->where('expiry_date', '>', now())
                ->where('is_active', true)
                ->orderBy('expiry_date', 'asc');
        }])
            ->where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                    ->orWhere('generic_name', 'LIKE', "%{$query}%");
            })
            ->whereHas('stocks', function ($stockQuery) {
                $stockQuery->where('available_quantity', '>', 0)
                    ->where('expiry_date', '>', now());
            })
            ->limit(10)
            ->get();

        return response()->json($medicines);
    }

    /**
     * Get Medicine Stock Details
     */
    public function getMedicineStock(Medicine $medicine)
    {
        $stocks = $medicine->stocks()
            ->where('available_quantity', '>', 0)
            ->where('expiry_date', '>', now())
            ->where('is_active', true)
            ->orderBy('expiry_date', 'asc') // FIFO
            ->get();

        return response()->json([
            'medicine' => $medicine,
            'stocks' => $stocks,
        ]);
    }

    /**
     * Update Payment Status
     */
    public function updatePayment(Request $request, MedicineSale $sale)
    {
        // Check ownership
        if ($sale->sold_by !== auth()->id()) {
            abort(403, 'Unauthorized access');
        }

        $validator = Validator::make($request->all(), [
            'paid_amount' => 'required|numeric|min:0|max:' . $sale->total_amount,
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        $sale->paid_amount = $request->paid_amount;
        $sale->payment_status = $sale->paid_amount >= $sale->total_amount ? 'paid' : 'partial';
        $sale->save();

        return redirect()->back()->with('success', 'Payment updated successfully');
    }

    /**
     * My Sales Report
     */
    public function myReport(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        // Sales summary
        $salesSummary = MedicineSale::where('sold_by', auth()->id())
            ->whereBetween('sale_date', [$dateFrom, $dateTo])
            ->selectRaw('
                DATE(sale_date) as date,
                SUM(total_amount) as total_sales,
                SUM(total_profit) as total_profit,
                COUNT(*) as sales_count
            ')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();

        // Top selling medicines
        $topMedicines = DB::table('medicine_sale_items')
            ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
            ->join('medicine_stocks', 'medicine_sale_items.medicine_stock_id', '=', 'medicine_stocks.id')
            ->join('medicines', 'medicine_stocks.medicine_id', '=', 'medicines.id')
            ->where('medicine_sales.sold_by', auth()->id())
            ->whereBetween('medicine_sales.sale_date', [$dateFrom, $dateTo])
            ->select(
                'medicines.name',
                'medicines.unit',
                DB::raw('SUM(medicine_sale_items.quantity) as total_quantity'),
                DB::raw('SUM(medicine_sale_items.total_price) as total_amount'),
                DB::raw('SUM(medicine_sale_items.profit) as total_profit')
            )
            ->groupBy('medicines.id', 'medicines.name', 'medicines.unit')
            ->orderBy('total_amount', 'desc')
            ->limit(10)
            ->get();

        // Totals
        $totalSales = $salesSummary->sum('total_sales');
        $totalProfit = $salesSummary->sum('total_profit');
        $totalTransactions = $salesSummary->sum('sales_count');

        return Inertia::render('MedicineSeller/MyReport', [
            'salesSummary' => $salesSummary,
            'topMedicines' => $topMedicines,
            'totalSales' => $totalSales,
            'totalProfit' => $totalProfit,
            'totalTransactions' => $totalTransactions,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }

    /**
     * Export Sales History
     */
    public function exportSalesHistory(Request $request)
    {
        $query = MedicineSale::with(['patient', 'items.medicineStock.medicine', 'soldBy'])
            ->where('sold_by', auth()->id());

        // Apply same filters
        if ($request->filled('date_from')) {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->filled('due')) {
            if ($request->due === 'with_due') {
                $query->whereRaw('total_amount > paid_amount');
            } elseif ($request->due === 'no_due') {
                $query->whereRaw('total_amount <= paid_amount');
            }
        }
        if ($request->filled('search')) {
            $query->where('invoice_number', 'LIKE', '%' . $request->search . '%');
        }

        $sales = $query->orderBy('created_at', 'desc')->get();
        $exportType = $request->get('export', 'pdf');

        if ($exportType === 'excel') {
            return $this->exportToExcel($sales, $request);
        } elseif ($exportType === 'print') {
            return $this->exportToPrint($sales, $request);
        } else {
            return $this->exportToPDF($sales, $request);
        }
    }

    private function exportToPDF($sales, $request)
    {
        $html = view('exports.medicine-sales-pdf', [
            'sales' => $sales,
            'dateFrom' => $request->date_from,
            'dateTo' => $request->date_to,
            'totalSales' => $sales->sum('total_amount'),
            'totalProfit' => $sales->sum('total_profit')
        ])->render();

        return response($html)->header('Content-Type', 'text/html');
    }

    private function exportToExcel($sales, $request)
    {
        $filename = 'medicine-sales-history-' . date('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function() use ($sales) {
            $file = fopen('php://output', 'w');

            // CSV Headers
            fputcsv($file, [
                'Invoice Number',
                'Patient Name',
                'Date',
                'Items',
                'Total Amount',
                'Paid Amount',
                'Due Amount',
                'Profit',
                'Payment Status'
            ]);

            // CSV Data
            foreach ($sales as $sale) {
                fputcsv($file, [
                    $sale->invoice_number,
                    $sale->patient->name ?? 'Walk-in Customer',
                    $sale->sale_date,
                    $sale->items->count() . ' items',
                    number_format($sale->total_amount, 2),
                    number_format($sale->paid_amount, 2),
                    number_format($sale->due_amount, 2),
                    number_format($sale->total_profit, 2),
                    ucfirst($sale->payment_status)
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function exportToPrint($sales, $request)
    {
        return view('exports.medicine-sales-print', [
            'sales' => $sales,
            'dateFrom' => $request->date_from,
            'dateTo' => $request->date_to,
            'totalSales' => $sales->sum('total_amount'),
            'totalProfit' => $sales->sum('total_profit')
        ]);
    }
}
