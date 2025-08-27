<?php

namespace App\Http\Controllers;

use App\Models\MainAccount;
use App\Models\MainAccountVoucher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use NumberFormatter;
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

        // Debug: Check what's actually coming from the methods
        \Log::info('Debug MainAccount Data:', [
            'balance' => $balance,
            'summary' => $summary,
            'sourceAccountSummary' => $sourceAccountSummary
        ]);

        // Debug: Manual calculation
        $manualDebit = MainAccountVoucher::where('voucher_type', 'Debit')->sum('amount');
        $manualCredit = MainAccountVoucher::where('voucher_type', 'Credit')->sum('amount');

        \Log::info('Manual Calculation:', [
            'debit' => $manualDebit,
            'credit' => $manualCredit,
            'count_debit' => MainAccountVoucher::where('voucher_type', 'Debit')->count(),
            'count_credit' => MainAccountVoucher::where('voucher_type', 'Credit')->count()
        ]);

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

        // Debug today's and monthly data
        \Log::info('Daily and Monthly Data:', [
            'todaySummary' => $todaySummary,
            'monthlyReport' => $monthlyReport
        ]);

        // Fallback: If summary is null or empty, calculate manually
        if (!$summary || ($summary['total_debit'] == 0 && $summary['total_credit'] == 0)) {
            $summary = [
                'total_debit' => $manualDebit,
                'total_credit' => $manualCredit,
                'net_balance' => $manualCredit - $manualDebit
            ];
        }

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
            $query->where(function ($q) use ($search) {
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


    public function dailyReport(Request $request): Response
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'voucher_type' => 'required|in:Debit,Credit',
        ]);

        $date = $validated['date'];
        $voucherType = $validated['voucher_type'];

        // Get vouchers for the specific date and type
        $vouchers = MainAccountVoucher::where('date', $date)
            ->where('voucher_type', $voucherType)
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($voucher, $index) {
                return [
                    'sl_no' => str_pad($index + 1, 2, '0', STR_PAD_LEFT),
                    'voucher_no' => $voucher->voucher_no,
                    'date' => $voucher->date->format('d/m/Y'),
                    'narration' => $voucher->narration,
                    'amount' => number_format($voucher->amount, 2),
                    'amount_raw' => $voucher->amount,
                ];
            });

        $totalAmount = $vouchers->sum('amount_raw');

        // Convert amount to words (you'll need a helper for this)
        $amountInWords = $this->convertToWords($totalAmount);

        return Inertia::render('MainAccount/DailyReport', [
            'date' => Carbon::parse($date)->format('d/m/Y'),
            'voucher_type' => $voucherType,
            'vouchers' => $vouchers,
            'total_amount' => number_format($totalAmount, 2),
            'amount_in_words' => $amountInWords,
            'hospital_name' => 'Naogaon Islamia Eye Hospital and Phaco Center',
            'hospital_location' => 'Naogaon',
        ]);
    }


    public function monthlyReport(Request $request): Response
    {
        $validated = $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020|max:2030',
            'voucher_type' => 'required|in:Debit,Credit',
        ]);

        $month = $validated['month'];
        $year = $validated['year'];
        $voucherType = $validated['voucher_type'];

        // Get vouchers for the specific month and type
        $vouchers = MainAccountVoucher::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->where('voucher_type', $voucherType)
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($voucher, $index) {
                return [
                    'sl_no' => str_pad($index + 1, 2, '0', STR_PAD_LEFT),
                    'voucher_no' => $voucher->voucher_no,
                    'date' => $voucher->date->format('d/m/Y'),
                    'narration' => $voucher->narration,
                    'amount' => number_format($voucher->amount, 2),
                    'amount_raw' => $voucher->amount,
                ];
            });

        $totalAmount = $vouchers->sum('amount_raw');
        $amountInWords = $this->convertToWords($totalAmount);

        return Inertia::render('MainAccount/MonthlyReport', [
            'month_name' => Carbon::createFromDate($year, $month)->format('F Y'),
            'voucher_type' => $voucherType,
            'vouchers' => $vouchers,
            'total_amount' => number_format($totalAmount, 2),
            'amount_in_words' => $amountInWords,
            'hospital_name' => 'Naogaon Islamia Eye Hospital and Phaco Center',
            'hospital_location' => 'Naogaon',
        ]);
    }


    public function yearlyReport(Request $request): Response
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:2030',
            'voucher_type' => 'required|in:Debit,Credit',
        ]);

        $year = $validated['year'];
        $voucherType = $validated['voucher_type'];

        // Get vouchers for the specific year and type
        $vouchers = MainAccountVoucher::whereYear('date', $year)
            ->where('voucher_type', $voucherType)
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($voucher, $index) {
                return [
                    'sl_no' => str_pad($index + 1, 2, '0', STR_PAD_LEFT),
                    'voucher_no' => $voucher->voucher_no,
                    'date' => $voucher->date->format('d/m/Y'),
                    'narration' => $voucher->narration,
                    'amount' => number_format($voucher->amount, 2),
                    'amount_raw' => $voucher->amount,
                ];
            });

        $totalAmount = $vouchers->sum('amount_raw');
        $amountInWords = $this->convertToWords($totalAmount);

        return Inertia::render('MainAccount/YearlyReport', [
            'year' => $year,
            'voucher_type' => $voucherType,
            'vouchers' => $vouchers,
            'total_amount' => number_format($totalAmount, 2),
            'amount_in_words' => $amountInWords,
            'hospital_name' => 'Naogaon Islamia Eye Hospital and Phaco Center',
            'hospital_location' => 'Naogaon',
        ]);
    }


    public function reports(): Response
    {
        return Inertia::render('MainAccount/Reports');
    }


    private function convertToWords(float $amount): string
    {
        $formatter = new NumberFormatter('en', NumberFormatter::SPELLOUT);
        $words = $formatter->format($amount);
        return ucwords($words) . ' Taka Only';
    }




    public function bankReport(Request $request): Response
    {
        $validated = $request->validate([
            'month' => 'nullable|integer|between:1,12',
            'year' => 'nullable|integer|min:2020|max:2030',
        ]);

        $month = $validated['month'] ?? now()->month;
        $year = $validated['year'] ?? now()->year;

        // Get previous month balance
        $previousMonth = $month == 1 ? 12 : $month - 1;
        $previousYear = $month == 1 ? $year - 1 : $year;

        $previousMonthBalance = MainAccountVoucher::whereMonth('date', '<', $month)
            ->whereYear('date', '<=', $year)
            ->selectRaw('
            SUM(CASE WHEN voucher_type = "Credit" THEN amount ELSE 0 END) -
            SUM(CASE WHEN voucher_type = "Debit" THEN amount ELSE 0 END) as balance
        ')
            ->first()->balance ?? 0;

        // Get all dates in the month with transactions
        $dates = MainAccountVoucher::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->distinct()
            ->pluck('date')
            ->map(function ($date) {
                return Carbon::parse($date)->format('Y-m-d');
            })
            ->sort()
            ->values();

        $bankData = [];
        $runningBalance = $previousMonthBalance;

        foreach ($dates as $date) {
            $dayVouchers = MainAccountVoucher::whereDate('date', $date)
                ->with(['createdBy'])
                ->get();

            // Credit Section
            $fundIn = $dayVouchers->where('voucher_type', 'Credit')
                ->where('source_transaction_type', 'fund_in')
                ->sum('amount');

            $income = $dayVouchers->where('voucher_type', 'Credit')
                ->where('source_transaction_type', 'income')
                ->sum('amount');

            $otherIncome = $dayVouchers->where('voucher_type', 'Credit')
                ->whereIn('source_transaction_type', ['other_income', 'bank_interest'])
                ->sum('amount');

            // Debit Section
            $fundOut = $dayVouchers->where('voucher_type', 'Debit')
                ->where('source_transaction_type', 'fund_out')
                ->sum('amount');

            $fixedAsset = $dayVouchers->where('voucher_type', 'Debit')
                ->where('source_transaction_type', 'expense')
                ->where('narration', 'like', '%Fixed Asset%')
                ->sum('amount');

            $expense = $dayVouchers->where('voucher_type', 'Debit')
                ->where('source_transaction_type', 'expense')
                ->where('narration', 'not like', '%Fixed Asset%')
                ->sum('amount');

            $totalCredit = $fundIn + $income + $otherIncome;
            $totalDebit = $fundOut + $fixedAsset + $expense;

            $runningBalance += ($totalCredit - $totalDebit);

            $bankData[] = [
                'date' => Carbon::parse($date)->format('d/m/Y'),
                'date_raw' => $date,
                'credit' => [
                    'fund_in' => $fundIn,
                    'income' => $income,
                    'other_income' => $otherIncome,
                    'total' => $totalCredit
                ],
                'debit' => [
                    'fund_out' => $fundOut,
                    'fixed_asset' => $fixedAsset,
                    'expense' => $expense,
                    'total' => $totalDebit
                ],
                'running_balance' => $runningBalance
            ];
        }

        return Inertia::render('MainAccount/BankReport', [
            'bankData' => $bankData,
            'month' => $month,
            'year' => $year,
            'monthName' => Carbon::createFromDate($year, $month)->format('F Y'),
            'previousMonthBalance' => $previousMonthBalance,
            'currentBalance' => $runningBalance,
        ]);
    }


}
