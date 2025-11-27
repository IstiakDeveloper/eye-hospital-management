<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{
    FixedAssetVendor,
    FixedAsset,
    FixedAssetVendorPayment,
    MedicineVendor,
    MedicineVendorTransaction,
    MedicineVendorPayment,
    OpticsVendor,
    GlassesPurchase,
    OpticsVendorTransaction
};
use Inertia\Inertia;

class VendorDueLedgerController extends Controller
{
    public function fixedAssetVendorDue(Request $request)
    {
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $vendorId = $request->vendor_id;

        // Get all vendors for the filter dropdown
        $vendors = FixedAssetVendor::orderBy('name')
            ->get(['id', 'name'])
            ->toArray();

        // Build the query for vendor
        $vendorQuery = FixedAssetVendor::query();

        if ($vendorId) {
            $vendorQuery->where('id', $vendorId);
        }

        $selectedVendors = $vendorQuery->get();
        $ledgerData = [];

        foreach ($selectedVendors as $vendor) {
            // Get all fixed assets for this vendor (only those with due)
            $assetsQuery = FixedAsset::where('vendor_id', $vendor->id)
                ->where('due_amount', '>', 0);

            if ($startDate && $endDate) {
                $assetsQuery->whereBetween('purchase_date', [$startDate, $endDate]);
            }

            $totalPurchaseDue = $assetsQuery->sum('due_amount');

            // Get all vendor payments for this vendor
            $paymentsQuery = FixedAssetVendorPayment::where('vendor_id', $vendor->id);

            if ($startDate && $endDate) {
                $paymentsQuery->whereBetween('payment_date', [$startDate, $endDate]);
            }

            $totalPayment = $paymentsQuery->sum('amount');

            $previousDue = 0;
            $currentDue = $totalPurchaseDue - $totalPayment;

            // Only add vendors with transactions
            if ($totalPurchaseDue > 0 || $totalPayment > 0) {
                $ledgerData[] = [
                    'id' => 'vendor-' . $vendor->id,
                    'date' => now()->toDateString(),
                    'vendor_name' => $vendor->name,
                    'description' => 'Vendor Due Summary',
                    'previous_due' => $previousDue,
                    'purchase_due' => $totalPurchaseDue,
                    'payment' => $totalPayment,
                    'current_due' => $currentDue,
                ];
            }
        }

        // Calculate totals
        $totalPreviousDue = collect($ledgerData)->sum('previous_due');
        $totalPurchaseDue = collect($ledgerData)->sum('purchase_due');
        $totalPayment = collect($ledgerData)->sum('payment');
        $totalCurrentDue = collect($ledgerData)->sum('current_due');

        return Inertia::render('VendorDue/FixedAssetVendorDueLedger', [
            'ledgerData' => $ledgerData,
            'vendors' => $vendors,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'vendor_id' => $vendorId,
            ],
            'totals' => [
                'previous_due' => $totalPreviousDue,
                'purchase_due' => $totalPurchaseDue,
                'payment' => $totalPayment,
                'current_due' => $totalCurrentDue,
            ],
        ]);
    }

    public function medicineVendorDue(Request $request)
    {
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $vendorId = $request->vendor_id;

        // Get all vendors for the filter dropdown, excluding OldStockAdd (case-insensitive)
        $vendors = MedicineVendor::where('name', 'NOT LIKE', '%OLD%STOCK%ADD%')
            ->where('name', 'NOT LIKE', '%OldStockAdd%')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->toArray();

        // Build the query for vendor, excluding OldStockAdd (case-insensitive)
        $vendorQuery = MedicineVendor::where('name', 'NOT LIKE', '%OLD%STOCK%ADD%')
            ->where('name', 'NOT LIKE', '%OldStockAdd%');

        if ($vendorId) {
            $vendorQuery->where('id', $vendorId);
        }

        $selectedVendors = $vendorQuery->get();
        $ledgerData = [];

        foreach ($selectedVendors as $vendor) {
            // Get all purchase transactions for this vendor
            $purchasesQuery = MedicineVendorTransaction::where('vendor_id', $vendor->id)
                ->where('type', 'purchase');

            if ($startDate && $endDate) {
                $purchasesQuery->whereBetween('transaction_date', [$startDate, $endDate]);
            }

            // Sum the total amount from all purchases (full purchase value)
            $totalPurchaseDue = $purchasesQuery->sum('amount');

            // Get all vendor payments for this vendor (all payments)
            $paymentsQuery = MedicineVendorPayment::where('vendor_id', $vendor->id);

            if ($startDate && $endDate) {
                $paymentsQuery->whereBetween('payment_date', [$startDate, $endDate]);
            }

            $totalPayment = $paymentsQuery->sum('amount');

            // Add opening balance if vendor has due type opening balance
            $openingDue = 0;
            if ($vendor->balance_type === 'due' && $vendor->opening_balance > 0) {
                $openingDue = $vendor->opening_balance;
            }

            $previousDue = $openingDue;
            $currentDue = $openingDue + $totalPurchaseDue - $totalPayment;

            // Show all vendors with any transaction activity
            if ($totalPurchaseDue != 0 || $totalPayment > 0 || $openingDue > 0) {
                $ledgerData[] = [
                    'id' => 'vendor-' . $vendor->id,
                    'date' => now()->toDateString(),
                    'vendor_name' => $vendor->name,
                    'description' => 'Vendor Due Summary',
                    'previous_due' => $previousDue,
                    'purchase_due' => $totalPurchaseDue,
                    'payment' => $totalPayment,
                    'current_due' => $currentDue,
                ];
            }
        }

        // Calculate totals
        $totalPreviousDue = collect($ledgerData)->sum('previous_due');
        $totalPurchaseDue = collect($ledgerData)->sum('purchase_due');
        $totalPayment = collect($ledgerData)->sum('payment');
        $totalCurrentDue = collect($ledgerData)->sum('current_due');

        return Inertia::render('VendorDue/MedicineVendorDueLedger', [
            'ledgerData' => $ledgerData,
            'vendors' => $vendors,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'vendor_id' => $vendorId,
            ],
            'totals' => [
                'previous_due' => $totalPreviousDue,
                'purchase_due' => $totalPurchaseDue,
                'payment' => $totalPayment,
                'current_due' => $totalCurrentDue,
            ],
        ]);
    }

    public function opticsVendorDue(Request $request)
    {
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $vendorId = $request->vendor_id;

        // Get all vendors for the filter dropdown
        $vendors = OpticsVendor::orderBy('name')
            ->get(['id', 'name'])
            ->toArray();

        // Build the query for vendor
        $vendorQuery = OpticsVendor::query();

        if ($vendorId) {
            $vendorQuery->where('id', $vendorId);
        }

        $selectedVendors = $vendorQuery->get();
        $ledgerData = [];

        foreach ($selectedVendors as $vendor) {
            // Get all purchase transactions for this vendor (only those with due)
            $purchasesQuery = GlassesPurchase::where('vendor_id', $vendor->id)
                ->where('due_amount', '>', 0);

            if ($startDate && $endDate) {
                $purchasesQuery->whereBetween('purchase_date', [$startDate, $endDate]);
            }

            $totalPurchaseDue = $purchasesQuery->sum('due_amount');

            // Get all vendor payment transactions for this vendor
            $paymentsQuery = OpticsVendorTransaction::where('vendor_id', $vendor->id)
                ->where('type', 'payment');

            if ($startDate && $endDate) {
                $paymentsQuery->whereBetween('transaction_date', [$startDate, $endDate]);
            }

            $totalPayment = $paymentsQuery->sum('amount');

            // Add opening balance if vendor has due type opening balance
            $openingDue = 0;
            if ($vendor->balance_type === 'due' && $vendor->opening_balance > 0) {
                $openingDue = $vendor->opening_balance;
            }

            $previousDue = $openingDue;
            $currentDue = $openingDue + $totalPurchaseDue - $totalPayment;

            // Show vendors with actual due, payments, or opening balance
            if ($totalPurchaseDue > 0 || $totalPayment > 0 || $openingDue > 0) {
                $ledgerData[] = [
                    'id' => 'vendor-' . $vendor->id,
                    'date' => now()->toDateString(),
                    'vendor_name' => $vendor->name,
                    'description' => 'Vendor Due Summary',
                    'previous_due' => $previousDue,
                    'purchase_due' => $totalPurchaseDue,
                    'payment' => $totalPayment,
                    'current_due' => $currentDue,
                ];
            }
        }

        // Calculate totals
        $totalPreviousDue = collect($ledgerData)->sum('previous_due');
        $totalPurchaseDue = collect($ledgerData)->sum('purchase_due');
        $totalPayment = collect($ledgerData)->sum('payment');
        $totalCurrentDue = collect($ledgerData)->sum('current_due');

        return Inertia::render('VendorDue/OpticsVendorDueLedger', [
            'ledgerData' => $ledgerData,
            'vendors' => $vendors,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'vendor_id' => $vendorId,
            ],
            'totals' => [
                'previous_due' => $totalPreviousDue,
                'purchase_due' => $totalPurchaseDue,
                'payment' => $totalPayment,
                'current_due' => $totalCurrentDue,
            ],
        ]);
    }
}
