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
        Schema::table('operation_bookings', function (Blueprint $table) {
            $table->decimal('base_amount', 10, 2)->nullable()->after('operation_price');
            $table->enum('discount_type', ['percentage', 'amount'])->nullable()->after('base_amount');
            $table->decimal('discount_value', 10, 2)->nullable()->after('discount_type');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('discount_value');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('operation_bookings', function (Blueprint $table) {
            $table->dropColumn(['base_amount', 'discount_type', 'discount_value', 'discount_amount']);
        });
    }
};
