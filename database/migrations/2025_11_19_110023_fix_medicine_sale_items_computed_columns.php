<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the computed/generated columns and recreate them as virtual (not stored)
        Schema::table('medicine_sale_items', function (Blueprint $table) {
            // Drop the existing generated columns
            $table->dropColumn(['total_price', 'profit']);
        });

        // Add them back as VIRTUAL generated columns (not STORED)
        // Virtual columns are computed on-the-fly and don't require storage
        DB::statement('ALTER TABLE medicine_sale_items ADD COLUMN total_price DECIMAL(10,2) AS (quantity * unit_price) VIRTUAL');
        DB::statement('ALTER TABLE medicine_sale_items ADD COLUMN profit DECIMAL(10,2) AS ((unit_price - buy_price) * quantity) VIRTUAL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medicine_sale_items', function (Blueprint $table) {
            $table->dropColumn(['total_price', 'profit']);
        });

        // Restore as STORED columns
        Schema::table('medicine_sale_items', function (Blueprint $table) {
            $table->decimal('total_price', 10, 2)->storedAs('quantity * unit_price');
            $table->decimal('profit', 10, 2)->storedAs('(unit_price - buy_price) * quantity');
        });
    }
};
