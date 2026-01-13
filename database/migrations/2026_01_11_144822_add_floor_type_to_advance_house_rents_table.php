<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('advance_house_rents', function (Blueprint $table) {
            $table->enum('floor_type', ['2_3_floor', '4_floor'])->default('2_3_floor')->after('payment_number');
        });

        // Update existing records to be 2_3_floor
        DB::table('advance_house_rents')->update(['floor_type' => '2_3_floor']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('advance_house_rents', function (Blueprint $table) {
            $table->dropColumn('floor_type');
        });
    }
};
