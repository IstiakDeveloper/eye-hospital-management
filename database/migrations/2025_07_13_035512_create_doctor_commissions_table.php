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
        Schema::create('doctor_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->foreignId('patient_payment_id')->constrained('patient_payments')->onDelete('cascade');
            $table->decimal('commission_amount', 10, 2);
            $table->decimal('commission_percentage', 5, 2)->nullable();
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->date('earned_date');
            $table->date('paid_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctor_commissions');
    }
};
