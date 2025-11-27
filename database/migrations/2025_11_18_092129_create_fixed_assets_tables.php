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
        // Fixed Assets Table
        Schema::create('fixed_assets', function (Blueprint $table) {
            $table->id();
            $table->string('asset_number')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('due_amount', 15, 2);
            $table->date('purchase_date');
            $table->enum('status', ['active', 'fully_paid', 'inactive'])->default('active');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        // Fixed Asset Payments Table
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fixed_asset_payments');
        Schema::dropIfExists('fixed_assets');
    }
};
