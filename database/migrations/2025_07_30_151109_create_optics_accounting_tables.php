<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('optics_account', function (Blueprint $table) {
            $table->id();
            $table->decimal('balance', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('optics_fund_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_no')->unique();
            $table->enum('type', ['fund_in', 'fund_out']);
            $table->decimal('amount', 15, 2);
            $table->string('purpose');
            $table->text('description');
            $table->date('date');
            $table->foreignId('added_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('optics_expense_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('optics_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_no')->unique();
            $table->enum('type', ['income', 'expense']);
            $table->decimal('amount', 15, 2);
            $table->string('category');
            $table->foreignId('expense_category_id')->nullable()->constrained('optics_expense_categories');
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('description');
            $table->date('transaction_date');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('optics_transactions');
        Schema::dropIfExists('optics_fund_transactions');
        Schema::dropIfExists('optics_expense_categories');
        Schema::dropIfExists('optics_account');
    }
};
