<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('zkteco_user_id')->nullable()->after('role_id')->comment('ZKTeco device internal user id (uid)');
        });

        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->date('observed_on')->unique();
            $table->string('name');
            $table->string('note')->nullable();
            $table->timestamps();
        });

        Schema::create('employee_attendance_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->time('expected_check_in')->default('09:00:00');
            $table->time('expected_check_out')->default('18:00:00');
            $table->unsignedTinyInteger('grace_minutes')->default(10);
            $table->json('weekend_days')->comment('0=Sun .. 6=Sat (PHP w)');
            $table->timestamps();

            $table->unique('user_id');
        });

        Schema::create('attendance_devices', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('external_device_id')->unique();
            $table->string('name');
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });

        Schema::create('attendance_punches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_device_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('zk_uid')->nullable()->index();
            $table->string('zk_employee_code', 64)->nullable()->index();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('punched_at');
            $table->unsignedTinyInteger('state')->nullable();
            $table->unsignedTinyInteger('punch_type')->nullable();
            $table->string('attendance_sync_type', 32)->nullable();
            $table->string('dedupe_hash', 64)->unique();
            $table->timestamps();

            $table->index(['user_id', 'punched_at']);
        });

        Schema::create('attendance_day_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('work_date');
            $table->dateTime('first_in_at')->nullable();
            $table->dateTime('last_out_at')->nullable();
            $table->string('status', 32);
            $table->unsignedSmallInteger('minutes_late')->nullable();
            $table->timestamp('calculated_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'work_date']);
            $table->index('work_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_day_records');
        Schema::dropIfExists('attendance_punches');
        Schema::dropIfExists('attendance_devices');
        Schema::dropIfExists('employee_attendance_settings');
        Schema::dropIfExists('holidays');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('zkteco_user_id');
        });
    }
};
