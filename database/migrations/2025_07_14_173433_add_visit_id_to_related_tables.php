<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add visit_id to patient_payments table
        Schema::table('patient_payments', function (Blueprint $table) {
            if (!Schema::hasColumn('patient_payments', 'visit_id')) {
                $table->foreignId('visit_id')->nullable()->constrained('patient_visits')->nullOnDelete()->after('patient_id');
            }
        });

        // Add visit_id to patient_invoices table
        Schema::table('patient_invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('patient_invoices', 'visit_id')) {
                $table->foreignId('visit_id')->nullable()->constrained('patient_visits')->nullOnDelete()->after('patient_id');
            }
        });

        // Add visit_id to vision_tests table
        Schema::table('vision_tests', function (Blueprint $table) {
            if (!Schema::hasColumn('vision_tests', 'visit_id')) {
                $table->foreignId('visit_id')->nullable()->constrained('patient_visits')->nullOnDelete()->after('patient_id');
            }
        });

        // Add visit_id to appointments table
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'visit_id')) {
                $table->foreignId('visit_id')->nullable()->constrained('patient_visits')->nullOnDelete()->after('patient_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('patient_payments', function (Blueprint $table) {
            $table->dropForeign(['visit_id']);
            $table->dropColumn('visit_id');
        });

        Schema::table('patient_invoices', function (Blueprint $table) {
            $table->dropForeign(['visit_id']);
            $table->dropColumn('visit_id');
        });

        Schema::table('vision_tests', function (Blueprint $table) {
            $table->dropForeign(['visit_id']);
            $table->dropColumn('visit_id');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['visit_id']);
            $table->dropColumn('visit_id');
        });
    }
};
