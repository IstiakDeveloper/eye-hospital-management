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
        Schema::create('patient_payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique(); // Auto-generated
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('invoice_id')->nullable()->constrained('patient_invoices')->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->foreignId('payment_method_id')->constrained('payment_methods');
            $table->date('payment_date');
            $table->text('notes')->nullable();
            $table->string('receipt_number')->nullable();
            $table->foreignId('received_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_payments');
    }
};
