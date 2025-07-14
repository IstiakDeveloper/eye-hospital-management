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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('expense_number')->unique(); // Auto-generated
            $table->foreignId('expense_category_id')->constrained('expense_categories');
            $table->decimal('amount', 10, 2);
            $table->text('description');
            $table->date('expense_date');
            $table->foreignId('payment_method_id')->constrained('payment_methods');
            $table->string('vendor_name')->nullable();
            $table->string('receipt_number')->nullable();
            $table->json('attachments')->nullable(); // File paths
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
