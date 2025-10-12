<?php

namespace App\Http\Controllers;

use App\Models\Glasses;
use App\Models\LensType;
use App\Models\CompleteGlasses;
use App\Models\GlassesPurchase;
use App\Models\MainAccount;
use App\Models\StockMovement;
use App\Models\OpticsAccount;
use App\Models\OpticsTransaction;
use App\Models\OpticsExpenseCategory;
use App\Models\OpticsVendor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OpticsCornerController extends Controller
{
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
            'month_profit' => OpticsAccount::monthlyReport(now()->year, now()->month),

            // Vendor stats - ✅ এটা যোগ করা হয়েছে
            'total_vendors' => OpticsVendor::active()->count(),
            'total_vendor_due' => OpticsVendor::where('balance_type', 'due')->sum('current_balance'),
            'pending_purchases' => GlassesPurchase::where('payment_status', '!=', 'paid')->count(),
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

    public function deleteFrame(Glasses $frame)
    {
        // Check if frame has any sales history
        $hasSales = StockMovement::where('item_type', 'glasses')
            ->where('item_id', $frame->id)
            ->where('movement_type', 'sale')
            ->exists();

        if ($hasSales) {
            return back()->with('error', 'Cannot delete frame that has sales history!');
        }

        // Calculate refund amount outside transaction for use in return message
        $currentStock = $frame->stock_quantity;
        $totalRefundAmount = $currentStock * $frame->purchase_price;

        DB::transaction(function () use ($frame, $totalRefundAmount, $currentStock) {
            // Get all purchase movements for audit trail
            $purchaseMovements = StockMovement::where('item_type', 'glasses')
                ->where('item_id', $frame->id)
                ->where('movement_type', 'purchase')
                ->get();

            // Delete all stock movements for this frame
            StockMovement::where('item_type', 'glasses')
                ->where('item_id', $frame->id)
                ->delete();

            // Process financial refund if there's any stock available
            if ($totalRefundAmount > 0) {
                // Use OpticsAccount adjustment method for proper accounting
                OpticsAccount::adjustAmount(
                    $totalRefundAmount,
                    'income',
                    'Frame Deletion Refund',
                    "Refund for deleted frame: {$frame->full_name} - {$currentStock} pcs at ৳{$frame->purchase_price} each"
                );
            }

            // Delete the frame
            $frame->delete();
        });

        return redirect()->route('optics.frames')->with('success', "Frame deleted successfully! Refund of ৳{$totalRefundAmount} has been processed for {$currentStock} pieces.");
    }

    public function toggleStatus(Glasses $frame)
    {
        $frame->update(['is_active' => !$frame->is_active]);

        $statusText = $frame->is_active ? 'activated' : 'deactivated';

        return back()->with('success', "Frame {$statusText} successfully!");
    }

    public function createFrame()
    {
        // ✅ Vendors list পাঠানো হচ্ছে
        $vendors = OpticsVendor::active()->get(['id', 'name', 'company_name']);

        return Inertia::render('OpticsCorner/Frames/Create', compact('vendors'));
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

            // ✅ Vendor fields যোগ করা হয়েছে
            'default_vendor_id' => 'nullable|exists:optics_vendors,id',
            'paid_amount' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            // Generate SKU
            $validated['sku'] = 'FR-' . strtoupper(Str::random(8));

            $frame = Glasses::create($validated);

            // Record stock movement for initial purchase
            if ($validated['stock_quantity'] > 0) {
                $totalCost = $validated['purchase_price'] * $validated['stock_quantity'];
                $paidAmount = $validated['paid_amount'] ?? 0;
                $dueAmount = $totalCost - $paidAmount;

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

                // ✅ Vendor থাকলে purchase record তৈরি করা হবে
                if (!empty($validated['default_vendor_id'])) {
                    $purchase = GlassesPurchase::create([
                        'purchase_no' => 'GP-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                        'vendor_id' => $validated['default_vendor_id'],
                        'glasses_id' => $frame->id,
                        'quantity' => $validated['stock_quantity'],
                        'unit_cost' => $validated['purchase_price'],
                        'total_cost' => $totalCost,
                        'paid_amount' => $paidAmount,
                        'due_amount' => $dueAmount,
                        'payment_status' => $dueAmount > 0 ? ($paidAmount > 0 ? 'partial' : 'pending') : 'paid',
                        'purchase_date' => now()->toDateString(),
                        'notes' => 'Initial stock purchase',
                        'added_by' => auth()->id(),
                    ]);

                    // Add to vendor's due if not fully paid
                    if ($dueAmount > 0) {
                        $vendor = OpticsVendor::findOrFail($validated['default_vendor_id']);
                        $vendor->addPurchase(
                            $dueAmount,
                            "Initial stock - {$frame->full_name} ({$validated['stock_quantity']} pcs)",
                            $purchase->id
                        );
                    }

                    // Only paid amount goes to expense
                    if ($paidAmount > 0) {
                        $transaction = OpticsAccount::addExpense(
                            $paidAmount,
                            'Frame Purchase',
                            "Initial stock for {$frame->full_name} - {$validated['stock_quantity']} pcs (Paid)"
                        );

                        $purchase->update(['optics_transaction_id' => $transaction->id]);
                    }
                } else {
                    // ✅ Vendor না থাকলে সরাসরি expense (cash purchase)
                    OpticsAccount::addExpense(
                        $totalCost,
                        'Frame Purchase',
                        "Initial stock for {$frame->full_name} - {$validated['stock_quantity']} pcs (Cash)"
                    );
                }
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
        // Get stock movements with related data
        $movements = StockMovement::with(['user'])
            ->when(request('type'), fn($q, $type) => $q->where('movement_type', $type))
            ->when(request('item_type'), fn($q, $itemType) => $q->where('item_type', $itemType))
            ->when(request('date_from'), fn($q, $date) => $q->whereDate('created_at', '>=', $date))
            ->when(request('date_to'), fn($q, $date) => $q->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate(20)
            ->through(function ($movement) {
                // Get item details based on item_type
                $itemDetails = $this->getItemDetails($movement->item_type, $movement->item_id);

                return [
                    'id' => $movement->id,
                    'item_type' => $movement->item_type,
                    'item_id' => $movement->item_id,
                    'movement_type' => $movement->movement_type,
                    'quantity' => $movement->quantity,
                    'previous_stock' => $movement->previous_stock,
                    'new_stock' => $movement->new_stock,
                    'unit_price' => abs($movement->unit_price),
                    'total_amount' => abs($movement->total_amount),
                    'notes' => $movement->notes,
                    'created_at' => $movement->created_at->format('Y-m-d H:i:s'),
                    'user' => [
                        'name' => $movement->user->name ?? 'System'
                    ],
                    // Item details
                    'item_brand' => $itemDetails['brand'] ?? 'N/A',
                    'item_model' => $itemDetails['model'] ?? 'N/A',
                    'item_sku' => $itemDetails['sku'] ?? 'N/A',
                    'item_name' => $itemDetails['name'] ?? 'Unknown Item',
                ];
            });

        // Calculate statistics
        $stats = $this->calculateStockStats();

        return Inertia::render('OpticsCorner/Stock/Index', [
            'movements' => $movements,
            'stats' => $stats,
            'filters' => request()->only(['type', 'item_type', 'date_from', 'date_to'])
        ]);
    }

    private function getItemDetails($itemType, $itemId)
    {
        switch ($itemType) {
            case 'glasses':
                $item = \App\Models\Glasses::find($itemId);
                return [
                    'brand' => $item->brand ?? 'N/A',
                    'model' => $item->model ?? 'N/A',
                    'sku' => $item->sku ?? 'N/A',
                    'name' => ($item->brand ?? '') . ' ' . ($item->model ?? ''),
                ];

            case 'lens_types':
                $item = \App\Models\LensType::find($itemId);
                return [
                    'brand' => $item->type ?? 'N/A',
                    'model' => $item->name ?? 'N/A',
                    'sku' => 'LENS-' . $itemId,
                    'name' => $item->name ?? 'Unknown Lens',
                ];

            case 'complete_glasses':
                $item = \App\Models\CompleteGlasses::with('frame')->find($itemId);
                return [
                    'brand' => $item->frame->brand ?? 'N/A',
                    'model' => $item->frame->model ?? 'N/A',
                    'sku' => $item->sku ?? 'N/A',
                    'name' => 'Complete: ' . ($item->frame->brand ?? '') . ' ' . ($item->frame->model ?? ''),
                ];

            default:
                return [
                    'brand' => 'N/A',
                    'model' => 'N/A',
                    'sku' => 'N/A',
                    'name' => 'Unknown Item',
                ];
        }
    }

    private function calculateStockStats()
    {
        $today = today();

        return [
            'total_movements' => StockMovement::count(),
            'today_purchases' => StockMovement::where('movement_type', 'purchase')
                ->whereDate('created_at', $today)
                ->sum('quantity'),
            'today_sales' => abs(StockMovement::where('movement_type', 'sale')
                ->whereDate('created_at', $today)
                ->sum('quantity')),
            'today_adjustments' => StockMovement::where('movement_type', 'adjustment')
                ->whereDate('created_at', $today)
                ->count(),
            'today_value' => StockMovement::whereDate('created_at', $today)
                ->get()
                ->sum(fn($m) => abs($m->total_amount)),

            // This week
            'week_purchases' => StockMovement::where('movement_type', 'purchase')
                ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
                ->sum('quantity'),
            'week_sales' => abs(StockMovement::where('movement_type', 'sale')
                ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
                ->sum('quantity')),
            'week_value' => StockMovement::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
                ->get()
                ->sum(fn($m) => abs($m->total_amount)),
        ];
    }

    public function addStock()
    {
        // Get frames with full_name attribute
        $frames = Glasses::active()
            ->get(['id', 'brand', 'model', 'sku', 'stock_quantity', 'default_vendor_id'])
            ->map(function ($frame) {
                $frame->full_name = $frame->full_name;
                return $frame;
            });

        $lensTypes = LensType::active()
            ->get(['id', 'name', 'stock_quantity'])
            ->map(function ($lens) {
                $lens->full_name = $lens->name;
                return $lens;
            });

        $completeGlasses = CompleteGlasses::active()
            ->with('frame', 'lensType')
            ->get(['id', 'frame_id', 'lens_type_id', 'stock_quantity'])
            ->map(function ($glass) {
                $glass->full_name = $glass->full_name;
                return $glass;
            });

        // ✅ Vendors list পাঠানো হচ্ছে
        $vendors = OpticsVendor::active()->get(['id', 'name', 'company_name']);

        return Inertia::render('OpticsCorner/Stock/AddStock', compact('frames', 'lensTypes', 'completeGlasses', 'vendors'));
    }

    public function storeStock(Request $request)
    {
        $validated = $request->validate([
            'item_type' => 'required|in:glasses,lens_types,complete_glasses',
            'item_id' => 'required|integer',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',

            // ✅ Vendor fields যোগ করা হয়েছে
            'vendor_id' => 'nullable|exists:optics_vendors,id',
            'paid_amount' => 'nullable|numeric|min:0',
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

            $itemName = match ($validated['item_type']) {
                'glasses' => $item->full_name,
                'lens_types' => $item->name,
                'complete_glasses' => $item->full_name,
            };

            // ✅ Vendor check করা হচ্ছে
            if (!empty($validated['vendor_id']) && $validated['item_type'] === 'glasses') {
                $paidAmount = $validated['paid_amount'] ?? 0;
                $dueAmount = $totalAmount - $paidAmount;

                // Create purchase record
                $purchase = GlassesPurchase::create([
                    'purchase_no' => 'GP-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                    'vendor_id' => $validated['vendor_id'],
                    'glasses_id' => $validated['item_id'],
                    'quantity' => $validated['quantity'],
                    'unit_cost' => $validated['unit_price'],
                    'total_cost' => $totalAmount,
                    'paid_amount' => $paidAmount,
                    'due_amount' => $dueAmount,
                    'payment_status' => $dueAmount > 0 ? ($paidAmount > 0 ? 'partial' : 'pending') : 'paid',
                    'purchase_date' => now()->toDateString(),
                    'notes' => $validated['notes'],
                    'added_by' => auth()->id(),
                ]);

                // Add to vendor's due
                if ($dueAmount > 0) {
                    $vendor = OpticsVendor::findOrFail($validated['vendor_id']);
                    $vendor->addPurchase(
                        $dueAmount,
                        "Stock purchase - {$itemName} ({$validated['quantity']} pcs)",
                        $purchase->id
                    );
                }

                // Only paid amount goes to expense
                if ($paidAmount > 0) {
                    $transaction = OpticsAccount::addExpense(
                        $paidAmount,
                        'Glasses Purchase',
                        "Stock purchase: {$itemName} - {$validated['quantity']} pcs (Paid)"
                    );

                    $purchase->update(['optics_transaction_id' => $transaction->id]);
                }
            } else {
                // ✅ Vendor না থাকলে সরাসরি expense (cash purchase)
                OpticsAccount::addExpense(
                    $totalAmount,
                    ucfirst(str_replace('_', ' ', $validated['item_type'])) . ' Purchase',
                    "Stock purchase: {$itemName} - {$validated['quantity']} pcs (Cash)"
                );
            }
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

            // Calculate old and new amounts
            $oldTotalAmount = $movement->total_amount;
            $newTotalAmount = $validated['unit_price'] * $validated['quantity'];
            $amountDifference = $newTotalAmount - $oldTotalAmount;

            // Handle stock adjustments
            if ($movement->item_type !== $validated['item_type'] || $movement->item_id != $validated['item_id']) {
                // Different item - revert old item stock
                $oldModel = match ($movement->item_type) {
                    'glasses' => Glasses::class,
                    'lens_types' => LensType::class,
                    'complete_glasses' => CompleteGlasses::class,
                };

                $oldItem = $oldModel::findOrFail($movement->item_id);
                $oldItem->update(['stock_quantity' => $oldItem->stock_quantity - $movement->quantity]);

                // Add to new item stock
                $previousStock = $item->stock_quantity;
                $newStock = $previousStock + $validated['quantity'];
                $item->update(['stock_quantity' => $newStock]);
            } else {
                // Same item - adjust stock based on quantity difference
                $quantityDifference = $validated['quantity'] - $movement->quantity;
                $previousStock = $item->stock_quantity - $quantityDifference;
                $newStock = $item->stock_quantity;
                $item->update(['stock_quantity' => $newStock]);
            }

            // Update movement record
            $movement->update([
                'item_type' => $validated['item_type'],
                'item_id' => $validated['item_id'],
                'quantity' => $validated['quantity'],
                'previous_stock' => $previousStock ?? $item->stock_quantity - $validated['quantity'],
                'new_stock' => $newStock ?? $item->stock_quantity,
                'unit_price' => $validated['unit_price'],
                'total_amount' => $newTotalAmount,
                'notes' => $validated['notes'],
            ]);

            // Handle financial adjustments using OpticsAccount adjustment method
            if ($amountDifference > 0) {
                // Additional expense needed
                OpticsAccount::adjustAmount(
                    $amountDifference,
                    'expense',
                    ucfirst(str_replace('_', ' ', $validated['item_type'])) . ' Purchase Adjustment',
                    "Stock adjustment: Additional expense for movement #{$movement->id}"
                );
            } elseif ($amountDifference < 0) {
                // Refund available
                OpticsAccount::adjustAmount(
                    abs($amountDifference),
                    'income',
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

            // Process financial refund using OpticsAccount adjustment method
            OpticsAccount::adjustAmount(
                $movement->total_amount,
                'income',
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


    public function vendors()
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

    public function createVendor()
    {
        return Inertia::render('OpticsCorner/Vendors/Create');
    }

    public function storeVendor(Request $request)
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

        return redirect()->route('optics.vendors')->with('success', 'Vendor added successfully!');
    }

    public function editVendor(OpticsVendor $vendor)
    {
        return Inertia::render('OpticsCorner/Vendors/Edit', compact('vendor'));
    }

    public function updateVendor(Request $request, OpticsVendor $vendor)
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

        return redirect()->route('optics.vendors')->with('success', 'Vendor updated successfully!');
    }

    public function vendorTransactions(OpticsVendor $vendor)
    {
        $transactions = $vendor->transactions()
            ->with('createdBy', 'paymentMethod')
            ->latest()
            ->paginate(20);

        $purchases = $vendor->purchases()
            ->with('glasses', 'addedBy')
            ->latest()
            ->paginate(10);

        return Inertia::render('OpticsCorner/Vendors/Transactions', compact('vendor', 'transactions', 'purchases'));
    }

    public function makeVendorPayment(Request $request, OpticsVendor $vendor)
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

        $vendor->addPayment(
            $validated['amount'],
            $validated['description'],
            $validated['payment_method_id'],
            $validated['payment_date'] ?? null
        );

        return back()->with('success', 'Payment recorded successfully!');
    }

    // =============== GLASSES PURCHASE FROM VENDOR ===============

    public function createPurchase()
    {
        $vendors = OpticsVendor::active()->get(['id', 'name', 'company_name', 'current_balance', 'balance_type']);
        $frames = Glasses::active()->get(['id', 'brand', 'model', 'sku', 'purchase_price', 'stock_quantity']);

        return Inertia::render('OpticsCorner/Purchases/Create', compact('vendors', 'frames'));
    }

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

            // Handle paid amount
            if ($paidAmount > 0) {
                // Create optics expense transaction
                $transaction = OpticsAccount::addExpense(
                    $paidAmount,
                    'Glasses Purchase',
                    "Purchase from vendor - {$glasses->full_name} ({$validated['quantity']} pcs)",
                    null,
                    $purchaseDate
                );

                $purchase->update(['optics_transaction_id' => $transaction->id]);
            }
        });

        return redirect()->route('optics.purchases')->with('success', 'Purchase recorded successfully!');
    }

    public function purchases()
    {
        $purchases = GlassesPurchase::with('vendor', 'glasses', 'addedBy')
            ->when(request('vendor_id'), fn($q, $vendorId) => $q->where('vendor_id', $vendorId))
            ->when(request('payment_status'), fn($q, $status) => $q->where('payment_status', $status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $vendors = OpticsVendor::active()->get(['id', 'name', 'company_name']);

        // ✅ Payment methods যোগ করুন
        $paymentMethods = \App\Models\PaymentMethod::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('OpticsCorner/Purchases/Index', compact('purchases', 'vendors', 'paymentMethods'));
    }

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
        });

        return back()->with('success', 'Payment recorded successfully!');
    }
}
