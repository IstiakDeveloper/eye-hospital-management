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
        Schema::create('stock_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained()->onDelete('cascade');
            $table->integer('minimum_stock')->default(10);
            $table->integer('reorder_level')->default(20);
            $table->boolean('low_stock_alert')->default(true);
            $table->boolean('expiry_alert')->default(true);
            $table->integer('expiry_alert_days')->default(30); // Alert X days before expiry
            $table->timestamps();

            $table->unique('medicine_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_alerts');
    }
};
