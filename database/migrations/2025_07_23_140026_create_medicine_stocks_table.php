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
        Schema::create('medicine_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained()->onDelete('cascade');
            $table->string('batch_number'); // Remove unique constraint
            $table->date('expiry_date');
            $table->integer('quantity'); // Original purchased quantity
            $table->integer('available_quantity'); // Current available quantity
            $table->decimal('buy_price', 10, 2);
            $table->decimal('sale_price', 10, 2);
            $table->decimal('profit_per_unit', 10, 2)->storedAs('sale_price - buy_price');
            $table->date('purchase_date'); // Add this field
            $table->text('notes')->nullable(); // Add this field
            $table->boolean('is_active')->default(true);
            $table->foreignId('added_by')->constrained('users'); // Add this field
            $table->timestamps();

            $table->index(['medicine_id', 'expiry_date']);
            $table->index(['batch_number', 'medicine_id']); // Allow same batch for different medicines
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicine_stocks');
    }
};
