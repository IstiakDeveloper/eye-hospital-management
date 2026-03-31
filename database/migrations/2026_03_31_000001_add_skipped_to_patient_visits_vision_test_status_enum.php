<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Extend ENUM to include 'skipped' so doctors can proceed without vision test.
        // MySQL syntax; if you use a different DB, adjust accordingly.
        DB::statement(
            "ALTER TABLE patient_visits MODIFY vision_test_status ENUM('pending','in_progress','completed','skipped') NOT NULL DEFAULT 'pending'"
        );
    }

    public function down(): void
    {
        // Best-effort rollback: convert 'skipped' -> 'pending' then remove enum value.
        DB::statement("UPDATE patient_visits SET vision_test_status = 'pending' WHERE vision_test_status = 'skipped'");
        DB::statement(
            "ALTER TABLE patient_visits MODIFY vision_test_status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending'"
        );
    }
};
