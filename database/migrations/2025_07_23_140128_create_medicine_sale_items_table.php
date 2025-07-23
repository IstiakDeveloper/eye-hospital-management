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
        Schema::create('medicine_sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_sale_id')->constrained()->onDelete('cascade');
            $table->foreignId('medicine_stock_id')->constrained()->onDelete('restrict');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2)->storedAs('quantity * unit_price');
            $table->decimal('buy_price', 10, 2); // Store buy price at time of sale
            $table->decimal('profit', 10, 2)->storedAs('(unit_price - buy_price) * quantity');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicine_sale_items');
    }
};
