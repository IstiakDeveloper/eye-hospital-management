<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('optics_sales', function (Blueprint $table) {
            // Make patient_id nullable
            $table->foreignId('patient_id')->nullable()->change();

            // Add customer information fields
            $table->string('customer_name')->after('patient_id');
            $table->string('customer_phone')->nullable()->after('customer_name');
            $table->string('customer_email')->nullable()->after('customer_phone');
        });
    }

    public function down()
    {
        Schema::table('optics_sales', function (Blueprint $table) {
            // Remove customer information fields
            $table->dropColumn(['customer_name', 'customer_phone', 'customer_email']);

            // Make patient_id required again
            $table->foreignId('patient_id')->nullable(false)->change();
        });
    }
};
