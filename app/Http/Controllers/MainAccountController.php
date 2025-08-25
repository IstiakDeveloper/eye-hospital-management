<?php

namespace App\Http\Controllers;

use App\Models\MainAccount;
use App\Models\MainAccountVoucher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MainAccountController extends Controller
{
    /**
     * Display the main account dashboard
     */
    public function index(): Response
    {
        $balance = MainAccount::getBalance();
        $summary = MainAccount::getAccountSummary();
        $sourceAccountSummary = MainAccount::getSourceAccountSummary();

        // Recent vouchers (last 10)
        $recentVouchers = MainAccountVoucher::with('createdBy')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($voucher) {
                return [
                    'id' => $voucher->id,
                    'voucher_no' => $voucher->voucher_no,
                    'voucher_type' => $voucher->voucher_type,
                    'date' => $voucher->date->format('Y-m-d'),
                    'narration' => $voucher->narration,
                    'amount' => $voucher->amount,
                    'formatted_amount' => $voucher->formatted_amount,
                    'source_account' => $voucher->source_account,
                    'source_account_name' => $voucher->source_account_name,
                    'transaction_type_name' => $voucher->transaction_type_name,
                    'created_by' => $voucher->createdBy ? [
                        'id' => $voucher->createdBy->id,
                        'name' => $voucher->createdBy->name,
                    ] : null,
                    'created_at' => $voucher->created_at->format('Y-m-d H:i:s'),
                ];
            });

        // Today's summary
        $todaySummary = MainAccountVoucher::getDailyTotals(today());

        // This month's summary
        $monthlyReport = MainAccount::getMonthlyReport(now()->year, now()->month);


        return Inertia::render('MainAccount/Index', [
            'balance' => $balance,
            'summary' => $summary,
            'sourceAccountSummary' => $sourceAccountSummary,
            'recentVouchers' => $recentVouchers,
            'todaySummary' => $todaySummary,
            'monthlyReport' => $monthlyReport,
        ]);

    }

    /**
     * Display all vouchers with filters
     */
    public function vouchers(Request $request): Response
    {
        $validated = $request->validate([
            'voucher_type' => 'nullable|string',
            'source_account' => 'nullable|string',
            'source_transaction_type' => 'nullable|string',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:10|max:100',
        ]);

        $query = MainAccountVoucher::with('createdBy')->orderBy('id', 'desc');

        // Apply filters
        if (!empty($validated['voucher_type'])) {
            $query->where('voucher_type', $validated['voucher_type']);
        }

        if (!empty($validated['source_account'])) {
            $query->where('source_account', $validated['source_account']);
        }

        if (!empty($validated['source_transaction_type'])) {
            $query->where('source_transaction_type', $validated['source_transaction_type']);
        }

        if (!empty($validated['date_from'])) {
            $query->whereDate('date', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate('date', '<=', $validated['date_to']);
        }

        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function($q) use ($search) {
                $q->where('voucher_no', 'like', "%{$search}%")
                  ->orWhere('narration', 'like', "%{$search}%")
                  ->orWhere('source_voucher_no', 'like', "%{$search}%");
            });
        }

        $perPage = $validated['per_page'] ?? 50;
        $vouchers = $query->paginate($perPage)->withQueryString();

        // Transform voucher data and calculate running balance
        $transformedVouchers = $vouchers->through(function ($voucher) {
            return [
                'id' => $voucher->id,
                'sl_no' => $voucher->sl_no,
                'voucher_no' => $voucher->voucher_no,
                'voucher_type' => $voucher->voucher_type,
                'date' => $voucher->date->format('Y-m-d'),
                'narration' => $voucher->narration,
                'amount' => $voucher->amount,
                'formatted_amount' => $voucher->formatted_amount,
                'source_account' => $voucher->source_account,
                'source_account_name' => $voucher->source_account_name,
                'source_transaction_type' => $voucher->source_transaction_type,
                'transaction_type_name' => $voucher->transaction_type_name,
                'source_voucher_no' => $voucher->source_voucher_no,
                'running_balance' => MainAccountVoucher::getRunningBalance($voucher->id),
                'created_by' => $voucher->createdBy ? [
                    'id' => $voucher->createdBy->id,
                    'name' => $voucher->createdBy->name,
                ] : null,
                'created_at' => $voucher->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Get filter options for dropdowns
        $filterOptions = [
            'voucher_types' => ['Debit', 'Credit'],
            'source_accounts' => MainAccountVoucher::distinct('source_account')
                ->pluck('source_account')
                ->filter()
                ->values(),
            'transaction_types' => MainAccountVoucher::distinct('source_transaction_type')
                ->pluck('source_transaction_type')
                ->filter()
                ->values(),
        ];

        return Inertia::render('MainAccount/Vouchers', [
            'vouchers' => $transformedVouchers,
            'filters' => array_filter($request->only(['voucher_type', 'source_account', 'source_transaction_type', 'date_from', 'date_to', 'search'])),
            'filterOptions' => $filterOptions,
        ]);
    }

    /**
     * Show voucher details
     */
    public function show(MainAccountVoucher $voucher): Response
    {
        $voucher->load('createdBy');

        $voucherData = [
            'id' => $voucher->id,
            'sl_no' => $voucher->sl_no,
            'voucher_no' => $voucher->voucher_no,
            'voucher_type' => $voucher->voucher_type,
            'date' => $voucher->date->format('Y-m-d'),
            'narration' => $voucher->narration,
            'amount' => $voucher->amount,
            'formatted_amount' => $voucher->formatted_amount,
            'source_account' => $voucher->source_account,
            'source_account_name' => $voucher->source_account_name,
            'source_transaction_type' => $voucher->source_transaction_type,
            'transaction_type_name' => $voucher->transaction_type_name,
            'source_voucher_no' => $voucher->source_voucher_no,
            'running_balance' => MainAccountVoucher::getRunningBalance($voucher->id),
            'created_by' => $voucher->createdBy ? [
                'id' => $voucher->createdBy->id,
                'name' => $voucher->createdBy->name,
                'email' => $voucher->createdBy->email,
            ] : null,
            'created_at' => $voucher->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $voucher->updated_at->format('Y-m-d H:i:s'),
        ];

        return Inertia::render('MainAccount/Show', [
            'voucher' => $voucherData,
        ]);
    }

    /**
     * Generate reports
     */
    public function reports(Request $request): Response
    {
        $validated = $request->validate([
            'type' => 'nullable|string|in:monthly,yearly,source_account,daily',
            'year' => 'nullable|integer|min:2020|max:' . (date('Y') + 1),
            'month' => 'nullable|integer|min:1|max:12',
            'date' => 'nullable|date',
        ]);

        $reportType = $validated['type'] ?? 'monthly';
        $year = $validated['year'] ?? now()->year;
        $month = $validated['month'] ?? now()->month;
        $date = $validated['date'] ?? today();

        $data = match ($reportType) {
            'monthly' => $this->getMonthlyReport($year, $month),
            'yearly' => $this->getYearlyReport($year),
            'source_account' => $this->getSourceAccountReport($year, $month),
            'daily' => $this->getDailyReport($date),
            default => []
        };

        return Inertia::render('MainAccount/Reports', [
            'reportType' => $reportType,
            'data' => $data,
            'year' => $year,
            'month' => $month,
            'date' => $date,
            'availableYears' => range(2020, now()->year + 1),
            'availableMonths' => collect(range(1, 12))->map(fn($m) => [
                'value' => $m,
                'label' => Carbon::create(null, $m, 1)->format('F')
            ]),
        ]);
    }

    private function getMonthlyReport(int $year, int $month): array
    {
        $monthlyReport = MainAccount::getMonthlyReport($year, $month);

        // Get daily breakdown
        $startDate = Carbon::create($year, $month, 1);
        $endDate = $startDate->copy()->endOfMonth();

        $dailyData = [];
        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $dailyTotals = MainAccountVoucher::getDailyTotals($date->toDateString());
            $dailyData[] = [
                'date' => $date->toDateString(),
                'day' => $date->format('d'),
                'day_name' => $date->format('l'),
                'debit' => $dailyTotals['debit_total'],
                'credit' => $dailyTotals['credit_total'],
                'net' => $dailyTotals['net_change'],
                'voucher_count' => $dailyTotals['voucher_count']
            ];
        }

        return array_merge($monthlyReport, [
            'daily_data' => $dailyData,
            'month_name' => $startDate->format('F Y')
        ]);
    }

    private function getYearlyReport(int $year): array
    {
        $monthlyData = [];
        for ($month = 1; $month <= 12; $month++) {
            $monthReport = MainAccount::getMonthlyReport($year, $month);
            $monthlyData[] = [
                'month' => $month,
                'month_name' => Carbon::create($year, $month, 1)->format('F'),
                'debit_total' => $monthReport['debit_total'],
                'credit_total' => $monthReport['credit_total'],
                'net_change' => $monthReport['net_change']
            ];
        }

        return [
            'year' => $year,
            'monthly_data' => $monthlyData,
            'total_debit' => collect($monthlyData)->sum('debit_total'),
            'total_credit' => collect($monthlyData)->sum('credit_total'),
            'net_change' => collect($monthlyData)->sum('net_change')
        ];
    }

    private function getSourceAccountReport(int $year, int $month): array
    {
        $data = MainAccountVoucher::selectRaw('
            source_account,
            source_transaction_type,
            SUM(CASE WHEN voucher_type = "Debit" THEN amount ELSE 0 END) as debit_total,
            SUM(CASE WHEN voucher_type = "Credit" THEN amount ELSE 0 END) as credit_total,
            SUM(CASE WHEN voucher_type = "Debit" THEN amount ELSE -amount END) as net_amount,
            COUNT(*) as transaction_count
        ')
        ->whereYear('date', $year)
        ->whereMonth('date', $month)
        ->groupBy('source_account', 'source_transaction_type')
        ->orderBy('source_account')
        ->orderBy('source_transaction_type')
        ->get()
        ->groupBy('source_account')
        ->map(function ($transactions, $account) {
            return [
                'account' => $account,
                'transactions' => $transactions->map(function ($transaction) {
                    return [
                        'type' => $transaction->source_transaction_type,
                        'debit_total' => $transaction->debit_total,
                        'credit_total' => $transaction->credit_total,
                        'net_amount' => $transaction->net_amount,
                        'transaction_count' => $transaction->transaction_count,
                    ];
                }),
                'account_totals' => [
                    'debit_total' => $transactions->sum('debit_total'),
                    'credit_total' => $transactions->sum('credit_total'),
                    'net_amount' => $transactions->sum('net_amount'),
                    'transaction_count' => $transactions->sum('transaction_count'),
                ]
            ];
        })
        ->values();

        return [
            'accounts' => $data,
            'period' => Carbon::create($year, $month, 1)->format('F Y')
        ];
    }

    private function getDailyReport(string $date): array
    {
        $dailyTotals = MainAccountVoucher::getDailyTotals($date);
        $vouchers = MainAccountVoucher::with('createdBy')
                                   ->whereDate('date', $date)
                                   ->orderBy('id')
                                   ->get()
                                   ->map(function ($voucher) {
                                       return [
                                           'id' => $voucher->id,
                                           'voucher_no' => $voucher->voucher_no,
                                           'voucher_type' => $voucher->voucher_type,
                                           'narration' => $voucher->narration,
                                           'amount' => $voucher->amount,
                                           'formatted_amount' => $voucher->formatted_amount,
                                           'source_account_name' => $voucher->source_account_name,
                                           'transaction_type_name' => $voucher->transaction_type_name,
                                           'created_by' => $voucher->createdBy?->name,
                                       ];
                                   });

        return array_merge($dailyTotals, [
            'vouchers' => $vouchers,
            'date' => $date,
            'formatted_date' => Carbon::parse($date)->format('l, F j, Y')
        ]);
    }

    /**
     * Export vouchers to CSV
     */
    public function export(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'voucher_type' => 'nullable|string',
            'source_account' => 'nullable|string',
            'source_transaction_type' => 'nullable|string',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'search' => 'nullable|string|max:255',
        ]);

        $query = MainAccountVoucher::with('createdBy')->orderBy('id');

        // Apply same filters as vouchers method
        if (!empty($validated['voucher_type'])) {
            $query->where('voucher_type', $validated['voucher_type']);
        }

        if (!empty($validated['source_account'])) {
            $query->where('source_account', $validated['source_account']);
        }

        if (!empty($validated['source_transaction_type'])) {
            $query->where('source_transaction_type', $validated['source_transaction_type']);
        }

        if (!empty($validated['date_from'])) {
            $query->whereDate('date', '>=', $validated['date_from']);
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate('date', '<=', $validated['date_to']);
        }

        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function($q) use ($search) {
                $q->where('voucher_no', 'like', "%{$search}%")
                  ->orWhere('narration', 'like', "%{$search}%")
                  ->orWhere('source_voucher_no', 'like', "%{$search}%");
            });
        }

        $vouchers = $query->get();

        $filename = 'main_account_vouchers_' . now()->format('Y-m-d_H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ];

        return response()->stream(function() use ($vouchers) {
            $file = fopen('php://output', 'w');

            // Add BOM for proper UTF-8 encoding
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // CSV Header
            fputcsv($file, [
                'SL No',
                'Voucher No',
                'Voucher Type',
                'Date',
                'Narration',
                'Amount',
                'Source Account',
                'Transaction Type',
                'Source Voucher',
                'Created By',
                'Created At'
            ]);

            // CSV Data
            foreach ($vouchers as $voucher) {
                fputcsv($file, [
                    $voucher->sl_no,
                    $voucher->voucher_no,
                    $voucher->voucher_type,
                    $voucher->date->format('Y-m-d'),
                    $voucher->narration,
                    $voucher->formatted_amount,
                    $voucher->source_account_name,
                    $voucher->transaction_type_name,
                    $voucher->source_voucher_no,
                    $voucher->createdBy?->name ?? 'N/A',
                    $voucher->created_at->format('Y-m-d H:i:s')
                ]);
            }

            fclose($file);
        }, 200, $headers);
    }
}
