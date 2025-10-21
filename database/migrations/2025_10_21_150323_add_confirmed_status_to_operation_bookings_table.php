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
        // Drop the old enum and recreate with 'confirmed' added
        DB::statement("ALTER TABLE `operation_bookings` MODIFY COLUMN `status` ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to old enum without 'confirmed'
        DB::statement("ALTER TABLE `operation_bookings` MODIFY COLUMN `status` ENUM('scheduled', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled'");
    }
};
