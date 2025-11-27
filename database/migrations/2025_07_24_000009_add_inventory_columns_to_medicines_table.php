<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->integer('total_stock')->default(0)->after('is_active');
            $table->decimal('average_buy_price', 10, 2)->default(0)->after('total_stock');
            $table->decimal('standard_sale_price', 10, 2)->default(0)->after('average_buy_price');
            $table->boolean('track_stock')->default(true)->after('standard_sale_price');
            $table->string('unit', 20)->default('piece')->after('track_stock'); // piece, bottle, box, etc
        });
    }

    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropColumn([
                'total_stock',
                'average_buy_price',
                'standard_sale_price',
                'track_stock',
                'unit'
            ]);
        });
    }
};
