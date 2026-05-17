<?php

namespace App\Http\Controllers\HospitalAccount;

use App\Http\Controllers\Controller;
use App\Http\Requests\HospitalAccount\StoreHospitalDueExpenseRequest;
use App\Http\Requests\HospitalAccount\StoreHospitalExpenseVendorPaymentRequest;
use App\Http\Requests\HospitalAccount\StoreHospitalExpenseVendorRequest;
use App\Models\HospitalAccount;
use App\Models\HospitalDueExpense;
use App\Models\HospitalExpenseCategory;
use App\Models\HospitalExpenseVendor;
use App\Models\HospitalExpenseVendorPayment;
use App\Services\HospitalAccount\HospitalExpenseDueService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DueExpenseController extends Controller
{
    public function index(Request $request)
    {
        $vendorId = $request->vendor_id ? (int) $request->vendor_id : null;

        $vendors = HospitalExpenseVendor::query()
            ->when($vendorId, fn ($q) => $q->where('id', $vendorId))
            ->orderBy('name')
            ->get(['id', 'name', 'company_name', 'phone', 'current_balance', 'is_active']);

        $vendorOptions = HospitalExpenseVendor::active()
            ->orderBy('name')
            ->get(['id', 'name', 'company_name', 'current_balance']);

        $dueExpenses = HospitalDueExpense::query()
            ->with(['vendor:id,name', 'expenseCategory:id,name'])
            ->when($vendorId, fn ($q) => $q->where('vendor_id', $vendorId))
            ->latest('expense_date')
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (HospitalDueExpense $expense) => [
                'id' => $expense->id,
                'expense_no' => $expense->expense_no,
                'vendor_name' => $expense->vendor->name,
                'category_name' => $expense->expenseCategory->name,
                'total_amount' => (float) $expense->total_amount,
                'paid_amount' => (float) $expense->paid_amount,
                'due_amount' => (float) $expense->due_amount,
                'description' => $expense->description,
                'expense_date' => $expense->expense_date->format('Y-m-d'),
            ]);

        $payments = HospitalExpenseVendorPayment::query()
            ->with(['vendor:id,name'])
            ->when($vendorId, fn ($q) => $q->where('vendor_id', $vendorId))
            ->latest('payment_date')
            ->latest('id')
            ->limit(30)
            ->get()
            ->map(fn (HospitalExpenseVendorPayment $payment) => [
                'id' => $payment->id,
                'payment_no' => $payment->payment_no,
                'vendor_name' => $payment->vendor->name,
                'amount' => (float) $payment->amount,
                'payment_method' => $payment->payment_method,
                'description' => $payment->description,
                'payment_date' => $payment->payment_date->format('Y-m-d'),
            ]);

        $expenseCategories = HospitalExpenseCategory::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('HospitalAccount/DueExpense', [
            'balance' => HospitalAccount::getBalance(),
            'vendors' => $vendors,
            'vendorOptions' => $vendorOptions,
            'dueExpenses' => $dueExpenses,
            'payments' => $payments,
            'expenseCategories' => $expenseCategories,
            'filters' => [
                'vendor_id' => $vendorId,
            ],
            'totals' => [
                'total_due' => (float) HospitalExpenseVendor::when($vendorId, fn ($q) => $q->where('id', $vendorId))->sum('current_balance'),
                'vendors_with_due' => HospitalExpenseVendor::when($vendorId, fn ($q) => $q->where('id', $vendorId))->where('current_balance', '>', 0)->count(),
                'total_expense_amount' => (float) HospitalDueExpense::when($vendorId, fn ($q) => $q->where('vendor_id', $vendorId))->sum('total_amount'),
            ],
        ]);
    }

    public function storeVendor(StoreHospitalExpenseVendorRequest $request, HospitalExpenseDueService $service)
    {
        $service->createVendor([
            ...$request->validated(),
            'is_active' => true,
            'current_balance' => 0,
        ]);

        return back()->with('success', 'Vendor added successfully!');
    }

    public function storeDueExpense(StoreHospitalDueExpenseRequest $request, HospitalExpenseDueService $service)
    {
        $vendor = HospitalExpenseVendor::findOrFail($request->vendor_id);

        try {
            $service->recordDueExpense(
                vendor: $vendor,
                expenseCategoryId: (int) $request->expense_category_id,
                totalAmount: (float) $request->total_amount,
                paidAmount: (float) $request->paid_amount,
                description: $request->description,
                expenseDate: $request->expense_date
            );
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['amount' => $e->getMessage()]);
        }

        return back()->with('success', 'Due expense recorded successfully!');
    }

    public function makePayment(
        StoreHospitalExpenseVendorPaymentRequest $request,
        HospitalExpenseVendor $hospitalExpenseVendor,
        HospitalExpenseDueService $service
    ) {
        try {
            $service->makeVendorPayment(
                vendor: $hospitalExpenseVendor,
                amount: (float) $request->amount,
                description: $request->description ?? 'Vendor payment',
                paymentMethod: $request->payment_method,
                referenceNo: $request->reference_no,
                paymentDate: $request->payment_date
            );
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['amount' => $e->getMessage()]);
        }

        return back()->with('success', 'Payment recorded successfully!');
    }
}
