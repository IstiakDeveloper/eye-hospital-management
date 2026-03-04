<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncOpticsSaleTransactionDates extends Command
{
    protected $signature = 'app:sync-optics-sale-transaction-dates
                            {--dry-run : Show what would be changed without making any updates}
                            {--force : Skip confirmation prompt}';

    protected $description = 'Sync hospital_transactions.transaction_date with optics_sales.created_at for advance payment entries';

    public function handle(): void
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->warn('DRY RUN mode — no changes will be made.');
        }

        // Find optics_sales whose created_at DATE differs from the corresponding
        // hospital_transaction.transaction_date (= the sale_date the user entered).
        // The invoice number always encodes the correct date, and hospital_transactions
        // records sale_date explicitly — so transaction_date is the source of truth.
        $mismatches = DB::table('optics_sales')
            ->join('hospital_transactions', function ($join) {
                $join->on('hospital_transactions.reference_id', '=', 'optics_sales.id')
                    ->where('hospital_transactions.reference_type', '=', 'optics_sales')
                    ->where('hospital_transactions.type', '=', 'income')
                    ->where('hospital_transactions.description', 'like', 'Advance Payment%');
            })
            ->whereRaw('DATE(optics_sales.created_at) != DATE(hospital_transactions.transaction_date)')
            ->whereNull('optics_sales.deleted_at')
            ->select(
                'optics_sales.id as sale_id',
                'optics_sales.invoice_number',
                DB::raw('DATE(optics_sales.created_at) as wrong_date'),
                DB::raw('DATE(hospital_transactions.transaction_date) as correct_date'),
                DB::raw('TIME(optics_sales.created_at) as sale_time'),
                'hospital_transactions.amount',
            )
            ->get();

        if ($mismatches->isEmpty()) {
            $this->info('No mismatches found. All optics sale dates are already in sync.');

            return;
        }

        $this->info("Found {$mismatches->count()} sale(s) with mismatched created_at dates:");

        $headers = ['Sale ID', 'Invoice', 'Wrong Date (created_at)', 'Correct Date (sale_date)'];
        $rows = $mismatches->map(fn ($r) => [
            $r->sale_id,
            $r->invoice_number,
            $r->wrong_date,
            $r->correct_date,
        ])->toArray();

        $this->table($headers, $rows);

        if ($isDryRun) {
            $this->warn('Dry run complete. Run without --dry-run to apply changes.');

            return;
        }

        if (! $this->option('force') && ! $this->confirm("Update created_at for these {$mismatches->count()} optics_sale(s)?", true)) {
            $this->info('Aborted.');

            return;
        }

        $updated = 0;
        foreach ($mismatches as $mismatch) {
            // Keep the original time, just correct the date portion
            $correctedDatetime = $mismatch->correct_date.' '.$mismatch->sale_time;

            DB::table('optics_sales')
                ->where('id', $mismatch->sale_id)
                ->update([
                    'created_at' => $correctedDatetime,
                    'updated_at' => $correctedDatetime,
                ]);

            // Also fix optics_sale_items for this sale
            DB::table('optics_sale_items')
                ->where('optics_sale_id', $mismatch->sale_id)
                ->update([
                    'created_at' => $correctedDatetime,
                    'updated_at' => $correctedDatetime,
                ]);

            // Also fix the advance payment record (optics_sale_payments)
            DB::table('optics_sale_payments')
                ->where('optics_sale_id', $mismatch->sale_id)
                ->where('notes', 'Advance Payment')
                ->update([
                    'created_at' => $correctedDatetime,
                    'updated_at' => $correctedDatetime,
                ]);

            $updated++;
        }

        $this->info("✓ Fixed {$updated} sale(s): optics_sales, optics_sale_items, and advance optics_sale_payments updated.");
    }
}
