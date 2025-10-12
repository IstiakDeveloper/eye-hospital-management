<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Optics Vendors Table
        Schema::create('optics_vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company_name')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone');
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('trade_license')->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->enum('balance_type', ['due', 'advance'])->default('due');
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->integer('payment_terms_days')->default(30);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['name', 'phone'], 'optics_vendors_name_phone_idx');
            $table->index('current_balance', 'optics_vendors_balance_idx');
        });

        // Optics Vendor Transactions Table (for tracking purchases and payments)
        Schema::create('optics_vendor_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_no')->unique();
            $table->foreignId('vendor_id')->constrained('optics_vendors')->onDelete('cascade');
            $table->enum('type', ['purchase', 'payment', 'return', 'adjustment']);
            $table->decimal('amount', 15, 2);
            $table->decimal('previous_balance', 15, 2);
            $table->decimal('new_balance', 15, 2);
            $table->string('reference_type')->nullable(); // glasses_purchase, payment, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('description');
            $table->date('transaction_date');
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['vendor_id', 'transaction_date']);
            $table->index('type');
        });

        // Glasses Purchases Table (similar to medicine_stocks)
        Schema::create('glasses_purchases', function (Blueprint $table) {
            $table->id();
            $table->string('purchase_no')->unique();
            $table->foreignId('vendor_id')->constrained('optics_vendors')->onDelete('restrict');
            $table->foreignId('glasses_id')->constrained('glasses')->onDelete('restrict');
            $table->integer('quantity');
            $table->decimal('unit_cost', 10, 2);
            $table->decimal('total_cost', 10, 2);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('due_amount', 10, 2)->default(0);
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending');
            $table->date('purchase_date');
            $table->text('notes')->nullable();
            $table->foreignId('added_by')->constrained('users');
            $table->foreignId('optics_transaction_id')->nullable()->constrained('optics_transactions');
            $table->timestamps();

            $table->index(['vendor_id', 'payment_status']);
            $table->index('purchase_date');
        });

        // Add vendor_id to glasses table (optional - to track default vendor)
        Schema::table('glasses', function (Blueprint $table) {
            $table->foreignId('default_vendor_id')->nullable()->after('is_active')->constrained('optics_vendors')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('glasses', function (Blueprint $table) {
            $table->dropForeign(['default_vendor_id']);
            $table->dropColumn('default_vendor_id');
        });

        Schema::dropIfExists('glasses_purchases');
        Schema::dropIfExists('optics_vendor_transactions');
        Schema::dropIfExists('optics_vendors');
    }
};
