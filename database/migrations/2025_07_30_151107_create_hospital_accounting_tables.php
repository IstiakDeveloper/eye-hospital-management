<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hospital_account', function (Blueprint $table) {
            $table->id();
            $table->decimal('balance', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('hospital_fund_transactions', function (Blueprint $table) {
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

        Schema::create('hospital_expense_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default expense categories
        DB::table('hospital_expense_categories')->insert([
            ['name' => 'Medicine Purchase', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Optics Purchase', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Medicine Vendor Payment', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Optics Vendor Payment', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Salary', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Utility Bills', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Maintenance', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Equipment Purchase', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Other Expense', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        Schema::create('hospital_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_no');
            $table->enum('type', ['income', 'expense']);
            $table->decimal('amount', 15, 2);
            $table->string('category');
            $table->foreignId('expense_category_id')->nullable()->constrained('hospital_expense_categories');
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
        Schema::dropIfExists('hospital_transactions');
        Schema::dropIfExists('hospital_fund_transactions');
        Schema::dropIfExists('hospital_expense_categories');
        Schema::dropIfExists('hospital_account');
    }
};
