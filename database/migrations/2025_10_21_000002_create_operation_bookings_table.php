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
        Schema::create('operation_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_no')->unique(); // Auto-generated: OB-20251021-0001
            $table->foreignId('operation_id')->constrained()->onDelete('cascade');
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');

            // Operation Details
            $table->string('operation_name'); // Stored for history
            $table->decimal('operation_price', 10, 2);

            // Payment Details
            $table->decimal('total_amount', 10, 2);
            $table->decimal('advance_payment', 10, 2)->default(0);
            $table->decimal('due_amount', 10, 2);
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending');

            // Scheduling
            $table->date('scheduled_date');
            $table->time('scheduled_time')->nullable();

            // Status
            $table->enum('status', ['scheduled', 'completed', 'cancelled', 'rescheduled'])->default('scheduled');
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();

            // Audit
            $table->foreignId('booked_by')->constrained('users');
            $table->foreignId('performed_by')->nullable()->constrained('users');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['patient_id', 'scheduled_date']);
            $table->index('status');
            $table->index('payment_status');
            $table->index('scheduled_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operation_bookings');
    }
};
