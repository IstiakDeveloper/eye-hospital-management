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
        Schema::create('operation_payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_no')->unique(); // Auto-generated: OPY-20251021-0001
            $table->foreignId('operation_booking_id')->constrained()->onDelete('cascade');
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');

            $table->decimal('amount', 10, 2);
            $table->enum('payment_type', ['advance', 'partial', 'full', 'refund'])->default('advance');
            $table->enum('payment_method', ['cash', 'card', 'mobile_banking', 'bank_transfer'])->default('cash');
            $table->string('payment_reference')->nullable(); // Transaction ID, Check No, etc.

            $table->date('payment_date');
            $table->text('notes')->nullable();

            $table->foreignId('received_by')->constrained('users');
            $table->timestamps();

            $table->index(['operation_booking_id', 'payment_date']);
            $table->index('payment_date');
            $table->index('payment_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operation_payments');
    }
};
