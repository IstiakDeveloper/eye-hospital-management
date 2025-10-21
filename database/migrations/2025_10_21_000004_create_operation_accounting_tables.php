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
        // Operation Account Balance Table
        Schema::create('operation_account', function (Blueprint $table) {
            $table->id();
            $table->decimal('balance', 15, 2)->default(0);
            $table->timestamps();
        });

        // Operation Transactions Table (Income/Expense)
        Schema::create('operation_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_no')->unique(); // OI-xxx (Income) or OE-xxx (Expense)
            $table->enum('type', ['income', 'expense']);
            $table->decimal('amount', 10, 2);
            $table->string('category'); // Operation Payment, Refund, Equipment Purchase, etc.
            
            // References
            $table->string('reference_type')->nullable(); // OperationBooking, OperationPayment, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            
            $table->text('description');
            $table->date('transaction_date');
            
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            
            $table->index(['type', 'transaction_date']);
            $table->index(['reference_type', 'reference_id']);
        });

        // Operation Fund Transactions (Fund In/Out from Main Account)
        Schema::create('operation_fund_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_no')->unique(); // OFI-xxx (Fund In) or OFO-xxx (Fund Out)
            $table->enum('type', ['fund_in', 'fund_out']);
            $table->decimal('amount', 10, 2);
            $table->string('purpose'); // Equipment Purchase, Salary, etc.
            $table->text('description');
            $table->date('date');
            
            $table->foreignId('added_by')->constrained('users');
            $table->timestamps();
            
            $table->index(['type', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operation_fund_transactions');
        Schema::dropIfExists('operation_transactions');
        Schema::dropIfExists('operation_account');
    }
};
