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
        Schema::table('appointments', function (Blueprint $table) {
            $table->index(['status', 'appointment_date']);
            $table->index(['doctor_id', 'appointment_date']);
        });

        Schema::table('patient_visits', function (Blueprint $table) {
            $table->index(['selected_doctor_id', 'created_at']);
        });

        Schema::table('hospital_transactions', function (Blueprint $table) {
            $table->index(['type', 'transaction_date']);
        });

        Schema::table('patient_payments', function (Blueprint $table) {
            $table->index('payment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['status', 'appointment_date']);
            $table->dropIndex(['doctor_id', 'appointment_date']);
        });

        Schema::table('patient_visits', function (Blueprint $table) {
            $table->dropIndex(['selected_doctor_id', 'created_at']);
        });

        Schema::table('hospital_transactions', function (Blueprint $table) {
            $table->dropIndex(['type', 'transaction_date']);
        });

        Schema::table('patient_payments', function (Blueprint $table) {
            $table->dropIndex(['payment_date']);
        });
    }
};
