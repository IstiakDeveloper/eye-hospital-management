<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_payments', function (Blueprint $table) {
            $table->foreignId('hospital_transaction_id')->nullable()->constrained('hospital_transactions')->after('received_by');
        });

        Schema::table('medicine_sales', function (Blueprint $table) {
            $table->foreignId('medicine_transaction_id')->nullable()->constrained('medicine_transactions')->after('sold_by');
        });

        Schema::table('medicine_stocks', function (Blueprint $table) {
            $table->foreignId('medicine_transaction_id')->nullable()->constrained('medicine_transactions')->after('added_by');
        });

        // For glasses sales (when implemented)
        if (Schema::hasTable('prescription_glasses')) {
            Schema::table('prescription_glasses', function (Blueprint $table) {
                $table->foreignId('optics_transaction_id')->nullable()->constrained('optics_transactions')->after('expected_delivery');
            });
        }
    }

    public function down(): void
    {
        Schema::table('patient_payments', function (Blueprint $table) {
            $table->dropForeign(['hospital_transaction_id']);
            $table->dropColumn('hospital_transaction_id');
        });

        Schema::table('medicine_sales', function (Blueprint $table) {
            $table->dropForeign(['medicine_transaction_id']);
            $table->dropColumn('medicine_transaction_id');
        });

        Schema::table('medicine_stocks', function (Blueprint $table) {
            $table->dropForeign(['medicine_transaction_id']);
            $table->dropColumn('medicine_transaction_id');
        });

        if (Schema::hasTable('prescription_glasses')) {
            Schema::table('prescription_glasses', function (Blueprint $table) {
                $table->dropForeign(['optics_transaction_id']);
                $table->dropColumn('optics_transaction_id');
            });
        }
    }
};
