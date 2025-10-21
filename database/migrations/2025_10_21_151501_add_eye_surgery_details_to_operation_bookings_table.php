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
        Schema::table('operation_bookings', function (Blueprint $table) {
            // Eye surgery specific details
            $table->string('surgery_type')->nullable()->after('operation_name'); // SICS/Phaco or custom
            $table->enum('eye_side', ['left', 'right'])->nullable()->after('surgery_type'); // Left Eye / Right Eye
            $table->string('lens_type')->nullable()->after('eye_side'); // Lens type (with custom option)
            $table->string('power')->nullable()->after('lens_type'); // Manual power input
            $table->text('surgery_remarks')->nullable()->after('power'); // Additional remarks
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('operation_bookings', function (Blueprint $table) {
            $table->dropColumn([
                'surgery_type',
                'eye_side',
                'lens_type',
                'power',
                'surgery_remarks'
            ]);
        });
    }
};
