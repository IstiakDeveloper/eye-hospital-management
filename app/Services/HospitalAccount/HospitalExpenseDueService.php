<?php

namespace App\Services\HospitalAccount;

use App\Models\HospitalAccount;
use App\Models\HospitalDueExpense;
use App\Models\HospitalExpenseCategory;
use App\Models\HospitalExpenseVendor;
use App\Models\HospitalExpenseVendorPayment;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class HospitalExpenseDueService
{
    public function createVendor(array $data): HospitalExpenseVendor
    {
        return HospitalExpenseVendor::create($data);
    }

    public function recordDueExpense(
        HospitalExpenseVendor $vendor,
        int $expenseCategoryId,
        float $totalAmount,
        float $paidAmount,
        string $description,
        string $expenseDate
    ): HospitalDueExpense {
        if ($paidAmount > $totalAmount) {
            throw new \InvalidArgumentException('Paid amount cannot exceed total amount.');
        }

        $dueAmount = round($totalAmount - $paidAmount, 2);

        if ($paidAmount > 0 && $paidAmount > HospitalAccount::getBalance()) {
            throw new \InvalidArgumentException('Insufficient hospital account balance for paid amount.');
        }

        return DB::transaction(function () use ($vendor, $expenseCategoryId, $totalAmount, $paidAmount, $dueAmount, $description, $expenseDate) {
            $category = HospitalExpenseCategory::findOrFail($expenseCategoryId);
            $hospitalTransactionId = null;

            if ($paidAmount > 0) {
                $transaction = HospitalAccount::addExpense(
                    amount: $paidAmount,
                    category: $category->name,
                    description: "Due expense (paid) - {$vendor->name}: {$description}",
                    categoryId: $category->id,
                    date: $expenseDate
                );

                $transaction->update([
                    'reference_type' => 'hospital_due_expenses',
                    'reference_id' => null,
                ]);

                $hospitalTransactionId = $transaction->id;
            }

            $dueExpense = HospitalDueExpense::create([
                'expense_no' => HospitalDueExpense::generateExpenseNo(),
                'vendor_id' => $vendor->id,
                'expense_category_id' => $category->id,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'description' => $description,
                'expense_date' => $expenseDate,
                'hospital_transaction_id' => $hospitalTransactionId,
                'created_by' => auth()->id(),
            ]);

            if ($hospitalTransactionId) {
                $dueExpense->hospitalTransaction?->update([
                    'reference_id' => $dueExpense->id,
                ]);
            }

            if ($dueAmount > 0) {
                $vendor->increment('current_balance', $dueAmount);
            }

            return $dueExpense->load(['vendor', 'expenseCategory']);
        });
    }

    public function makeVendorPayment(
        HospitalExpenseVendor $vendor,
        float $amount,
        string $description,
        string $paymentMethod = 'cash',
        ?string $referenceNo = null,
        ?string $paymentDate = null
    ): HospitalExpenseVendorPayment {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Payment amount must be greater than zero.');
        }

        if ($amount > (float) $vendor->current_balance) {
            throw new \InvalidArgumentException('Payment amount cannot exceed vendor due balance.');
        }

        if ($amount > HospitalAccount::getBalance()) {
            throw new \InvalidArgumentException('Insufficient hospital account balance.');
        }

        $allocations = $this->buildPaymentAllocations($vendor, $amount);

        if ($allocations->isEmpty()) {
            throw new \InvalidArgumentException('No outstanding due expenses found for this vendor.');
        }

        $paymentDate = $paymentDate ?? now()->toDateString();

        return DB::transaction(function () use ($vendor, $amount, $description, $paymentMethod, $referenceNo, $paymentDate, $allocations) {
            $payment = HospitalExpenseVendorPayment::create([
                'payment_no' => HospitalExpenseVendorPayment::generatePaymentNo(),
                'vendor_id' => $vendor->id,
                'amount' => $amount,
                'payment_method' => $paymentMethod,
                'reference_no' => $referenceNo,
                'description' => $description,
                'payment_date' => $paymentDate,
                'created_by' => auth()->id(),
            ]);

            $firstTransactionId = null;

            foreach ($allocations as $allocation) {
                /** @var HospitalDueExpense $dueExpense */
                $dueExpense = $allocation['expense'];
                $allocAmount = $allocation['amount'];
                $category = $dueExpense->expenseCategory;

                $transaction = HospitalAccount::addExpense(
                    amount: $allocAmount,
                    category: $category->name,
                    description: "Due expense payment - {$vendor->name} ({$category->name}): {$description}",
                    categoryId: $category->id,
                    date: $paymentDate
                );

                $transaction->update([
                    'reference_type' => 'hospital_expense_vendor_payments',
                    'reference_id' => $payment->id,
                ]);

                $firstTransactionId ??= $transaction->id;
            }

            if ($firstTransactionId) {
                $payment->update(['hospital_transaction_id' => $firstTransactionId]);
            }

            $vendor->decrement('current_balance', $amount);

            return $payment->load('vendor');
        });
    }

    /**
     * @return Collection<int, array{expense: HospitalDueExpense, amount: float}>
     */
    private function buildPaymentAllocations(HospitalExpenseVendor $vendor, float $amount): Collection
    {
        $remaining = $amount;
        $outstanding = $vendor->outstandingDueByExpenseId();
        $allocations = collect();

        $expenses = $vendor->dueExpenses()
            ->with('expenseCategory:id,name')
            ->orderBy('expense_date')
            ->orderBy('id')
            ->get();

        foreach ($expenses as $expense) {
            if ($remaining <= 0) {
                break;
            }

            $due = $outstanding[$expense->id] ?? 0.0;

            if ($due <= 0) {
                continue;
            }

            $allocAmount = min($due, $remaining);
            $allocations->push([
                'expense' => $expense,
                'amount' => $allocAmount,
            ]);
            $remaining = round($remaining - $allocAmount, 2);
        }

        if ($remaining > 0.009) {
            throw new \InvalidArgumentException('Payment could not be fully allocated to due expenses.');
        }

        return $allocations;
    }
}
