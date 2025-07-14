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
        Schema::create('service_charges', function (Blueprint $table) {
            $table->id();
            $table->string('service_name');
            $table->string('service_type'); // 'consultation', 'vision_test', 'procedure', 'other'
            $table->decimal('base_price', 10, 2);
            $table->decimal('doctor_fee', 10, 2)->default(0); // Doctor's share
            $table->decimal('hospital_fee', 10, 2)->default(0); // Hospital's share
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_charges');
    }
};
