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
        Schema::create('financial_reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_type'); // 'daily', 'weekly', 'monthly', 'yearly'
            $table->date('report_date');
            $table->json('report_data'); // JSON data with income, expense, profit, etc.
            $table->decimal('total_income', 15, 2)->default(0);
            $table->decimal('total_expense', 15, 2)->default(0);
            $table->decimal('net_profit', 15, 2)->default(0);
            $table->foreignId('generated_by')->constrained('users');
            $table->timestamps();

            $table->unique(['report_type', 'report_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_reports');
    }
};
