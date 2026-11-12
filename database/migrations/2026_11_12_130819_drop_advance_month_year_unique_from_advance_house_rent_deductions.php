<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('advance_house_rent_deductions', function (Blueprint $table) {
            $table->index('advance_house_rent_id', 'ahr_deductions_advance_id_index');
        });

        Schema::table('advance_house_rent_deductions', function (Blueprint $table) {
            $table->dropUnique('advance_month_year_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('advance_house_rent_deductions', function (Blueprint $table) {
            $table->unique(['advance_house_rent_id', 'month', 'year'], 'advance_month_year_unique');
        });

        Schema::table('advance_house_rent_deductions', function (Blueprint $table) {
            $table->dropIndex('ahr_deductions_advance_id_index');
        });
    }
};
