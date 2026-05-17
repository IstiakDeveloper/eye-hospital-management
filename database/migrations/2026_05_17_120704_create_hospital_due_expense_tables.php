<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hospital_expense_vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company_name')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone');
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['name', 'phone']);
        });

        Schema::create('hospital_due_expenses', function (Blueprint $table) {
            $table->id();
            $table->string('expense_no')->unique();
            $table->foreignId('vendor_id')->constrained('hospital_expense_vendors')->cascadeOnDelete();
            $table->foreignId('expense_category_id')->constrained('hospital_expense_categories');
            $table->decimal('total_amount', 15, 2);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('due_amount', 15, 2)->default(0);
            $table->text('description');
            $table->date('expense_date');
            $table->foreignId('hospital_transaction_id')->nullable()->constrained('hospital_transactions')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['vendor_id', 'expense_date']);
        });

        Schema::create('hospital_expense_vendor_payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_no')->unique();
            $table->foreignId('vendor_id')->constrained('hospital_expense_vendors')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('payment_method')->default('cash');
            $table->string('reference_no')->nullable();
            $table->date('payment_date');
            $table->text('description')->nullable();
            $table->foreignId('hospital_transaction_id')->nullable()->constrained('hospital_transactions')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['vendor_id', 'payment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hospital_expense_vendor_payments');
        Schema::dropIfExists('hospital_due_expenses');
        Schema::dropIfExists('hospital_expense_vendors');
    }
};
