<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('optics_sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('optics_sale_id')->constrained('optics_sales')->onDelete('cascade');
            $table->string('item_type'); // 'frame', 'lens', 'complete_glasses'
            $table->unsignedBigInteger('item_id');
            $table->string('item_name');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('optics_sale_items');
    }
};
