<?php

namespace App\Http\Controllers;

use App\Models\HospitalAccount;
use App\Models\MedicineAccount;
use App\Models\OpticsAccount;
use App\Models\OperationAccount;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Medicine;
use App\Models\MedicineStock;
use App\Models\Glasses;
use App\Models\LensType;
use App\Models\CompleteGlasses;
use App\Models\PatientPayment;
use App\Models\MedicineSale;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Get date range from request or default to last 30 days
        $dateRange = $this->getDateRange($request);
        $startDate = $dateRange['start'];
        $endDate = $dateRange['end'];
        $previousStartDate = $dateRange['previousStart'];
        $previousEndDate = $dateRange['previousEnd'];

        // Get account balances (always current)
        $accountBalances = $this->getAccountBalances();

        // Get hospital overview with date filtering
        $hospitalOverview = $this->getHospitalOverview($startDate, $endDate, $previousStartDate, $previousEndDate);

        // Get medicine stock info with date filtering
        $medicineStockInfo = $this->getMedicineStockInfo($startDate, $endDate, $previousStartDate, $previousEndDate);

        // Get optics stock info with date filtering
        $opticsStockInfo = $this->getOpticsStockInfo($startDate, $endDate, $previousStartDate, $previousEndDate);

        // Get recent activities with date filtering
        $recentActivities = $this->getRecentActivities($startDate, $endDate);

        // Get period reports
        $periodReports = $this->getPeriodReports($startDate, $endDate, $previousStartDate, $previousEndDate);

        return inertia('Dashboard/AdminDashboard', [
            'accountBalances' => $accountBalances,
            'hospitalOverview' => $hospitalOverview,
            'medicineStockInfo' => $medicineStockInfo,
            'opticsStockInfo' => $opticsStockInfo,
            'recentActivities' => $recentActivities,
            'periodReports' => $periodReports,
            'dateRange' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'period' => $request->get('period', 'last_30_days'),
            ],
        ]);
    }

    private function getDateRange(Request $request)
    {
        $period = $request->get('period', 'last_30_days');
        $customStart = $request->get('start_date');
        $customEnd = $request->get('end_date');

        $now = Carbon::now();

        switch ($period) {
            case 'today':
                $start = $now->copy()->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
            case 'yesterday':
                $start = $now->copy()->subDay()->startOfDay();
                $end = $now->copy()->subDay()->endOfDay();
                break;
            case 'last_7_days':
                $start = $now->copy()->subDays(6)->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
            case 'last_30_days':
                $start = $now->copy()->subDays(29)->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
            case 'this_month':
                $start = $now->copy()->startOfMonth();
                $end = $now->copy()->endOfMonth();
                break;
            case 'last_month':
                $start = $now->copy()->subMonth()->startOfMonth();
                $end = $now->copy()->subMonth()->endOfMonth();
                break;
            case 'this_year':
                $start = $now->copy()->startOfYear();
                $end = $now->copy()->endOfYear();
                break;
            case 'custom':
                $start = $customStart ? Carbon::parse($customStart)->startOfDay() : $now->copy()->subDays(29)->startOfDay();
                $end = $customEnd ? Carbon::parse($customEnd)->endOfDay() : $now->copy()->endOfDay();
                break;
            default:
                $start = $now->copy()->subDays(29)->startOfDay();
                $end = $now->copy()->endOfDay();
        }

        // Calculate previous period for comparison
        $daysDiff = $start->diffInDays($end) + 1;
        $previousStart = $start->copy()->subDays($daysDiff);
        $previousEnd = $start->copy()->subDay()->endOfDay();

        return [
            'start' => $start,
            'end' => $end,
            'previousStart' => $previousStart,
            'previousEnd' => $previousEnd,
        ];
    }

    private function getAccountBalances()
    {
        // ✅ All accounts unified in Hospital Account with categories
        $hospitalBalance = HospitalAccount::getBalance();

        return [
            'hospital' => [
                'balance' => $hospitalBalance,
                'currency' => 'BDT',
                'lastUpdated' => HospitalAccount::orderBy('updated_at', 'desc')->first()?->updated_at,
            ],
            'medicine' => [
                'balance' => MedicineAccount::getBalance(), // Keep for legacy compatibility
                'currency' => 'BDT',
                'lastUpdated' => MedicineAccount::first()?->updated_at,
            ],
            'optics' => [
                'balance' => OpticsAccount::getBalance(), // Keep for legacy compatibility
                'currency' => 'BDT',
                'lastUpdated' => OpticsAccount::first()?->updated_at,
            ],
            'operation' => [
                'balance' => OperationAccount::getBalance(), // Keep for legacy compatibility
                'currency' => 'BDT',
                'lastUpdated' => OperationAccount::first()?->updated_at,
            ],
            'total' => $hospitalBalance, // ✅ Total is now just Hospital Account balance
        ];
    }

    private function getHospitalOverview($startDate, $endDate, $previousStartDate, $previousEndDate)
    {
        $currentPeriodData = [
            'patients' => [
                'total' => Patient::whereBetween('created_at', [$startDate, $endDate])->count(),
                'today' => Patient::whereDate('created_at', Carbon::today())->count(),
            ],
            'visits' => [
                'total' => PatientVisit::whereBetween('created_at', [$startDate, $endDate])->count(),
                'today' => PatientVisit::whereDate('created_at', Carbon::today())->count(),
                'active' => PatientVisit::active()->whereBetween('created_at', [$startDate, $endDate])->count(),
                'completed' => PatientVisit::where('overall_status', 'completed')->whereBetween('created_at', [$startDate, $endDate])->count(),
            ],
            'appointments' => [
                'total' => Appointment::whereBetween('created_at', [$startDate, $endDate])->count(),
                'today' => Appointment::today()->count(),
                'pending' => Appointment::pending()->whereBetween('created_at', [$startDate, $endDate])->count(),
                'completed' => Appointment::completed()->whereBetween('created_at', [$startDate, $endDate])->count(),
            ],
            'doctors' => [
                'total' => Doctor::count(),
                'available' => Doctor::where('is_available', true)->count(),
            ],
            'prescriptions' => [
                'total' => Prescription::whereBetween('created_at', [$startDate, $endDate])->count(),
                'today' => Prescription::whereDate('created_at', Carbon::today())->count(),
            ],
        ];

        // Get previous period data for comparison
        $previousPeriodData = [
            'patients' => Patient::whereBetween('created_at', [$previousStartDate, $previousEndDate])->count(),
            'visits' => PatientVisit::whereBetween('created_at', [$previousStartDate, $previousEndDate])->count(),
            'appointments' => Appointment::whereBetween('created_at', [$previousStartDate, $previousEndDate])->count(),
            'prescriptions' => Prescription::whereBetween('created_at', [$previousStartDate, $previousEndDate])->count(),
        ];

        // Calculate growth percentages
        $currentPeriodData['patients']['growth'] = $this->calculateGrowth($currentPeriodData['patients']['total'], $previousPeriodData['patients']);
        $currentPeriodData['visits']['growth'] = $this->calculateGrowth($currentPeriodData['visits']['total'], $previousPeriodData['visits']);
        $currentPeriodData['appointments']['growth'] = $this->calculateGrowth($currentPeriodData['appointments']['total'], $previousPeriodData['appointments']);
        $currentPeriodData['prescriptions']['growth'] = $this->calculateGrowth($currentPeriodData['prescriptions']['total'], $previousPeriodData['prescriptions']);

        return $currentPeriodData;
    }

    private function getMedicineStockInfo($startDate, $endDate, $previousStartDate, $previousEndDate)
    {
        $totalMedicines = Medicine::count();
        $activeMedicines = Medicine::active()->count();
        $lowStockMedicines = Medicine::lowStock()->count();
        $totalStockValue = MedicineStock::active()->sum(DB::raw('available_quantity * buy_price'));
        $expiredStock = MedicineStock::expired()->sum('available_quantity');
        $expiringStock = MedicineStock::expiring(30)->sum('available_quantity');

        // Current period sales
        $currentSales = MedicineSale::whereBetween('sale_date', [$startDate, $endDate])->sum('total_amount');
        $currentProfit = MedicineSale::whereBetween('sale_date', [$startDate, $endDate])->sum('total_profit');
        $currentSold = DB::table('medicine_sale_items')
            ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
            ->whereBetween('medicine_sales.sale_date', [$startDate, $endDate])
            ->sum('medicine_sale_items.quantity');

        // Previous period sales for comparison
        $previousSales = MedicineSale::whereBetween('sale_date', [$previousStartDate, $previousEndDate])->sum('total_amount');
        $previousProfit = MedicineSale::whereBetween('sale_date', [$previousStartDate, $previousEndDate])->sum('total_profit');

        // Top selling medicines in current period
        $topSellingMedicines = DB::table('medicine_sale_items')
            ->join('medicine_stocks', 'medicine_sale_items.medicine_stock_id', '=', 'medicine_stocks.id')
            ->join('medicines', 'medicine_stocks.medicine_id', '=', 'medicines.id')
            ->join('medicine_sales', 'medicine_sale_items.medicine_sale_id', '=', 'medicine_sales.id')
            ->whereBetween('medicine_sales.sale_date', [$startDate, $endDate])
            ->select(
                'medicines.name',
                DB::raw('SUM(medicine_sale_items.quantity) as total_sold'),
                DB::raw('SUM(medicine_sale_items.quantity * medicine_sale_items.unit_price) as total_revenue')
            )
            ->groupBy('medicines.id', 'medicines.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        return [
            'overview' => [
                'totalMedicines' => $totalMedicines,
                'activeMedicines' => $activeMedicines,
                'lowStockMedicines' => $lowStockMedicines,
                'totalStockValue' => $totalStockValue,
                'expiredStock' => $expiredStock,
                'expiringStock' => $expiringStock,
            ],
            'alerts' => [
                'lowStock' => $lowStockMedicines,
                'expired' => MedicineStock::expired()->count(),
                'expiring' => MedicineStock::expiring(30)->count(),
            ],
            'topSelling' => $topSellingMedicines,
            'periodStats' => [
                'totalSales' => $currentSales,
                'totalProfit' => $currentProfit,
                'totalSold' => $currentSold,
                'salesGrowth' => $this->calculateGrowth($currentSales, $previousSales),
                'profitGrowth' => $this->calculateGrowth($currentProfit, $previousProfit),
            ],
        ];
    }

    private function getOpticsStockInfo($startDate, $endDate, $previousStartDate, $previousEndDate)
    {
        $totalFrames = Glasses::count();
        $activeFrames = Glasses::active()->count();
        $lowStockFrames = Glasses::lowStock()->count();
        $totalFrameValue = Glasses::active()->sum(DB::raw('stock_quantity * purchase_price'));

        $totalLensTypes = LensType::count();
        $activeLensTypes = LensType::active()->count();
        $lowStockLenses = LensType::lowStock()->count();
        $totalLensValue = LensType::active()->sum(DB::raw('stock_quantity * price'));

        $totalCompleteGlasses = CompleteGlasses::count();
        $activeCompleteGlasses = CompleteGlasses::active()->count();
        $lowStockCompleteGlasses = CompleteGlasses::lowStock()->count();
        $totalCompleteGlassesValue = CompleteGlasses::active()->sum(DB::raw('stock_quantity * total_cost'));

        // Current period prescription glasses
        $currentPrescriptionGlasses = DB::table('prescription_glasses')
            ->join('prescriptions', 'prescription_glasses.prescription_id', '=', 'prescriptions.id')
            ->whereBetween('prescriptions.created_at', [$startDate, $endDate])
            ->count();

        // Previous period for comparison
        $previousPrescriptionGlasses = DB::table('prescription_glasses')
            ->join('prescriptions', 'prescription_glasses.prescription_id', '=', 'prescriptions.id')
            ->whereBetween('prescriptions.created_at', [$previousStartDate, $previousEndDate])
            ->count();

        // Top selling frames in current period
        $topSellingFrames = Glasses::withCount(['prescriptionGlasses' => function ($query) use ($startDate, $endDate) {
            $query->whereHas('prescription', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            });
        }])
            ->orderByDesc('prescription_glasses_count')
            ->limit(5)
            ->get(['id', 'brand', 'model', 'selling_price']);

        return [
            'frames' => [
                'total' => $totalFrames,
                'active' => $activeFrames,
                'lowStock' => $lowStockFrames,
                'totalValue' => $totalFrameValue,
            ],
            'lenses' => [
                'total' => $totalLensTypes,
                'active' => $activeLensTypes,
                'lowStock' => $lowStockLenses,
                'totalValue' => $totalLensValue,
            ],
            'completeGlasses' => [
                'total' => $totalCompleteGlasses,
                'active' => $activeCompleteGlasses,
                'lowStock' => $lowStockCompleteGlasses,
                'totalValue' => $totalCompleteGlassesValue,
            ],
            'alerts' => [
                'totalLowStock' => $lowStockFrames + $lowStockLenses + $lowStockCompleteGlasses,
                'framesLowStock' => $lowStockFrames,
                'lensesLowStock' => $lowStockLenses,
                'completeGlassesLowStock' => $lowStockCompleteGlasses,
            ],
            'topSellingFrames' => $topSellingFrames,
            'totalStockValue' => $totalFrameValue + $totalLensValue + $totalCompleteGlassesValue,
            'periodStats' => [
                'prescriptionGlasses' => $currentPrescriptionGlasses,
                'prescriptionGlassesGrowth' => $this->calculateGrowth($currentPrescriptionGlasses, $previousPrescriptionGlasses),
            ],
        ];
    }

    private function getRecentActivities($startDate, $endDate)
    {
        $recentPatients = Patient::with('registeredBy')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest()
            ->limit(5)
            ->get(['id', 'name', 'patient_id', 'phone', 'created_at', 'registered_by']);

        $recentVisits = PatientVisit::with(['patient', 'selectedDoctor.user'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->latest()
            ->limit(5)
            ->get(['id', 'visit_id', 'patient_id', 'selected_doctor_id', 'overall_status', 'final_amount', 'created_at']);

        $recentPayments = PatientPayment::with(['patient', 'receivedBy'])
            ->whereBetween('payment_date', [$startDate, $endDate])
            ->latest()
            ->limit(5)
            ->get(['id', 'payment_number', 'patient_id', 'amount', 'payment_date', 'received_by']);

        return [
            'recentPatients' => $recentPatients,
            'recentVisits' => $recentVisits,
            'recentPayments' => $recentPayments,
        ];
    }

    private function getPeriodReports($startDate, $endDate, $previousStartDate, $previousEndDate)
    {
        // ✅ ALL DATA FROM HOSPITAL ACCOUNT WITH CATEGORY FILTERING

        // Hospital Income Categories
        $hospitalIncomeCategories = DB::table('hospital_income_categories')
            ->where('is_active', true)
            ->pluck('name', 'id');

        // OPD Income - From Hospital Account with income categories
        $opdIncome = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->whereIn('income_category_id', function($query) {
                $query->select('id')
                    ->from('hospital_income_categories')
                    ->where('name', 'like', '%OPD%')
                    ->orWhere('name', 'like', '%Patient%')
                    ->orWhere('name', 'like', '%Consultation%');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Medical Test Income
        $medicalTestIncome = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->whereIn('income_category_id', function($query) {
                $query->select('id')
                    ->from('hospital_income_categories')
                    ->where('name', 'like', '%Medical Test%')
                    ->orWhere('name', 'like', '%Test%')
                    ->orWhere('name', 'like', '%Lab%');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Medicine Income - From Hospital Account
        $medicineIncome = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->whereIn('income_category_id', function($query) {
                $query->select('id')
                    ->from('hospital_income_categories')
                    ->where('name', 'like', '%Medicine%');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Optics Income - From Hospital Account
        $opticsIncome = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->whereIn('income_category_id', function($query) {
                $query->select('id')
                    ->from('hospital_income_categories')
                    ->where('name', 'like', '%Optics%')
                    ->orWhere('name', 'like', '%Glasses%')
                    ->orWhere('name', 'like', '%Frame%')
                    ->orWhere('name', 'like', '%Lens%');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Operation Income - From Hospital Account
        $operationIncome = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->whereIn('income_category_id', function($query) {
                $query->select('id')
                    ->from('hospital_income_categories')
                    ->where('name', 'like', '%Operation%')
                    ->orWhere('name', 'like', '%Surgery%');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Total Hospital Income
        $hospitalIncome = $opdIncome + $medicalTestIncome;

        // Expenses by Category - From Hospital Account
        $hospitalExpense = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->whereIn('expense_category_id', function($query) {
                $query->select('id')
                    ->from('hospital_expense_categories')
                    ->where('name', 'not like', '%Medicine%')
                    ->where('name', 'not like', '%Optics%')
                    ->where('name', 'not like', '%Operation%');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        $medicineExpense = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->whereIn('expense_category_id', function($query) {
                $query->select('id')
                    ->from('hospital_expense_categories')
                    ->where('name', 'like', '%Medicine%');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        $opticsExpense = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->whereIn('expense_category_id', function($query) {
                $query->select('id')
                    ->from('hospital_expense_categories')
                    ->where('name', 'like', '%Optics%')
                    ->orWhere('name', 'like', '%Frame%')
                    ->orWhere('name', 'like', '%Lens%');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        $operationExpense = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->whereIn('expense_category_id', function($query) {
                $query->select('id')
                    ->from('hospital_expense_categories')
                    ->where('name', 'like', '%Operation%')
                    ->orWhere('name', 'like', '%Surgery%');
            })
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Previous Period for Growth Calculation
        $previousOpdIncome = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->whereIn('income_category_id', function($query) {
                $query->select('id')
                    ->from('hospital_income_categories')
                    ->where('name', 'like', '%OPD%')
                    ->orWhere('name', 'like', '%Patient%')
                    ->orWhere('name', 'like', '%Consultation%');
            })
            ->whereBetween('transaction_date', [$previousStartDate, $previousEndDate])
            ->sum('amount');

        $previousMedicalTestIncome = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->whereIn('income_category_id', function($query) {
                $query->select('id')
                    ->from('hospital_income_categories')
                    ->where('name', 'like', '%Medical Test%')
                    ->orWhere('name', 'like', '%Test%')
                    ->orWhere('name', 'like', '%Lab%');
            })
            ->whereBetween('transaction_date', [$previousStartDate, $previousEndDate])
            ->sum('amount');

        $previousHospitalIncome = $previousOpdIncome + $previousMedicalTestIncome;

        // ✅ Get current balances from Hospital Account by category
        $hospitalBalance = HospitalAccount::getBalance();

        return [
            'hospital' => [
                'income' => $hospitalIncome,
                'opdIncome' => $opdIncome,
                'medicalTestIncome' => $medicalTestIncome,
                'expense' => $hospitalExpense,
                'profit' => $hospitalIncome - $hospitalExpense,
                'balance' => $hospitalBalance,
                'incomeGrowth' => $this->calculateGrowth($hospitalIncome, $previousHospitalIncome),
                'opdIncomeGrowth' => $this->calculateGrowth($opdIncome, $previousOpdIncome),
                'medicalTestIncomeGrowth' => $this->calculateGrowth($medicalTestIncome, $previousMedicalTestIncome),
            ],
            'medicine' => [
                'income' => $medicineIncome,
                'expense' => $medicineExpense,
                'profit' => $medicineIncome - $medicineExpense,
                'balance' => $medicineIncome - $medicineExpense, // ✅ Calculated from Hospital Account
            ],
            'optics' => [
                'income' => $opticsIncome,
                'expense' => $opticsExpense,
                'profit' => $opticsIncome - $opticsExpense,
                'balance' => $opticsIncome - $opticsExpense, // ✅ Calculated from Hospital Account
            ],
            'operation' => [
                'income' => $operationIncome,
                'expense' => $operationExpense,
                'profit' => $operationIncome - $operationExpense,
                'balance' => $operationIncome - $operationExpense, // ✅ Calculated from Hospital Account
            ],
        ];
    }

    private function calculateGrowth($current, $previous)
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    public function getChartData(Request $request)
    {
        $period = $request->get('period', 'monthly'); // daily, weekly, monthly, yearly

        switch ($period) {
            case 'daily':
                return $this->getDailyChartData();
            case 'weekly':
                return $this->getWeeklyChartData();
            case 'yearly':
                return $this->getYearlyChartData();
            default:
                return $this->getMonthlyChartData();
        }
    }

    private function getMonthlyChartData()
    {
        $months = [];
        $hospitalData = [];
        $medicineData = [];
        $opticsData = [];
        $operationData = [];

        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $months[] = $date->format('M Y');

            $hospitalReport = HospitalAccount::monthlyReport($date->year, $date->month);
            $medicineReport = MedicineAccount::monthlyReport($date->year, $date->month);
            $opticsReport = OpticsAccount::monthlyReport($date->year, $date->month);
            $operationReport = OperationAccount::monthlyReport($date->year, $date->month);

            $hospitalData[] = $hospitalReport['profit'];
            $medicineData[] = $medicineReport['profit'];
            $opticsData[] = $opticsReport['profit'];
            $operationData[] = $operationReport['profit'];
        }

        return [
            'labels' => $months,
            'datasets' => [
                [
                    'label' => 'Hospital',
                    'data' => $hospitalData,
                    'backgroundColor' => 'rgba(59, 130, 246, 0.1)',
                    'borderColor' => 'rgb(59, 130, 246)',
                    'tension' => 0.4,
                ],
                [
                    'label' => 'Medicine',
                    'data' => $medicineData,
                    'backgroundColor' => 'rgba(16, 185, 129, 0.1)',
                    'borderColor' => 'rgb(16, 185, 129)',
                    'tension' => 0.4,
                ],
                [
                    'label' => 'Optics',
                    'data' => $opticsData,
                    'backgroundColor' => 'rgba(245, 158, 11, 0.1)',
                    'borderColor' => 'rgb(245, 158, 11)',
                    'tension' => 0.4,
                ],
                [
                    'label' => 'Operation',
                    'data' => $operationData,
                    'backgroundColor' => 'rgba(147, 51, 234, 0.1)',
                    'borderColor' => 'rgb(147, 51, 234)',
                    'tension' => 0.4,
                ],
            ],
        ];
    }

    private function getDailyChartData()
    {
        $days = [];
        $patientData = [];
        $visitData = [];
        $paymentData = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $days[] = $date->format('M d');

            $patientData[] = Patient::whereDate('created_at', $date)->count();
            $visitData[] = PatientVisit::whereDate('created_at', $date)->count();
            $paymentData[] = PatientPayment::whereDate('payment_date', $date)->sum('amount');
        }

        return [
            'labels' => $days,
            'datasets' => [
                [
                    'label' => 'New Patients',
                    'data' => $patientData,
                    'backgroundColor' => 'rgba(139, 69, 19, 0.1)',
                    'borderColor' => 'rgb(139, 69, 19)',
                    'tension' => 0.4,
                ],
                [
                    'label' => 'Visits',
                    'data' => $visitData,
                    'backgroundColor' => 'rgba(168, 85, 247, 0.1)',
                    'borderColor' => 'rgb(168, 85, 247)',
                    'tension' => 0.4,
                ],
                [
                    'label' => 'Payments (BDT)',
                    'data' => $paymentData,
                    'backgroundColor' => 'rgba(236, 72, 153, 0.1)',
                    'borderColor' => 'rgb(236, 72, 153)',
                    'tension' => 0.4,
                    'yAxisID' => 'y1',
                ],
            ],
            'options' => [
                'scales' => [
                    'y' => [
                        'type' => 'linear',
                        'display' => true,
                        'position' => 'left',
                    ],
                    'y1' => [
                        'type' => 'linear',
                        'display' => true,
                        'position' => 'right',
                        'grid' => [
                            'drawOnChartArea' => false,
                        ],
                    ],
                ],
            ],
        ];
    }

    private function getWeeklyChartData()
    {
        // Implementation for weekly data
        return $this->getMonthlyChartData(); // Placeholder
    }

    private function getYearlyChartData()
    {
        // Implementation for yearly data
        return $this->getMonthlyChartData(); // Placeholder
    }
}
