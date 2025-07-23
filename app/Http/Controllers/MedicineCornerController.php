<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\MedicineStock;
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
        $stocks = MedicineStock::with(['medicine', 'addedBy'])
            ->where('available_quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->paginate(20);

        $lowStockMedicines = Medicine::with('stockAlert')
            ->whereHas('stockAlert', function ($query) {
                $query->whereRaw('medicines.total_stock <= stock_alerts.minimum_stock');
            })
            ->limit(5)
            ->get();

        $expiringStock = MedicineStock::with('medicine')
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

        return Inertia::render('MedicineCorner/Stock', [
            'stocks' => $stocks,
            'lowStockMedicines' => $lowStockMedicines,
            'expiringStock' => $expiringStock,
            'totalStockValue' => $totalStockValue,
        ]);
    }

    /**
     * Medicine List Page
     */
    public function medicines()
    {
        $medicines = Medicine::with(['stockAlert'])
            ->withCount('stocks')
            ->orderBy('name')
            ->paginate(20);

        $medicineTypes = Medicine::distinct()->pluck('type')->filter();

        return Inertia::render('MedicineCorner/Medicines', [
            'medicines' => $medicines,
            'medicineTypes' => $medicineTypes,
        ]);
    }

    /**
     * Purchase Entry Page
     */
    public function purchase()
    {
        $medicines = Medicine::active()
            ->orderBy('name')
            ->get(['id', 'name', 'generic_name', 'standard_sale_price']);

        $recentPurchases = StockTransaction::with(['medicineStock.medicine', 'createdBy'])
            ->where('type', 'purchase')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $todayPurchases = StockTransaction::where('type', 'purchase')
            ->whereDate('created_at', today())
            ->sum('total_amount');

        return Inertia::render('MedicineCorner/Purchase', [
            'medicines' => $medicines,
            'recentPurchases' => $recentPurchases,
            'todayPurchases' => $todayPurchases,
        ]);
    }

    /**
     * Reports Page
     */
    public function reports(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        // Purchase Summary
        $purchaseSummary = StockTransaction::where('type', 'purchase')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();

        // Top Purchased Medicines
        $topPurchased = DB::table('stock_transactions')
            ->join('medicine_stocks', 'stock_transactions.medicine_stock_id', '=', 'medicine_stocks.id')
            ->join('medicines', 'medicine_stocks.medicine_id', '=', 'medicines.id')
            ->where('stock_transactions.type', 'purchase')
            ->whereBetween('stock_transactions.created_at', [$dateFrom, $dateTo])
            ->select(
                'medicines.name',
                DB::raw('SUM(stock_transactions.total_amount) as total_amount'),
                DB::raw('SUM(stock_transactions.quantity) as total_quantity')
            )
            ->groupBy('medicines.id', 'medicines.name')
            ->orderBy('total_amount', 'desc')
            ->limit(10)
            ->get();

        // Stock Valuation
        $stockValuation = Medicine::with(['stocks' => function ($query) {
            $query->where('available_quantity', '>', 0);
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
                ];
            })
            ->sortByDesc('total_value')
            ->values();

        // Monthly Purchase Trend
        $monthlyTrend = StockTransaction::where('type', 'purchase')
            ->where('created_at', '>=', now()->subMonths(12))
            ->selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, SUM(total_amount) as total')
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        return Inertia::render('MedicineCorner/Reports', [
            'purchaseSummary' => $purchaseSummary,
            'topPurchased' => $topPurchased,
            'stockValuation' => $stockValuation,
            'monthlyTrend' => $monthlyTrend,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'totalPurchase' => $purchaseSummary->sum('total'),
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
     * Add New Stock
     */
    public function addStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'medicine_id' => 'required|exists:medicines,id',
            'batch_number' => 'required|string|max:255',
            'expiry_date' => 'required|date|after:today',
            'quantity' => 'required|integer|min:1',
            'buy_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            // For Inertia requests, redirect back with errors
            return redirect()->back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            // Create stock entry
            $stock = MedicineStock::create([
                'medicine_id' => $request->medicine_id,
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

            // Create purchase transaction
            StockTransaction::create([
                'medicine_stock_id' => $stock->id,
                'type' => 'purchase',
                'quantity' => $request->quantity,
                'unit_price' => $request->buy_price,
                'total_amount' => $request->quantity * $request->buy_price,
                'reason' => 'Stock purchase - Batch: ' . $request->batch_number,
                'created_by' => auth()->id(),
            ]);

            // Update medicine totals
            $medicine = Medicine::find($request->medicine_id);
            $medicine->updateTotalStock();
            $medicine->updateAverageBuyPrice();

            DB::commit();

            // For Inertia, redirect with success message
            return redirect()->back()->with('success', 'Stock added successfully');
        } catch (\Exception $e) {
            DB::rollback();

            // For Inertia, redirect back with error
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
     * Get Medicine Details with Stock
     */
    public function getMedicineDetails(Medicine $medicine)
    {
        $medicine->load([
            'stocks' => function ($query) {
                $query->where('available_quantity', '>', 0)
                    ->orderBy('expiry_date', 'asc');
            },
            'stockAlert'
        ]);

        return response()->json([
            'success' => true,
            'medicine' => $medicine
        ]);
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
}
