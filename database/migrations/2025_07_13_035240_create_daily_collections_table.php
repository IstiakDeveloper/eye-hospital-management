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
        Schema::create('daily_collections', function (Blueprint $table) {
            $table->id();
            $table->date('collection_date');
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('total_income', 15, 2)->default(0);
            $table->decimal('total_expense', 15, 2)->default(0);
            $table->decimal('closing_balance', 15, 2)->default(0);
            $table->json('payment_method_breakdown')->nullable(); // JSON of payment method wise collection
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->boolean('is_finalized')->default(false);
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();

            $table->unique('collection_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_collections');
    }
};
