<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{HospitalFundTransaction, HospitalAccount};
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class FundLedgerController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $investorName = $request->investor_name;

        // Get unique investor names for the filter dropdown
        $investorNames = HospitalFundTransaction::selectRaw('DISTINCT purpose')
            ->whereNotNull('purpose')
            ->orderBy('purpose')
            ->pluck('purpose')
            ->unique()
            ->values()
            ->toArray();

        // Build the query
        $query = HospitalFundTransaction::query()
            ->orderBy('date')
            ->orderBy('created_at');

        // Filter by date range if provided
        if ($startDate && $endDate) {
            $query->whereBetween('date', [$startDate, $endDate]);
        }

        // Filter by investor name if provided
        if ($investorName) {
            $query->where('purpose', $investorName);
        }

        $transactions = $query->get();

        // Calculate running balance with previous balance
        $runningBalance = 0;
        $ledgerData = [];

        foreach ($transactions as $transaction) {
            $previousBalance = $runningBalance; // Store previous balance before update

            if ($transaction->type === 'fund_in') {
                $runningBalance += $transaction->amount;
                $fundIn = $transaction->amount;
                $fundOut = 0;
            } else {
                $runningBalance -= $transaction->amount;
                $fundIn = 0;
                $fundOut = $transaction->amount;
            }

            $ledgerData[] = [
                'id' => $transaction->id,
                'date' => $transaction->date,
                'investor_name' => $transaction->purpose,
                'description' => $transaction->description,
                'previous_balance' => $previousBalance,
                'fund_in' => $fundIn,
                'fund_out' => $fundOut,
                'balance' => $runningBalance,
            ];
        }

        // Calculate totals
        $totalFundIn = $transactions->where('type', 'fund_in')->sum('amount');
        $totalFundOut = $transactions->where('type', 'fund_out')->sum('amount');

        return Inertia::render('Fund/Ledger', [
            'ledgerData' => $ledgerData,
            'investorNames' => $investorNames,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'investor_name' => $investorName,
            ],
            'totals' => [
                'fund_in' => $totalFundIn,
                'fund_out' => $totalFundOut,
                'balance' => $runningBalance,
            ],
        ]);
    }

    public function print(Request $request)
    {
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $investorName = $request->investor_name;

        // Build the query
        $query = HospitalFundTransaction::query()
            ->orderBy('date')
            ->orderBy('created_at');

        // Filter by date range if provided
        if ($startDate && $endDate) {
            $query->whereBetween('date', [$startDate, $endDate]);
        }

        // Filter by investor name if provided
        if ($investorName) {
            $query->where('purpose', $investorName);
        }

        $transactions = $query->get();

        // Calculate running balance with previous balance
        $runningBalance = 0;
        $ledgerData = [];

        foreach ($transactions as $transaction) {
            $previousBalance = $runningBalance;

            if ($transaction->type === 'fund_in') {
                $runningBalance += $transaction->amount;
                $fundIn = $transaction->amount;
                $fundOut = 0;
            } else {
                $runningBalance -= $transaction->amount;
                $fundIn = 0;
                $fundOut = $transaction->amount;
            }

            $ledgerData[] = [
                'date' => $transaction->date->format('d M Y'),
                'investor_name' => $transaction->purpose,
                'description' => $transaction->description,
                'previous_balance' => $previousBalance,
                'fund_in' => $fundIn,
                'fund_out' => $fundOut,
                'balance' => $runningBalance,
            ];
        }

        // Calculate totals
        $totalFundIn = $transactions->where('type', 'fund_in')->sum('amount');
        $totalFundOut = $transactions->where('type', 'fund_out')->sum('amount');

        $pdf = Pdf::loadView('exports.fund-ledger', [
            'ledgerData' => $ledgerData,
            'startDate' => $startDate ? \Carbon\Carbon::parse($startDate)->format('d M Y') : null,
            'endDate' => $endDate ? \Carbon\Carbon::parse($endDate)->format('d M Y') : null,
            'investorName' => $investorName,
            'totalFundIn' => $totalFundIn,
            'totalFundOut' => $totalFundOut,
            'finalBalance' => $runningBalance,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('fund-ledger-' . now()->format('Y-m-d-His') . '.pdf');
    }
}
