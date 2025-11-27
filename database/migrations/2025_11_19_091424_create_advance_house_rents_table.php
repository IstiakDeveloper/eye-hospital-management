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
        Schema::create('advance_house_rents', function (Blueprint $table) {
            $table->id();
            $table->decimal('advance_amount', 15, 2); // Total advance paid
            $table->decimal('used_amount', 15, 2)->default(0); // Amount already used/deducted
            $table->decimal('remaining_amount', 15, 2); // Remaining balance
            $table->enum('status', ['active', 'exhausted', 'cancelled'])->default('active');
            $table->text('description')->nullable(); // Why advance was given
            $table->date('payment_date'); // Date when advance was paid
            $table->string('payment_number')->unique(); // Like ADV-RENT-20251119-0001
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('payment_date');
        });

        // Track each monthly deduction from advance
        Schema::create('advance_house_rent_deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('advance_house_rent_id')->constrained()->cascadeOnDelete();
            $table->integer('month'); // 1-12
            $table->integer('year'); // 2025, 2026, etc.
            $table->decimal('amount', 15, 2); // Amount deducted for this month
            $table->text('notes')->nullable();
            $table->date('deduction_date');
            $table->string('deduction_number')->unique(); // Like RENT-202511-0001
            $table->foreignId('deducted_by')->constrained('users');
            $table->timestamps();

            $table->unique(['advance_house_rent_id', 'month', 'year'], 'advance_month_year_unique');
            $table->index(['month', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advance_house_rent_deductions');
        Schema::dropIfExists('advance_house_rents');
    }
};
