<?php

use App\Models\HospitalExpenseCategory;
use App\Models\HospitalIncomeCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
    $this->withoutMiddleware(\App\Http\Middleware\PermissionMiddleware::class);

    DB::table('hospital_account')->insert(['balance' => 0, 'created_at' => now(), 'updated_at' => now()]);
});

// ─── Index Page ───────────────────────────────────────────────────────────────

it('renders the receipt & payment report page', function () {
    $response = $this->get(route('reports.receipt-payment'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('Reports/ReceiptPayment')
        ->has('openingBalance')
        ->has('closingBalance')
        ->has('receipts')
        ->has('payments')
        ->has('totals')
        ->has('filters')
        ->has('verification')
    );
});

it('accepts date range filters', function () {
    $response = $this->get(route('reports.receipt-payment', [
        'from_date' => '2026-02-01',
        'to_date' => '2026-02-28',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('filters.from_date', '2026-02-01')
        ->where('filters.to_date', '2026-02-28')
    );
});

// ─── Closing Balance Accuracy ─────────────────────────────────────────────────

it('closing balance correctly reflects income transactions', function () {
    $category = HospitalIncomeCategory::create(['name' => 'OPD Income', 'is_active' => true]);

    DB::table('hospital_transactions')->insert([
        'transaction_no' => 'HI-001',
        'type' => 'income',
        'amount' => 5000,
        'income_category_id' => $category->id,
        'category' => 'OPD Income',
        'description' => 'Test income transaction',
        'transaction_date' => '2026-02-10',
        'created_by' => $this->user->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('hospital_account')->update(['balance' => 5000]);

    $response = $this->get(route('reports.receipt-payment', [
        'from_date' => '2026-02-01',
        'to_date' => '2026-02-28',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('totals.current_month_receipts', 5000)
        ->where('closingBalance.current', 5000)
    );
});

// ─── Sale Deletion / Reversal Bug Fix ────────────────────────────────────────

it('includes sale deletion expenses in the payments section', function () {
    DB::table('hospital_transactions')->insert([
        'transaction_no' => 'HE-REV-001',
        'type' => 'expense',
        'amount' => 1220,
        'expense_category_id' => null,
        'category' => 'Medicine Sale Deletion',
        'description' => 'Reversed medicine sale',
        'transaction_date' => '2026-02-14',
        'created_by' => $this->user->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    DB::table('hospital_account')->update(['balance' => -1220]);

    $response = $this->get(route('reports.receipt-payment', [
        'from_date' => '2026-02-01',
        'to_date' => '2026-02-28',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('payments', fn ($payments) => collect($payments)->contains(
            fn ($p) => $p['category'] === 'Medicine Sale Deletion'
                && (float) $p['current_month'] === 1220.0
                && $p['type'] === 'sale_deletion'
        ))
    );
});

it('closing balance matches actual bank balance when a sale deletion occurred in the period', function () {
    $incomeCategory = HospitalIncomeCategory::create(['name' => 'Medicine Income', 'is_active' => true]);

    DB::table('hospital_transactions')->insert([
        'transaction_no' => 'HI-001',
        'type' => 'income',
        'amount' => 10000,
        'income_category_id' => $incomeCategory->id,
        'category' => 'Medicine Income',
        'description' => 'Test medicine income',
        'transaction_date' => '2026-02-05',
        'created_by' => $this->user->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Reversal of a sale from a previous period
    DB::table('hospital_transactions')->insert([
        'transaction_no' => 'HE-REV-001',
        'type' => 'expense',
        'amount' => 1220,
        'expense_category_id' => null,
        'category' => 'Medicine Sale Deletion',
        'description' => 'Reversed medicine sale from January',
        'transaction_date' => '2026-02-14',
        'created_by' => $this->user->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Actual bank balance = 10000 income - 1220 reversal = 8780
    DB::table('hospital_account')->update(['balance' => 8780]);

    $response = $this->get(route('reports.receipt-payment', [
        'from_date' => '2026-02-01',
        'to_date' => '2026-02-28',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('closingBalance.current', 8780)
    );
});

it('closing balance is balanced (receipt side equals payment side)', function () {
    $incomeCategory = HospitalIncomeCategory::create(['name' => 'OPD Income', 'is_active' => true]);
    $expenseCategory = HospitalExpenseCategory::create(['name' => 'Salary', 'is_active' => true]);

    DB::table('hospital_transactions')->insert(
        ['transaction_no' => 'HI-001', 'type' => 'income', 'amount' => 5000, 'income_category_id' => $incomeCategory->id, 'expense_category_id' => null, 'category' => 'OPD Income', 'description' => 'Test income', 'transaction_date' => '2026-02-05', 'created_by' => $this->user->id, 'created_at' => now(), 'updated_at' => now()]
    );
    DB::table('hospital_transactions')->insert(
        ['transaction_no' => 'HE-001', 'type' => 'expense', 'amount' => 2000, 'expense_category_id' => $expenseCategory->id, 'income_category_id' => null, 'category' => 'Salary', 'description' => 'Test salary expense', 'transaction_date' => '2026-02-15', 'created_by' => $this->user->id, 'created_at' => now(), 'updated_at' => now()]
    );
    DB::table('hospital_transactions')->insert(
        ['transaction_no' => 'HE-REV-001', 'type' => 'expense', 'amount' => 500, 'expense_category_id' => null, 'income_category_id' => null, 'category' => 'Medicine Sale Deletion', 'description' => 'Reversed sale', 'transaction_date' => '2026-02-20', 'created_by' => $this->user->id, 'created_at' => now(), 'updated_at' => now()]
    );
    DB::table('hospital_account')->update(['balance' => 2500]);

    $response = $this->get(route('reports.receipt-payment', [
        'from_date' => '2026-02-01',
        'to_date' => '2026-02-28',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('verification.current_is_balanced', true)
        ->where('verification.current_difference', 0.0)
    );
});
