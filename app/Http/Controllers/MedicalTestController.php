<?php

namespace App\Http\Controllers;

use App\Models\HospitalAccount;
use App\Models\HospitalTransaction;
use App\Models\MainAccount;
use App\Models\MainAccountVoucher;
use App\Models\MedicalTest;
use App\Models\Patient;
use App\Models\PatientMedicalTest;
use App\Models\PatientMedicalTestPayment;
use App\Models\PatientTestGroup;
use App\Models\PatientVisit;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MedicalTestController extends Controller
{
    // ==================== Test Master Management (Super Admin) ====================

    /**
     * Display test master list
     */
    public function testIndex()
    {
        $tests = MedicalTest::orderBy('category')
            ->orderBy('name')
            ->get();

        return Inertia::render('MedicalTests/TestIndex', [
            'tests' => $tests,
            'categories' => MedicalTest::getCategories()
        ]);
    }

    /**
     * Store new test
     */
    public function storeTest(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|unique:medical_tests,code',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string',
            'duration_minutes' => 'nullable|integer|min:1'
        ]);

        // Auto-generate code if not provided
        if (empty($validated['code'])) {
            $prefix = strtoupper(substr($validated['category'], 0, 2));
            $lastTest = MedicalTest::where('code', 'like', $prefix . '%')
                ->latest()
                ->first();
            $nextNumber = $lastTest ? intval(substr($lastTest->code, -3)) + 1 : 1;
            $validated['code'] = $prefix . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
        }

        MedicalTest::create($validated);

        return back()->with('success', 'Test created successfully!');
    }

    /**
     * Update test
     */
    public function updateTest(Request $request, MedicalTest $test)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string',
            'description' => 'nullable|string',
            'duration_minutes' => 'nullable|integer|min:1',
            'is_active' => 'boolean'
        ]);

        $test->update($validated);

        return back()->with('success', 'Test updated successfully!');
    }

    /**
     * Delete test
     */
    public function destroyTest(MedicalTest $test)
    {
        if ($test->patientTests()->exists()) {
            return back()->with('error', 'Cannot delete test with existing patient records!');
        }

        $test->delete();
        return back()->with('success', 'Test deleted successfully!');
    }

    // ==================== Patient Test Booking ====================

    /**
     * Show test booking page
     */
    public function create()
    {
        return Inertia::render('MedicalTests/Create', [
            'tests' => MedicalTest::where('is_active', true)
                ->orderBy('category')
                ->orderBy('name')
                ->get(),
            'paymentMethods' => PaymentMethod::where('is_active', true)->get(),
            'categories' => MedicalTest::getCategories()
        ]);
    }

    /**
     * Search patients for test booking
     */
    public function searchPatients(Request $request)
    {
        $search = $request->get('search');

        $patients = Patient::with(['visits' => function ($query) {
            $query->latest()->take(1);
        }])
            ->where(function ($query) use ($search) {
                $query->where('patient_id', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('nid_card', 'like', "%{$search}%");
            })
            ->limit(10)
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                    'age' => $patient->age,
                    'gender' => $patient->gender,
                    'last_visit_id' => $patient->visits->first()?->id,
                    'last_visit_number' => $patient->visits->first()?->visit_id,
                ];
            });

        return response()->json($patients);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'visit_id' => 'nullable|exists:patient_visits,id',
            'tests' => 'required|array|min:1',
            'tests.*.medical_test_id' => 'required|exists:medical_tests,id',
            'tests.*.discount_amount' => 'nullable|numeric|min:0',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'paid_amount' => 'required|numeric|min:0',
            'test_date' => 'nullable|date',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            $testDate = $validated['test_date'] ?? now()->toDateString();

            // Create Test Group
            $testGroup = PatientTestGroup::create([
                'group_number' => PatientTestGroup::generateGroupNumber(),
                'patient_id' => $validated['patient_id'],
                'visit_id' => $validated['visit_id'],
                'total_original_price' => 0,
                'total_discount' => 0,
                'final_amount' => 0,
                'paid_amount' => 0,
                'due_amount' => 0,
                'test_date' => $testDate,
                'created_by' => auth()->id()
            ]);

            $totalOriginal = 0;
            $totalDiscount = 0;
            $totalFinal = 0;

            // Create individual tests
            foreach ($validated['tests'] as $testData) {
                $medicalTest = MedicalTest::find($testData['medical_test_id']);
                $discountAmount = $testData['discount_amount'] ?? 0;
                $finalPrice = $medicalTest->price - $discountAmount;

                PatientMedicalTest::create([
                    'test_number' => PatientMedicalTest::generateTestNumber(),
                    'patient_id' => $validated['patient_id'],
                    'visit_id' => $validated['visit_id'],
                    'test_group_id' => $testGroup->id,
                    'medical_test_id' => $medicalTest->id,
                    'original_price' => $medicalTest->price,
                    'discount_amount' => $discountAmount,
                    'final_price' => $finalPrice,
                    'paid_amount' => 0,
                    'due_amount' => $finalPrice,
                    'test_date' => $testDate,
                    'created_by' => auth()->id()
                ]);

                $totalOriginal += $medicalTest->price;
                $totalDiscount += $discountAmount;
                $totalFinal += $finalPrice;
            }

            // Update group totals
            $testGroup->update([
                'total_original_price' => $totalOriginal,
                'total_discount' => $totalDiscount,
                'final_amount' => $totalFinal,
                'paid_amount' => $validated['paid_amount'],
                'due_amount' => max(0, $totalFinal - $validated['paid_amount'])
            ]);
            $testGroup->updatePaymentStatus();

            // Create payment if amount > 0
            if ($validated['paid_amount'] > 0) {
                // 1. Create Payment Record
                PatientMedicalTestPayment::create([
                    'payment_number' => PatientMedicalTestPayment::generatePaymentNumber(),
                    'test_group_id' => $testGroup->id,
                    'patient_id' => $validated['patient_id'],
                    'amount' => $validated['paid_amount'],
                    'payment_method_id' => $validated['payment_method_id'],
                    'payment_date' => $testDate,
                    'notes' => $validated['notes'],
                    'received_by' => auth()->id()
                ]);

                // 2. Update Hospital Account + Create Hospital Transaction with Medical Test category
                $medicalTestCategory = \App\Models\HospitalIncomeCategory::firstOrCreate(
                    ['name' => 'Medical Test'],
                    ['is_active' => true]
                );

                $hospitalTransaction = HospitalAccount::addIncome(
                    $validated['paid_amount'],
                    'Medical Test',
                    "Medical Test Payment - Group: {$testGroup->group_number}",
                    'medical_test',
                    $testGroup->id,
                    $testDate,
                    $medicalTestCategory->id
                );

                // Link transaction to group
                $testGroup->update(['hospital_transaction_id' => $hospitalTransaction->id]);

                // 3. Update Main Account + Create/Update Combined Daily Voucher
                $this->updateMainAccountVoucher(
                    date: $testDate,
                    amount: $validated['paid_amount'],
                    voucherType: 'Credit', // Income = Credit
                    sourceAccount: 'hospital',
                    sourceTransactionType: 'income',
                    description: "Medical Test Payment - Group: {$testGroup->group_number}",
                    sourceVoucherNo: $hospitalTransaction->transaction_no,
                    sourceReferenceId: $hospitalTransaction->id
                );
            }

            DB::commit();

            return redirect()->route('medical-tests.receipt', $testGroup->id)
                ->with('success', 'Test booking completed successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Medical Test Booking Failed: ' . $e->getMessage());

            return back()
                ->withInput()
                ->with('error', 'Failed to book tests: ' . $e->getMessage());
        }
    }

    /**
     * Add payment to existing test group
     */
    public function addPayment(Request $request, PatientTestGroup $testGroup)
    {
        if ($testGroup->payment_status === 'paid') {
            return back()->with('error', 'This test group is already fully paid!');
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $testGroup->due_amount,
            'payment_method_id' => 'required|exists:payment_methods,id',
            'payment_date' => 'nullable|date',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            $paymentDate = $validated['payment_date'] ?? now()->toDateString();

            // 1. Create Payment Record
            PatientMedicalTestPayment::create([
                'payment_number' => PatientMedicalTestPayment::generatePaymentNumber(),
                'test_group_id' => $testGroup->id,
                'patient_id' => $testGroup->patient_id,
                'amount' => $validated['amount'],
                'payment_method_id' => $validated['payment_method_id'],
                'payment_date' => $paymentDate,
                'notes' => $validated['notes'],
                'received_by' => auth()->id()
            ]);

            // 2. Update Test Group Payment Status
            $testGroup->increment('paid_amount', $validated['amount']);
            $testGroup->decrement('due_amount', $validated['amount']);
            $testGroup->updatePaymentStatus();

            // 3. Update Hospital Account + Create Hospital Transaction with Medical Test category
            $medicalTestCategory = \App\Models\HospitalIncomeCategory::firstOrCreate(
                ['name' => 'Medical Test'],
                ['is_active' => true]
            );

            $hospitalTransaction = HospitalAccount::addIncome(
                $validated['amount'],
                'Medical Test',
                "Medical Test Due Payment - Group: {$testGroup->group_number}",
                'medical_test',
                $testGroup->id,
                $paymentDate,
                $medicalTestCategory->id
            );

            // 4. Update Main Account + Create/Update Combined Daily Voucher
            $this->updateMainAccountVoucher(
                date: $paymentDate,
                amount: $validated['amount'],
                voucherType: 'Credit', // Income = Credit
                sourceAccount: 'hospital',
                sourceTransactionType: 'income',
                description: "Medical Test Due Payment - Group: {$testGroup->group_number}",
                sourceVoucherNo: $hospitalTransaction->transaction_no,
                sourceReferenceId: $hospitalTransaction->id
            );

            DB::commit();

            return redirect()->route('medical-tests.show', $testGroup->id)
                ->with('success', 'Payment added successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to add payment: ' . $e->getMessage());
        }
    }

    /**
     * Update Main Account with combined daily voucher
     */
    private function updateMainAccountVoucher(
        string $date,
        float $amount,
        string $voucherType,
        string $sourceAccount,
        string $sourceTransactionType,
        string $description,
        ?string $sourceVoucherNo = null,
        ?int $sourceReferenceId = null
    ): void {
        // Check if voucher already exists for this date, source account and transaction type
        $existingVoucher = MainAccountVoucher::where('date', $date)
            ->where('source_account', $sourceAccount)
            ->where('source_transaction_type', $sourceTransactionType)
            ->where('voucher_type', $voucherType)
            ->first();

        if ($existingVoucher) {
            // Update existing voucher
            $existingVoucher->increment('amount', $amount);

            // Append to narration
            $existingVoucher->update([
                'narration' => $existingVoucher->narration . " + {$description}",
            ]);

            // Update Main Account Balance
            $mainAccount = MainAccount::firstOrCreate([]);
            if ($voucherType === 'Credit') {
                $mainAccount->increment('balance', $amount);
            } else {
                $mainAccount->decrement('balance', $amount);
            }
        } else {
            // Create new voucher
            $mainAccount = MainAccount::firstOrCreate([]);

            if ($voucherType === 'Credit') {
                $mainAccount->increment('balance', $amount);
            } else {
                $mainAccount->decrement('balance', $amount);
            }

            // Generate Main Account Voucher Number
            $lastVoucher = MainAccountVoucher::orderBy('id', 'desc')->first();
            $voucherNo = $lastVoucher ? str_pad(((int) $lastVoucher->voucher_no) + 1, 2, '0', STR_PAD_LEFT) : '01';

            MainAccountVoucher::create([
                'voucher_no' => $voucherNo,
                'voucher_type' => $voucherType,
                'date' => $date,
                'narration' => "Hospital Income - Medical Test: {$description}",
                'amount' => $amount,
                'source_account' => $sourceAccount,
                'source_transaction_type' => $sourceTransactionType,
                'source_voucher_no' => $sourceVoucherNo,
                'source_reference_id' => $sourceReferenceId,
                'created_by' => auth()->id(),
            ]);
        }
    }

    /**
     * List all test groups
     */
    public function index(Request $request)
    {
    $query = PatientTestGroup::with(['patient', 'visit', 'tests.medicalTest', 'createdBy'])
        ->orderBy('created_at', 'desc');

        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('group_number', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('patient_id', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('test_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('test_date', '<=', $request->date_to);
        }

    // Always calculate stats for today only
    $statsQuery = PatientTestGroup::whereDate('test_date', now()->toDateString());

    $stats = [
        'today_total' => (float) $statsQuery->sum('final_amount'),
        'today_paid' => (float) $statsQuery->sum('paid_amount'),
        'today_due' => (float) $statsQuery->sum('due_amount'),
        'pending_count' => (int) $statsQuery->where('payment_status', '!=', 'paid')->count()
    ];

        $testGroups = $query->paginate(10)->withQueryString();

        return Inertia::render('MedicalTests/Index', [
            'testGroups' => $testGroups,
            'filters' => $request->only(['search', 'payment_status', 'date_from', 'date_to']),
            'stats' => $stats
        ]);
    }

    /**
     * Show test group details
     */
    public function show(PatientTestGroup $testGroup)
    {
        $testGroup->load([
            'patient',
            'visit',
            'tests.medicalTest',
            'payments.paymentMethod',
            'payments.receivedBy',
            'createdBy',
            'hospitalTransaction'
        ]);

        return Inertia::render('MedicalTests/Show', [
            'testGroup' => $testGroup
        ]);
    }

    /**
     * Show receipt page
     */
    public function receipt(PatientTestGroup $testGroup)
    {
        $testGroup->load([
            'patient',
            'visit',
            'tests.medicalTest',
            'payments.paymentMethod',
            'payments.receivedBy'
        ]);

        return Inertia::render('MedicalTests/Receipt', [
            'testGroup' => $testGroup
        ]);
    }

    /**
     * Print receipt (PDF)
     */
    public function printReceipt(PatientTestGroup $testGroup)
    {
        $testGroup->load([
            'patient',
            'visit',
            'tests.medicalTest',
            'payments'
        ]);

        return view('pdfs.medical-test-receipt', compact('testGroup'));
    }

    // ==================== Additional Payments ====================

    /**
     * Show payment page for due amount
     */
    public function paymentPage(PatientTestGroup $testGroup)
    {
        if ($testGroup->payment_status === 'paid') {
            return redirect()->route('medical-tests.show', $testGroup->id)
                ->with('error', 'This test group is already fully paid!');
        }

        $testGroup->load(['patient', 'tests.medicalTest', 'payments']);

        return Inertia::render('MedicalTests/Payment', [
            'testGroup' => $testGroup,
            'paymentMethods' => PaymentMethod::where('is_active', true)->get()
        ]);
    }


    // ==================== Test Result Management ====================

    /**
     * Update test result
     */
    public function updateResult(Request $request, PatientMedicalTest $test)
    {
        $validated = $request->validate([
            'result' => 'required|string',
            'notes' => 'nullable|string',
            'report_file' => 'nullable|file|mimes:pdf,jpg,png|max:2048',
            'test_status' => 'required|in:pending,in_progress,completed,cancelled'
        ]);

        if ($request->hasFile('report_file')) {
            $path = $request->file('report_file')->store('test-reports', 'public');
            $validated['report_file'] = $path;
        }

        if ($validated['test_status'] === 'completed') {
            $validated['completed_at'] = now();
        }

        $test->update($validated);

        return back()->with('success', 'Test result updated successfully!');
    }

    // ==================== Reports ====================

    /**
     * Daily test report
     */
    public function dailyReport(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        $testGroups = PatientTestGroup::with(['patient', 'tests.medicalTest', 'payments'])
            ->whereDate('test_date', $date)
            ->get();

        $summary = [
            'total_tests' => $testGroups->sum(fn($g) => $g->tests->count()),
            'total_amount' => $testGroups->sum('final_amount'),
            'total_paid' => $testGroups->sum('paid_amount'),
            'total_due' => $testGroups->sum('due_amount'),
            'total_discount' => $testGroups->sum('total_discount'),
            'total_groups' => $testGroups->count()
        ];

        // Group by test type
        $testsByType = [];
        foreach ($testGroups as $group) {
            foreach ($group->tests as $test) {
                $testName = $test->medicalTest->name;
                if (!isset($testsByType[$testName])) {
                    $testsByType[$testName] = [
                        'count' => 0,
                        'amount' => 0
                    ];
                }
                $testsByType[$testName]['count']++;
                $testsByType[$testName]['amount'] += $test->final_price;
            }
        }

        return Inertia::render('MedicalTests/DailyReport', [
            'testGroups' => $testGroups,
            'summary' => $summary,
            'testsByType' => $testsByType,
            'date' => $date
        ]);
    }

    /**
     * Monthly test report
     */
    public function monthlyReport(Request $request)
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month', now()->month);

        $testGroups = PatientTestGroup::with(['patient', 'tests.medicalTest'])
            ->whereYear('test_date', $year)
            ->whereMonth('test_date', $month)
            ->get();

        $summary = [
            'total_tests' => $testGroups->sum(fn($g) => $g->tests->count()),
            'total_amount' => $testGroups->sum('final_amount'),
            'total_paid' => $testGroups->sum('paid_amount'),
            'total_due' => $testGroups->sum('due_amount'),
            'total_discount' => $testGroups->sum('total_discount'),
            'total_groups' => $testGroups->count()
        ];

        return Inertia::render('MedicalTests/MonthlyReport', [
            'testGroups' => $testGroups,
            'summary' => $summary,
            'year' => $year,
            'month' => $month
        ]);
    }

    /**
     * Test-wise report
     */
    public function testWiseReport(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $tests = PatientMedicalTest::with(['medicalTest', 'patient'])
            ->whereBetween('test_date', [$startDate, $endDate])
            ->get()
            ->groupBy('medical_test_id')
            ->map(function ($group) {
                return [
                    'test_name' => $group->first()->medicalTest->name,
                    'test_code' => $group->first()->medicalTest->code,
                    'count' => $group->count(),
                    'total_amount' => $group->sum('final_price'),
                    'total_discount' => $group->sum('discount_amount'),
                    'total_original' => $group->sum('original_price')
                ];
            })
            ->values();

        return Inertia::render('MedicalTests/TestWiseReport', [
            'tests' => $tests,
            'startDate' => $startDate,
            'endDate' => $endDate
        ]);
    }

    // ==================== Delete/Cancel ====================

    /**
     * Cancel test group (if not paid)
     */
    public function cancel(PatientTestGroup $testGroup)
    {
        if ($testGroup->paid_amount > 0) {
            return back()->with('error', 'Cannot cancel test group with payments!');
        }

        try {
            DB::beginTransaction();

            $testGroup->tests()->delete();
            $testGroup->delete();

            DB::commit();

            return redirect()->route('medical-tests.index')
                ->with('success', 'Test group cancelled successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to cancel: ' . $e->getMessage());
        }
    }
}
