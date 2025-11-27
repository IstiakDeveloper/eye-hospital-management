<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\MedicineVendor;
use App\Models\MedicineVendorTransaction;
use App\Models\MedicineVendorPayment;

echo "Checking Medicine Vendor Due Calculation:\n\n";

$vendors = MedicineVendor::where('name', 'NOT LIKE', '%OLD%STOCK%ADD%')
    ->where('name', 'NOT LIKE', '%OldStockAdd%')
    ->get();

$totalPrevDue = 0;
$totalPurchDue = 0;
$totalPay = 0;
$totalCurDue = 0;

foreach($vendors as $v) {
    $openingDue = ($v->balance_type === 'due' && $v->opening_balance > 0) ? $v->opening_balance : 0;
    $purchaseDue = MedicineVendorTransaction::where('vendor_id', $v->id)
        ->where('type', 'purchase')
        ->sum('amount');
    $payment = MedicineVendorPayment::where('vendor_id', $v->id)
        ->sum('amount');
    $currentDue = $openingDue + $purchaseDue - $payment;

    if($purchaseDue > 0 || $payment > 0 || $openingDue > 0) {
        echo $v->name . "\n";
        echo "  Opening: " . number_format($openingDue, 2) . "\n";
        echo "  Purchase Due: " . number_format($purchaseDue, 2) . "\n";
        echo "  Payment: " . number_format($payment, 2) . "\n";
        echo "  Current Due: " . number_format($currentDue, 2) . "\n\n";

        $totalPrevDue += $openingDue;
        $totalPurchDue += $purchaseDue;
        $totalPay += $payment;
        $totalCurDue += $currentDue;
    }
}

echo "========== TOTALS ==========\n";
echo "Previous Due: " . number_format($totalPrevDue, 2) . "\n";
echo "Purchase Due: " . number_format($totalPurchDue, 2) . "\n";
echo "Payment: " . number_format($totalPay, 2) . "\n";
echo "Current Due: " . number_format($totalCurDue, 2) . "\n\n";

// Check for vendors with purchase due but not in ledger
echo "========== CHECKING ALL VENDORS WITH PURCHASE DUE ==========\n";
$allPurchaseDue = MedicineVendorTransaction::where('type', 'purchase')
    ->where('due_amount', '>', 0)
    ->get()
    ->groupBy('vendor_id');

foreach($allPurchaseDue as $vendorId => $transactions) {
    $vendor = MedicineVendor::find($vendorId);
    $totalDue = $transactions->sum('due_amount');
    if($vendor) {
        $isExcluded = (stripos($vendor->name, 'OLD') !== false && stripos($vendor->name, 'STOCK') !== false && stripos($vendor->name, 'ADD') !== false) ||
                      $vendor->name === 'OldStockAdd';
        echo "Vendor: " . $vendor->name . " | Due: " . number_format($totalDue, 2) . " | Excluded: " . ($isExcluded ? 'YES' : 'NO') . "\n";
    } else {
        echo "Vendor ID " . $vendorId . " (NOT FOUND) | Due: " . number_format($totalDue, 2) . "\n";
    }
}
