<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create hospital_income_categories table
        Schema::create('hospital_income_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add income_category_id to hospital_transactions
        Schema::table('hospital_transactions', function (Blueprint $table) {
            $table->foreignId('income_category_id')->nullable()->after('expense_category_id')->constrained('hospital_income_categories');
        });

        // Insert default income categories
        DB::table('hospital_income_categories')->insert([
            ['name' => 'OPD Income', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Patient Payment', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Consultation Fee', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Medical Test', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Optics Income', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Medicine Income', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Operation Income', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Other Income', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bank Interest', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hospital_transactions', function (Blueprint $table) {
            $table->dropForeign(['income_category_id']);
            $table->dropColumn('income_category_id');
        });

        Schema::dropIfExists('hospital_income_categories');
    }
};
