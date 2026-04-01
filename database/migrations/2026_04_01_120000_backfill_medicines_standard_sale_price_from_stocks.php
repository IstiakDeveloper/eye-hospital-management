<?php

use App\Models\Medicine;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Fill medicines.standard_sale_price from each medicine's latest stock row (max id).
     */
    public function up(): void
    {
        Medicine::syncAllStandardSalePricesFromLatestStock();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
