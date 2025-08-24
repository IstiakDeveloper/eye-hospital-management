<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('patient_visits', function (Blueprint $table) {
            $table->id();
            $table->string('visit_id')->unique(); // PV-20250714-0001
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('selected_doctor_id')->nullable()->constrained('doctors')->nullOnDelete();

            // Visit financial details
            $table->decimal('registration_fee', 10, 2)->default(100.00);
            $table->decimal('doctor_fee', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->enum('discount_type', ['percentage', 'amount'])->nullable();
            $table->decimal('discount_value', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('final_amount', 10, 2)->default(0);
            $table->decimal('total_paid', 10, 2)->default(0);
            $table->decimal('total_due', 10, 2)->default(0);

            // Visit status tracking
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending');
            $table->enum('vision_test_status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->enum('prescription_status', ['pending', 'completed'])->default('pending');
            $table->enum('overall_status', ['payment', 'vision_test', 'prescription', 'completed'])->default('payment');

            // Visit timestamps
            $table->timestamp('payment_completed_at')->nullable();
            $table->timestamp('vision_test_completed_at')->nullable();
            $table->timestamp('prescription_completed_at')->nullable();

            // Visit notes
            $table->text('visit_notes')->nullable();
            $table->text('chief_complaint')->nullable(); // Main problem

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Indexes
            $table->index(['patient_id', 'overall_status']);
            $table->index(['payment_status', 'vision_test_status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_visits');
    }
};
