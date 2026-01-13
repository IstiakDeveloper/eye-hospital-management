<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use App\Models\HospitalExpenseCategory;
use App\Models\HospitalTransaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HouseSecurityLedgerController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $description = $request->description;

        // Get House Security category
        $houseSecurityCategory = HospitalExpenseCategory::where('name', 'House Security')->first();

        if (! $houseSecurityCategory) {
            return Inertia::render('HouseSecurity/Ledger', [
                'ledgerData' => [],
                'descriptions' => [],
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'description' => $description,
                ],
                'totals' => [
                    'total_expense' => 0,
                    'balance' => 0,
                ],
            ]);
        }

        // Get unique descriptions for the filter dropdown
        $descriptions = HospitalTransaction::where('expense_category_id', $houseSecurityCategory->id)
            ->where('type', 'expense')
            ->whereNotNull('description')
            ->selectRaw('DISTINCT description')
            ->orderBy('description')
            ->pluck('description')
            ->unique()
            ->values()
            ->toArray();

        // Build the query
        $query = HospitalTransaction::query()
            ->where('expense_category_id', $houseSecurityCategory->id)
            ->where('type', 'expense')
            ->orderBy('transaction_date')
            ->orderBy('created_at');

        // Filter by date range if provided
        if ($startDate && $endDate) {
            $query->whereBetween('transaction_date', [$startDate, $endDate]);
        }

        // Filter by description if provided
        if ($description) {
            $query->where('description', 'like', '%'.$description.'%');
        }

        $transactions = $query->get();

        // Calculate running balance with previous balance
        $runningBalance = 0;
        $ledgerData = [];

        foreach ($transactions as $transaction) {
            $previousBalance = $runningBalance; // Store previous balance before update
            $runningBalance += $transaction->amount;

            $ledgerData[] = [
                'id' => $transaction->id,
                'date' => $transaction->transaction_date,
                'transaction_no' => $transaction->transaction_no,
                'description' => $transaction->description,
                'previous_balance' => $previousBalance,
                'expense' => $transaction->amount,
                'balance' => $runningBalance,
            ];
        }

        // Calculate totals
        $totalExpense = $transactions->sum('amount');

        return Inertia::render('HouseSecurity/Ledger', [
            'ledgerData' => $ledgerData,
            'descriptions' => $descriptions,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'description' => $description,
            ],
            'totals' => [
                'total_expense' => $totalExpense,
                'balance' => $runningBalance,
            ],
        ]);
    }

    public function print(Request $request)
    {
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $description = $request->description;

        // Get House Security category
        $houseSecurityCategory = HospitalExpenseCategory::where('name', 'House Security')->first();

        if (! $houseSecurityCategory) {
            abort(404, 'House Security category not found');
        }

        // Build the query
        $query = HospitalTransaction::query()
            ->where('expense_category_id', $houseSecurityCategory->id)
            ->where('type', 'expense')
            ->orderBy('transaction_date')
            ->orderBy('created_at');

        // Filter by date range if provided
        if ($startDate && $endDate) {
            $query->whereBetween('transaction_date', [$startDate, $endDate]);
        }

        // Filter by description if provided
        if ($description) {
            $query->where('description', 'like', '%'.$description.'%');
        }

        $transactions = $query->get();

        // Calculate running balance with previous balance
        $runningBalance = 0;
        $ledgerData = [];

        foreach ($transactions as $transaction) {
            $previousBalance = $runningBalance;
            $runningBalance += $transaction->amount;

            $ledgerData[] = [
                'date' => $transaction->transaction_date->format('d M Y'),
                'transaction_no' => $transaction->transaction_no,
                'description' => $transaction->description,
                'previous_balance' => $previousBalance,
                'expense' => $transaction->amount,
                'balance' => $runningBalance,
            ];
        }

        // Calculate totals
        $totalExpense = $transactions->sum('amount');

        $pdf = Pdf::loadView('exports.house-security-ledger', [
            'ledgerData' => $ledgerData,
            'startDate' => $startDate ? \Carbon\Carbon::parse($startDate)->format('d M Y') : null,
            'endDate' => $endDate ? \Carbon\Carbon::parse($endDate)->format('d M Y') : null,
            'description' => $description,
            'totalExpense' => $totalExpense,
            'finalBalance' => $runningBalance,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('house-security-ledger-'.now()->format('Y-m-d-His').'.pdf');
    }
}
