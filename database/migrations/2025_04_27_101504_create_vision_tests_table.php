<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vision_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->string('right_eye_vision')->nullable();
            $table->string('left_eye_vision')->nullable();
            $table->float('right_eye_power')->nullable();
            $table->float('left_eye_power')->nullable();
            $table->string('right_eye_pressure')->nullable();
            $table->string('left_eye_pressure')->nullable();
            $table->text('additional_notes')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('test_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vision_tests');
    }
};
