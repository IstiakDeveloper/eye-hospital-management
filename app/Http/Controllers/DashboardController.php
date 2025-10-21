<?php

namespace App\Http\Controllers;

use App\Models\HospitalAccount;
use App\Models\MedicineAccount;
use App\Models\OpticsAccount;
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
        return [
            'hospital' => [
                'balance' => HospitalAccount::getBalance(),
                'currency' => 'BDT',
                'lastUpdated' => HospitalAccount::first()?->updated_at,
            ],
            'medicine' => [
                'balance' => MedicineAccount::getBalance(),
                'currency' => 'BDT',
                'lastUpdated' => MedicineAccount::first()?->updated_at,
            ],
            'optics' => [
                'balance' => OpticsAccount::getBalance(),
                'currency' => 'BDT',
                'lastUpdated' => OpticsAccount::first()?->updated_at,
            ],
            'total' => HospitalAccount::getBalance() + MedicineAccount::getBalance() + OpticsAccount::getBalance(),
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
        // OPD Income (Patient Visit Payments) - Current Period
        // Includes both 'OPD' and 'patient_payment' categories
        $opdIncome = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->whereIn('category', ['OPD', 'patient_payment'])
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Medical Test Income - Current Period
        $medicalTestIncome = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->where('category', 'Medical Test')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Total Hospital Income
        $hospitalIncome = $opdIncome + $medicalTestIncome;

        // Hospital Expense
        $hospitalExpense = DB::table('hospital_transactions')
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Previous period for comparison - OPD
        // Includes both 'OPD' and 'patient_payment' categories
        $previousOpdIncome = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->whereIn('category', ['OPD', 'patient_payment'])
            ->whereBetween('transaction_date', [$previousStartDate, $previousEndDate])
            ->sum('amount');

        // Previous period for comparison - Medical Test
        $previousMedicalTestIncome = DB::table('hospital_transactions')
            ->where('type', 'income')
            ->where('category', 'Medical Test')
            ->whereBetween('transaction_date', [$previousStartDate, $previousEndDate])
            ->sum('amount');

        // Previous Total Hospital Income
        $previousHospitalIncome = $previousOpdIncome + $previousMedicalTestIncome;

        // Medicine transactions
        $medicineIncome = DB::table('medicine_transactions')
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        $medicineExpense = DB::table('medicine_transactions')
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        // Optics transactions
        $opticsIncome = DB::table('optics_transactions')
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        $opticsExpense = DB::table('optics_transactions')
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->sum('amount');

        return [
            'hospital' => [
                'income' => $hospitalIncome,
                'opdIncome' => $opdIncome,
                'medicalTestIncome' => $medicalTestIncome,
                'expense' => $hospitalExpense,
                'profit' => $hospitalIncome - $hospitalExpense,
                'balance' => HospitalAccount::getBalance(),
                'incomeGrowth' => $this->calculateGrowth($hospitalIncome, $previousHospitalIncome),
                'opdIncomeGrowth' => $this->calculateGrowth($opdIncome, $previousOpdIncome),
                'medicalTestIncomeGrowth' => $this->calculateGrowth($medicalTestIncome, $previousMedicalTestIncome),
            ],
            'medicine' => [
                'income' => $medicineIncome,
                'expense' => $medicineExpense,
                'profit' => $medicineIncome - $medicineExpense,
                'balance' => MedicineAccount::getBalance(),
            ],
            'optics' => [
                'income' => $opticsIncome,
                'expense' => $opticsExpense,
                'profit' => $opticsIncome - $opticsExpense,
                'balance' => OpticsAccount::getBalance(),
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

        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $months[] = $date->format('M Y');

            $hospitalReport = HospitalAccount::monthlyReport($date->year, $date->month);
            $medicineReport = MedicineAccount::monthlyReport($date->year, $date->month);
            $opticsReport = OpticsAccount::monthlyReport($date->year, $date->month);

            $hospitalData[] = $hospitalReport['profit'];
            $medicineData[] = $medicineReport['profit'];
            $opticsData[] = $opticsReport['profit'];
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
