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
        Schema::table('medicine_sales', function (Blueprint $table) {
            $table->string('customer_name')->nullable()->after('patient_id');
            $table->string('customer_phone', 20)->nullable()->after('customer_name');
            $table->string('customer_email')->nullable()->after('customer_phone');
            $table->enum('payment_method', ['cash', 'card', 'mobile', 'bank_transfer'])->default('cash')->after('payment_status');
            $table->text('notes')->nullable()->after('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medicine_sales', function (Blueprint $table) {
            $table->dropColumn(['customer_name', 'customer_phone', 'customer_email', 'payment_method', 'notes']);
        });
    }
};
