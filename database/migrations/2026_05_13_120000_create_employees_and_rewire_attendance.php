<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_code')->unique();
            $table->string('name');
            $table->string('phone', 32)->nullable();
            $table->string('email')->nullable();
            $table->string('department')->nullable();
            $table->string('designation')->nullable();
            $table->date('date_of_join')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('zkteco_user_id')->nullable()->unique();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        $userIds = collect();
        if (Schema::hasTable('employee_attendance_settings')) {
            $userIds = $userIds->merge(DB::table('employee_attendance_settings')->pluck('user_id'));
        }
        if (Schema::hasTable('attendance_day_records')) {
            $userIds = $userIds->merge(DB::table('attendance_day_records')->pluck('user_id'));
        }
        if (Schema::hasTable('attendance_punches')) {
            $userIds = $userIds->merge(DB::table('attendance_punches')->whereNotNull('user_id')->pluck('user_id'));
        }
        if (Schema::hasColumn('users', 'zkteco_user_id')) {
            $userIds = $userIds->merge(DB::table('users')->whereNotNull('zkteco_user_id')->pluck('id'));
        }

        $userIds = $userIds->unique()->filter()->values();

        $userIdToEmployeeId = [];

        foreach ($userIds as $userId) {
            $user = DB::table('users')->where('id', $userId)->first();
            if (! $user) {
                continue;
            }

            $code = 'EMP-'.str_pad((string) $userId, 6, '0', STR_PAD_LEFT);
            $zk = $user->zkteco_user_id ?? null;

            $employeeId = DB::table('employees')->insertGetId([
                'employee_code' => $code,
                'name' => $user->name,
                'phone' => $user->phone ?? null,
                'email' => $user->email,
                'department' => null,
                'designation' => null,
                'date_of_join' => null,
                'is_active' => (bool) ($user->is_active ?? true),
                'zkteco_user_id' => $zk,
                'user_id' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $userIdToEmployeeId[(int) $userId] = $employeeId;
        }

        if (Schema::hasTable('employee_attendance_settings')) {
            Schema::table('employee_attendance_settings', function (Blueprint $table) {
                $table->foreignId('employee_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            });

            foreach (DB::table('employee_attendance_settings')->get() as $row) {
                $eid = $userIdToEmployeeId[(int) $row->user_id] ?? null;
                if ($eid) {
                    DB::table('employee_attendance_settings')->where('id', $row->id)->update(['employee_id' => $eid]);
                }
            }

            DB::table('employee_attendance_settings')->whereNull('employee_id')->delete();

            Schema::table('employee_attendance_settings', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropUnique(['user_id']);
                $table->dropColumn('user_id');
            });
        }

        if (Schema::hasTable('attendance_punches')) {
            Schema::table('attendance_punches', function (Blueprint $table) {
                $table->foreignId('employee_id')->nullable()->after('zk_employee_code')->constrained()->nullOnDelete();
            });

            foreach (DB::table('attendance_punches')->whereNotNull('user_id')->cursor() as $punch) {
                $eid = $userIdToEmployeeId[(int) $punch->user_id] ?? null;
                if ($eid) {
                    DB::table('attendance_punches')->where('id', $punch->id)->update(['employee_id' => $eid]);
                }
            }

            DB::table('attendance_punches')->whereNotNull('user_id')->whereNull('employee_id')->delete();

            Schema::table('attendance_punches', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropIndex(['user_id', 'punched_at']);
                $table->dropColumn('user_id');
            });

            Schema::table('attendance_punches', function (Blueprint $table) {
                $table->index(['employee_id', 'punched_at']);
            });
        }

        if (Schema::hasTable('attendance_day_records')) {
            Schema::table('attendance_day_records', function (Blueprint $table) {
                $table->foreignId('employee_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            });

            foreach (DB::table('attendance_day_records')->cursor() as $rec) {
                $eid = $userIdToEmployeeId[(int) $rec->user_id] ?? null;
                if ($eid) {
                    DB::table('attendance_day_records')->where('id', $rec->id)->update(['employee_id' => $eid]);
                }
            }

            DB::table('attendance_day_records')->whereNull('employee_id')->delete();

            Schema::table('attendance_day_records', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropUnique(['user_id', 'work_date']);
                $table->dropColumn('user_id');
            });

            Schema::table('attendance_day_records', function (Blueprint $table) {
                $table->unique(['employee_id', 'work_date']);
            });
        }

        if (Schema::hasColumn('users', 'zkteco_user_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('zkteco_user_id');
            });
        }
    }

    public function down(): void
    {
        throw new \RuntimeException('This migration cannot be reversed safely. Restore from backup if needed.');
    }
};
