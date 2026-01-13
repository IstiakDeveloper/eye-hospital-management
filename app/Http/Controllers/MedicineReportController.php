<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MedicineReportController extends Controller
{
    public function buySaleStockReport(Request $request)
    {
        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $search = $request->search ?? null;

        // Get report data
        $reportData = Medicine::getBuySaleStockReport($fromDate, $toDate, $search);

        // Add serial numbers
        $reportData = collect($reportData)->map(function ($item, $index) {
            $item['sl'] = $index + 1;

            return $item;
        })->values()->toArray();

        // Calculate totals - use direct database values for accuracy
        $directTotals = DB::table('medicine_sales')
            ->whereBetween('sale_date', [$fromDate, $toDate])
            ->selectRaw('
                SUM(subtotal) as total_subtotal,
                SUM(discount) as total_discount,
                SUM(total_amount) as total_amount,
                SUM(due_amount) as total_due
            ')
            ->first();

        // Calculate profit directly: Total Sales - Total Cost (100% accurate)
        $totalCost = DB::table('medicine_sale_items')
            ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
            ->whereBetween('medicine_sales.sale_date', [$fromDate, $toDate])
            ->sum(DB::raw('medicine_sale_items.quantity * medicine_sale_items.buy_price'));

        $totals = [
            'before_stock_qty' => collect($reportData)->sum('before_stock_qty'),
            'before_stock_value' => collect($reportData)->sum('before_stock_value'),

            'buy_qty' => collect($reportData)->sum('buy_qty'),
            'buy_total' => collect($reportData)->sum('buy_total'),

            'sale_qty' => collect($reportData)->sum('sale_qty'),
            'sale_subtotal' => (float) $directTotals->total_subtotal,
            'sale_discount' => (float) $directTotals->total_discount,
            'sale_total' => (float) $directTotals->total_amount,
            'sale_due' => (float) $directTotals->total_due,

            'available_stock' => collect($reportData)->sum('available_stock'),
            // Sum unrounded values for perfect continuity
            'available_value' => collect($reportData)->sum('available_value'),

            'total_profit' => (float) $directTotals->total_amount - $totalCost,
        ];

        return Inertia::render('MedicineCorner/Reports/BuySaleStockReport', [
            'reportData' => $reportData,
            'totals' => $totals,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
            ],
        ]);
    }
}
