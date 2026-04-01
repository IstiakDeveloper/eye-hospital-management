<?php

namespace App\Console\Commands;

use App\Models\Medicine;
use Illuminate\Console\Command;

class SyncMedicineStandardSalePrices extends Command
{
    protected $signature = 'medicine:sync-standard-sale-prices';

    protected $description = 'Set medicines.standard_sale_price from each medicine\'s latest stock batch (max id)';

    public function handle(): int
    {
        $n = Medicine::syncAllStandardSalePricesFromLatestStock();
        $this->info("Updated standard sale price for {$n} medicine(s).");

        return self::SUCCESS;
    }
}
