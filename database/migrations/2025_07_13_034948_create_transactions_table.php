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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number')->unique(); // Auto-generated
            $table->enum('type', ['income', 'expense']);
            $table->decimal('amount', 15, 2);
            $table->text('description');
            $table->foreignId('account_category_id')->constrained('account_categories');
            $table->foreignId('payment_method_id')->constrained('payment_methods');
            $table->date('transaction_date');
            $table->string('reference_type')->nullable(); // 'patient_payment', 'appointment_fee', 'medicine_sale', etc.
            $table->unsignedBigInteger('reference_id')->nullable(); // ID of related record
            $table->json('metadata')->nullable(); // Additional data as JSON
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
