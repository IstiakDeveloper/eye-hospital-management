<?php

namespace App\Http\Controllers\Optics;

use App\Http\Controllers\Controller;
use App\Models\Glasses;
use App\Models\CompleteGlasses;
use App\Models\LensType;
use App\Models\OpticsSale;
use App\Models\OpticsSaleItem;
use App\Models\OpticsSalePayment;
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
        // Today's sales summary from new OpticsSale model
        $todaySalesData = OpticsSale::whereDate('created_at', today())
            ->selectRaw('COUNT(*) as count, SUM(total_amount) as total, SUM(due_amount) as due')
            ->first();

        $todaySales = $todaySalesData->total ?? 0;
        $todaySalesCount = $todaySalesData->count ?? 0;
        $todayDue = $todaySalesData->due ?? 0;

        // Pending deliveries count
        $pendingReadyCount = OpticsSale::where('status', 'ready')->count();
        $pendingCount = OpticsSale::where('status', 'pending')->count();

        // This month's summary
        $monthSalesData = OpticsSale::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->selectRaw('COUNT(*) as count, SUM(total_amount) as total, SUM(due_amount) as due')
            ->first();

        $monthSales = $monthSalesData->total ?? 0;
        $monthDue = $monthSalesData->due ?? 0;

        // Yesterday comparison
        $yesterdaySales = OpticsSale::whereDate('created_at', Carbon::yesterday())
            ->sum('total_amount');

        // Recent sales from new OpticsSale model
        $recentSales = OpticsSale::with(['patient', 'seller'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($sale) {
                return [
                    'id' => $sale->id,
                    'invoice_number' => $sale->invoice_number,
                    'patient_name' => $sale->customer_name,
                    'patient_phone' => $sale->customer_phone ?? ($sale->patient ? $sale->patient->phone : 'N/A'),
                    'total_amount' => $sale->total_amount,
                    'due_amount' => $sale->due_amount,
                    'status' => $sale->status,
                    'created_at' => $sale->created_at
                ];
            });

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
            'todayDue' => $todayDue,
            'todaySalesCount' => $todaySalesCount,
            'salesGrowth' => $salesGrowth,
            'pendingCount' => $pendingCount,
            'pendingReadyCount' => $pendingReadyCount,

            // Monthly metrics
            'monthSales' => $monthSales,
            'monthDue' => $monthDue,
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
     * Search Customer by phone or name for POS
     */
    public function searchCustomer(Request $request)
    {
        $query = $request->get('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        // Search patients by phone or name
        $customers = Patient::where(function ($q) use ($query) {
            $q->where('phone', 'LIKE', "%{$query}%")
                ->orWhere('name', 'LIKE', "%{$query}%")
                ->orWhere('patient_id', 'LIKE', "%{$query}%");
        })
            ->limit(10)
            ->get(['id', 'patient_id', 'name', 'phone', 'email', 'address', 'gender'])
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                    'email' => $patient->email,
                    'address' => $patient->address,
                    'gender' => $patient->gender,
                    'display_name' => $patient->name . ' (' . $patient->phone . ')',
                    'total_visits' => $patient->total_visits ?? 0,
                ];
            });

        return response()->json($customers);
    }

    /**
     * Get Customer Details for POS
     */
    public function getCustomerDetails($id)
    {
        try {
            $patient = Patient::findOrFail($id);

            return response()->json([
                'success' => true,
                'customer' => [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                    'email' => $patient->email,
                    'address' => $patient->address,
                    'gender' => $patient->gender,
                    'age' => $patient->age,
                    'total_visits' => $patient->total_visits,
                    'last_visit_date' => $patient->last_visit_date?->format('d M Y'),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found'
            ], 404);
        }
    }

    /**
     * Updated POS System with recent customers
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

        // Recent customers (last 10 patients who made purchases)
        $recentCustomers = Patient::whereHas('visits', function ($query) {
            $query->whereDate('created_at', '>=', now()->subDays(30));
        })
            ->with(['visits' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->orderByDesc(function ($query) {
                $query->select('created_at')
                    ->from('patient_visits')
                    ->whereColumn('patient_visits.patient_id', 'patients.id')
                    ->orderBy('created_at', 'desc')
                    ->limit(1);
            })
            ->limit(10)
            ->get(['id', 'patient_id', 'name', 'phone', 'email'])
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                    'email' => $patient->email,
                    'display_name' => $patient->name . ' (' . $patient->phone . ')',
                    'last_visit' => optional($patient->visits->first())->created_at?->format('d M Y'),
                ];
            });

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
     * Process Sale with Items + Fitting Charge
     */
    public function processSale(Request $request)
    {
        $validated = $request->validate([
            'sale_date' => 'required|date|before_or_equal:today',
            'customer_id' => 'nullable|exists:patients,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email|max:255',
            'items' => 'nullable|array', // Allow empty items if fitting charge exists
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
            throw new \Exception('Either items or fitting charge must be provided');
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
            // Otherwise, just use the provided customer info without creating a patient

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
                    'notes' => "POS Sale - " . ($product->name ?? $product->full_name) . " x{$item['quantity']}",
                    'user_id' => auth()->user()->id,
                    'created_at' => $validated['sale_date'] . ' ' . now()->format('H:i:s'),
                    'updated_at' => $validated['sale_date'] . ' ' . now()->format('H:i:s'),
                ]);

                $saleDetails[] = ($product->name ?? $product->full_name) . " x{$item['quantity']}";
            }
            } // End of items processing

            // Calculate total amount
            $fittingCharge = $validated['glass_fitting_price'] ?? 0;
            $discount = $validated['discount'] ?? 0;
            $totalAmount = $itemsTotal + $fittingCharge - $discount;
            $dueAmount = $totalAmount - $validated['advance_payment'];

            // Validate advance payment
            if ($validated['advance_payment'] > $totalAmount) {
                throw new \Exception('Advance payment cannot exceed total amount');
            }

            // Create the sale record (invoice_number will be set in model)
            // Disable timestamps temporarily to set custom created_at based on sale_date
            $sale = new OpticsSale([
                'patient_id' => $patientId,
                'customer_name' => $customerName,
                'customer_phone' => $customerPhone,
                'customer_email' => $customerEmail,
                'seller_id' => auth()->user()->id,
                'glass_fitting_price' => $fittingCharge,
                'total_amount' => $totalAmount,
                'advance_payment' => $validated['advance_payment'],
                'due_amount' => $dueAmount,
                'status' => 'pending',
                'notes' => $validated['notes'],
            ]);

            // Set timestamps manually based on sale_date
            $saleDateTime = $validated['sale_date'] . ' ' . now()->format('H:i:s');
            $sale->created_at = $saleDateTime;
            $sale->updated_at = $saleDateTime;

            // Save without automatic timestamps
            $sale->timestamps = false;
            $sale->save();
            $sale->timestamps = true; // Re-enable timestamps for future updates

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
                    'total_price' => $item['price'] * $item['quantity'],
                    'created_at' => $validated['sale_date'] . ' ' . now()->format('H:i:s'),
                    'updated_at' => $validated['sale_date'] . ' ' . now()->format('H:i:s'),
                ]);
            }
            } // End of saving sale items

            // Create payment record if advance payment exists
            if ($validated['advance_payment'] > 0) {
                OpticsSalePayment::create([
                    'optics_sale_id' => $sale->id,
                    'amount' => $validated['advance_payment'],
                    'payment_method' => $validated['payment_method'],
                    'transaction_id' => $validated['transaction_id'] ?? null,
                    'notes' => 'Advance Payment',
                    'received_by' => auth()->user()->id,
                    'created_at' => $validated['sale_date'] . ' ' . now()->format('H:i:s'),
                    'updated_at' => $validated['sale_date'] . ' ' . now()->format('H:i:s'),
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

                // Create hospital transaction with sale_date
                $hospitalTransaction = \App\Models\HospitalAccount::addIncome(
                    $validated['advance_payment'], // Only advance amount
                    'Optics Income',
                    $description,
                    'optics_sales',
                    $sale->id,
                    $validated['sale_date'], // Use sale_date for transaction
                    $opticsCategory->id
                );

                // Update the created_at timestamp to match sale_date
                if ($hospitalTransaction) {
                    DB::table('hospital_transactions')
                        ->where('id', $hospitalTransaction->id)
                        ->update([
                            'created_at' => $saleDateTime,
                            'updated_at' => $saleDateTime
                        ]);
                }
            }

            DB::commit();

            $responseMessage = "Sale completed successfully! Invoice: {$sale->invoice_number} | Total: ৳" . number_format($totalAmount, 2);
            if ($dueAmount > 0) {
                $responseMessage .= " | Due: ৳" . number_format($dueAmount, 2);
            }

            return redirect()->back()->with('success', $responseMessage);
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
        $query = OpticsSale::with(['patient', 'seller', 'payments'])
            ->withCount('items');

        // Date filtering
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search by invoice number or patient name
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('invoice_number', 'LIKE', '%' . $request->search . '%')
                    ->orWhere('customer_name', 'LIKE', '%' . $request->search . '%')
                    ->orWhere('customer_phone', 'LIKE', '%' . $request->search . '%')
                    ->orWhereHas('patient', function($q) use ($request) {
                        $q->where('name', 'LIKE', '%' . $request->search . '%')
                          ->orWhere('phone', 'LIKE', '%' . $request->search . '%');
                    });
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Due filter
        if ($request->filled('due')) {
            if ($request->due === 'with_due') {
                $query->where('due_amount', '>', 0);
            } elseif ($request->due === 'no_due') {
                $query->where('due_amount', '<=', 0);
            }
        }

        $sales = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        // Get totals from the current query (before pagination)
        $totalQuery = clone $query;
        $totalSales = $totalQuery->sum('total_amount');
        $totalDue = $totalQuery->sum('due_amount');
        $salesCount = $totalQuery->count();

        return Inertia::render('OpticsSeller/SalesHistory', [
            'sales' => $sales,
            'totalSales' => $totalSales,
            'totalDue' => $totalDue,
            'salesCount' => $salesCount,
            'filters' => $request->only(['date_from', 'date_to', 'search', 'status', 'due']),
        ]);
    }

    /**
     * Export Sales History
     */
    public function exportSalesHistory(Request $request)
    {
        $query = OpticsSale::with(['patient', 'seller', 'items', 'payments']);

        // Apply same filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('invoice_number', 'LIKE', '%' . $request->search . '%')
                    ->orWhere('customer_name', 'LIKE', '%' . $request->search . '%')
                    ->orWhere('customer_phone', 'LIKE', '%' . $request->search . '%')
                    ->orWhereHas('patient', function($q) use ($request) {
                        $q->where('name', 'LIKE', '%' . $request->search . '%')
                          ->orWhere('phone', 'LIKE', '%' . $request->search . '%');
                    });
            });
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('due')) {
            if ($request->due === 'with_due') {
                $query->where('due_amount', '>', 0);
            } elseif ($request->due === 'no_due') {
                $query->where('due_amount', '<=', 0);
            }
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
        $html = view('exports.optics-sales-pdf', [
            'sales' => $sales,
            'dateFrom' => $request->date_from,
            'dateTo' => $request->date_to,
            'totalSales' => $sales->sum('total_amount'),
            'totalDue' => $sales->sum('due_amount')
        ])->render();

        return response($html)->header('Content-Type', 'text/html');
    }

    private function exportToExcel($sales, $request)
    {
        $filename = 'sales-history-' . date('Y-m-d') . '.csv';

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
                'Patient Phone',
                'Date',
                'Items',
                'Total Amount',
                'Advance Payment',
                'Due Amount',
                'Status',
                'Seller'
            ]);

            // CSV Data
            foreach ($sales as $sale) {
                fputcsv($file, [
                    $sale->invoice_number,
                    $sale->customer_name,
                    $sale->customer_phone ?? ($sale->patient ? $sale->patient->phone : 'N/A'),
                    $sale->created_at->format('d M Y h:i A'),
                    $sale->items->count() . ' items',
                    number_format($sale->total_amount, 2),
                    number_format($sale->advance_payment, 2),
                    number_format($sale->due_amount, 2),
                    ucfirst($sale->status),
                    $sale->seller->name ?? 'N/A'
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function exportToPrint($sales, $request)
    {
        return view('exports.optics-sales-print', [
            'sales' => $sales,
            'dateFrom' => $request->date_from,
            'dateTo' => $request->date_to,
            'totalSales' => $sales->sum('total_amount'),
            'totalDue' => $sales->sum('due_amount')
        ]);
    }

    /**
     * Sale Details
     */
    public function saleDetails(OpticsSale $sale)
    {
        $sale->load(['patient', 'seller', 'items', 'payments.receiver']);

        return Inertia::render('OpticsSeller/SaleDetails', [
            'sale' => [
                'id' => $sale->id,
                'invoice_number' => $sale->invoice_number,
                'customer_name' => $sale->customer_name,
                'customer_phone' => $sale->customer_phone,
                'customer_email' => $sale->customer_email,
                'patient' => $sale->patient,
                'seller' => $sale->seller,
                'glass_fitting_price' => $sale->glass_fitting_price,
                'items_total' => $sale->items_total,
                'total_amount' => $sale->total_amount,
                'advance_payment' => $sale->advance_payment,
                'due_amount' => $sale->due_amount,
                'total_paid' => $sale->total_paid,
                'remaining_due' => $sale->remaining_due,
                'status' => $sale->status,
                'notes' => $sale->notes,
                'created_at' => $sale->created_at,
                'items' => $sale->items->map(function($item) {
                    return [
                        'id' => $item->id,
                        'item_name' => $item->item_name,
                        'item_type' => $item->item_type,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'total_price' => $item->total_price
                    ];
                }),
                'payments' => $sale->payments->map(function($payment) {
                    return [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'payment_method' => $payment->payment_method,
                        'transaction_id' => $payment->transaction_id,
                        'notes' => $payment->notes,
                        'received_by' => $payment->receiver->name,
                        'created_at' => $payment->created_at
                    ];
                })
            ]
        ]);
    }

    /**
     * Update Payment - Add payment to a sale
     */
    public function updatePayment(Request $request, OpticsSale $sale)
    {
        // Refresh sale to get latest due_amount
        $sale->refresh();

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0|max:' . $sale->due_amount,
            'payment_method' => 'required|in:cash,card,bkash,nagad,rocket',
            'transaction_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            // Create new payment record
            OpticsSalePayment::create([
                'optics_sale_id' => $sale->id,
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'transaction_id' => $validated['transaction_id'] ?? null,
                'notes' => $validated['notes'] ?? 'Payment',
                'received_by' => auth()->user()->id
            ]);

            // Update sale due amount
            $newDueAmount = $sale->due_amount - $validated['amount'];
            $sale->update([
                'due_amount' => $newDueAmount
            ]);

            // Record income in OpticsAccount
            $description = "Due Payment - Invoice: {$sale->invoice_number} | Customer: {$sale->customer_name}";
            if ($sale->customer_phone) {
                $description .= " ({$sale->customer_phone})";
            }
            $description .= " | Payment Amount: ৳" . number_format($validated['amount'], 2);
            $description .= " | Remaining Due: ৳" . number_format($newDueAmount, 2);
            $description .= " | Payment Method: " . strtoupper($validated['payment_method']);
            if ($validated['transaction_id']) {
                $description .= " | TxnID: {$validated['transaction_id']}";
            }
            if ($validated['notes']) {
                $description .= " | Notes: {$validated['notes']}";
            }

            // Add to Hospital Account with Optics Income category
            $opticsCategory = \App\Models\HospitalIncomeCategory::firstOrCreate(
                ['name' => 'Optics Income'],
                ['is_active' => true]
            );

            // Create hospital transaction with today's date
            $paymentDate = now()->toDateString();
            $hospitalTransaction = \App\Models\HospitalAccount::addIncome(
                $validated['amount'],
                'Optics Income',
                $description,
                'optics_sales',
                $sale->id,
                $paymentDate, // Use today's date for payment
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

            DB::commit();

            return back()->with('success', 'Payment recorded successfully! Remaining due: ৳' . number_format($newDueAmount, 2));
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to record payment: ' . $e->getMessage());
        }
    }

    /**
     * Update the status of a sale
     */
    public function updateStatus(Request $request, OpticsSale $sale)
    {
        $request->validate([
            'status' => 'required|in:pending,ready,delivered'
        ]);

        // If updating to delivered, check if there's any due amount
        if ($request->status === 'delivered' && $sale->due_amount > 0) {
            return back()->with('error', 'Cannot deliver before full payment. Remaining due: ৳' . number_format($sale->due_amount, 2));
        }

        $sale->update([
            'status' => $request->status
        ]);

        return back()->with('success', 'Status updated successfully to ' . ucfirst($request->status));
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
