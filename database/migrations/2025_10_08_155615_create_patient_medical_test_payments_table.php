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
        Schema::create('patient_medical_test_payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique();
            $table->foreignId('patient_medical_test_id')->nullable()->constrained('patient_medical_tests')->onDelete('cascade');
            $table->foreignId('test_group_id')->nullable()->constrained('patient_test_groups')->onDelete('cascade');
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->foreignId('payment_method_id')->constrained('payment_methods');
            $table->date('payment_date');
            $table->text('notes')->nullable();
            $table->foreignId('received_by')->constrained('users');
            $table->timestamps();

            $table->index('payment_date');
            $table->index('test_group_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_medical_test_payments');
    }
};
