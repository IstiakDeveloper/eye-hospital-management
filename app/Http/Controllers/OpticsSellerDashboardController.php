<?php

namespace App\Http\Controllers;

use App\Models\Glasses;
use App\Models\CompleteGlasses;
use App\Models\LensType;
use App\Models\OpticsAccount;
use App\Models\OpticsTransaction;
use App\Models\StockMovement;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class OpticsSellerDashboardController extends Controller
{
    /**
     * Optics Seller Dashboard
     */
    public function index()
    {
        // Today's sales summary (from OpticsTransaction)
        $todaySales = OpticsTransaction::income()
            ->byCategory('Sales')
            ->whereDate('transaction_date', today())
            ->sum('amount');

        $todayExpenses = OpticsTransaction::expense()
            ->whereDate('transaction_date', today())
            ->sum('amount');

        $todayProfit = $todaySales - $todayExpenses;

        $todaySalesCount = OpticsTransaction::income()
            ->byCategory('Sales')
            ->whereDate('transaction_date', today())
            ->count();

        // This month's summary
        $monthSales = OpticsTransaction::income()
            ->byCategory('Sales')
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        $monthExpenses = OpticsTransaction::expense()
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        $monthProfit = $monthSales - $monthExpenses;

        // Yesterday comparison
        $yesterdaySales = OpticsTransaction::income()
            ->byCategory('Sales')
            ->whereDate('transaction_date', Carbon::yesterday())
            ->sum('amount');

        // Recent sales (from OpticsTransaction)
        $recentSales = OpticsTransaction::income()
            ->byCategory('Sales')
            ->with('createdBy')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Low stock items
        $lowStockFrames = Glasses::active()->lowStock()->limit(5)->get();
        $lowStockCompleteGlasses = CompleteGlasses::active()->lowStock()->with(['frame', 'lensType'])->limit(5)->get();
        $lowStockLenses = LensType::active()->lowStock()->limit(5)->get();

        // Daily sales trend (last 7 days)
        $dailySalesTrend = OpticsTransaction::income()
            ->byCategory('Sales')
            ->where('transaction_date', '>=', now()->subDays(7))
            ->selectRaw('DATE(transaction_date) as date, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // Top selling items (from StockMovement)
        $topSellingItems = StockMovement::where('movement_type', 'sale')
            ->whereDate('created_at', '>=', now()->startOfMonth())
            ->selectRaw('item_type, item_id, SUM(ABS(quantity)) as total_sold, SUM(total_amount) as total_amount')
            ->groupBy('item_type', 'item_id')
            ->orderByDesc('total_amount')
            ->limit(5)
            ->get()
            ->map(function ($movement) {
                $item = null;
                $itemName = 'Unknown Item';

                switch ($movement->item_type) {
                    case 'glasses':
                        $item = Glasses::find($movement->item_id);
                        $itemName = $item ? $item->full_name : 'Deleted Frame';
                        break;
                    case 'complete_glasses':
                        $item = CompleteGlasses::with(['frame', 'lensType'])->find($movement->item_id);
                        $itemName = $item ? $item->full_name : 'Deleted Complete Glasses';
                        break;
                    case 'lens_types':
                        $item = LensType::find($movement->item_id);
                        $itemName = $item ? $item->name : 'Deleted Lens';
                        break;
                }

                return [
                    'name' => $itemName,
                    'type' => $movement->item_type,
                    'total_quantity' => $movement->total_sold,
                    'total_amount' => $movement->total_amount,
                    'unit' => 'pcs'
                ];
            });

        // Performance metrics
        $salesGrowth = $yesterdaySales > 0 ? (($todaySales - $yesterdaySales) / $yesterdaySales) * 100 : 0;

        // Account balance
        $accountBalance = OpticsAccount::getBalance();

        return Inertia::render('OpticsSeller/Dashboard', [
            // Today's metrics
            'todaySales' => $todaySales,
            'todayProfit' => $todayProfit,
            'todaySalesCount' => $todaySalesCount,
            'salesGrowth' => $salesGrowth,

            // Monthly metrics
            'monthSales' => $monthSales,
            'monthProfit' => $monthProfit,
            'accountBalance' => $accountBalance,

            // Data collections
            'recentSales' => $recentSales,
            'lowStockFrames' => $lowStockFrames,
            'lowStockCompleteGlasses' => $lowStockCompleteGlasses,
            'lowStockLenses' => $lowStockLenses,
            'dailySalesTrend' => $dailySalesTrend,
            'topSellingItems' => $topSellingItems,
        ]);
    }

    /**
     * POS System - Point of Sale for Optics
     */
    public function pos()
    {
        // Available glasses frames
        $frames = Glasses::active()
            ->inStock()
            ->orderBy('brand')
            ->orderBy('model')
            ->get();

        // Available complete glasses
        $completeGlasses = CompleteGlasses::active()
            ->inStock()
            ->with(['frame', 'lensType'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Available lens types
        $lensTypes = LensType::active()
            ->inStock()
            ->orderBy('name')
            ->get();

        // Recent customers (if you have patient table)
        $recentCustomers = collect(); // Empty for now, can add Patient model later

        // Quick stats for POS
        $todaySalesCount = OpticsTransaction::income()
            ->byCategory('Sales')
            ->whereDate('transaction_date', today())
            ->count();

        $lastTransaction = OpticsTransaction::income()
            ->byCategory('Sales')
            ->orderBy('created_at', 'desc')
            ->first();

        $lastInvoiceNumber = $lastTransaction?->transaction_no ?? 'N/A';

        return Inertia::render('OpticsSeller/POS', [
            'frames' => $frames,
            'completeGlasses' => $completeGlasses,
            'lensTypes' => $lensTypes,
            'recentCustomers' => $recentCustomers,
            'todaySalesCount' => $todaySalesCount,
            'lastInvoiceNumber' => $lastInvoiceNumber,
        ]);
    }

    /**
     * Process Optics Sale Transaction (using existing system)
     */
    public function processSale(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'items' => 'required|array|min:1',
            'items.*.type' => 'required|in:frame,lens,complete_glasses',
            'items.*.id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0', // This will be the calculated discount amount
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $totalAmount = 0;
            $saleDetails = [];

            foreach ($validated['items'] as $item) {
                $model = match ($item['type']) {
                    'frame' => Glasses::class,
                    'lens' => LensType::class,
                    'complete_glasses' => CompleteGlasses::class,
                };

                $product = $model::findOrFail($item['id']);

                if ($product->stock_quantity < $item['quantity']) {
                    throw new \Exception(
                        "Insufficient stock for " . ($product->name ?? $product->full_name) .
                            ". Available: {$product->stock_quantity}"
                    );
                }

                $itemTotal = $item['price'] * $item['quantity'];
                $totalAmount += $itemTotal;

                // Update stock
                $previousStock = $product->stock_quantity;
                $newStock = $previousStock - $item['quantity'];
                $product->update(['stock_quantity' => $newStock]);

                // Record stock movement
                StockMovement::create([
                    'item_type' => $item['type'] === 'frame' ? 'glasses' : ($item['type'] === 'lens' ? 'lens_types' : 'complete_glasses'),
                    'item_id' => $item['id'],
                    'movement_type' => 'sale',
                    'quantity' => -$item['quantity'],
                    'previous_stock' => $previousStock,
                    'new_stock' => $newStock,
                    'unit_price' => $item['price'],
                    'total_amount' => $itemTotal,
                    'notes' => "POS Sale to {$validated['customer_name']} - " . ($product->name ?? $product->full_name) . " x{$item['quantity']}",
                    'user_id' => auth()->id(),
                ]);

                $saleDetails[] = ($product->name ?? $product->full_name) . " x{$item['quantity']}";
            }

            // Apply discount
            $finalAmount = $totalAmount - ($validated['discount'] ?? 0);

            // Record income using existing system
            $description = "POS Sale to {$validated['customer_name']}";
            if ($validated['customer_phone']) {
                $description .= " ({$validated['customer_phone']})";
            }
            $description .= " - " . implode(', ', $saleDetails);
            if ($validated['notes']) {
                $description .= " | Notes: {$validated['notes']}";
            }
            if ($validated['discount']) {
                $description .= " | Discount: ৳{$validated['discount']}";
            }

            $transaction = OpticsAccount::addIncome(
                $finalAmount,
                'Sales',
                $description
            );

            DB::commit();

            return redirect()->back()->with('success', "Sale completed successfully! Transaction: {$transaction->transaction_no} | Amount: ৳{$finalAmount}");
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Sale failed: ' . $e->getMessage());
        }
    }

    /**
     * Sales History (from OpticsTransaction)
     */
    public function salesHistory(Request $request)
    {
        $query = OpticsTransaction::income()
            ->byCategory('Sales')
            ->with('createdBy');

        // Date filtering
        if ($request->filled('date_from')) {
            $query->whereDate('transaction_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('transaction_date', '<=', $request->date_to);
        }

        // Search by transaction number or description
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('transaction_no', 'LIKE', '%' . $request->search . '%')
                    ->orWhere('description', 'LIKE', '%' . $request->search . '%');
            });
        }

        $sales = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        // Get totals from the current query (before pagination)
        $totalQuery = clone $query;
        $totalSales = $totalQuery->sum('amount');
        $salesCount = $totalQuery->count();

        // Calculate estimated profit (you can adjust this logic)
        $totalProfit = $totalSales * 0.3; // Assuming 30% average profit margin

        return Inertia::render('OpticsSeller/SalesHistory', [
            'sales' => $sales,
            'totalSales' => $totalSales,
            'totalProfit' => $totalProfit,
            'salesCount' => $salesCount,
            'filters' => $request->only(['date_from', 'date_to', 'search']),
        ]);
    }

    /**
     * Sale Details
     */
    public function saleDetails(OpticsTransaction $transaction)
    {
        // Check if this is a sales transaction
        if ($transaction->type !== 'income' || $transaction->category !== 'Sales') {
            abort(404, 'Sale not found');
        }

        $transaction->load('createdBy');

        // Get related stock movements for this sale (better matching)
        $stockMovements = StockMovement::where('movement_type', 'sale')
            ->whereDate('created_at', $transaction->transaction_date)
            ->where('user_id', $transaction->created_by)
            ->where('notes', 'LIKE', '%' . $transaction->description . '%')
            ->get()
            ->map(function ($movement) {
                $item = null;
                $itemName = 'Unknown Item';

                switch ($movement->item_type) {
                    case 'glasses':
                        $item = Glasses::find($movement->item_id);
                        $itemName = $item ? $item->full_name : 'Deleted Frame';
                        break;
                    case 'complete_glasses':
                        $item = CompleteGlasses::with(['frame', 'lensType'])->find($movement->item_id);
                        $itemName = $item ? $item->full_name : 'Deleted Complete Glasses';
                        break;
                    case 'lens_types':
                        $item = LensType::find($movement->item_id);
                        $itemName = $item ? $item->name : 'Deleted Lens';
                        break;
                }

                return [
                    'id' => $movement->id,
                    'item_name' => $itemName,
                    'item_type' => $movement->item_type,
                    'quantity' => abs($movement->quantity),
                    'unit_price' => $movement->unit_price,
                    'total_price' => $movement->total_amount,
                ];
            });

        // If no stock movements found, create dummy data from transaction description
        if ($stockMovements->isEmpty()) {
            // Try to extract items from description
            $description = $transaction->description;

            // Example: "POS Sale to John Doe - Frame x1, Lens x2"
            if (preg_match('/ - (.+?)(?:\s\||$)/', $description, $matches)) {
                $itemsText = $matches[1];
                $items = explode(', ', $itemsText);

                $stockMovements = collect();
                foreach ($items as $index => $itemText) {
                    // Parse "Frame x1" format
                    if (preg_match('/(.+?)\s+x(\d+)/', $itemText, $itemMatches)) {
                        $stockMovements->push([
                            'id' => $index + 1,
                            'item_name' => trim($itemMatches[1]),
                            'item_type' => 'unknown',
                            'quantity' => (int)$itemMatches[2],
                            'unit_price' => $transaction->amount / count($items), // Estimate
                            'total_price' => $transaction->amount / count($items),
                        ]);
                    }
                }
            }

            // If still empty, create single item
            if ($stockMovements->isEmpty()) {
                $stockMovements = collect([[
                    'id' => 1,
                    'item_name' => 'Optics Item',
                    'item_type' => 'unknown',
                    'quantity' => 1,
                    'unit_price' => $transaction->amount,
                    'total_price' => $transaction->amount,
                ]]);
            }
        }

        return Inertia::render('OpticsSeller/SaleDetails', [
            'transaction' => $transaction,
            'stockMovements' => $stockMovements,
        ]);
    }

    /**
     * Search Items for POS
     */
    public function searchItems(Request $request)
    {
        $query = $request->get('q', '');
        $type = $request->get('type', 'all'); // all, frames, complete, lenses

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $results = [];

        if ($type === 'all' || $type === 'frames') {
            $frames = Glasses::active()
                ->inStock()
                ->where(function ($q) use ($query) {
                    $q->where('brand', 'LIKE', "%{$query}%")
                        ->orWhere('model', 'LIKE', "%{$query}%")
                        ->orWhere('color', 'LIKE', "%{$query}%");
                })
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => 'frame',
                        'name' => $item->full_name,
                        'price' => $item->selling_price,
                        'stock' => $item->stock_quantity,
                        'details' => $item->color . ' | ' . $item->formatted_size
                    ];
                });
            $results = array_merge($results, $frames->toArray());
        }

        if ($type === 'all' || $type === 'complete') {
            $completeGlasses = CompleteGlasses::active()
                ->inStock()
                ->with(['frame', 'lensType'])
                ->whereHas('frame', function ($q) use ($query) {
                    $q->where('brand', 'LIKE', "%{$query}%")
                        ->orWhere('model', 'LIKE', "%{$query}%");
                })
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => 'complete_glasses',
                        'name' => $item->full_name,
                        'price' => $item->selling_price,
                        'stock' => $item->stock_quantity,
                        'details' => "Power: {$item->sphere_power}"
                    ];
                });
            $results = array_merge($results, $completeGlasses->toArray());
        }

        if ($type === 'all' || $type === 'lenses') {
            $lenses = LensType::active()
                ->inStock()
                ->where('name', 'LIKE', "%{$query}%")
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => 'lens',
                        'name' => $item->name,
                        'price' => $item->price,
                        'stock' => $item->stock_quantity,
                        'details' => $item->type . ' | ' . $item->material
                    ];
                });
            $results = array_merge($results, $lenses->toArray());
        }

        return response()->json($results);
    }

    /**
     * My Sales Report
     */
    public function myReport(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        // Sales summary
        $salesSummary = OpticsTransaction::income()
            ->byCategory('Sales')
            ->whereBetween('transaction_date', [$dateFrom, $dateTo])
            ->selectRaw('
                DATE(transaction_date) as date,
                SUM(amount) as total_sales,
                COUNT(*) as sales_count
            ')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();

        // Top selling items (from stock movements)
        $topItems = StockMovement::where('movement_type', 'sale')
            ->whereBetween('created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->selectRaw('item_type, item_id, SUM(ABS(quantity)) as total_sold, SUM(total_amount) as total_amount')
            ->groupBy('item_type', 'item_id')
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get()
            ->map(function ($movement) {
                $item = null;
                $itemName = 'Unknown Item';

                switch ($movement->item_type) {
                    case 'glasses':
                        $item = Glasses::find($movement->item_id);
                        $itemName = $item ? $item->full_name : 'Deleted Frame';
                        break;
                    case 'complete_glasses':
                        $item = CompleteGlasses::with(['frame', 'lensType'])->find($movement->item_id);
                        $itemName = $item ? $item->full_name : 'Deleted Complete Glasses';
                        break;
                    case 'lens_types':
                        $item = LensType::find($movement->item_id);
                        $itemName = $item ? $item->name : 'Deleted Lens';
                        break;
                }

                return [
                    'name' => $itemName,
                    'item_type' => $movement->item_type,
                    'total_quantity' => $movement->total_sold,
                    'total_amount' => $movement->total_amount,
                    'unit' => 'pcs'
                ];
            });

        // Totals
        $totalSales = $salesSummary->sum('total_sales');
        $totalTransactions = $salesSummary->sum('sales_count');
        $totalProfit = $totalSales * 0.3; // Estimated 30% profit margin

        return Inertia::render('OpticsSeller/MyReport', [
            'salesSummary' => $salesSummary,
            'topItems' => $topItems,
            'totalSales' => $totalSales,
            'totalProfit' => $totalProfit,
            'totalTransactions' => $totalTransactions,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }
}
