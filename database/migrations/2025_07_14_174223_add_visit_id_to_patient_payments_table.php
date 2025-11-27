<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_payments', function (Blueprint $table) {
            if (!Schema::hasColumn('patient_payments', 'visit_id')) {
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
    }
};
