<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_test_groups', function (Blueprint $table) {
            $table->id();
            $table->string('group_number')->unique();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('visit_id')->nullable()->constrained('patient_visits')->nullOnDelete();

            // Pricing
            $table->decimal('total_original_price', 10, 2)->default(0);
            $table->decimal('total_discount', 10, 2)->default(0);
            $table->decimal('final_amount', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('due_amount', 10, 2)->default(0);
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending');

            // Test dates
            $table->date('test_date');
            $table->timestamp('completed_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('hospital_transaction_id')->nullable()->constrained('hospital_transactions')->nullOnDelete();

            $table->timestamps();

            $table->index(['patient_id', 'test_date']);
            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_test_groups');
    }
};
