<?php

/**
 * Debug script to check Optics Sale Due mismatch
 * Run this in tinker or create a route temporarily
 */

// METHOD 1: Sales Page Method (Direct due_amount field sum)
$directDueSum = \App\Models\OpticsSale::whereNull('deleted_at')->sum('due_amount');

echo 'METHOD 1 (Sales Page): Direct due_amount sum = '.number_format($directDueSum, 2)."\n\n";

// METHOD 2: Balance Sheet Method (Calculate based on payments)
$opticsSales = \App\Models\OpticsSale::whereNull('deleted_at')->get(['id', 'invoice_number', 'total_amount', 'advance_payment', 'due_amount']);

$calculatedDue = 0;
$discrepancies = [];

foreach ($opticsSales as $sale) {
    // Get all payments from payment table
    $paymentsFromTable = DB::table('optics_sale_payments')
        ->where('optics_sale_id', $sale->id)
        ->sum('amount');

    // Check if advance payment is in payment table
    $advanceInTable = DB::table('optics_sale_payments')
        ->where('optics_sale_id', $sale->id)
        ->where('notes', 'like', '%Advance%')
        ->sum('amount');

    // Calculate total paid
    $totalPaid = $advanceInTable > 0 ? $paymentsFromTable : ($sale->advance_payment + $paymentsFromTable);

    // Calculate due
    $calculatedDueForSale = $sale->total_amount - $totalPaid;

    if ($calculatedDueForSale > 0) {
        $calculatedDue += $calculatedDueForSale;
    }

    // Check discrepancy
    if (round($calculatedDueForSale, 2) != round($sale->due_amount, 2)) {
        $discrepancies[] = [
            'invoice' => $sale->invoice_number,
            'total_amount' => $sale->total_amount,
            'advance_payment_field' => $sale->advance_payment,
            'payments_in_table' => $paymentsFromTable,
            'advance_in_table' => $advanceInTable,
            'total_paid_calculated' => $totalPaid,
            'due_in_db_field' => $sale->due_amount,
            'due_calculated' => $calculatedDueForSale,
            'difference' => $sale->due_amount - $calculatedDueForSale,
        ];
    }
}

echo 'METHOD 2 (Balance Sheet): Calculated due based on payments = '.number_format($calculatedDue, 2)."\n\n";

echo 'DIFFERENCE: '.number_format($directDueSum - $calculatedDue, 2)."\n\n";

if (! empty($discrepancies)) {
    echo 'FOUND '.count($discrepancies)." SALES WITH MISMATCHED DUE AMOUNTS:\n\n";

    foreach ($discrepancies as $disc) {
        echo "Invoice: {$disc['invoice']}\n";
        echo '  Total Amount: '.number_format($disc['total_amount'], 2)."\n";
        echo '  Advance (field): '.number_format($disc['advance_payment_field'], 2)."\n";
        echo '  Payments (table): '.number_format($disc['payments_in_table'], 2)."\n";
        echo '  Advance in table: '.number_format($disc['advance_in_table'], 2)."\n";
        echo '  Total Paid: '.number_format($disc['total_paid_calculated'], 2)."\n";
        echo '  Due (DB field): '.number_format($disc['due_in_db_field'], 2)."\n";
        echo '  Due (Calculated): '.number_format($disc['due_calculated'], 2)."\n";
        echo '  Difference: '.number_format($disc['difference'], 2)."\n";
        echo "  ---\n";
    }
} else {
    echo "NO DISCREPANCIES FOUND - All sales have correct due_amount field\n";
}

// Additional check: Find sales where payment was made but due_amount wasn't updated
echo "\n\nCHECKING FOR PAYMENT UPDATES ISSUE:\n";
$salesWithPaymentsButDue = DB::table('optics_sales')
    ->join('optics_sale_payments', 'optics_sales.id', '=', 'optics_sale_payments.optics_sale_id')
    ->whereNull('optics_sales.deleted_at')
    ->where('optics_sales.due_amount', '>', 0)
    ->select('optics_sales.invoice_number', 'optics_sales.due_amount', DB::raw('SUM(optics_sale_payments.amount) as total_payments'))
    ->groupBy('optics_sales.id', 'optics_sales.invoice_number', 'optics_sales.due_amount')
    ->get();

if ($salesWithPaymentsButDue->count() > 0) {
    echo "Found sales with payments but still showing due:\n";
    foreach ($salesWithPaymentsButDue as $sale) {
        echo "  Invoice: {$sale->invoice_number}, Due: {$sale->due_amount}, Payments: {$sale->total_payments}\n";
    }
}
