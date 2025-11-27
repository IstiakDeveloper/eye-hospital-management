<?php

namespace App\Http\Controllers;

use App\Models\HospitalAccount;
use App\Models\MainAccount;
use App\Models\MainAccountVoucher;
use App\Models\MedicineAccount;
use App\Models\OpticsAccount;
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

            // Fixed Asset: Check for "- Fixed Asset" in narration
            $fixedAsset = $dayVouchers->where('voucher_type', 'Debit')
                ->where('source_transaction_type', 'expense')
                ->filter(function ($voucher) {
                    return str_contains($voucher->narration, '- Fixed Asset');
                })
                ->sum('amount');

            // Expense: All other expenses that don't contain "- Fixed Asset"
            $expense = $dayVouchers->where('voucher_type', 'Debit')
                ->where('source_transaction_type', 'expense')
                ->filter(function ($voucher) {
                    return !str_contains($voucher->narration, '- Fixed Asset');
                })
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


    public function receiptAndPaymentReport(Request $request): Response
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        if (!empty($validated['date_from']) && !empty($validated['date_to'])) {
            $startDate = Carbon::parse($validated['date_from'])->startOfDay();
            $endDate = Carbon::parse($validated['date_to'])->endOfDay();
        } else {
            // Default to current month
            $startDate = now()->startOfMonth();
            $endDate = now()->endOfMonth();
        }

        $reportTitle = $startDate->format('d/m/Y') . ' to ' . $endDate->format('d/m/Y');

        // Get opening balance (balance before the start date)
        $openingBalance = MainAccountVoucher::where('date', '<', $startDate)
            ->selectRaw('
            SUM(CASE WHEN voucher_type = "Credit" THEN amount ELSE 0 END) -
            SUM(CASE WHEN voucher_type = "Debit" THEN amount ELSE 0 END) as balance
        ')
            ->first()->balance ?? 0;

        // RECEIPTS (Credit Vouchers - Money Coming In)
        $receipts = MainAccountVoucher::whereBetween('date', [$startDate, $endDate])
            ->where('voucher_type', 'Credit')
            ->selectRaw('
            source_account,
            source_transaction_type,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count
        ')
            ->groupBy('source_account', 'source_transaction_type')
            ->get()
            ->map(function ($item) {
                return [
                    'source_account' => $item->source_account,
                    'source_account_name' => match ($item->source_account) {
                        'hospital' => 'Hospital Account',
                        'medicine' => 'Medicine Account',
                        'optics' => 'Optics Account',
                        default => ucfirst($item->source_account)
                    },
                    'transaction_type' => $item->source_transaction_type,
                    'transaction_type_name' => match ($item->source_transaction_type) {
                        'income' => 'Income',
                        'fund_in' => 'Fund In',
                        'other_income' => 'Other Income',
                        'bank_interest' => 'Bank Interest',
                        default => ucfirst(str_replace('_', ' ', $item->source_transaction_type))
                    },
                    'total_amount' => (float) $item->total_amount,
                    'transaction_count' => $item->transaction_count,
                    'formatted_amount' => number_format($item->total_amount, 2)
                ];
            })
            ->groupBy('source_account');

        // PAYMENTS (Debit Vouchers - Money Going Out)
        $payments = MainAccountVoucher::whereBetween('date', [$startDate, $endDate])
            ->where('voucher_type', 'Debit')
            ->selectRaw('
            source_account,
            source_transaction_type,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count
        ')
            ->groupBy('source_account', 'source_transaction_type')
            ->get()
            ->map(function ($item) {
                return [
                    'source_account' => $item->source_account,
                    'source_account_name' => match ($item->source_account) {
                        'hospital' => 'Hospital Account',
                        'medicine' => 'Medicine Account',
                        'optics' => 'Optics Account',
                        default => ucfirst($item->source_account)
                    },
                    'transaction_type' => $item->source_transaction_type,
                    'transaction_type_name' => match ($item->source_transaction_type) {
                        'expense' => 'Expense',
                        'fund_out' => 'Fund Out',
                        default => ucfirst(str_replace('_', ' ', $item->source_transaction_type))
                    },
                    'total_amount' => (float) $item->total_amount,
                    'transaction_count' => $item->transaction_count,
                    'formatted_amount' => number_format($item->total_amount, 2)
                ];
            })
            ->groupBy('source_account');

        // Calculate totals
        $totalReceipts = collect($receipts)->flatten(1)->sum('total_amount');
        $totalPayments = collect($payments)->flatten(1)->sum('total_amount');
        $netChange = $totalReceipts - $totalPayments;
        $closingBalance = $openingBalance + $netChange;

        // Get detailed transactions for reference (optional)
        $detailedTransactions = MainAccountVoucher::whereBetween('date', [$startDate, $endDate])
            ->with('createdBy')
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($voucher) {
                return [
                    'id' => $voucher->id,
                    'voucher_no' => $voucher->voucher_no,
                    'voucher_type' => $voucher->voucher_type,
                    'date' => $voucher->date->format('d/m/Y'),
                    'date_raw' => $voucher->date->format('Y-m-d'),
                    'narration' => $voucher->narration,
                    'amount' => $voucher->amount,
                    'formatted_amount' => $voucher->formatted_amount,
                    'source_account_name' => $voucher->source_account_name,
                    'transaction_type_name' => $voucher->transaction_type_name,
                ];
            });

        // Summary by account
        $accountSummary = [];
        foreach (['hospital', 'medicine', 'optics'] as $account) {
            $accountReceipts = collect($receipts[$account] ?? [])->sum('total_amount');
            $accountPayments = collect($payments[$account] ?? [])->sum('total_amount');

            $accountSummary[$account] = [
                'account_name' => match ($account) {
                    'hospital' => 'Hospital Account',
                    'medicine' => 'Medicine Account',
                    'optics' => 'Optics Account',
                    default => ucfirst($account)
                },
                'receipts' => $accountReceipts,
                'payments' => $accountPayments,
                'net_change' => $accountReceipts - $accountPayments,
                'formatted_receipts' => number_format($accountReceipts, 2),
                'formatted_payments' => number_format($accountPayments, 2),
                'formatted_net_change' => number_format($accountReceipts - $accountPayments, 2),
            ];
        }

        return Inertia::render('MainAccount/ReceiptAndPaymentReport', [
            'reportTitle' => $reportTitle,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
            'openingBalance' => (float) $openingBalance,
            'closingBalance' => (float) $closingBalance,
            'netChange' => (float) $netChange,
            'totalReceipts' => (float) $totalReceipts,
            'totalPayments' => (float) $totalPayments,
            'receipts' => $receipts,
            'payments' => $payments,
            'accountSummary' => $accountSummary,
            'detailedTransactions' => $detailedTransactions,
            'formattedOpeningBalance' => number_format($openingBalance, 2),
            'formattedClosingBalance' => number_format($closingBalance, 2),
            'formattedNetChange' => number_format($netChange, 2),
            'formattedTotalReceipts' => number_format($totalReceipts, 2),
            'formattedTotalPayments' => number_format($totalPayments, 2),
            'hospital_name' => 'Naogaon Islamia Eye Hospital and Phaco Center',
            'hospital_location' => 'Naogaon',
        ]);
    }

    public function incomeExpenditureReport(Request $request): Response
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        // Always use custom date range (monthly filter removed)
        // If no dates provided, default to current month
        if (!empty($validated['date_from']) && !empty($validated['date_to'])) {
            $startDate = Carbon::parse($validated['date_from'])->startOfDay();
            $endDate = Carbon::parse($validated['date_to'])->endOfDay();
        } else {
            // Default to current month
            $startDate = now()->startOfMonth();
            $endDate = now()->endOfMonth();
        }

        $reportTitle = $startDate->format('d/m/Y') . ' to ' . $endDate->format('d/m/Y');

        // INCOME SECTION (Only Credit Vouchers with income and other_income, bank_interest)
        $incomes = MainAccountVoucher::whereBetween('date', [$startDate, $endDate])
            ->where('voucher_type', 'Credit')
            ->whereIn('source_transaction_type', ['income', 'other_income', 'bank_interest'])
            ->selectRaw('
            source_account,
            source_transaction_type,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count
        ')
            ->groupBy('source_account', 'source_transaction_type')
            ->get()
            ->map(function ($item) {
                return [
                    'source_account' => $item->source_account,
                    'source_account_name' => match ($item->source_account) {
                        'hospital' => 'Hospital Account',
                        'medicine' => 'Medicine Account',
                        'optics' => 'Optics Account',
                        default => ucfirst($item->source_account)
                    },
                    'transaction_type' => $item->source_transaction_type,
                    'transaction_type_name' => match ($item->source_transaction_type) {
                        'income' => 'Income',
                        'other_income' => 'Other Income',
                        'bank_interest' => 'Bank Interest',
                        default => ucfirst(str_replace('_', ' ', $item->source_transaction_type))
                    },
                    'total_amount' => (float) $item->total_amount,
                    'transaction_count' => $item->transaction_count,
                    'formatted_amount' => number_format($item->total_amount, 2)
                ];
            })
            ->groupBy('source_account');

        // EXPENDITURE SECTION (Only Debit Vouchers with expense)
        $expenditures = MainAccountVoucher::whereBetween('date', [$startDate, $endDate])
            ->where('voucher_type', 'Debit')
            ->where('source_transaction_type', 'expense')
            ->selectRaw('
            source_account,
            source_transaction_type,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count
        ')
            ->groupBy('source_account', 'source_transaction_type')
            ->get()
            ->map(function ($item) {
                return [
                    'source_account' => $item->source_account,
                    'source_account_name' => match ($item->source_account) {
                        'hospital' => 'Hospital Account',
                        'medicine' => 'Medicine Account',
                        'optics' => 'Optics Account',
                        default => ucfirst($item->source_account)
                    },
                    'transaction_type' => $item->source_transaction_type,
                    'transaction_type_name' => 'Expense',
                    'total_amount' => (float) $item->total_amount,
                    'transaction_count' => $item->transaction_count,
                    'formatted_amount' => number_format($item->total_amount, 2)
                ];
            })
            ->groupBy('source_account');

        // Calculate totals
        $totalIncome = collect($incomes)->flatten(1)->sum('total_amount');
        $totalExpenditure = collect($expenditures)->flatten(1)->sum('total_amount');
        $netSurplusDeficit = $totalIncome - $totalExpenditure;

        // CUMULATIVE DATA (From inception to end date)
        $cumulativeIncomes = MainAccountVoucher::where('date', '<=', $endDate)
            ->where('voucher_type', 'Credit')
            ->whereIn('source_transaction_type', ['income', 'other_income', 'bank_interest'])
            ->selectRaw('
            source_account,
            source_transaction_type,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count
        ')
            ->groupBy('source_account', 'source_transaction_type')
            ->get()
            ->map(function ($item) {
                return [
                    'source_account' => $item->source_account,
                    'source_account_name' => match ($item->source_account) {
                        'hospital' => 'Hospital Account',
                        'medicine' => 'Medicine Account',
                        'optics' => 'Optics Account',
                        default => ucfirst($item->source_account)
                    },
                    'transaction_type' => $item->source_transaction_type,
                    'transaction_type_name' => match ($item->source_transaction_type) {
                        'income' => 'Income',
                        'other_income' => 'Other Income',
                        'bank_interest' => 'Bank Interest',
                        default => ucfirst(str_replace('_', ' ', $item->source_transaction_type))
                    },
                    'total_amount' => (float) $item->total_amount,
                    'transaction_count' => $item->transaction_count,
                    'formatted_amount' => number_format($item->total_amount, 2)
                ];
            })
            ->groupBy('source_account');

        $cumulativeExpenditures = MainAccountVoucher::where('date', '<=', $endDate)
            ->where('voucher_type', 'Debit')
            ->where('source_transaction_type', 'expense')
            ->selectRaw('
            source_account,
            source_transaction_type,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count
        ')
            ->groupBy('source_account', 'source_transaction_type')
            ->get()
            ->map(function ($item) {
                return [
                    'source_account' => $item->source_account,
                    'source_account_name' => match ($item->source_account) {
                        'hospital' => 'Hospital Account',
                        'medicine' => 'Medicine Account',
                        'optics' => 'Optics Account',
                        default => ucfirst($item->source_account)
                    },
                    'transaction_type' => $item->source_transaction_type,
                    'transaction_type_name' => 'Expense',
                    'total_amount' => (float) $item->total_amount,
                    'transaction_count' => $item->transaction_count,
                    'formatted_amount' => number_format($item->total_amount, 2)
                ];
            })
            ->groupBy('source_account');

        $cumulativeTotalIncome = collect($cumulativeIncomes)->flatten(1)->sum('total_amount');
        $cumulativeTotalExpenditure = collect($cumulativeExpenditures)->flatten(1)->sum('total_amount');
        $cumulativeNetSurplusDeficit = $cumulativeTotalIncome - $cumulativeTotalExpenditure;

        // Account-wise summary
        $accountSummary = [];
        foreach (['hospital', 'medicine', 'optics'] as $account) {
            $accountIncome = collect($incomes[$account] ?? [])->sum('total_amount');
            $accountExpenditure = collect($expenditures[$account] ?? [])->sum('total_amount');

            $accountSummary[$account] = [
                'account_name' => match ($account) {
                    'hospital' => 'Hospital Account',
                    'medicine' => 'Medicine Account',
                    'optics' => 'Optics Account',
                    default => ucfirst($account)
                },
                'income' => $accountIncome,
                'expenditure' => $accountExpenditure,
                'surplus_deficit' => $accountIncome - $accountExpenditure,
                'formatted_income' => number_format($accountIncome, 2),
                'formatted_expenditure' => number_format($accountExpenditure, 2),
                'formatted_surplus_deficit' => number_format($accountIncome - $accountExpenditure, 2),
            ];
        }

        // Monthly comparison (not used with date range filter)
        $monthlyComparison = [];

        // Detailed transactions for reference
        $detailedTransactions = MainAccountVoucher::whereBetween('date', [$startDate, $endDate])
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->where('voucher_type', 'Credit')
                        ->whereIn('source_transaction_type', ['income', 'other_income', 'bank_interest']);
                })
                    ->orWhere(function ($q) {
                        $q->where('voucher_type', 'Debit')
                            ->where('source_transaction_type', 'expense');
                    });
            })
            ->with('createdBy')
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($voucher) {
                return [
                    'id' => $voucher->id,
                    'voucher_no' => $voucher->voucher_no,
                    'voucher_type' => $voucher->voucher_type,
                    'date' => $voucher->date->format('d/m/Y'),
                    'date_raw' => $voucher->date->format('Y-m-d'),
                    'narration' => $voucher->narration,
                    'amount' => $voucher->amount,
                    'formatted_amount' => $voucher->formatted_amount,
                    'source_account_name' => $voucher->source_account_name,
                    'transaction_type_name' => $voucher->transaction_type_name,
                    'is_income' => in_array($voucher->source_transaction_type, ['income', 'other_income', 'bank_interest']),
                ];
            });

        return Inertia::render('MainAccount/IncomeExpenditureReport', [
            'reportTitle' => $reportTitle,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
            'totalIncome' => (float) $totalIncome,
            'totalExpenditure' => (float) $totalExpenditure,
            'netSurplusDeficit' => (float) $netSurplusDeficit,
            'incomes' => $incomes,
            'expenditures' => $expenditures,
            'cumulativeIncomes' => $cumulativeIncomes,
            'cumulativeExpenditures' => $cumulativeExpenditures,
            'cumulativeTotalIncome' => (float) $cumulativeTotalIncome,
            'cumulativeTotalExpenditure' => (float) $cumulativeTotalExpenditure,
            'cumulativeNetSurplusDeficit' => (float) $cumulativeNetSurplusDeficit,
            'accountSummary' => $accountSummary,
            'monthlyComparison' => $monthlyComparison,
            'detailedTransactions' => $detailedTransactions,
            'formattedTotalIncome' => number_format($totalIncome, 2),
            'formattedTotalExpenditure' => number_format($totalExpenditure, 2),
            'formattedNetSurplusDeficit' => number_format($netSurplusDeficit, 2),
            'formattedCumulativeTotalIncome' => number_format($cumulativeTotalIncome, 2),
            'formattedCumulativeTotalExpenditure' => number_format($cumulativeTotalExpenditure, 2),
            'formattedCumulativeNetSurplusDeficit' => number_format($cumulativeNetSurplusDeficit, 2),
            'hospital_name' => 'Naogaon Islamia Eye Hospital and Phaco Center',
            'hospital_location' => 'Naogaon',
        ]);
    }

    public function balanceSheet(Request $request): Response
    {
        $validated = $request->validate([
            'date' => 'nullable|date',
        ]);

        $asOnDate = $validated['date'] ?? now()->toDateString();
        $asOnDateFormatted = Carbon::parse($asOnDate)->format('d/m/Y');

        // ASSETS SECTION
        // ===============

        // Current Assets - Cash and Bank Balances
        $mainAccountBalance = MainAccountVoucher::where('date', '<=', $asOnDate)
            ->selectRaw('
            SUM(CASE WHEN voucher_type = "Credit" THEN amount ELSE 0 END) -
            SUM(CASE WHEN voucher_type = "Debit" THEN amount ELSE 0 END) as balance
        ')
            ->first()->balance ?? 0;

        // Individual Account Balances
        $hospitalBalance = HospitalAccount::first()?->balance ?? 0;
        $medicineBalance = MedicineAccount::first()?->balance ?? 0;
        $opticsBalance = OpticsAccount::first()?->balance ?? 0;

        // Fixed Assets (from expense narration containing "- Fixed Asset")
        $fixedAssets = MainAccountVoucher::where('voucher_type', 'Debit')
            ->where('source_transaction_type', 'expense')
            ->where('date', '<=', $asOnDate)
            ->where('narration', 'like', '%- Fixed Asset%')
            ->selectRaw('
            source_account,
            SUM(amount) as total_amount
        ')
            ->groupBy('source_account')
            ->get()
            ->map(function ($item) {
                return [
                    'account' => $item->source_account,
                    'account_name' => match ($item->source_account) {
                        'hospital' => 'Hospital Fixed Assets',
                        'medicine' => 'Medicine Fixed Assets',
                        'optics' => 'Optics Fixed Assets',
                        default => ucfirst($item->source_account) . ' Fixed Assets'
                    },
                    'amount' => (float) $item->total_amount,
                    'formatted_amount' => number_format($item->total_amount, 2)
                ];
            });

        $totalFixedAssets = $fixedAssets->sum('amount');

        // Current Assets breakdown
        $currentAssets = [
            [
                'name' => 'Main Account (Cash & Bank)',
                'amount' => $mainAccountBalance,
                'formatted_amount' => number_format($mainAccountBalance, 2)
            ]
        ];

        $totalCurrentAssets = $mainAccountBalance;
        $totalAssets = $totalCurrentAssets + $totalFixedAssets;

        // LIABILITIES & EQUITY SECTION
        // ============================

        // For a simplified balance sheet, we'll calculate:
        // Capital = Total Income - Total Expenditure from inception
        // (This represents accumulated surplus/deficit)

        $totalIncome = MainAccountVoucher::where('voucher_type', 'Credit')
            ->whereIn('source_transaction_type', ['income', 'other_income', 'bank_interest'])
            ->where('date', '<=', $asOnDate)
            ->sum('amount');

        $totalExpenses = MainAccountVoucher::where('voucher_type', 'Debit')
            ->where('source_transaction_type', 'expense')
            ->where('date', '<=', $asOnDate)
            ->sum('amount');

        // Fund Transactions (Capital contributions)
        $totalFundIn = MainAccountVoucher::where('voucher_type', 'Credit')
            ->where('source_transaction_type', 'fund_in')
            ->where('date', '<=', $asOnDate)
            ->sum('amount');

        $totalFundOut = MainAccountVoucher::where('voucher_type', 'Debit')
            ->where('source_transaction_type', 'fund_out')
            ->where('date', '<=', $asOnDate)
            ->sum('amount');

        // Calculate Capital Account
        $initialCapital = $totalFundIn - $totalFundOut; // Net fund contributions
        $retainedEarnings = $totalIncome - $totalExpenses; // Accumulated profit/loss
        $totalCapital = $initialCapital + $retainedEarnings;

        // Liabilities (for now, we'll show any negative balances as liabilities)
        $liabilities = [];
        $totalLiabilities = 0;

        // If any account has negative balance, treat as liability
        if ($hospitalBalance < 0) {
            $liabilities[] = [
                'name' => 'Hospital Account Overdraft',
                'amount' => abs($hospitalBalance),
                'formatted_amount' => number_format(abs($hospitalBalance), 2)
            ];
            $totalLiabilities += abs($hospitalBalance);
        }

        if ($medicineBalance < 0) {
            $liabilities[] = [
                'name' => 'Medicine Account Overdraft',
                'amount' => abs($medicineBalance),
                'formatted_amount' => number_format(abs($medicineBalance), 2)
            ];
            $totalLiabilities += abs($medicineBalance);
        }

        if ($opticsBalance < 0) {
            $liabilities[] = [
                'name' => 'Optics Account Overdraft',
                'amount' => abs($opticsBalance),
                'formatted_amount' => number_format(abs($opticsBalance), 2)
            ];
            $totalLiabilities += abs($opticsBalance);
        }

        // Capital & Reserves breakdown
        $capitalReserves = [
            [
                'name' => 'Capital Account (Fund Contributions)',
                'amount' => $initialCapital,
                'formatted_amount' => number_format($initialCapital, 2)
            ],
            [
                'name' => 'Retained Earnings (Accumulated Surplus/Deficit)',
                'amount' => $retainedEarnings,
                'formatted_amount' => number_format($retainedEarnings, 2)
            ]
        ];

        $totalLiabilitiesAndCapital = $totalLiabilities + $totalCapital;

        // Account-wise balances for reference
        $accountBalances = [
            [
                'name' => 'Hospital Account',
                'balance' => $hospitalBalance,
                'formatted_balance' => number_format($hospitalBalance, 2),
                'status' => $hospitalBalance >= 0 ? 'asset' : 'liability'
            ],
            [
                'name' => 'Medicine Account',
                'balance' => $medicineBalance,
                'formatted_balance' => number_format($medicineBalance, 2),
                'status' => $medicineBalance >= 0 ? 'asset' : 'liability'
            ],
            [
                'name' => 'Optics Account',
                'balance' => $opticsBalance,
                'formatted_balance' => number_format($opticsBalance, 2),
                'status' => $opticsBalance >= 0 ? 'asset' : 'liability'
            ]
        ];

        // Verification - Assets should equal Liabilities + Capital
        $balanceDifference = $totalAssets - $totalLiabilitiesAndCapital;

        return Inertia::render('MainAccount/BalanceSheet', [
            'asOnDate' => $asOnDate,
            'asOnDateFormatted' => $asOnDateFormatted,
            'reportTitle' => "Balance Sheet as on {$asOnDateFormatted}",

            // Assets
            'currentAssets' => $currentAssets,
            'fixedAssets' => $fixedAssets,
            'totalCurrentAssets' => (float) $totalCurrentAssets,
            'totalFixedAssets' => (float) $totalFixedAssets,
            'totalAssets' => (float) $totalAssets,

            // Liabilities & Capital
            'liabilities' => $liabilities,
            'capitalReserves' => $capitalReserves,
            'totalLiabilities' => (float) $totalLiabilities,
            'totalCapital' => (float) $totalCapital,
            'totalLiabilitiesAndCapital' => (float) $totalLiabilitiesAndCapital,

            // Formatted amounts
            'formattedTotalCurrentAssets' => number_format($totalCurrentAssets, 2),
            'formattedTotalFixedAssets' => number_format($totalFixedAssets, 2),
            'formattedTotalAssets' => number_format($totalAssets, 2),
            'formattedTotalLiabilities' => number_format($totalLiabilities, 2),
            'formattedTotalCapital' => number_format($totalCapital, 2),
            'formattedTotalLiabilitiesAndCapital' => number_format($totalLiabilitiesAndCapital, 2),

            // Additional data
            'accountBalances' => $accountBalances,
            'balanceDifference' => (float) $balanceDifference,
            'formattedBalanceDifference' => number_format($balanceDifference, 2),
            'isBalanced' => abs($balanceDifference) < 0.01, // Consider balanced if difference < 1 paisa

            // Components for reference
            'initialCapital' => (float) $initialCapital,
            'retainedEarnings' => (float) $retainedEarnings,
            'totalIncome' => (float) $totalIncome,
            'totalExpenses' => (float) $totalExpenses,
            'totalFundIn' => (float) $totalFundIn,
            'totalFundOut' => (float) $totalFundOut,
            'formattedInitialCapital' => number_format($initialCapital, 2),
            'formattedRetainedEarnings' => number_format($retainedEarnings, 2),

            'hospital_name' => 'Naogaon Islamia Eye Hospital and Phaco Center',
            'hospital_location' => 'Naogaon',
        ]);
    }
}
