<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create Fixed Asset Vendors Table
        Schema::create('fixed_asset_vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company_name')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone');
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->decimal('current_balance', 15, 2)->default(0); // Total due to this vendor
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['name', 'phone']);
        });

        // Create Vendor Payments Table
        Schema::create('fixed_asset_vendor_payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_no')->unique();
            $table->foreignId('vendor_id')->constrained('fixed_asset_vendors')->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->string('payment_method')->default('cash'); // cash, bank_transfer, cheque
            $table->string('reference_no')->nullable();
            $table->date('payment_date');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['vendor_id', 'payment_date']);
        });

        // Modify Fixed Assets Table
        Schema::table('fixed_assets', function (Blueprint $table) {
            // Add vendor_id
            $table->foreignId('vendor_id')->nullable()->after('asset_number')->constrained('fixed_asset_vendors')->onDelete('set null');

            // Remove individual due tracking - we'll track at vendor level
            // Keep paid_amount to track what we paid for this specific asset
        });

        // Remove old fixed_asset_payments table as payments now go to vendor
        Schema::dropIfExists('fixed_asset_payments');
    }

    public function down(): void
    {
        // Recreate fixed_asset_payments
        Schema::create('fixed_asset_payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_no')->unique();
            $table->foreignId('fixed_asset_id')->constrained('fixed_assets')->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->date('payment_date');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::table('fixed_assets', function (Blueprint $table) {
            $table->dropForeign(['vendor_id']);
            $table->dropColumn('vendor_id');
        });

        Schema::dropIfExists('fixed_asset_vendor_payments');
        Schema::dropIfExists('fixed_asset_vendors');
    }
};
