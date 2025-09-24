<?php

namespace App\Http\Controllers;

use App\Models\Glasses;
use App\Models\LensType;
use App\Models\CompleteGlasses;
use App\Models\StockMovement;
use App\Models\OpticsAccount;
use App\Models\OpticsTransaction;
use App\Models\OpticsExpenseCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OpticsCornerController extends Controller
{
    // Dashboard - Overview
    public function index()
    {
        $stats = [
            'total_frames' => Glasses::active()->count(),
            'frames_in_stock' => Glasses::active()->inStock()->count(),
            'low_stock_frames' => Glasses::active()->lowStock()->count(),
            'total_complete_glasses' => CompleteGlasses::active()->count(),
            'lens_types' => LensType::active()->count(),
            'account_balance' => OpticsAccount::getBalance(),
            'today_sales' => OpticsTransaction::income()->whereDate('transaction_date', today())->sum('amount'),
            'today_expenses' => OpticsTransaction::expense()->whereDate('transaction_date', today())->sum('amount'),
            'month_profit' => OpticsAccount::monthlyReport(now()->year, now()->month)
        ];

        $lowStockItems = collect()
            ->merge(Glasses::active()->lowStock()->with(['stockMovements' => fn($q) => $q->latest()->limit(3)])->get())
            ->merge(LensType::active()->lowStock()->get())
            ->merge(CompleteGlasses::active()->lowStock()->with('frame', 'lensType')->get());

        $recentTransactions = OpticsTransaction::with('createdBy')->latest()->limit(10)->get();

        return Inertia::render('OpticsCorner/Dashboard', compact('stats', 'lowStockItems', 'recentTransactions'));
    }


    public function frames()
    {
        $frames = Glasses::query()
            ->when(
                request('search'),
                fn($q, $search) =>
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('color', 'like', "%{$search}%")
                    ->orWhere('size', 'like', "%{$search}%")
                    ->orWhere('material', 'like', "%{$search}%")
            )
            ->when(request('type'), fn($q, $type) => $q->where('type', $type))
            ->when(request('frame_type'), fn($q, $frameType) => $q->where('frame_type', $frameType))
            ->when(request('material'), fn($q, $material) => $q->where('material', $material))
            ->when(request('gender'), fn($q, $gender) => $q->where('gender', $gender))
            ->when(request('color'), fn($q, $color) => $q->where('color', 'like', "%{$color}%"))
            ->when(request('status') === 'active', fn($q) => $q->where('is_active', true))
            ->when(request('status') === 'inactive', fn($q) => $q->where('is_active', false))
            ->when(request('low_stock'), fn($q) => $q->lowStock())
            ->when(request('in_stock'), fn($q) => $q->inStock())
            ->when(request('out_of_stock'), fn($q) => $q->where('stock_quantity', 0))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $filterOptions = [
            'types' => Glasses::distinct()->pluck('type')->filter()->sort()->values(),
            'frame_types' => Glasses::distinct()->pluck('frame_type')->filter()->sort()->values(),
            'materials' => Glasses::distinct()->pluck('material')->filter()->sort()->values(),
            'genders' => Glasses::distinct()->pluck('gender')->filter()->sort()->values(),
            'colors' => Glasses::distinct()->pluck('color')->filter()->sort()->values(),
        ];

        return Inertia::render('OpticsCorner/Frames/Index', compact('frames', 'filterOptions'));
    }

    public function toggleStatus(Glasses $frame)
    {
        $frame->update(['is_active' => !$frame->is_active]);

        $statusText = $frame->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Frame {$statusText} successfully!");
    }

    public function createFrame()
    {
        return Inertia::render('OpticsCorner/Frames/Create');
    }

    public function storeFrame(Request $request)
    {

        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'type' => 'required|in:frame,sunglasses,reading_glasses,progressive,bifocal',
            'frame_type' => 'required|in:full_rim,half_rim,rimless',
            'material' => 'required|in:plastic,metal,titanium,acetate,wood',
            'color' => 'nullable|string|max:255',
            'gender' => 'required|in:men,women,unisex,kids',
            'size' => 'nullable|string|max:255',
            'lens_width' => 'nullable|numeric|min:0|max:999',
            'bridge_width' => 'nullable|numeric|min:0|max:999',
            'temple_length' => 'nullable|numeric|min:0|max:999',
            'shape' => 'nullable|string|max:255',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'minimum_stock_level' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            // Generate SKU
            $validated['sku'] = 'FR-' . strtoupper(Str::random(8));

            $frame = Glasses::create($validated);

            // Record stock movement for initial purchase
            if ($validated['stock_quantity'] > 0) {
                $totalCost = $validated['purchase_price'] * $validated['stock_quantity'];

                StockMovement::create([
                    'item_type' => 'glasses',
                    'item_id' => $frame->id,
                    'movement_type' => 'purchase',
                    'quantity' => $validated['stock_quantity'],
                    'previous_stock' => 0,
                    'new_stock' => $validated['stock_quantity'],
                    'unit_price' => $validated['purchase_price'],
                    'total_amount' => $totalCost,
                    'notes' => 'Initial stock purchase',
                    'user_id' => auth()->id(),
                ]);

                // Add expense to account
                OpticsAccount::addExpense(
                    $totalCost,
                    'Frame Purchase',
                    "Initial stock for {$frame->full_name} - {$validated['stock_quantity']} pcs"
                );
            }
        });

        return redirect()->route('optics.frames')->with('success', 'Frame added successfully!');
    }

    public function editFrame(Glasses $frame)
    {
        return Inertia::render('OpticsCorner/Frames/Edit', compact('frame'));
    }

    public function updateFrame(Request $request, Glasses $frame)
    {
        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'type' => 'required|in:frame,sunglasses,reading_glasses,progressive,bifocal',
            'frame_type' => 'required|in:full_rim,half_rim,rimless',
            'material' => 'required|in:plastic,metal,titanium,acetate,wood',
            'color' => 'nullable|string|max:255',
            'gender' => 'required|in:men,women,unisex,kids',
            'size' => 'nullable|string|max:255',
            'lens_width' => 'nullable|numeric|min:0|max:999',
            'bridge_width' => 'nullable|numeric|min:0|max:999',
            'temple_length' => 'nullable|numeric|min:0|max:999',
            'shape' => 'nullable|string|max:255',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'minimum_stock_level' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $frame->update($validated);

        return redirect()->route('optics.frames')->with('success', 'Frame updated successfully!');
    }

    public function stockManagement()
    {
        $movements = StockMovement::with(['user'])
            ->when(request('type'), fn($q, $type) => $q->byType($type))
            ->when(request('item_type'), fn($q, $itemType) => $q->byItemType($itemType))
            ->latest()
            ->paginate(20);

        return Inertia::render('OpticsCorner/Stock/Index', compact('movements'));
    }

    public function addStock()
    {
        // Get frames with full_name attribute
        $frames = Glasses::active()
            ->get(['id', 'brand', 'model', 'sku', 'stock_quantity'])
            ->map(function ($frame) {
                $frame->full_name = $frame->full_name; // This will use the accessor
                return $frame;
            });

        // Get lens types with proper fields
        $lensTypes = LensType::active()
            ->get(['id', 'name', 'stock_quantity'])
            ->map(function ($lens) {
                $lens->full_name = $lens->name; // Use name as full_name for consistency
                return $lens;
            });

        // Get complete glasses with relationships
        $completeGlasses = CompleteGlasses::active()
            ->with('frame', 'lensType')
            ->get(['id', 'frame_id', 'lens_type_id', 'stock_quantity'])
            ->map(function ($glass) {
                $glass->full_name = $glass->full_name; // This will use the accessor
                return $glass;
            });

        return Inertia::render('OpticsCorner/Stock/AddStock', compact('frames', 'lensTypes', 'completeGlasses'));
    }

    public function storeStock(Request $request)
    {
        $validated = $request->validate([
            'item_type' => 'required|in:glasses,lens_types,complete_glasses',
            'item_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $model = match ($validated['item_type']) {
                'glasses' => Glasses::class,
                'lens_types' => LensType::class,
                'complete_glasses' => CompleteGlasses::class,
            };

            $item = $model::findOrFail($validated['item_id']);
            $previousStock = $item->stock_quantity;
            $newStock = $previousStock + $validated['quantity'];
            $totalAmount = $validated['unit_price'] * $validated['quantity'];

            // Update stock
            $item->update(['stock_quantity' => $newStock]);

            // Record movement
            StockMovement::create([
                'item_type' => $validated['item_type'],
                'item_id' => $validated['item_id'],
                'movement_type' => 'purchase',
                'quantity' => $validated['quantity'],
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'unit_price' => $validated['unit_price'],
                'total_amount' => $totalAmount,
                'notes' => $validated['notes'],
                'user_id' => auth()->id(),
            ]);

            // Add expense to account
            $itemName = match ($validated['item_type']) {
                'glasses' => $item->full_name,
                'lens_types' => $item->name,
                'complete_glasses' => $item->full_name,
            };

            OpticsAccount::addExpense(
                $totalAmount,
                ucfirst(str_replace('_', ' ', $validated['item_type'])) . ' Purchase',
                "Stock purchase: {$itemName} - {$validated['quantity']} pcs"
            );
        });

        return redirect()->route('optics.stock')->with('success', 'Stock added successfully!');
    }
    public function editStock($id)
    {
        $movement = StockMovement::with(['user'])->findOrFail($id);

        // Only allow editing purchase movements
        if ($movement->movement_type !== 'purchase') {
            return redirect()->route('optics.stock')->with('error', 'Only purchase movements can be edited!');
        }

        // Get all available items based on movement type
        $frames = collect();
        $lensTypes = collect();
        $completeGlasses = collect();

        if ($movement->item_type === 'glasses') {
            $frames = Glasses::active()
                ->get(['id', 'brand', 'model', 'sku', 'stock_quantity'])
                ->map(function ($frame) {
                    $frame->full_name = $frame->full_name;
                    return $frame;
                });
        } elseif ($movement->item_type === 'lens_types') {
            $lensTypes = LensType::active()
                ->get(['id', 'name', 'stock_quantity'])
                ->map(function ($lens) {
                    $lens->full_name = $lens->name;
                    return $lens;
                });
        } elseif ($movement->item_type === 'complete_glasses') {
            $completeGlasses = CompleteGlasses::active()
                ->with('frame', 'lensType')
                ->get(['id', 'frame_id', 'lens_type_id', 'stock_quantity'])
                ->map(function ($glass) {
                    $glass->full_name = $glass->full_name;
                    return $glass;
                });
        }

        return Inertia::render('OpticsCorner/Stock/Edit', compact('movement', 'frames', 'lensTypes', 'completeGlasses'));
    }
    
    public function updateStock(Request $request, $id)
    {
        $movement = StockMovement::findOrFail($id);

        // Only allow editing purchase movements
        if ($movement->movement_type !== 'purchase') {
            return redirect()->route('optics.stock')->with('error', 'Only purchase movements can be edited!');
        }

        $validated = $request->validate([
            'item_type' => 'required|in:glasses,lens_types,complete_glasses',
            'item_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $movement) {
            $model = match ($validated['item_type']) {
                'glasses' => Glasses::class,
                'lens_types' => LensType::class,
                'complete_glasses' => CompleteGlasses::class,
            };

            $item = $model::findOrFail($validated['item_id']);

            // If item changed, revert previous item's stock
            if ($movement->item_type !== $validated['item_type'] || $movement->item_id != $validated['item_id']) {
                $oldModel = match ($movement->item_type) {
                    'glasses' => Glasses::class,
                    'lens_types' => LensType::class,
                    'complete_glasses' => CompleteGlasses::class,
                };

                $oldItem = $oldModel::findOrFail($movement->item_id);
                $oldItem->update(['stock_quantity' => $oldItem->stock_quantity - $movement->quantity]);

                // Update new item stock
                $previousStock = $item->stock_quantity;
                $newStock = $previousStock + $validated['quantity'];
            } else {
                // Same item, adjust stock based on quantity difference
                $quantityDifference = $validated['quantity'] - $movement->quantity;
                $previousStock = $item->stock_quantity - $quantityDifference;
                $newStock = $item->stock_quantity;
            }

            // Update item stock
            $item->update(['stock_quantity' => $newStock]);

            $totalAmount = $validated['unit_price'] * $validated['quantity'];
            $oldTotalAmount = $movement->total_amount;

            // Update movement record
            $movement->update([
                'item_type' => $validated['item_type'],
                'item_id' => $validated['item_id'],
                'quantity' => $validated['quantity'],
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'unit_price' => $validated['unit_price'],
                'total_amount' => $totalAmount,
                'notes' => $validated['notes'],
            ]);

            // Adjust account balance (difference between old and new amount)
            $amountDifference = $totalAmount - $oldTotalAmount;

            if ($amountDifference > 0) {
                // Additional expense
                OpticsAccount::addExpense(
                    $amountDifference,
                    ucfirst(str_replace('_', ' ', $validated['item_type'])) . ' Purchase Adjustment',
                    "Stock adjustment: Additional expense for movement #{$movement->id}"
                );
            } elseif ($amountDifference < 0) {
                // Refund (add income)
                OpticsAccount::addIncome(
                    abs($amountDifference),
                    ucfirst(str_replace('_', ' ', $validated['item_type'])) . ' Purchase Adjustment',
                    "Stock adjustment: Refund for movement #{$movement->id}"
                );
            }
        });

        return redirect()->route('optics.stock')->with('success', 'Stock movement updated successfully!');
    }
    public function deleteStock($id)
    {
        $movement = StockMovement::findOrFail($id);

        // Only allow deleting purchase movements
        if ($movement->movement_type !== 'purchase') {
            return redirect()->route('optics.stock')->with('error', 'Only purchase movements can be deleted!');
        }

        DB::transaction(function () use ($movement) {
            $model = match ($movement->item_type) {
                'glasses' => Glasses::class,
                'lens_types' => LensType::class,
                'complete_glasses' => CompleteGlasses::class,
            };

            $item = $model::findOrFail($movement->item_id);

            // Revert stock quantity
            $item->update(['stock_quantity' => $item->stock_quantity - $movement->quantity]);

            // Add refund to account
            OpticsAccount::addIncome(
                $movement->total_amount,
                ucfirst(str_replace('_', ' ', $movement->item_type)) . ' Purchase Refund',
                "Stock movement deleted: Movement #{$movement->id} refund"
            );

            // Delete the movement
            $movement->delete();
        });

        return redirect()->route('optics.stock')->with('success', 'Stock movement deleted successfully!');
    }

    // =============== SALES MANAGEMENT ===============
    public function sales()
    {
        $sales = OpticsTransaction::income()
            ->byCategory('Sales')
            ->with('createdBy')
            ->latest()
            ->paginate(20);

        return Inertia::render('OpticsCorner/Sales/Index', compact('sales'));
    }

    public function createSale()
    {
        $frames = Glasses::active()->inStock()->get(['id', 'brand', 'model', 'sku', 'selling_price', 'stock_quantity']);
        $lensTypes = LensType::active()->inStock()->get(['id', 'name', 'price', 'stock_quantity']);
        $completeGlasses = CompleteGlasses::active()->inStock()->with('frame', 'lensType')->get();

        return Inertia::render('OpticsCorner/Sales/Create', compact('frames', 'lensTypes', 'completeGlasses'));
    }

    public function storeSale(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'items' => 'required|array|min:1',
            'items.*.type' => 'required|in:frame,lens,complete_glasses',
            'items.*.id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $totalAmount = 0;
            $saleDetails = [];

            foreach ($validated['items'] as $item) {
                $model = match ($item['type']) {
                    'frame' => Glasses::class,
                    'lens' => LensType::class,
                    'complete_glasses' => CompleteGlasses::class,
                };

                $product = $model::findOrFail($item['id']);

                // Check stock
                if ($product->stock_quantity < $item['quantity']) {
                    dd('nothing');
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
                    'user_id' => auth()->id(),
                ]);

                $saleDetails[] = ($product->name ?? $product->full_name) . " x{$item['quantity']}";
            }

            // Apply discount
            $finalAmount = $totalAmount - ($validated['discount'] ?? 0);

            // Record income
            OpticsAccount::addIncome(
                $finalAmount,
                'Sales',
                "Sale to {$validated['customer_name']} - " . implode(', ', $saleDetails) .
                    ($validated['notes'] ? " | Notes: {$validated['notes']}" : '')
            );
        });

        return redirect()->route('optics.sales')->with('success', 'Sale recorded successfully!');
    }

    public function account()
    {
        $balance = OpticsAccount::getBalance();
        $monthlyReport = OpticsAccount::monthlyReport(now()->year, now()->month);

        $transactions = OpticsTransaction::with('createdBy', 'expenseCategory')
            ->when(request('type'), fn($q, $type) => $q->where('type', $type))
            ->when(request('category'), fn($q, $category) => $q->byCategory($category))
            ->latest()
            ->paginate(20);

        $expenseCategories = OpticsExpenseCategory::where('is_active', true)->get();

        return Inertia::render('OpticsCorner/Account/Index', compact('balance', 'monthlyReport', 'transactions', 'expenseCategories'));
    }

    public function addFund(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'purpose' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        OpticsAccount::addFund($validated['amount'], $validated['purpose'], $validated['description'] ?? '');

        return back()->with('success', 'Fund added successfully!');
    }

    public function addExpense(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'category' => 'required|string|max:255',
            'expense_category_id' => 'nullable|exists:optics_expense_categories,id',
            'description' => 'required|string',
        ]);

        OpticsAccount::addExpense(
            $validated['amount'],
            $validated['category'],
            $validated['description'],
            $validated['expense_category_id']
        );

        return back()->with('success', 'Expense added successfully!');
    }

    // =============== REPORTS ===============
    public function reports()
    {
        $currentMonth = OpticsAccount::monthlyReport(now()->year, now()->month);
        $lastMonth = OpticsAccount::monthlyReport(now()->subMonth()->year, now()->subMonth()->month);

        $topSellingFrames = StockMovement::where('item_type', 'glasses')
            ->where('movement_type', 'sale')
            ->selectRaw('item_id, SUM(ABS(quantity)) as total_sold')
            ->groupBy('item_id')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->with(['item'])
            ->get();

        $lowStockAlert = collect()
            ->merge(Glasses::active()->lowStock()->get())
            ->merge(LensType::active()->lowStock()->get())
            ->merge(CompleteGlasses::active()->lowStock()->with('frame', 'lensType')->get());

        return Inertia::render('OpticsCorner/Reports/Index', compact('currentMonth', 'lastMonth', 'topSellingFrames', 'lowStockAlert'));
    }

    // =============== LENS TYPES MANAGEMENT ===============
    public function lensTypes()
    {
        $lensTypes = LensType::active()
            ->when(
                request('search'),
                fn($q, $search) =>
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('material', 'like', "%{$search}%")
            )
            ->latest()
            ->paginate(20);

        return Inertia::render('OpticsCorner/LensTypes/Index', compact('lensTypes'));
    }

    public function storeLensType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'material' => 'required|string|max:255',
            'coating' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'minimum_stock_level' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        LensType::create($validated);

        return back()->with('success', 'Lens type added successfully!');
    }
}
