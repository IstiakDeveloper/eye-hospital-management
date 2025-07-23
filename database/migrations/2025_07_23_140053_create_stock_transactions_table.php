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
        Schema::create('stock_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_stock_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['purchase', 'sale', 'adjustment', 'expired', 'damaged', 'return']);
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_amount', 10, 2);
            $table->string('reference_type')->nullable(); // prescription, direct_sale, stock_adjustment
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('reason')->nullable(); // Add this field - was missing
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['medicine_stock_id', 'type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transactions');
    }
};
