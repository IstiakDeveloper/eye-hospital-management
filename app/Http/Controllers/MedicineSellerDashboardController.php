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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
     * POS System - Point of Sale
     */
    public function pos()
    {
        // Available medicines with stock - including out of stock items
        $medicines = Medicine::with(['stocks' => function ($query) {
            $query->where('expiry_date', '>', now())
                ->where('is_active', true)
                ->orderBy('expiry_date', 'asc'); // FIFO
        }])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Recent customers for search
        $recentCustomers = Patient::orderBy('created_at', 'desc')
            ->limit(50) // Increased for better search results
            ->get(['id', 'name', 'phone', 'email']);

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
     * Process Sale Transaction
     */
    public function processSale(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.medicine_stock_id' => 'required|exists:medicine_stocks,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'patient_id' => 'nullable|exists:patients,id',
            'prescription_id' => 'nullable|exists:prescriptions,id',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            // Generate invoice number
            $invoiceNumber = 'SL-' . date('Ymd') . '-' . str_pad(
                MedicineSale::whereDate('created_at', today())->count() + 1,
                4,
                '0',
                STR_PAD_LEFT
            );

            // Calculate totals
            $subtotal = 0;
            $totalProfit = 0;
            $saleItems = [];
            $medicineNames = [];

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
                $medicineNames[] = $stock->medicine->name;

                $saleItems[] = [
                    'stock' => $stock,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $lineTotal,
                    'line_profit' => $lineProfit,
                ];
            }

            $discount = $request->discount ?? 0;
            $tax = $request->tax ?? 0;
            $totalAmount = $subtotal - $discount + $tax;

            // Create sale record
            $sale = MedicineSale::create([
                'invoice_number' => $invoiceNumber,
                'patient_id' => $request->patient_id,
                'prescription_id' => $request->prescription_id,
                'sale_date' => now(),
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total_amount' => $totalAmount,
                'paid_amount' => $request->paid_amount,
                'total_profit' => $totalProfit,
                'payment_status' => $request->paid_amount >= $totalAmount ? 'paid' : 'partial',
                'sold_by' => auth()->id(),
            ]);

            // Create sale items and update stock
            foreach ($saleItems as $saleItem) {
                // Create sale item
                MedicineSaleItem::create([
                    'medicine_sale_id' => $sale->id,
                    'medicine_stock_id' => $saleItem['stock']->id,
                    'quantity' => $saleItem['quantity'],
                    'unit_price' => $saleItem['unit_price'],
                    'buy_price' => $saleItem['stock']->buy_price,
                ]);

                // Update stock
                $saleItem['stock']->available_quantity -= $saleItem['quantity'];
                $saleItem['stock']->save();

                // Create stock transaction
                StockTransaction::create([
                    'medicine_stock_id' => $saleItem['stock']->id,
                    'type' => 'sale',
                    'quantity' => $saleItem['quantity'],
                    'unit_price' => $saleItem['unit_price'],
                    'total_amount' => $saleItem['line_total'],
                    'reference_type' => 'medicine_sale',
                    'reference_id' => $sale->id,
                    'reason' => 'Medicine sale - Invoice: ' . $invoiceNumber,
                    'created_by' => auth()->id(),
                ]);

                // Update medicine total stock
                $saleItem['stock']->medicine->updateTotalStock();
            }

            // ✅ ADD TO MEDICINE ACCOUNT AS INCOME
            $customerInfo = $request->patient_id ?
                "Patient ID: {$request->patient_id}" : ($request->customer_name ? "Customer: {$request->customer_name}" : "Walk-in customer");

            $medicineList = implode(', ', array_slice($medicineNames, 0, 3));
            if (count($medicineNames) > 3) {
                $medicineList .= ' + ' . (count($medicineNames) - 3) . ' more';
            }

            $medicineTransaction = MedicineAccount::addIncome(
                $totalAmount,
                'medicine_sale',
                "Medicine sale - Invoice: {$invoiceNumber} | {$customerInfo} | Medicines: {$medicineList}",
                'medicine_sales',
                $sale->id
            );

            // Link sale to medicine transaction
            $sale->update(['medicine_transaction_id' => $medicineTransaction->id]);

            DB::commit();

            return redirect()->back()->with('success', "Sale completed successfully! Invoice: {$invoiceNumber} | Amount added to Medicine Account: ৳{$totalAmount}");
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Sale failed: ' . $e->getMessage());
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
            'filters' => $request->only(['date_from', 'date_to', 'payment_status', 'search']),
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
}
