<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Categories posted by purchase and payment screens.
     *
     * @var list<string>
     */
    private array $automaticCategories = [
        'Medicine Purchase',
        'Medicine Vendor Payment',
        'Medicine Purchase Refund',
        'Optics Purchase',
        'Optics Vendor Payment',
        'Fixed Asset Purchase',
        'Fixed Asset Vendor Payment',
    ];

    public function up(): void
    {
        Schema::table('hospital_expense_categories', function (Blueprint $table) {
            $table->boolean('allows_manual_entry')->default(true)->after('is_active');
        });

        DB::table('hospital_expense_categories')
            ->whereIn('name', $this->automaticCategories)
            ->update(['allows_manual_entry' => false]);
    }

    public function down(): void
    {
        Schema::table('hospital_expense_categories', function (Blueprint $table) {
            $table->dropColumn('allows_manual_entry');
        });
    }
};
