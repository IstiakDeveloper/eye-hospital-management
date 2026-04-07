<?php

namespace App\Console\Commands;

use App\Models\OpticsSale;
use Illuminate\Console\Command;

class RecalculateOpticsSaleDuesCommand extends Command
{
    protected $signature = 'optics:recalculate-sale-dues {--dry-run : Show changes without saving}';

    protected $description = 'Sync optics_sales.due_amount from total_amount + payments (current outstanding only; not historical as-on dates)';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $updated = 0;
        $checked = 0;
        $sumStored = 0.0;
        $sumComputed = 0.0;
        $maxAbsDiff = 0.0;

        OpticsSale::query()
            ->whereNull('deleted_at')
            ->orderBy('id')
            ->chunkById(100, function ($sales) use ($dryRun, &$updated, &$checked, &$sumStored, &$sumComputed, &$maxAbsDiff): void {
                foreach ($sales as $sale) {
                    $checked++;
                    $before = (float) $sale->due_amount;
                    $computed = $sale->computeOutstandingDue();

                    $sumStored += $before;
                    $sumComputed += $computed;

                    $absDiff = abs($before - $computed);
                    if ($absDiff > $maxAbsDiff) {
                        $maxAbsDiff = $absDiff;
                    }

                    if ($absDiff > 0.009) {
                        if ($dryRun) {
                            $this->line("Sale #{$sale->id} ({$sale->invoice_number}): {$before} → {$computed}");
                        } else {
                            $sale->recalculateDue();
                        }
                        $updated++;
                    }
                }
            });

        $this->info("Checked {$checked} sales.".($dryRun ? " Would update {$updated}." : " Updated {$updated}."));
        $this->line(sprintf(
            'Totals — stored due sum: %s | payment-based due sum: %s | largest per-sale gap: %s',
            number_format($sumStored, 2, '.', ''),
            number_format($sumComputed, 2, '.', ''),
            number_format($maxAbsDiff, 2, '.', '')
        ));

        if ($updated === 0) {
            $this->newLine();
            $this->comment(
                'No row needed changing: each sale\'s due_amount already matches payments (current balance). '
                .'Reports with an "as on [past date]" use payments up to that date only — that can differ from this column without being "wrong".'
            );
        }

        return self::SUCCESS;
    }
}
