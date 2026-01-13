<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use App\Models\AdvanceHouseRent;
use App\Models\AdvanceHouseRentDeduction;
use App\Models\HospitalAccount;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdvanceHouseRentController extends Controller
{
    // Dashboard - Show advance rent overview
    public function index(Request $request): Response
    {
        $floorType = $request->get('floor_type', '2_3_floor'); // Default to 2nd & 3rd floor

        $activeAdvances = AdvanceHouseRent::active()
            ->where('floor_type', $floorType)
            ->with('createdBy')
            ->orderBy('payment_date', 'desc')
            ->get();

        $exhaustedAdvances = AdvanceHouseRent::where('status', 'exhausted')
            ->where('floor_type', $floorType)
            ->with('createdBy')
            ->orderBy('payment_date', 'desc')
            ->take(5)
            ->get();

        $recentDeductions = AdvanceHouseRentDeduction::with(['advanceHouseRent', 'deductedBy'])
            ->whereHas('advanceHouseRent', function ($q) use ($floorType) {
                $q->where('floor_type', $floorType);
            })
            ->orderBy('deduction_date', 'desc')
            ->take(10)
            ->get();

        $totalAdvanceBalance = AdvanceHouseRent::getActiveBalance($floorType);
        $totalAdvanceGiven = AdvanceHouseRent::where('floor_type', $floorType)->sum('advance_amount');
        $totalUsed = AdvanceHouseRent::where('floor_type', $floorType)->sum('used_amount');

        // Monthly deduction summary
        $currentYear = now()->year;
        $monthlyDeductions = AdvanceHouseRentDeduction::where('year', $currentYear)
            ->whereHas('advanceHouseRent', function ($q) use ($floorType) {
                $q->where('floor_type', $floorType);
            })
            ->selectRaw('month, SUM(amount) as total')
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get()
            ->pluck('total', 'month');

        return Inertia::render('HospitalAccount/AdvanceRent/Dashboard', [
            'activeAdvances' => $activeAdvances,
            'exhaustedAdvances' => $exhaustedAdvances,
            'recentDeductions' => $recentDeductions,
            'totalAdvanceBalance' => $totalAdvanceBalance,
            'totalAdvanceGiven' => $totalAdvanceGiven,
            'totalUsed' => $totalUsed,
            'monthlyDeductions' => $monthlyDeductions,
            'floorType' => $floorType,
        ]);
    }

    // Store new advance rent payment
    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
            'floor_type' => 'required|in:2_3_floor,4_floor',
        ]);

        $hospitalBalance = HospitalAccount::getBalance();
        if ($request->amount > $hospitalBalance) {
            return back()->withErrors(['amount' => 'Insufficient hospital account balance!']);
        }

        DB::beginTransaction();
        try {
            $advanceRent = HospitalAccount::addAdvanceRent(
                amount: $request->amount,
                description: $request->description,
                date: $request->date,
                floorType: $request->floor_type
            );

            DB::commit();

            $floorLabel = $request->floor_type === '4_floor' ? '4th Floor' : '2nd & 3rd Floor';

            return back()->with('success', "Advance house rent payment of ৳{$request->amount} for {$floorLabel} recorded successfully! Payment No: {$advanceRent->payment_number}");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to record advance rent: '.$e->getMessage()]);
        }
    }

    // Deduct monthly rent from advance
    public function deduct(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2100',
            'notes' => 'nullable|string|max:500',
            'floor_type' => 'required|in:2_3_floor,4_floor',
        ]);

        // Find active advance with sufficient balance for specific floor
        $advanceRent = AdvanceHouseRent::where('status', 'active')
            ->where('floor_type', $request->floor_type)
            ->where('remaining_amount', '>=', $request->amount)
            ->orderBy('payment_date', 'asc') // Use oldest first (FIFO)
            ->first();

        if (! $advanceRent) {
            $floorLabel = $request->floor_type === '4_floor' ? '4th Floor' : '2nd & 3rd Floor';

            return back()->withErrors(['amount' => "No active advance found for {$floorLabel} with sufficient balance!"]);
        }

        if ($advanceRent->status !== 'active') {
            return back()->withErrors(['error' => 'This advance rent is not active!']);
        }

        if ($request->amount > $advanceRent->remaining_amount) {
            return back()->withErrors(['amount' => 'Deduction amount exceeds remaining advance balance!']);
        }

        // Check if already deducted for this month/year and floor type
        $existingDeduction = AdvanceHouseRentDeduction::where('month', $request->month)
            ->where('year', $request->year)
            ->whereHas('advanceHouseRent', function ($q) use ($request) {
                $q->where('floor_type', $request->floor_type);
            })
            ->first();

        if ($existingDeduction) {
            $floorLabel = $request->floor_type === '4_floor' ? '4th Floor' : '2nd & 3rd Floor';

            return back()->withErrors(['error' => "Rent for {$floorLabel} in this month has already been deducted!"]);
        }

        DB::beginTransaction();
        try {
            $deduction = HospitalAccount::deductMonthlyRent(
                advanceRent: $advanceRent,
                amount: $request->amount,
                month: $request->month,
                year: $request->year,
                notes: $request->notes
            );

            DB::commit();

            $monthName = date('F', mktime(0, 0, 0, $request->month, 1));
            $floorLabel = $request->floor_type === '4_floor' ? '4th Floor' : '2nd & 3rd Floor';

            return back()->with('success', "{$floorLabel} house rent of ৳{$request->amount} deducted for {$monthName} {$request->year}. Deduction No: {$deduction->deduction_number}");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Failed to deduct rent: '.$e->getMessage()]);
        }
    }

    // History - All advances with deductions in table format
    public function history(Request $request): Response
    {
        $year = $request->filled('year') ? $request->year : now()->year;
        $month = $request->filled('month') ? $request->month : null;
        $floorType = $request->get('floor_type', '2_3_floor');

        // Get all advances for the period
        $advancesQuery = AdvanceHouseRent::with('createdBy')
            ->where('floor_type', $floorType)
            ->whereYear('payment_date', $year);

        if ($month) {
            $advancesQuery->whereMonth('payment_date', $month);
        }

        $advances = $advancesQuery->orderBy('payment_date', 'asc')->get();

        // Get all deductions for the period
        $deductionsQuery = AdvanceHouseRentDeduction::with(['advanceHouseRent', 'deductedBy'])
            ->whereHas('advanceHouseRent', function ($q) use ($floorType) {
                $q->where('floor_type', $floorType);
            })
            ->where('year', $year);

        if ($month) {
            $deductionsQuery->where('month', $month);
        }

        $deductions = $deductionsQuery->orderBy('deduction_date', 'asc')->get();

        // Calculate previous balance (before the selected period)
        $previousAdvances = AdvanceHouseRent::where('floor_type', $floorType)
            ->where(function ($q) use ($year, $month) {
                if ($month) {
                    $q->where(function ($query) use ($year, $month) {
                        $query->whereYear('payment_date', '<', $year)
                            ->orWhere(function ($q2) use ($year, $month) {
                                $q2->whereYear('payment_date', $year)
                                    ->whereMonth('payment_date', '<', $month);
                            });
                    });
                } else {
                    $q->whereYear('payment_date', '<', $year);
                }
            })->sum('advance_amount');

        $previousDeductions = AdvanceHouseRentDeduction::whereHas('advanceHouseRent', function ($q) use ($floorType) {
            $q->where('floor_type', $floorType);
        })
            ->where(function ($q) use ($year, $month) {
                if ($month) {
                    $q->where(function ($query) use ($year, $month) {
                        $query->where('year', '<', $year)
                            ->orWhere(function ($q2) use ($year, $month) {
                                $q2->where('year', $year)
                                    ->where('month', '<', $month);
                            });
                    });
                } else {
                    $q->where('year', '<', $year);
                }
            })->sum('amount');

        $previousBalance = $previousAdvances - $previousDeductions;

        // Build transaction array with date grouping
        $transactions = [];
        $runningBalance = $previousBalance;

        // Merge and sort all transactions
        $allTransactions = collect();

        foreach ($advances as $advance) {
            $allTransactions->push([
                'date' => $advance->payment_date,
                'description' => $advance->description,
                'payment_number' => $advance->payment_number,
                'credit' => $advance->advance_amount,
                'debit' => 0,
                'type' => 'advance',
            ]);
        }

        foreach ($deductions as $deduction) {
            $monthName = date('F', mktime(0, 0, 0, $deduction->month, 1));
            $allTransactions->push([
                'date' => $deduction->deduction_date,
                'description' => "Rent for {$monthName} {$deduction->year}".($deduction->notes ? " - {$deduction->notes}" : ''),
                'payment_number' => $deduction->deduction_number,
                'credit' => 0,
                'debit' => $deduction->amount,
                'type' => 'deduction',
            ]);
        }

        // Group by date and calculate totals
        $groupedByDate = $allTransactions->groupBy('date')->map(function ($items, $date) use (&$runningBalance) {
            $totalCredit = $items->sum('credit');
            $totalDebit = $items->sum('debit');
            $runningBalance += $totalCredit - $totalDebit;

            return [
                'date' => $date,
                'credit' => $totalCredit,
                'debit' => $totalDebit,
                'balance' => $runningBalance,
                'details' => $items->map(function ($item) {
                    return [
                        'description' => $item['description'],
                        'payment_number' => $item['payment_number'],
                        'credit' => $item['credit'],
                        'debit' => $item['debit'],
                        'type' => $item['type'],
                    ];
                })->toArray(),
            ];
        })->sortKeys()->values()->toArray();

        $transactions = $groupedByDate;

        // Get available years for filter
        $years = AdvanceHouseRent::selectRaw('YEAR(payment_date) as year')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year');

        if ($years->isEmpty()) {
            $years = collect([now()->year]);
        }

        return Inertia::render('HospitalAccount/AdvanceRent/History', [
            'transactions' => $transactions,
            'previousBalance' => $previousBalance,
            'filters' => [
                'year' => $year,
                'month' => $month,
                'floor_type' => $floorType,
            ],
            'years' => $years,
        ]);
    }

    // Deduction history by month/year
    public function deductions(Request $request): Response
    {
        $query = AdvanceHouseRentDeduction::with(['advanceHouseRent', 'deductedBy']);

        if ($request->filled('month')) {
            $query->where('month', $request->month);
        }

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        $deductions = $query->orderBy('deduction_date', 'desc')
            ->paginate(20)
            ->withQueryString();

        $years = AdvanceHouseRentDeduction::selectRaw('DISTINCT year')
            ->orderBy('year', 'desc')
            ->pluck('year');

        $monthlyTotals = AdvanceHouseRentDeduction::when($request->filled('year'), function ($q) use ($request) {
            $q->where('year', $request->year);
        })
            ->selectRaw('month, year, SUM(amount) as total')
            ->groupBy('month', 'year')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        return Inertia::render('HospitalAccount/AdvanceRent/Deductions', [
            'deductions' => $deductions,
            'years' => $years,
            'monthlyTotals' => $monthlyTotals,
            'filters' => $request->only(['month', 'year']),
        ]);
    }

    // Export to PDF or Excel
    public function export(Request $request)
    {
        $year = $request->filled('year') ? $request->year : now()->year;
        $month = $request->filled('month') ? $request->month : null;
        $floorType = $request->get('floor_type', '2_3_floor');
        $format = $request->get('format', 'pdf');

        // Get data (same logic as history)
        $advancesQuery = AdvanceHouseRent::where('floor_type', $floorType)->whereYear('payment_date', $year);
        if ($month) {
            $advancesQuery->whereMonth('payment_date', $month);
        }
        $advances = $advancesQuery->orderBy('payment_date', 'asc')->get();

        $deductionsQuery = AdvanceHouseRentDeduction::whereHas('advanceHouseRent', function ($q) use ($floorType) {
            $q->where('floor_type', $floorType);
        })->where('year', $year);
        if ($month) {
            $deductionsQuery->where('month', $month);
        }
        $deductions = $deductionsQuery->orderBy('deduction_date', 'asc')->get();

        // Calculate previous balance
        $previousAdvances = AdvanceHouseRent::where('floor_type', $floorType)->where(function ($q) use ($year, $month) {
            if ($month) {
                $q->where(function ($query) use ($year, $month) {
                    $query->whereYear('payment_date', '<', $year)
                        ->orWhere(function ($q2) use ($year, $month) {
                            $q2->whereYear('payment_date', $year)->whereMonth('payment_date', '<', $month);
                        });
                });
            } else {
                $q->whereYear('payment_date', '<', $year);
            }
        })->sum('advance_amount');

        $previousDeductions = AdvanceHouseRentDeduction::whereHas('advanceHouseRent', function ($q) use ($floorType) {
            $q->where('floor_type', $floorType);
        })->where(function ($q) use ($year, $month) {
            if ($month) {
                $q->where(function ($query) use ($year, $month) {
                    $query->where('year', '<', $year)
                        ->orWhere(function ($q2) use ($year, $month) {
                            $q2->where('year', $year)->where('month', '<', $month);
                        });
                });
            } else {
                $q->where('year', '<', $year);
            }
        })->sum('amount');

        $previousBalance = $previousAdvances - $previousDeductions;

        // Build transactions with date grouping
        $allTransactions = collect();
        $runningBalance = $previousBalance;

        foreach ($advances as $advance) {
            $allTransactions->push([
                'date' => $advance->payment_date,
                'description' => $advance->description,
                'payment_number' => $advance->payment_number,
                'credit' => $advance->advance_amount,
                'debit' => 0,
                'type' => 'advance',
            ]);
        }

        foreach ($deductions as $deduction) {
            $monthName = date('F', mktime(0, 0, 0, $deduction->month, 1));
            $allTransactions->push([
                'date' => $deduction->deduction_date,
                'description' => "Rent for {$monthName} {$deduction->year}".($deduction->notes ? " - {$deduction->notes}" : ''),
                'payment_number' => $deduction->deduction_number,
                'credit' => 0,
                'debit' => $deduction->amount,
                'type' => 'deduction',
            ]);
        }

        // Group by date
        $groupedByDate = $allTransactions->groupBy('date')->map(function ($items, $date) use (&$runningBalance) {
            $totalCredit = $items->sum('credit');
            $totalDebit = $items->sum('debit');
            $runningBalance += $totalCredit - $totalDebit;

            return [
                'date' => date('d M Y', strtotime($date)),
                'credit' => $totalCredit,
                'debit' => $totalDebit,
                'balance' => $runningBalance,
                'details' => $items->map(function ($item) {
                    return [
                        'description' => $item['description'],
                        'payment_number' => $item['payment_number'],
                        'credit' => $item['credit'],
                        'debit' => $item['debit'],
                        'type' => $item['type'],
                    ];
                })->toArray(),
            ];
        })->sortKeys()->values()->toArray();

        $transactions = $groupedByDate;

        $totalCredit = collect($transactions)->sum('credit');
        $totalDebit = collect($transactions)->sum('debit');

        $periodTitle = $month
            ? date('F', mktime(0, 0, 0, $month, 1))." {$year}"
            : "Year {$year}";

        if ($format === 'excel') {
            return $this->exportExcel($transactions, $previousBalance, $totalCredit, $totalDebit, $runningBalance, $periodTitle);
        }

        return $this->exportPDF($transactions, $previousBalance, $totalCredit, $totalDebit, $runningBalance, $periodTitle);
    }

    private function exportPDF($transactions, $previousBalance, $totalCredit, $totalDebit, $finalBalance, $periodTitle)
    {
        $pdf = Pdf::loadView('pdf.advance-rent-history', compact(
            'transactions', 'previousBalance', 'totalCredit', 'totalDebit', 'finalBalance', 'periodTitle'
        ));

        return $pdf->download("advance-rent-history-{$periodTitle}.pdf");
    }

    private function exportExcel($transactions, $previousBalance, $totalCredit, $totalDebit, $finalBalance, $periodTitle): StreamedResponse
    {
        $fileName = "advance-rent-history-{$periodTitle}.csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ];

        return response()->stream(function () use ($transactions, $previousBalance, $totalCredit, $totalDebit, $finalBalance, $periodTitle) {
            $handle = fopen('php://output', 'w');

            // Title
            fputcsv($handle, ["Advance House Rent History - {$periodTitle}"]);
            fputcsv($handle, []);

            // Headers
            fputcsv($handle, ['Date', 'Description', 'Payment/Deduction No', 'Credit (৳)', 'Debit (৳)', 'Balance (৳)']);

            // Opening Balance
            fputcsv($handle, ['', 'Opening Balance', '', '', '', number_format($previousBalance, 2)]);

            // Transactions
            foreach ($transactions as $transaction) {
                // For single transaction on that date
                if (count($transaction['details']) === 1) {
                    $detail = $transaction['details'][0];
                    fputcsv($handle, [
                        $transaction['date'],
                        $detail['description'],
                        $detail['payment_number'],
                        $transaction['credit'] > 0 ? number_format($transaction['credit'], 2) : '',
                        $transaction['debit'] > 0 ? number_format($transaction['debit'], 2) : '',
                        number_format($transaction['balance'], 2),
                    ]);
                } else {
                    // Multiple transactions on same date - show merged row
                    $descriptions = implode('; ', array_map(fn ($d) => $d['description'], $transaction['details']));
                    $paymentNumbers = implode('; ', array_map(fn ($d) => $d['payment_number'], $transaction['details']));

                    fputcsv($handle, [
                        $transaction['date'],
                        "Multiple Transactions: {$descriptions}",
                        $paymentNumbers,
                        $transaction['credit'] > 0 ? number_format($transaction['credit'], 2) : '',
                        $transaction['debit'] > 0 ? number_format($transaction['debit'], 2) : '',
                        number_format($transaction['balance'], 2),
                    ]);
                }
            }

            // Totals
            fputcsv($handle, []);
            fputcsv($handle, ['', 'Total', '', number_format($totalCredit, 2), number_format($totalDebit, 2), number_format($finalBalance, 2)]);

            fclose($handle);
        }, 200, $headers);
    }
}
