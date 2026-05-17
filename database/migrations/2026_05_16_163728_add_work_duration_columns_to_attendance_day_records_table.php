<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_day_records', function (Blueprint $table) {
            $table->unsignedSmallInteger('minutes_worked')->nullable()->after('minutes_late');
            $table->unsignedSmallInteger('minutes_early_leave')->nullable()->after('minutes_worked');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_day_records', function (Blueprint $table) {
            $table->dropColumn(['minutes_worked', 'minutes_early_leave']);
        });
    }
};
