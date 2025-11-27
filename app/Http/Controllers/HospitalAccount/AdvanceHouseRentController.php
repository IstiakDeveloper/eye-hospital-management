<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use App\Models\{AdvanceHouseRent, AdvanceHouseRentDeduction, HospitalAccount};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdvanceHouseRentController extends Controller
{
    // Dashboard - Show advance rent overview
    public function index(): Response
    {
        $activeAdvances = AdvanceHouseRent::active()
            ->with('createdBy')
            ->orderBy('payment_date', 'desc')
            ->get();

        $exhaustedAdvances = AdvanceHouseRent::where('status', 'exhausted')
            ->with('createdBy')
            ->orderBy('payment_date', 'desc')
            ->take(5)
            ->get();

        $recentDeductions = AdvanceHouseRentDeduction::with(['advanceHouseRent', 'deductedBy'])
            ->orderBy('deduction_date', 'desc')
            ->take(10)
            ->get();

        $totalAdvanceBalance = AdvanceHouseRent::getActiveBalance();
        $totalAdvanceGiven = AdvanceHouseRent::sum('advance_amount');
        $totalUsed = AdvanceHouseRent::sum('used_amount');

        // Monthly deduction summary
        $currentYear = now()->year;
        $monthlyDeductions = AdvanceHouseRentDeduction::where('year', $currentYear)
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
        ]);
    }

    // Store new advance rent payment
    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string|max:500',
            'date' => 'required|date',
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
                date: $request->date
            );

            DB::commit();

            return back()->with('success', "Advance house rent payment of ৳{$request->amount} recorded successfully! Payment No: {$advanceRent->payment_number}");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to record advance rent: ' . $e->getMessage()]);
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
        ]);

        // Find active advance with sufficient balance
        $advanceRent = AdvanceHouseRent::where('status', 'active')
            ->where('remaining_amount', '>=', $request->amount)
            ->orderBy('payment_date', 'asc') // Use oldest first (FIFO)
            ->first();

        if (!$advanceRent) {
            return back()->withErrors(['amount' => 'No active advance found with sufficient balance!']);
        }

        if ($advanceRent->status !== 'active') {
            return back()->withErrors(['error' => 'This advance rent is not active!']);
        }

        if ($request->amount > $advanceRent->remaining_amount) {
            return back()->withErrors(['amount' => 'Deduction amount exceeds remaining advance balance!']);
        }

        // Check if already deducted for this month/year (from ANY advance)
        $existingDeduction = AdvanceHouseRentDeduction::where('month', $request->month)
            ->where('year', $request->year)
            ->first();

        if ($existingDeduction) {
            return back()->withErrors(['error' => 'Rent for this month has already been deducted!']);
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
            return back()->with('success', "House rent of ৳{$request->amount} deducted for {$monthName} {$request->year}. Deduction No: {$deduction->deduction_number}");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to deduct rent: ' . $e->getMessage()]);
        }
    }

    // History - All advances with deductions in table format
    public function history(Request $request): Response
    {
        $year = $request->filled('year') ? $request->year : now()->year;
        $month = $request->filled('month') ? $request->month : null;

        // Get all advances for the period
        $advancesQuery = AdvanceHouseRent::with('createdBy')
            ->whereYear('payment_date', $year);

        if ($month) {
            $advancesQuery->whereMonth('payment_date', $month);
        }

        $advances = $advancesQuery->orderBy('payment_date', 'asc')->get();

        // Get all deductions for the period
        $deductionsQuery = AdvanceHouseRentDeduction::with(['advanceHouseRent', 'deductedBy'])
            ->where('year', $year);

        if ($month) {
            $deductionsQuery->where('month', $month);
        }

        $deductions = $deductionsQuery->orderBy('deduction_date', 'asc')->get();

        // Calculate previous balance (before the selected period)
        $previousAdvances = AdvanceHouseRent::where(function($q) use ($year, $month) {
            if ($month) {
                $q->where(function($query) use ($year, $month) {
                    $query->whereYear('payment_date', '<', $year)
                          ->orWhere(function($q2) use ($year, $month) {
                              $q2->whereYear('payment_date', $year)
                                 ->whereMonth('payment_date', '<', $month);
                          });
                });
            } else {
                $q->whereYear('payment_date', '<', $year);
            }
        })->sum('advance_amount');

        $previousDeductions = AdvanceHouseRentDeduction::where(function($q) use ($year, $month) {
            if ($month) {
                $q->where(function($query) use ($year, $month) {
                    $query->where('year', '<', $year)
                          ->orWhere(function($q2) use ($year, $month) {
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
                'description' => "Rent for {$monthName} {$deduction->year}" . ($deduction->notes ? " - {$deduction->notes}" : ''),
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
        $format = $request->get('format', 'pdf');

        // Get data (same logic as history)
        $advancesQuery = AdvanceHouseRent::whereYear('payment_date', $year);
        if ($month) $advancesQuery->whereMonth('payment_date', $month);
        $advances = $advancesQuery->orderBy('payment_date', 'asc')->get();

        $deductionsQuery = AdvanceHouseRentDeduction::with('advanceHouseRent')->where('year', $year);
        if ($month) $deductionsQuery->where('month', $month);
        $deductions = $deductionsQuery->orderBy('deduction_date', 'asc')->get();

        // Calculate previous balance
        $previousAdvances = AdvanceHouseRent::where(function($q) use ($year, $month) {
            if ($month) {
                $q->where(function($query) use ($year, $month) {
                    $query->whereYear('payment_date', '<', $year)
                          ->orWhere(function($q2) use ($year, $month) {
                              $q2->whereYear('payment_date', $year)->whereMonth('payment_date', '<', $month);
                          });
                });
            } else {
                $q->whereYear('payment_date', '<', $year);
            }
        })->sum('advance_amount');

        $previousDeductions = AdvanceHouseRentDeduction::where(function($q) use ($year, $month) {
            if ($month) {
                $q->where(function($query) use ($year, $month) {
                    $query->where('year', '<', $year)
                          ->orWhere(function($q2) use ($year, $month) {
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
                'description' => "Rent for {$monthName} {$deduction->year}" . ($deduction->notes ? " - {$deduction->notes}" : ''),
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
            ? date('F', mktime(0, 0, 0, $month, 1)) . " {$year}"
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

        return response()->stream(function() use ($transactions, $previousBalance, $totalCredit, $totalDebit, $finalBalance, $periodTitle) {
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
                    $descriptions = implode('; ', array_map(fn($d) => $d['description'], $transaction['details']));
                    $paymentNumbers = implode('; ', array_map(fn($d) => $d['payment_number'], $transaction['details']));

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
