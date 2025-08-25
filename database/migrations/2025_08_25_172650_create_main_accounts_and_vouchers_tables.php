<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('main_accounts', function (Blueprint $table) {
            $table->id();
            $table->decimal('balance', 20, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('main_account_vouchers', function (Blueprint $table) {
            $table->id(); // This will be your SL No
            $table->string('voucher_no')->unique(); // Auto generated like 01, 02, etc
            $table->enum('voucher_type', ['Debit', 'Credit']);
            $table->date('date');
            $table->text('narration'); // Description of the transaction
            $table->decimal('amount', 15, 2);
            $table->string('source_account'); // hospital, medicine, optics
            $table->string('source_transaction_type'); // income, expense, fund_in, fund_out
            $table->string('source_voucher_no')->nullable(); // Original voucher number from source
            $table->unsignedBigInteger('source_reference_id')->nullable(); // Reference to original transaction
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            // Index for better performance
            $table->index(['date', 'voucher_type']);
            $table->index('source_account');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('main_account_vouchers');
        Schema::dropIfExists('main_accounts');
    }
};
