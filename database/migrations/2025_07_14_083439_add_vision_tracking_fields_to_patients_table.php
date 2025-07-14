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
        Schema::table('patients', function (Blueprint $table) {
            // Add progression tracking columns
            $table->enum('vision_test_status', ['pending', 'in_progress', 'completed'])->default('pending')->after('payment_status');
            $table->enum('prescription_status', ['pending', 'completed'])->default('pending')->after('vision_test_status');
            $table->enum('overall_status', ['registration', 'payment', 'vision_test', 'prescription', 'completed'])->default('registration')->after('prescription_status');

            // Track when each step was completed
            $table->timestamp('payment_completed_at')->nullable()->after('overall_status');
            $table->timestamp('vision_test_completed_at')->nullable()->after('payment_completed_at');
            $table->timestamp('prescription_completed_at')->nullable()->after('vision_test_completed_at');

            // For return visits
            $table->boolean('is_return_visit')->default(false)->after('prescription_completed_at');
            $table->foreignId('previous_visit_id')->nullable()->constrained('patients')->nullOnDelete()->after('is_return_visit');

            // Update existing index
            $table->index(['overall_status', 'vision_test_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropIndex(['overall_status', 'vision_test_status']);
            $table->dropColumn([
                'vision_test_status',
                'prescription_status',
                'overall_status',
                'payment_completed_at',
                'vision_test_completed_at',
                'prescription_completed_at',
                'is_return_visit',
                'previous_visit_id'
            ]);
        });
    }
};
