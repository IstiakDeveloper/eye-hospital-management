<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('optics_sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('restrict');
            $table->foreignId('seller_id')->constrained('users')->onDelete('restrict');
            $table->decimal('glass_fitting_price', 10, 2);
            $table->decimal('total_amount', 10, 2);
            $table->decimal('advance_payment', 10, 2)->default(0);
            $table->decimal('due_amount', 10, 2)->default(0);
            $table->enum('status', ['pending', 'ready', 'delivered'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('optics_sales');
    }
};
