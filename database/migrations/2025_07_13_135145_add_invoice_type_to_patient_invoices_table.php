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
        Schema::table('patient_invoices', function (Blueprint $table) {
            $table->string('invoice_type')
                ->default('general')
                ->after('invoice_number')
                ->comment('registration, consultation, vision_test, medicine, procedure');

            $table->index('invoice_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_invoices', function (Blueprint $table) {
            $table->dropIndex(['invoice_type']);
            $table->dropColumn('invoice_type');
        });
    }
};
