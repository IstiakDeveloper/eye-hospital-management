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
        Schema::create('patient_medical_tests', function (Blueprint $table) {
            $table->id();
            $table->string('test_number')->unique();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('visit_id')->nullable()->constrained('patient_visits')->nullOnDelete();
            $table->foreignId('test_group_id')->nullable()->constrained('patient_test_groups')->onDelete('cascade');
            $table->foreignId('medical_test_id')->constrained('medical_tests')->onDelete('restrict');

            // Pricing
            $table->decimal('original_price', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('final_price', 10, 2);

            // Payment
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('due_amount', 10, 2)->default(0);
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending');

            // Test Status
            $table->enum('test_status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->date('test_date');
            $table->timestamp('completed_at')->nullable();

            // Results
            $table->text('result')->nullable();
            $table->text('notes')->nullable();
            $table->string('report_file')->nullable();

            // References
            $table->foreignId('ordered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('hospital_transaction_id')->nullable()->constrained('hospital_transactions')->nullOnDelete();

            $table->timestamps();

            $table->index(['patient_id', 'test_date']);
            $table->index(['test_status', 'payment_status']);
            $table->index('test_group_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_medical_tests');
    }
};
