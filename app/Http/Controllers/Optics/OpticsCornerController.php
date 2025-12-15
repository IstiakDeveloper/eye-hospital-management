<?php

namespace App\Http\Controllers\Optics;

use App\Http\Controllers\Controller;
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
use App\Models\OpticsSale;
use App\Models\OpticsSaleItem;
use App\Models\OpticsSalePayment;
use App\Models\Patient;
use App\Models\HospitalAccount;
use App\Models\HospitalExpenseCategory;
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
        $query = Glasses::query()
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
            ->latest();

        // Check if requesting all frames for print
        if (request('all') === 'true') {
            $frames = $query->get();
        } else {
            $frames = $query->paginate(20)->withQueryString();
        }

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

                    // Only paid amount goes to Hospital Account expense
                    if ($paidAmount > 0) {
                        $purchaseCategory = HospitalExpenseCategory::firstOrCreate(
                            ['name' => 'Optics Purchase'],
                            ['is_active' => true]
                        );

                        $transaction = HospitalAccount::addExpense(
                            $paidAmount,
                            'Optics Purchase',
                            "Initial stock for {$frame->full_name} - {$validated['stock_quantity']} pcs (Paid to vendor)",
                            $purchaseCategory->id,
                            now()->toDateString()
                        );

                        $purchase->update(['optics_transaction_id' => $transaction->id]);
                    }
                } else {
                    // ✅ Vendor না থাকলে সরাসরি expense (cash purchase)
                    $purchaseCategory = HospitalExpenseCategory::firstOrCreate(
                        ['name' => 'Optics Purchase'],
                        ['is_active' => true]
                    );

                    HospitalAccount::addExpense(
                        $totalCost,
                        'Optics Purchase',
                        "Initial stock for {$frame->full_name} - {$validated['stock_quantity']} pcs (Cash)",
                        $purchaseCategory->id,
                        now()->toDateString()
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
        // Get frames with full_name attribute and purchase_price
        $frames = Glasses::active()
            ->get(['id', 'brand', 'model', 'sku', 'stock_quantity', 'purchase_price', 'default_vendor_id'])
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
            'total_price' => 'required|numeric|min:0', // ✅ Changed from unit_price to total_price
            'notes' => 'nullable|string',

            // ✅ Vendor fields যোগ করা হয়েছে
            'vendor_id' => 'nullable|exists:optics_vendors,id',
            'paid_amount' => 'nullable|numeric|min:0',
        ]);

        // ✅ Calculate unit price from total price
        $unitPrice = $validated['total_price'] / $validated['quantity'];

        DB::transaction(function () use ($validated, $unitPrice) {
            $model = match ($validated['item_type']) {
                'glasses' => Glasses::class,
                'lens_types' => LensType::class,
                'complete_glasses' => CompleteGlasses::class,
            };

            $item = $model::findOrFail($validated['item_id']);
            $previousStock = $item->stock_quantity;
            $newStock = $previousStock + $validated['quantity'];
            $totalAmount = $validated['total_price']; // ✅ Use total_price directly

            // ✅ Update average purchase price for glasses
            if ($validated['item_type'] === 'glasses' && $item instanceof Glasses) {
                $item->updateAveragePurchasePrice($validated['quantity'], $unitPrice);
            }

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
                'unit_price' => $unitPrice, // ✅ Use calculated unit price
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
                    'unit_cost' => $unitPrice, // ✅ Use calculated unit price
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

                // Only create hospital expense for PAID amount
                // Due amount will be recorded as expense when payment is made later
                if ($paidAmount > 0) {
                    $purchaseCategory = HospitalExpenseCategory::firstOrCreate(
                        ['name' => 'Optics Purchase'],
                        ['is_active' => true]
                    );

                    $description = "Stock purchase: {$itemName} - {$validated['quantity']} pcs";
                    if ($dueAmount > 0) {
                        $description .= " (Paid: ৳" . number_format($paidAmount, 2) . " | Due: ৳" . number_format($dueAmount, 2) . ")";
                    } else {
                        $description .= " (Fully Paid)";
                    }

                    $transaction = HospitalAccount::addExpense(
                        $paidAmount, // Only paid amount
                        'Optics Purchase',
                        $description,
                        $purchaseCategory->id,
                        now()->toDateString()
                    );

                }
            } else {
                // Vendor না থাকলে সরাসরি expense (cash purchase)
                $purchaseCategory = HospitalExpenseCategory::firstOrCreate(
                    ['name' => 'Optics Purchase'],
                    ['is_active' => true]
                );

                HospitalAccount::addExpense(
                    $totalAmount,
                    'Optics Purchase',
                    "Stock purchase: {$itemName} - {$validated['quantity']} pcs (Cash)",
                    $purchaseCategory->id,
                    now()->toDateString()
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
        $query = OpticsSale::with(['patient', 'seller', 'payments'])
            ->withCount('items');

        // Search functionality
        if (request('search')) {
            $search = request('search');
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        // Date range filter
        if (request('from_date')) {
            $query->whereDate('created_at', '>=', request('from_date'));
        }

        if (request('to_date')) {
            $query->whereDate('created_at', '<=', request('to_date'));
        }

        // Status filter
        if (request('status')) {
            $query->where('status', request('status'));
        }

        // Check if requesting all records for print/export
        if (request('all') === 'true') {
            $sales = $query->latest()->get();
        } else {
            $sales = $query->latest()->paginate(20)->withQueryString();
        }

        // Calculate totals for the current query
        $totalQuery = clone $query;
        $totalSales = $totalQuery->sum('total_amount');
        $totalDue = $totalQuery->sum('due_amount');
        $salesCount = $totalQuery->count();

        return Inertia::render('OpticsCorner/Sales/Index', [
            'sales' => $sales,
            'totalSales' => $totalSales,
            'totalDue' => $totalDue,
            'salesCount' => $salesCount,
            'filters' => request()->only(['search', 'from_date', 'to_date', 'status']),
        ]);
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
            'customer_id' => 'nullable|exists:patients,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email|max:255',
            'items' => 'nullable|array',
            'items.*.type' => 'required|in:frame,lens,complete_glasses',
            'items.*.id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'glass_fitting_price' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'advance_payment' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,card,bkash,nagad,rocket',
            'transaction_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        // Validate that either items exist or fitting charge is provided
        if (empty($validated['items']) && empty($validated['glass_fitting_price'])) {
            return back()->with('error', 'Either items or fitting charge must be provided');
        }

        DB::beginTransaction();
        try {
            // Handle customer/patient information
            $patientId = null;
            $customerName = $validated['customer_name'];
            $customerPhone = $validated['customer_phone'] ?? null;
            $customerEmail = $validated['customer_email'] ?? null;

            // If customer_id is provided, use existing patient
            if ($validated['customer_id']) {
                $patient = Patient::find($validated['customer_id']);
                if ($patient) {
                    $patientId = $patient->id;
                    $customerName = $patient->name;
                    $customerPhone = $patient->phone;
                    $customerEmail = $patient->email;
                }
            }

            // Calculate items total
            $itemsTotal = 0;
            $saleDetails = [];

            // Process items only if they exist
            if (!empty($validated['items'])) {
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
                    $itemsTotal += $itemTotal;

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
                        'notes' => "Sale - " . ($product->name ?? $product->full_name) . " x{$item['quantity']}",
                        'user_id' => auth()->id(),
                    ]);

                    $saleDetails[] = ($product->name ?? $product->full_name) . " x{$item['quantity']}";
                }
            }

            // Calculate total amount
            $fittingCharge = $validated['glass_fitting_price'] ?? 0;
            $discount = $validated['discount'] ?? 0;
            $totalAmount = $itemsTotal + $fittingCharge - $discount;

            // Validate advance payment
            if ($validated['advance_payment'] > $totalAmount) {
                throw new \Exception('Advance payment cannot exceed total amount');
            }

            // Due calculation: Since we'll create payment record, advance will be in payment table
            // So initially due = total - 0, then after payment creation, it will be updated
            $dueAmount = $totalAmount - $validated['advance_payment'];

            // Create the sale record
            $sale = OpticsSale::create([
                'patient_id' => $patientId,
                'customer_name' => $customerName,
                'customer_phone' => $customerPhone,
                'customer_email' => $customerEmail,
                'seller_id' => auth()->id(),
                'glass_fitting_price' => $fittingCharge,
                'total_amount' => $totalAmount,
                'advance_payment' => $validated['advance_payment'],
                'due_amount' => $dueAmount,
                'status' => 'pending',
                'notes' => $validated['notes']
            ]);

            // Save sale items
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $model = match ($item['type']) {
                        'frame' => Glasses::class,
                        'lens' => LensType::class,
                        'complete_glasses' => CompleteGlasses::class,
                    };
                    $product = $model::find($item['id']);
                    $itemName = $product ? ($product->name ?? $product->full_name) : 'Unknown Item';

                    OpticsSaleItem::create([
                        'optics_sale_id' => $sale->id,
                        'item_type' => $item['type'],
                        'item_id' => $item['id'],
                        'item_name' => $itemName,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['price'],
                        'total_price' => $item['price'] * $item['quantity']
                    ]);
                }
            }

            // Create payment record if advance payment exists
            if ($validated['advance_payment'] > 0) {
                OpticsSalePayment::create([
                    'optics_sale_id' => $sale->id,
                    'amount' => $validated['advance_payment'],
                    'payment_method' => $validated['payment_method'],
                    'transaction_id' => $validated['transaction_id'] ?? null,
                    'notes' => 'Advance Payment',
                    'received_by' => auth()->id()
                ]);
            }

            // Record income in OpticsAccount (ONLY advance payment, not full amount)
            if ($validated['advance_payment'] > 0) {
                $description = "Advance Payment - Invoice: {$sale->invoice_number} | Customer: {$customerName}";
                if ($customerPhone) {
                    $description .= " ({$customerPhone})";
                }
                $description .= " | Total Amount: ৳" . number_format($totalAmount, 2);
                $description .= " | Advance: ৳" . number_format($validated['advance_payment'], 2);
                $description .= " | Due: ৳" . number_format($dueAmount, 2);
                if (!empty($saleDetails)) {
                    $description .= " | Items: " . implode(', ', $saleDetails);
                }
                if ($fittingCharge > 0) {
                    $description .= " | Fitting: ৳{$fittingCharge}";
                }
                if ($discount > 0) {
                    $description .= " | Discount: ৳{$discount}";
                }
                if ($validated['notes']) {
                    $description .= " | Notes: {$validated['notes']}";
                }

                // Add to Hospital Account with Optics Income category
                $opticsCategory = \App\Models\HospitalIncomeCategory::firstOrCreate(
                    ['name' => 'Optics Income'],
                    ['is_active' => true]
                );

                $hospitalTransaction = \App\Models\HospitalAccount::addIncome(
                    $validated['advance_payment'],
                    'Optics Income',
                    $description,
                    'optics_sales',
                    $sale->id,
                    now()->toDateString(),
                    $opticsCategory->id
                );

                // Update the created_at timestamp to match current time
                if ($hospitalTransaction) {
                    DB::table('hospital_transactions')
                        ->where('id', $hospitalTransaction->id)
                        ->update([
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                }
            }

            DB::commit();

            $responseMessage = "Sale completed successfully! Invoice: {$sale->invoice_number} | Total: ৳" . number_format($totalAmount, 2);
            if ($dueAmount > 0) {
                $responseMessage .= " | Due: ৳" . number_format($dueAmount, 2);
            }

            return redirect()->route('optics.sales')->with('success', $responseMessage);
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Sale failed: ' . $e->getMessage());
        }
    }

    public function editSale($saleId)
    {
        // Get the sale with items and payments
        $sale = OpticsSale::with(['items', 'payments', 'patient'])
            ->findOrFail($saleId);

        // Build sale items from OpticsSaleItem
        $saleItems = $sale->items->map(function ($item) {
            return [
                'id' => $item->item_id,
                'type' => $item->item_type,
                'name' => $item->item_name,
                'quantity' => $item->quantity,
                'price' => $item->unit_price,
                'total' => $item->total_price,
            ];
        })->toArray();

        // Calculate discount (items total + fitting - total amount)
        $itemsTotal = $sale->items->sum('total_price');
        $discount = $itemsTotal + $sale->glass_fitting_price - $sale->total_amount;

        // Get first payment details if exists
        $firstPayment = $sale->payments->first();

        $saleData = [
            'id' => $sale->id,
            'invoice_number' => $sale->invoice_number,
            'customer_id' => $sale->patient_id,
            'customer_name' => $sale->customer_name,
            'customer_phone' => $sale->customer_phone,
            'customer_email' => $sale->customer_email,
            'items' => $saleItems,
            'glass_fitting_price' => $sale->glass_fitting_price ?? 0,
            'discount' => $discount > 0 ? $discount : 0,
            'advance_payment' => $sale->advance_payment,
            'payment_method' => $firstPayment->payment_method ?? 'cash',
            'transaction_id' => $firstPayment->transaction_id ?? null,
            'notes' => $sale->notes,
            'total_amount' => $sale->total_amount,
            'due_amount' => $sale->due_amount,
            'status' => $sale->status,
            'created_at' => $sale->created_at,
        ];

        // Get available products for dropdown
        $frames = Glasses::active()->inStock()->get(['id', 'brand', 'model', 'sku', 'selling_price', 'stock_quantity']);
        $lensTypes = LensType::active()->inStock()->get(['id', 'name', 'price', 'stock_quantity']);
        $completeGlasses = CompleteGlasses::active()->inStock()->with('frame', 'lensType')->get();

        return Inertia::render('OpticsCorner/Sales/Edit', [
            'sale' => $saleData,
            'frames' => $frames,
            'lensTypes' => $lensTypes,
            'completeGlasses' => $completeGlasses
        ]);
    }

    public function updateSale(Request $request, $saleId)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:patients,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email|max:255',
            'items' => 'nullable|array',
            'items.*.type' => 'required|in:frame,lens,complete_glasses',
            'items.*.id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'glass_fitting_price' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'advance_payment' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,card,bkash,nagad,rocket',
            'transaction_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        // Validate that either items exist or fitting charge is provided
        if (empty($validated['items']) && empty($validated['glass_fitting_price'])) {
            return back()->with('error', 'Either items or fitting charge must be provided');
        }

        DB::beginTransaction();
        try {
            // Get the original sale
            $sale = OpticsSale::with(['items', 'payments'])->findOrFail($saleId);

            // Step 1: Revert old stock movements
            foreach ($sale->items as $saleItem) {
                $model = match ($saleItem->item_type) {
                    'frame' => Glasses::class,
                    'lens' => LensType::class,
                    'complete_glasses' => CompleteGlasses::class,
                };

                $product = $model::find($saleItem->item_id);
                if ($product) {
                    // Add back the quantity that was sold
                    $product->update([
                        'stock_quantity' => $product->stock_quantity + $saleItem->quantity
                    ]);
                }

                // Find and delete related stock movement
                StockMovement::where('movement_type', 'sale')
                    ->where('item_type', $saleItem->item_type === 'frame' ? 'glasses' : ($saleItem->item_type === 'lens' ? 'lens_types' : 'complete_glasses'))
                    ->where('item_id', $saleItem->item_id)
                    ->where('user_id', $sale->seller_id)
                    ->whereDate('created_at', $sale->created_at->toDateString())
                    ->delete();
            }

            // Step 2: Delete old sale items
            $sale->items()->delete();

            // Step 3: Reverse old income transactions
            $oldPaymentsTotal = $sale->payments->sum('amount');
            if ($oldPaymentsTotal > 0) {
                OpticsAccount::adjustAmount(
                    $oldPaymentsTotal,
                    'expense',
                    'Sale Update Reversal',
                    "Reversed payments for sale update - Invoice: {$sale->invoice_number}"
                );
            }

            // Step 4: Delete old payments
            $sale->payments()->delete();

            // Step 5: Handle customer/patient information
            $patientId = null;
            $customerName = $validated['customer_name'];
            $customerPhone = $validated['customer_phone'] ?? null;
            $customerEmail = $validated['customer_email'] ?? null;

            if ($validated['customer_id']) {
                $patient = Patient::find($validated['customer_id']);
                if ($patient) {
                    $patientId = $patient->id;
                    $customerName = $patient->name;
                    $customerPhone = $patient->phone;
                    $customerEmail = $patient->email;
                }
            }

            // Step 6: Process new items and update stock
            $itemsTotal = 0;
            $saleDetails = [];

            if (!empty($validated['items'])) {
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
                    $itemsTotal += $itemTotal;

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
                        'notes' => "Updated Sale - " . ($product->name ?? $product->full_name) . " x{$item['quantity']}",
                        'user_id' => auth()->id(),
                    ]);

                    $saleDetails[] = ($product->name ?? $product->full_name) . " x{$item['quantity']}";

                    // Create new sale item
                    OpticsSaleItem::create([
                        'optics_sale_id' => $sale->id,
                        'item_type' => $item['type'],
                        'item_id' => $item['id'],
                        'item_name' => $product->name ?? $product->full_name,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['price'],
                        'total_price' => $itemTotal
                    ]);
                }
            }

            // Step 7: Calculate new totals
            $fittingCharge = $validated['glass_fitting_price'] ?? 0;
            $discount = $validated['discount'] ?? 0;
            $totalAmount = $itemsTotal + $fittingCharge - $discount;

            if ($validated['advance_payment'] > $totalAmount) {
                throw new \Exception('Advance payment cannot exceed total amount');
            }

            // Due calculation: Since we'll create payment record, advance will be in payment table
            $dueAmount = $totalAmount - $validated['advance_payment'];

            // Step 8: Update sale record
            $sale->update([
                'patient_id' => $patientId,
                'customer_name' => $customerName,
                'customer_phone' => $customerPhone,
                'customer_email' => $customerEmail,
                'glass_fitting_price' => $fittingCharge,
                'total_amount' => $totalAmount,
                'advance_payment' => $validated['advance_payment'],
                'due_amount' => $dueAmount,
                'notes' => $validated['notes']
            ]);

            // Step 9: Delete old payment records (will be recreated if payment amount changed)
            OpticsSalePayment::where('optics_sale_id', $sale->id)->delete();

            // Step 10: Create new payment record if advance payment exists
            if ($validated['advance_payment'] > 0) {
                OpticsSalePayment::create([
                    'optics_sale_id' => $sale->id,
                    'amount' => $validated['advance_payment'],
                    'payment_method' => $validated['payment_method'],
                    'transaction_id' => $validated['transaction_id'] ?? null,
                    'notes' => 'Updated Advance Payment',
                    'received_by' => auth()->id()
                ]);
            }

            // Note: Do NOT add income here - sale edit doesn't create new income
            // Income was already recorded during initial sale creation
            // Only payment changes through updatePayment() should affect Hospital Account

            DB::commit();

            $responseMessage = "Sale updated successfully! Invoice: {$sale->invoice_number} | Total: ৳" . number_format($totalAmount, 2);
            if ($dueAmount > 0) {
                $responseMessage .= " | Due: ৳" . number_format($dueAmount, 2);
            }

            return redirect()->route('optics.sales')->with('success', $responseMessage);
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Sale update failed: ' . $e->getMessage());
        }
    }

    public function deleteSale($saleId)
    {
        DB::beginTransaction();
        try {
            // Get the sale with items and payments
            $sale = OpticsSale::with(['items', 'payments'])->findOrFail($saleId);

            // Step 1: Revert stock for all items
            foreach ($sale->items as $saleItem) {
                $model = match ($saleItem->item_type) {
                    'frame' => Glasses::class,
                    'lens' => LensType::class,
                    'complete_glasses' => CompleteGlasses::class,
                };

                $product = $model::find($saleItem->item_id);
                if ($product) {
                    // Add back the quantity that was sold
                    $product->update([
                        'stock_quantity' => $product->stock_quantity + $saleItem->quantity
                    ]);
                }

                // Find and delete related stock movements
                StockMovement::where('movement_type', 'sale')
                    ->where('item_type', $saleItem->item_type === 'frame' ? 'glasses' : ($saleItem->item_type === 'lens' ? 'lens_types' : 'complete_glasses'))
                    ->where('item_id', $saleItem->item_id)
                    ->where('user_id', $sale->seller_id)
                    ->whereDate('created_at', $sale->created_at->toDateString())
                    ->delete();
            }

            // Step 2: Reverse all income transactions (all payments)
            $totalPayments = $sale->payments->sum('amount');
            if ($totalPayments > 0) {
                OpticsAccount::adjustAmount(
                    $totalPayments,
                    'expense',
                    'Sale Deletion',
                    "Reversed sale - Invoice: {$sale->invoice_number} | Customer: {$sale->customer_name} | Total Refunded: ৳" . number_format($totalPayments, 2)
                );
            }

            // Step 3: Delete all payments
            $sale->payments()->delete();

            // Step 4: Delete all sale items
            $sale->items()->delete();

            // Step 5: Delete the sale record itself
            $invoiceNumber = $sale->invoice_number;
            $sale->delete();

            DB::commit();

            return redirect()->route('optics.sales')->with('success', "Sale deleted successfully! Invoice: {$invoiceNumber} | Stock has been restored and ৳" . number_format($totalPayments, 2) . " has been refunded.");
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->with('error', 'Sale deletion failed: ' . $e->getMessage());
        }
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
