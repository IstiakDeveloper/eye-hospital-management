<?php

namespace App\Http\Controllers;

use App\Models\HospitalAccount;
use App\Models\HospitalExpenseCategory;
use App\Models\Medicine;
use App\Models\MedicineAccount;
use App\Models\MedicineSale;
use App\Models\MedicineSaleItem;
use App\Models\MedicineStock;
use App\Models\MedicineTransaction;
use App\Models\MedicineVendor;
use App\Models\MedicineVendorPayment;
use App\Models\MedicineVendorTransaction;
use App\Models\Patient;
use App\Models\StockAlert;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class MedicineCornerController extends Controller
{
    /**
     * Medicine Corner Dashboard
     */
    public function dashboard()
    {
        $stats = [
            'total_medicines' => Medicine::active()->count(),
            'medicines_in_stock' => Medicine::where('total_stock', '>', 0)->count(),
            'low_stock_medicines' => Medicine::whereHas('stockAlert', function ($query) {
                $query->whereRaw('medicines.total_stock <= stock_alerts.minimum_stock');
            })->count(),
            'total_stock_value' => $this->calculateTotalStockValue(),
            'account_balance' => MedicineAccount::getBalance(),
            'today_sales' => MedicineSale::whereDate('sale_date', today())->sum('total_amount'),
            'today_profit' => MedicineSale::whereDate('sale_date', today())->sum('total_profit'),
            'month_profit' => MedicineAccount::monthlyReport(now()->year, now()->month),

            // Vendor stats
            'total_vendors' => MedicineVendor::active()->count(),
            'total_vendor_due' => MedicineVendor::where('balance_type', 'due')->sum('current_balance'),
            'pending_purchases' => MedicineStock::where('payment_status', '!=', 'paid')->count(),
        ];

        // Low stock medicines
        $lowStockMedicines = Medicine::with('stockAlert')
            ->whereHas('stockAlert', function ($query) {
                $query->whereRaw('medicines.total_stock <= stock_alerts.minimum_stock');
            })
            ->limit(10)
            ->get();

        // Expiring medicines in next 30 days
        $expiringMedicines = MedicineStock::with(['medicine', 'vendor'])
            ->where('expiry_date', '>', now())
            ->where('expiry_date', '<=', now()->addDays(30))
            ->where('available_quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->limit(10)
            ->get();

        // Recent transactions - Fixed to use correct model
        $recentTransactions = MedicineTransaction::with('createdBy')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'transaction_no' => $transaction->transaction_no,
                    'type' => $transaction->type,
                    'amount' => $transaction->amount,
                    'category' => $transaction->category ?? 'General',
                    'description' => $transaction->description ?? '',
                    'transaction_date' => $transaction->transaction_date,
                    'created_by' => [
                        'name' => $transaction->createdBy->name ?? 'System',
                    ],
                ];
            });

        // Recent sales
        $recentSales = MedicineSale::with(['patient', 'soldBy'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('MedicineCorner/Dashboard', [
            'stats' => $stats,
            'lowStockMedicines' => $lowStockMedicines,
            'expiringMedicines' => $expiringMedicines,
            'recentTransactions' => $recentTransactions,
            'recentSales' => $recentSales,
        ]);
    }

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
        // Handle Export Requests
        if ($request->has('export')) {
            return $this->exportMedicines($request);
        }

        $query = Medicine::with([
            'stockAlert',
            'stocks' => function ($q) {
                $q->where('available_quantity', '>', 0)
                    ->where('expiry_date', '>', now())
                    ->orderBy('sale_price', 'asc')
                    ->limit(1);
            },
        ])->withCount('stocks');

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

        // Transform medicine data to include actual sale price from stock
        $medicines->getCollection()->transform(function ($medicine) {
            $actualSalePrice = $medicine->standard_sale_price;

            // Get the lowest sale price from available stock
            if ($medicine->stocks->isNotEmpty()) {
                $actualSalePrice = $medicine->stocks->first()->sale_price;
            }

            $medicine->actual_sale_price = $actualSalePrice;
            $medicine->has_stock = $medicine->total_stock > 0;
            $medicine->average_buy_price = $medicine->average_buy_price ?? 0; // ✅ Include average purchase price

            return $medicine;
        });

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
     * Export Medicines based on filters
     */
    private function exportMedicines(Request $request)
    {
        $query = Medicine::with([
            'stockAlert',
            'stocks' => function ($q) {
                $q->where('available_quantity', '>', 0)
                    ->where('expiry_date', '>', now());
            },
        ]);

        // Apply same filters as index
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('generic_name', 'like', "%{$search}%")
                    ->orWhere('manufacturer', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%");
            });
        }

        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        if ($manufacturer = $request->get('manufacturer')) {
            $query->where('manufacturer', 'like', "%{$manufacturer}%");
        }

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

        // Only apply active filter if explicitly set
        if ($request->has('active') && $request->get('active') !== null && $request->get('active') !== '') {
            $query->where('is_active', $request->boolean('active'));
        }

        // Get all medicines - no pagination for export
        $medicines = $query->orderBy('name')->get();

        // Log for debugging (remove in production)
        Log::info('Export Medicines', [
            'count' => $medicines->count(),
            'filters' => $request->only(['search', 'type', 'manufacturer', 'stock_status', 'active']),
            'export_format' => $request->get('export'),
        ]);

        $exportFormat = $request->get('export'); // 'excel' or 'print'

        if ($exportFormat === 'excel') {
            return $this->exportToExcel($medicines);
        } else {
            return $this->exportToPrint($medicines);
        }
    }

    /**
     * Export to Excel format (CSV)
     */
    private function exportToExcel($medicines)
    {
        $filename = 'medicines_stock_report_'.now()->format('Y-m-d_H-i-s').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];

        $callback = function () use ($medicines) {
            $file = fopen('php://output', 'w');

            // Add BOM for Excel UTF-8 support
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Headers
            fputcsv($file, [
                'Medicine Name',
                'Generic Name',
                'Type',
                'Manufacturer',
                'Unit',
                'Total Stock',
                'Standard Sale Price',
                'Average Buy Price',
                'Stock Value',
                'Status',
                'Minimum Stock',
                'Reorder Level',
                'Stock Status',
            ]);

            // Data rows
            foreach ($medicines as $medicine) {
                $stockValue = $medicine->total_stock * ($medicine->average_buy_price ?? 0);

                $stockStatus = 'Normal';
                if ($medicine->total_stock <= 0) {
                    $stockStatus = 'Out of Stock';
                } elseif ($medicine->stockAlert && $medicine->total_stock <= $medicine->stockAlert->minimum_stock) {
                    $stockStatus = 'Low Stock';
                } elseif ($medicine->stockAlert && $medicine->total_stock <= $medicine->stockAlert->reorder_level) {
                    $stockStatus = 'Reorder Level';
                }

                fputcsv($file, [
                    $medicine->name ?? '',
                    $medicine->generic_name ?? 'N/A',
                    $medicine->type ?? '',
                    $medicine->manufacturer ?? 'N/A',
                    $medicine->unit ?? 'piece',
                    $medicine->total_stock ?? 0,
                    number_format($medicine->standard_sale_price ?? 0, 2),
                    number_format($medicine->average_buy_price ?? 0, 2),
                    number_format($stockValue, 2),
                    $medicine->is_active ? 'Active' : 'Inactive',
                    $medicine->stockAlert ? $medicine->stockAlert->minimum_stock : 'N/A',
                    $medicine->stockAlert ? $medicine->stockAlert->reorder_level : 'N/A',
                    $stockStatus,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export to Print format (HTML)
     */
    private function exportToPrint($medicines)
    {
        $html = view('reports.medicines-print', [
            'medicines' => $medicines,
            'generatedAt' => now()->format('d M Y, h:i A'),
        ])->render();

        return response($html)->header('Content-Type', 'text/html');
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
                'stockAlert',
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
            ->get(['id', 'name', 'generic_name', 'standard_sale_price', 'average_buy_price', 'total_stock'])
            ->map(function ($medicine) {
                $latestStock = $medicine->stocks->first();

                return [
                    'id' => $medicine->id,
                    'name' => $medicine->name,
                    'generic_name' => $medicine->generic_name,
                    'standard_sale_price' => $medicine->standard_sale_price,
                    'average_buy_price' => $medicine->average_buy_price ?? 0,
                    'total_stock' => $medicine->total_stock,
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
     * Updated Add Stock Method - With Average Price & Hospital Account Integration
     */
    public function addStock(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vendor_id' => 'required|exists:medicine_vendors,id',
            'medicine_id' => 'required|exists:medicines,id',
            'batch_number' => 'nullable|string|max:255', // ✅ Optional
            'expiry_date' => 'nullable|date|after:today', // ✅ Optional
            'quantity' => 'required|integer|min:1',
            'total_price' => 'required|numeric|min:0',
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

        // ✅ Calculate unit price from total price
        $unitPrice = $request->total_price / $request->quantity;

        DB::beginTransaction();
        try {
            $vendor = MedicineVendor::findOrFail($request->vendor_id);
            $medicine = Medicine::findOrFail($request->medicine_id);
            $totalPurchaseAmount = $request->total_price;
            $paidAmount = $request->paid_amount ?? 0;
            $dueAmount = $totalPurchaseAmount - $paidAmount;

            // ✅ Auto-generate batch number if not provided
            $batchNumber = $request->batch_number ?: 'AUTO-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -6));

            // ✅ Set default expiry date (2 years from now) if not provided
            $expiryDate = $request->expiry_date ?: now()->addYears(2)->toDateString();

            // Check credit limit
            if ($dueAmount > 0 && ($vendor->current_balance + $dueAmount) > $vendor->credit_limit && $vendor->credit_limit > 0) {
                throw new \Exception("Credit limit exceeded for {$vendor->name}. Current due: ৳{$vendor->current_balance}, Credit limit: ৳{$vendor->credit_limit}");
            }

            // ✅ Update average purchase price BEFORE adding new stock
            $medicine->updateAveragePurchasePrice($request->quantity, $unitPrice);

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
                'description' => "Medicine purchase - {$medicine->name} (Batch: {$batchNumber})",
                'transaction_date' => now()->toDateString(),
                'due_date' => now()->addDays($vendor->payment_terms_days)->toDateString(),
                'created_by' => auth()->id(),
            ]);

            // Create medicine stock with calculated unit price
            $stock = MedicineStock::create([
                'medicine_id' => $request->medicine_id,
                'vendor_id' => $vendor->id,
                'batch_number' => $batchNumber, // ✅ Use auto-generated or provided batch
                'expiry_date' => $expiryDate, // ✅ Use default or provided expiry
                'quantity' => $request->quantity,
                'available_quantity' => $request->quantity,
                'buy_price' => $unitPrice, // ✅ Use calculated unit price
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
                'unit_price' => $unitPrice, // ✅ Use calculated unit price
                'total_amount' => $totalPurchaseAmount,
                'vendor_transaction_id' => $vendorTransaction->id,
                'reason' => 'Stock purchase - Batch: '.$batchNumber,
                'created_by' => auth()->id(),
            ]);

            // Update vendor transaction reference
            $vendorTransaction->update(['reference_id' => $stock->id]);

            // ✅ Handle immediate payment - Use Hospital Account instead of Medicine Account
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

                // ✅ Deduct from Hospital Account (not Medicine Account)
                $purchaseCategory = \App\Models\HospitalExpenseCategory::firstOrCreate(
                    ['name' => 'Medicine Purchase'],
                    ['is_active' => true]
                );

                \App\Models\HospitalAccount::addExpense(
                    $paidAmount,
                    'Medicine Purchase',
                    "Medicine purchase payment to {$vendor->name} for {$medicine->name} (Batch: {$batchNumber})",
                    $purchaseCategory->id,
                    now()->toDateString()
                );
            }

            // Update vendor balance
            $vendor->updateBalance();

            // Update medicine totals
            $medicine->updateTotalStock();
            // ✅ No need to call updateAverageBuyPrice() again - already updated above

            DB::commit();

            $message = "Stock added successfully! Total: ৳{$totalPurchaseAmount}";
            if ($paidAmount > 0) {
                $message .= ", Paid: ৳{$paidAmount} (from Hospital Account)";
            }
            if ($dueAmount > 0) {
                $message .= ", Due to {$vendor->name}: ৳{$dueAmount}";
            }
            $message .= ' | New Average Price: ৳'.number_format($medicine->fresh()->average_buy_price, 2);

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollback();

            return redirect()->back()->with('error', 'Failed to add stock: '.$e->getMessage());
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

            return redirect()->back()->with('error', 'Failed to add medicine: '.$e->getMessage());
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

            return redirect()->back()->with('error', 'Failed to adjust stock: '.$e->getMessage());
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
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $medicine->update($request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Medicine updated successfully',
                'medicine' => $medicine,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update medicine: '.$e->getMessage(),
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
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $medicine->stockAlert()->updateOrCreate(
                ['medicine_id' => $medicine->id],
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock alert settings updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update stock alert: '.$e->getMessage(),
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
            'message' => 'Export functionality to be implemented',
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
            'items.medicineStock.medicine',
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
            'items.medicineStock.medicine',
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
     * Update Sale - 100% Accurate Version Following MedicineSellerDashboardController
     */
    public function updateSale(Request $request, MedicineSale $sale)
    {
        // Log incoming data for debugging
        \Log::info('Update Sale Request Data:', [
            'sale_id' => $sale->id,
            'items_count' => count($request->get('items', [])),
            'patient_id' => $request->get('patient_id'),
            'paid_amount' => $request->get('paid_amount'),
        ]);

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
            \Log::error('Validation Failed:', $validator->errors()->toArray());

            return redirect()->back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            // Step 1: Store original values for accounting adjustment
            $originalTotalAmount = $sale->total_amount;
            $originalInvoiceNumber = $sale->invoice_number;

            // Step 2: Store original items for stock adjustment
            $originalItems = $sale->items()->with('medicineStock.medicine')->get();

            // Step 3: Restore original stock quantities and delete stock transactions
            foreach ($originalItems as $originalItem) {
                // Restore stock
                $originalItem->medicineStock->available_quantity += $originalItem->quantity;
                $originalItem->medicineStock->save();
                $originalItem->medicineStock->medicine->updateTotalStock();

                // Delete old stock transaction
                StockTransaction::where('reference_type', 'medicine_sale')
                    ->where('reference_id', $sale->id)
                    ->where('medicine_stock_id', $originalItem->medicine_stock_id)
                    ->delete();
            }

            // Step 4: Delete original items
            $sale->items()->delete();

            // Step 5: Process new items and calculate new totals
            $subtotal = 0;
            $totalProfit = 0;
            $medicineNames = [];

            foreach ($request->items as $item) {
                $stock = MedicineStock::with('medicine')->findOrFail($item['medicine_stock_id']);

                // Check stock availability
                if ($stock->available_quantity < $item['quantity']) {
                    throw new \Exception("Insufficient stock for {$stock->medicine->name}. Available: {$stock->available_quantity}");
                }

                $lineTotal = $item['quantity'] * $item['unit_price'];
                $lineProfit = ($item['unit_price'] - $stock->buy_price) * $item['quantity'];

                $subtotal += $lineTotal;
                $totalProfit += $lineProfit;
                $medicineNames[] = $stock->medicine->name;

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

                // Create new stock transaction
                StockTransaction::create([
                    'medicine_stock_id' => $stock->id,
                    'type' => 'sale',
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_amount' => $lineTotal,
                    'reference_type' => 'medicine_sale',
                    'reference_id' => $sale->id,
                    'reason' => 'Medicine sale update - Invoice: '.$originalInvoiceNumber,
                    'created_by' => auth()->id(),
                ]);

                // Update medicine total stock
                $stock->medicine->updateTotalStock();
            }

            // Step 6: Calculate final amounts
            $discount = $request->discount ?? 0;
            $tax = $request->tax ?? 0;
            $totalAmount = $subtotal - $discount + $tax;
            $dueAmount = max(0, $totalAmount - $request->paid_amount);

            // Step 7: Update sale record
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

            // Step 8: Update MedicineAccount
            // First reverse the old transaction by manually decrementing
            if ($originalTotalAmount > 0) {
                $medicineAccount = MedicineAccount::firstOrCreate([]);
                $medicineAccount->decrement('balance', $originalTotalAmount);

                // Create reversal transaction record
                MedicineTransaction::create([
                    'transaction_no' => 'MR-'.date('Ymd').'-'.str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                    'type' => 'expense',
                    'amount' => $originalTotalAmount,
                    'category' => 'sale_reversal',
                    'description' => "Sale update reversal - Invoice: {$originalInvoiceNumber} | Original Amount: ৳".number_format($originalTotalAmount, 2),
                    'reference_type' => 'medicine_sales',
                    'reference_id' => $sale->id,
                    'transaction_date' => now()->toDateString(),
                    'created_by' => auth()->id(),
                ]);
            }

            // Then add the new income
            $customerInfo = $request->patient_id ?
                "Patient ID: {$request->patient_id}" :
                ($request->customer_name ? "Customer: {$request->customer_name}" : 'Walk-in customer');

            $medicineList = implode(', ', array_slice($medicineNames, 0, 3));
            if (count($medicineNames) > 3) {
                $medicineList .= ' + '.(count($medicineNames) - 3).' more';
            }

            // Note: When updating sale, we don't add new income to Hospital Account
            // Income was already added during initial sale creation
            // Only payment changes through updatePayment method should affect Hospital Account            DB::commit();

            return redirect()->route('medicine-corner.sale-details', $sale->id)
                ->with('success', "Sale updated successfully! Invoice: {$originalInvoiceNumber} | New Total: ৳".number_format($totalAmount, 2).' | Medicine Account Updated');
        } catch (\Exception $e) {
            DB::rollback();

            return redirect()->back()->with('error', 'Failed to update sale: '.$e->getMessage());
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
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $oldPaidAmount = $sale->paid_amount;
            $newPaidAmount = $request->paid_amount;
            $paymentDifference = $newPaidAmount - $oldPaidAmount;

            $dueAmount = max(0, $sale->total_amount - $newPaidAmount);
            $paymentStatus = $dueAmount > 0 ? 'partial' : 'paid';

            $sale->update([
                'paid_amount' => $newPaidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'payment_method' => $request->payment_method,
                'payment_notes' => $request->payment_notes,
                'updated_by' => auth()->id(),
            ]);

            // If additional payment was made, add to Hospital Account
            if ($paymentDifference > 0) {
                $medicineCategory = \App\Models\HospitalIncomeCategory::firstOrCreate(
                    ['name' => 'Medicine Income'],
                    ['is_active' => true]
                );

                \App\Models\HospitalAccount::addIncome(
                    $paymentDifference,
                    'Medicine Income',
                    "Medicine due payment - Invoice: {$sale->invoice_number} | Additional payment: ৳{$paymentDifference}",
                    'medicine_sales',
                    $sale->id,
                    null,
                    $medicineCategory->id
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment updated successfully',
                'sale' => $sale->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete Sale - 100% Accurate Version with ALL Account Updates
     * This properly reverses:
     * 1. Stock quantities
     * 2. Medicine Account balance
     * 3. Hospital Account balance
     * 4. All related transactions
     */
    public function deleteSale(MedicineSale $sale)
    {
        DB::beginTransaction();
        try {
            // Store values for logging
            $invoiceNumber = $sale->invoice_number;
            $totalAmount = $sale->total_amount;
            $paidAmount = $sale->paid_amount;

            // Step 1: Restore stock quantities
            foreach ($sale->items as $item) {
                // Restore available quantity
                $item->medicineStock->available_quantity += $item->quantity;
                $item->medicineStock->save();

                // Update medicine total stock
                $item->medicineStock->medicine->updateTotalStock();

                // Create reverse stock transaction using 'return' type (valid ENUM value)
                StockTransaction::create([
                    'medicine_stock_id' => $item->medicine_stock_id,
                    'type' => 'return',
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total_amount' => $item->quantity * $item->unit_price,
                    'reference_type' => 'medicine_sale_cancellation',
                    'reference_id' => $sale->id,
                    'reason' => 'Sale deleted - Invoice: '.$invoiceNumber,
                    'created_by' => auth()->id(),
                ]);

                // Delete original sale stock transaction
                StockTransaction::where('reference_type', 'medicine_sale')
                    ->where('reference_id', $sale->id)
                    ->where('medicine_stock_id', $item->medicine_stock_id)
                    ->where('type', 'sale')
                    ->delete();
            }

            // Step 2: Reverse MedicineAccount transaction
            if ($totalAmount > 0) {
                $medicineAccount = MedicineAccount::firstOrCreate([]);
                $medicineAccount->decrement('balance', $totalAmount);

                // Create cancellation transaction record
                MedicineTransaction::create([
                    'transaction_no' => 'MC-'.date('Ymd').'-'.str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
                    'type' => 'expense',
                    'amount' => $totalAmount,
                    'category' => 'sale_cancellation',
                    'description' => "Sale deleted - Invoice: {$invoiceNumber} | Amount: ৳".number_format($totalAmount, 2).' | Deleted by: '.auth()->user()->name,
                    'reference_type' => 'medicine_sales',
                    'reference_id' => $sale->id,
                    'transaction_date' => now()->toDateString(),
                    'created_by' => auth()->id(),
                ]);
            }

            // Step 3: Reverse Hospital Account transaction
            // CRITICAL: Sale creates income in Hospital Account, so deletion must reverse it
            if ($totalAmount > 0) {
                HospitalAccount::addExpense(
                    $totalAmount,
                    'Medicine Sale Deletion',
                    "Reversed medicine sale - Invoice: {$invoiceNumber} | Customer: ".($sale->customer_name ?? 'Walk-in').' | Amount: ৳'.number_format($totalAmount, 2).' | Deleted by: '.auth()->user()->name
                );
            }

            // Step 4: Delete sale items
            $sale->items()->delete();

            // Step 5: Delete the sale record
            $sale->delete();

            DB::commit();

            return redirect()->route('medicine-corner.sales')->with('success',
                "✅ Sale Deleted Successfully!\n\n".
                "Invoice: {$invoiceNumber}\n".
                'Amount: ৳'.number_format($totalAmount, 2)."\n\n".
                "✓ Stock restored to inventory\n".
                '✓ Medicine Account reversed: ৳'.number_format($totalAmount, 2)."\n".
                '✓ Hospital Account reversed: ৳'.number_format($totalAmount, 2)
            );
        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Delete Sale Error: '.$e->getMessage(), [
                'sale_id' => $sale->id,
                'invoice' => $sale->invoice_number ?? 'N/A',
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error',
                '❌ Failed to delete sale: '.$e->getMessage()
            );
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
                'errors' => $validator->errors(),
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
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bulk action failed: '.$e->getMessage(),
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
            ],
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
                            }),
                        ];
                    })->values(),
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
            },
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

            // Check hospital account balance
            $hospitalBalance = HospitalAccount::getBalance();
            if ($hospitalBalance < $request->amount) {
                throw new \Exception("Insufficient balance in Hospital Account. Available: ৳{$hospitalBalance}, Required: ৳{$request->amount}");
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
            if (! empty($request->allocated_transactions)) {
                $remainingAmount = $request->amount;

                foreach ($request->allocated_transactions as $transactionId) {
                    if ($remainingAmount <= 0) {
                        break;
                    }

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
                now()->toDateString()
            );

            // Update vendor balance
            $vendor->updateBalance();

            DB::commit();

            return redirect()->back()->with('success', "Payment of ৳{$request->amount} made successfully to {$vendor->name}");
        } catch (\Exception $e) {
            DB::rollback();

            return redirect()->back()->with('error', 'Failed to make payment: '.$e->getMessage());
        }
    }

    /**
     * Get Vendor Purchase History (AJAX)
     */
    public function getVendorPurchaseHistory(Request $request)
    {
        $vendorId = $request->get('vendor_id');

        if (! $vendorId) {
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
            ],
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
            'reference_id' => $stock->id,
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
                'reference_id' => $stock->id,
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
                $hospitalBalance = HospitalAccount::getBalance();
                if ($hospitalBalance < $paymentDifference) {
                    throw new \Exception("Insufficient balance in Hospital Account. Available: ৳{$hospitalBalance}, Required: ৳{$paymentDifference}");
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
                'reason' => 'Stock purchase updated - Batch: '.$request->batch_number,
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

                    // Add expense to Hospital Account
                    $purchaseCategory = HospitalExpenseCategory::firstOrCreate(
                        ['name' => 'Medicine Purchase'],
                        ['is_active' => true]
                    );

                    HospitalAccount::addExpense(
                        $paymentDifference,
                        'Medicine Purchase',
                        "Additional payment to {$newVendor->name} for {$newMedicine->name} (Stock Update)",
                        $purchaseCategory->id,
                        now()->toDateString()
                    );
                } else {
                    // Payment was reduced - No refund to Medicine Account, just log
                    // The reduced payment stays with vendor transaction only
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

            return redirect()->back()->with('error', 'Failed to update stock: '.$e->getMessage());
        }
    }

    public function getStockForEdit($id)
    {
        try {
            $stock = MedicineStock::with([
                'medicine',
                'vendor',
                'vendorTransaction',
                'addedBy',
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
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Stock not found',
            ], 404);
        }
    }
}
