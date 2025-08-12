<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Vendors/Suppliers Table
        Schema::create('medicine_vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company_name')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone');
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('trade_license')->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0); // Opening due
            $table->decimal('current_balance', 15, 2)->default(0); // Current due (+ = we owe them, - = they owe us)
            $table->enum('balance_type', ['due', 'advance'])->default('due'); // due = we owe, advance = they owe
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->integer('payment_terms_days')->default(30); // Payment terms in days
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Shorter index names
            $table->index(['name', 'phone'], 'vendors_name_phone_idx');
            $table->index('current_balance', 'vendors_balance_idx');
        });

        // Vendor Transactions (Purchase & Payments)
        Schema::create('medicine_vendor_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_no')->unique();
            $table->foreignId('vendor_id')->constrained('medicine_vendors')->onDelete('cascade');
            $table->enum('type', ['purchase', 'payment', 'adjustment']);
            $table->decimal('amount', 15, 2);
            $table->decimal('due_amount', 15, 2)->default(0); // For purchases
            $table->decimal('paid_amount', 15, 2)->default(0); // Amount paid immediately
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending');
            $table->string('reference_type')->nullable(); // 'medicine_purchase', 'direct_payment'
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('payment_method')->nullable(); // cash, bank_transfer, cheque
            $table->string('cheque_no')->nullable();
            $table->date('cheque_date')->nullable();
            $table->text('description');
            $table->date('transaction_date');
            $table->date('due_date')->nullable(); // For purchases
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            // Shorter index names
            $table->index(['vendor_id', 'type', 'transaction_date'], 'vendor_trans_lookup_idx');
            $table->index(['payment_status', 'due_date'], 'vendor_trans_payment_idx');
        });

        // Purchase Orders (Optional - for better tracking)
        Schema::create('medicine_purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique();
            $table->foreignId('vendor_id')->constrained('medicine_vendors');
            $table->date('order_date');
            $table->date('expected_delivery_date')->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->enum('status', ['pending', 'partial', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        // Purchase Order Items
        Schema::create('medicine_purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('medicine_purchase_orders')->onDelete('cascade');
            $table->foreignId('medicine_id')->constrained('medicines');
            $table->integer('ordered_quantity');
            $table->integer('received_quantity')->default(0);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->timestamps();
        });

        // Vendor Payments (Detailed payment tracking)
        Schema::create('medicine_vendor_payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_no')->unique();
            $table->foreignId('vendor_id')->constrained('medicine_vendors');
            $table->decimal('amount', 15, 2);
            $table->string('payment_method'); // cash, bank_transfer, cheque, mobile_banking
            $table->string('reference_no')->nullable(); // Bank reference, cheque no, etc.
            $table->date('payment_date');
            $table->text('description');
            $table->json('allocated_transactions')->nullable(); // Which purchases this payment covers
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            // Shorter index name
            $table->index(['vendor_id', 'payment_date'], 'vendor_payments_lookup_idx');
        });

        // Add vendor_id to medicine_stocks table
        Schema::table('medicine_stocks', function (Blueprint $table) {
            $table->foreignId('vendor_id')->nullable()->after('medicine_id')->constrained('medicine_vendors')->onDelete('set null');
            $table->foreignId('purchase_order_id')->nullable()->after('vendor_id')->constrained('medicine_purchase_orders')->onDelete('set null');
            $table->decimal('due_amount', 10, 2)->default(0)->after('sale_price'); // Amount due to vendor for this stock
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('paid')->after('due_amount');
        });

        // Add vendor transaction reference to stock_transactions
        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->foreignId('vendor_transaction_id')->nullable()->after('reference_id')->constrained('medicine_vendor_transactions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('stock_transactions', function (Blueprint $table) {
            $table->dropForeign(['vendor_transaction_id']);
            $table->dropColumn('vendor_transaction_id');
        });

        Schema::table('medicine_stocks', function (Blueprint $table) {
            $table->dropForeign(['vendor_id', 'purchase_order_id']);
            $table->dropColumn(['vendor_id', 'purchase_order_id', 'due_amount', 'payment_status']);
        });

        Schema::dropIfExists('medicine_vendor_payments');
        Schema::dropIfExists('medicine_purchase_order_items');
        Schema::dropIfExists('medicine_purchase_orders');
        Schema::dropIfExists('medicine_vendor_transactions');
        Schema::dropIfExists('medicine_vendors');
    }
};
