<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Doctor;
use App\Models\PaymentMethod;
use App\Models\PatientPayment;
use App\Repositories\PatientRepository;
use App\Services\PatientRegistrationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReceptionistDashboardController extends Controller
{
    protected $patientRepository;
    protected $registrationService;

    public function __construct(
        PatientRepository $patientRepository,
        PatientRegistrationService $registrationService
    ) {
        $this->patientRepository = $patientRepository;
        $this->registrationService = $registrationService;
    }

    /**
     * Display receptionist dashboard
     */
    public function index()
    {
        // Get dashboard statistics
        $stats = $this->getDashboardStats();

        // Get recent visits (last 10)
        $recentVisits = PatientVisit::with(['patient', 'selectedDoctor.user', 'payments'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($visit) {
                return [
                    'id' => $visit->id,
                    'visit_id' => $visit->visit_id,
                    'patient_id' => $visit->patient->patient_id,
                    'patient_name' => $visit->patient->name,
                    'phone' => $visit->patient->phone,
                    'email' => $visit->patient->email,
                    'payment_status' => $visit->payment_status,
                    'vision_test_status' => $visit->vision_test_status,
                    'overall_status' => $visit->overall_status,
                    'total_paid' => $visit->total_paid,
                    'final_amount' => $visit->final_amount,
                    'total_due' => $visit->total_due,
                    'created_at' => $visit->created_at,
                    'doctor_name' => $visit->selectedDoctor && $visit->selectedDoctor->user
                        ? $visit->selectedDoctor->user->name
                        : null,
                ];
            });

        // Get today's payments summary
        $todayPayments = $this->getTodayPaymentsSummary();

        // Get pending visits (payment not completed)
        $pendingVisits = PatientVisit::where('payment_status', '!=', 'paid')
            ->with(['patient', 'selectedDoctor.user'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($visit) {
                return [
                    'id' => $visit->id,
                    'visit_id' => $visit->visit_id,
                    'patient_id' => $visit->patient->patient_id,
                    'patient_name' => $visit->patient->name,
                    'phone' => $visit->patient->phone,
                    'payment_status' => $visit->payment_status,
                    'total_due' => $visit->total_due,
                    'final_amount' => $visit->final_amount,
                    'total_paid' => $visit->total_paid,
                    'created_at' => $visit->created_at,
                    'doctor_name' => $visit->selectedDoctor && $visit->selectedDoctor->user
                        ? $visit->selectedDoctor->user->name
                        : null,
                ];
            });

        // Get doctors for new visit modal
        $doctors = Doctor::with('user')
            ->where('is_available', true)
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->user ? $doctor->user->name : 'Unknown Doctor',
                    'specialization' => $doctor->specialization ?? 'General',
                    'consultation_fee' => $doctor->consultation_fee ?? 0,
                    'follow_up_fee' => $doctor->follow_up_fee ?? 0,
                ];
            });

        return Inertia::render('Receptionist/Dashboard', [
            'stats' => $stats,
            'recentVisits' => $recentVisits,
            'todayPayments' => $todayPayments,
            'pendingVisits' => $pendingVisits,
            'doctors' => $doctors,
        ]);
    }

    /**
     * Quick search patients for autocomplete
     */
    /**
     * Quick search patients for autocomplete - Fixed version
     */
    public function quickSearch(Request $request)
    {
        $request->validate(['term' => 'required|string|min:2']);

        // Search patients first
        $patients = Patient::where('name', 'like', '%' . $request->term . '%')
            ->orWhere('phone', 'like', '%' . $request->term . '%')
            ->orWhere('patient_id', 'like', '%' . $request->term . '%')
            ->orWhere('nid_card', 'like', '%' . $request->term . '%')
            ->with(['visits' => function ($q) {
                $q->latest()->limit(2); // Get latest 2 visits to check properly
            }])
            ->limit(8)
            ->get();

        // Get their latest visits and check active status properly
        $results = $patients->map(function ($patient) {
            $latestVisit = $patient->visits->first();

            // Check if patient has any active (non-completed) visit
            $activeVisit = $patient->visits->where('overall_status', '!=', 'completed')->first();
            $hasActiveVisit = $activeVisit !== null;

            // If there's an active visit, use that one. Otherwise use latest visit
            $displayVisit = $activeVisit ?: $latestVisit;

            return [
                'patient_id' => $patient->id,
                'visit_id' => $displayVisit?->id,
                'patient_unique_id' => $patient->patient_id,
                'visit_unique_id' => $displayVisit?->visit_id,
                'name' => $patient->name,
                'phone' => $patient->phone,
                'email' => $patient->email,
                'nid_card' => $patient->nid_card,

                // Payment and visit status from active visit (if exists) or latest visit
                'payment_status' => $displayVisit?->payment_status ?? 'no_visit',
                'vision_test_status' => $displayVisit?->vision_test_status ?? 'no_visit',
                'overall_status' => $displayVisit?->overall_status ?? 'no_visit',

                'created_at' => $patient->created_at,
                'latest_visit_date' => $displayVisit?->created_at,
                'doctor_name' => $displayVisit?->selectedDoctor?->user?->name,

                // This is the key fix - proper active visit detection
                'has_active_visit' => $hasActiveVisit,

                // Additional debugging info (optional - remove in production)
                'debug_info' => [
                    'total_visits' => $patient->visits->count(),
                    'latest_visit_status' => $latestVisit?->overall_status,
                    'active_visit_id' => $activeVisit?->id,
                    'active_visit_status' => $activeVisit?->overall_status,
                ]
            ];
        });

        return response()->json($results);
    }

    /**
     * Get visit for receipt printing
     */
    public function getVisitReceipt(PatientVisit $visit)
    {
        $visit->load([
            'patient',
            'selectedDoctor.user',
            'payments' => function ($query) {
                $query->latest();
            }
        ]);

        $latestPayment = $visit->payments->first();

        return response()->json([
            'visit' => $visit,
            'patient' => $visit->patient,
            'payment' => $latestPayment,
        ]);
    }

    /**
     * Quick registration form data
     */
    public function getQuickRegistrationData()
    {
        $doctors = $this->registrationService->getAvailableDoctors();
        $paymentMethods = PaymentMethod::active()->get();

        return response()->json([
            'doctors' => $doctors,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    /**
     * Process quick patient registration with visit
     */
    public function quickRegister(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'selected_doctor_id' => 'nullable|exists:doctors,id',
            'payment_amount' => 'required|numeric|min:0',
        ]);

        try {
            // Register patient with visit
            $result = $this->registrationService->registerPatientWithVisit(
                $request->only(['name', 'phone', 'email']),
                $request->selected_doctor_id,
                $request->payment_amount
            );

            $visit = $result['visit'];
            $patient = $result['patient'];

            return response()->json([
                'success' => true,
                'message' => 'Patient registered successfully!',
                'visit' => $visit->fresh(['patient', 'selectedDoctor.user', 'payments']),
                'redirect_url' => route('visits.receipt', $visit),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get today's visits/registrations
     */
    public function getTodayActivity()
    {
        $today = today();

        $todayVisits = PatientVisit::whereDate('created_at', $today)
            ->with(['patient', 'selectedDoctor.user', 'payments'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($visit) {
                return [
                    'id' => $visit->id,
                    'visit_id' => $visit->visit_id,
                    'patient_id' => $visit->patient->patient_id,
                    'patient_name' => $visit->patient->name,
                    'phone' => $visit->patient->phone,
                    'payment_status' => $visit->payment_status,
                    'vision_test_status' => $visit->vision_test_status,
                    'overall_status' => $visit->overall_status,
                    'total_paid' => $visit->total_paid,
                    'final_amount' => $visit->final_amount,
                    'total_due' => $visit->total_due,
                    'created_at' => $visit->created_at,
                    'doctor_name' => $visit->selectedDoctor && $visit->selectedDoctor->user
                        ? $visit->selectedDoctor->user->name
                        : null,
                ];
            });

        return response()->json($todayVisits);
    }

    /**
     * Get dashboard statistics
     */
    private function getDashboardStats()
    {
        $today = today();
        $thisMonth = now()->startOfMonth();

        return [
            // Today's stats
            'today_registrations' => PatientVisit::whereDate('created_at', $today)->count(),
            'today_revenue' => PatientPayment::whereDate('payment_date', $today)->sum('amount'),
            'today_pending_payments' => PatientVisit::whereDate('created_at', $today)
                ->where('payment_status', '!=', 'paid')->count(),

            // This month's stats
            'month_registrations' => PatientVisit::where('created_at', '>=', $thisMonth)->count(),
            'month_revenue' => PatientPayment::where('payment_date', '>=', $thisMonth)->sum('amount'),

            // Overall stats
            'total_patients' => Patient::count(),
            'total_visits' => PatientVisit::count(),
            'pending_payments_count' => PatientVisit::where('payment_status', '!=', 'paid')->count(),
            'pending_payments_amount' => PatientVisit::where('payment_status', '!=', 'paid')->sum('total_due'),

            // Recent activity
            'last_registration_time' => PatientVisit::latest()->first()?->created_at,
            'last_payment_time' => PatientPayment::latest()->first()?->payment_date,

            // Quick actions count
            'visits_ready_for_vision_test' => PatientVisit::where('payment_status', 'paid')
                ->where('vision_test_status', 'pending')->count(),
            'visits_in_vision_test' => PatientVisit::where('vision_test_status', 'in_progress')->count(),
            'visits_ready_for_prescription' => PatientVisit::where('vision_test_status', 'completed')
                ->where('prescription_status', 'pending')->count(),
        ];
    }

    /**
     * Get today's payments summary
     */
    private function getTodayPaymentsSummary()
    {
        $today = today();

        $payments = PatientPayment::with(['visit.patient', 'paymentMethod'])
            ->whereDate('payment_date', $today)
            ->orderBy('payment_date', 'desc')
            ->limit(10)
            ->get();

        $totalAmount = $payments->sum('amount');
        $totalCount = $payments->count();

        return [
            'total_amount' => $totalAmount,
            'total_count' => $totalCount,
            'average_payment' => $totalCount > 0 ? round($totalAmount / $totalCount, 2) : 0,
            'payments' => $payments->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'patient_name' => $payment->visit->patient->name,
                    'patient_id' => $payment->visit->patient->patient_id,
                    'visit_id' => $payment->visit->visit_id,
                    'payment_method' => $payment->paymentMethod->name ?? 'Cash',
                    'payment_date' => $payment->payment_date,
                    'created_at' => $payment->created_at,
                ];
            }),
        ];
    }

    /**
     * Get payment method breakdown for today
     */
    public function getTodayPaymentMethodBreakdown()
    {
        $today = today();

        $breakdown = PatientPayment::with('paymentMethod')
            ->whereDate('payment_date', $today)
            ->get()
            ->groupBy(function ($payment) {
                return $payment->paymentMethod->name ?? 'Cash';
            })
            ->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'total' => $group->sum('amount'),
                ];
            });

        return response()->json($breakdown);
    }

    /**
     * Mark visit as ready for vision test
     */
    public function markVisitReadyForVisionTest(PatientVisit $visit)
    {
        if ($visit->payment_status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Payment must be completed first',
            ], 422);
        }

        $visit->update([
            'vision_test_status' => 'pending',
            'overall_status' => 'vision_test'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Visit marked as ready for vision test!',
        ]);
    }

    /**
     * Get hourly visit stats for today
     */
    public function getTodayHourlyStats()
    {
        $today = today();

        $hourlyStats = PatientVisit::whereDate('created_at', $today)
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('COUNT(*) as visits'),
                DB::raw('SUM(final_amount) as revenue')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->keyBy('hour');

        // Fill missing hours with zero values
        $stats = [];
        for ($hour = 0; $hour < 24; $hour++) {
            $stats[] = [
                'hour' => $hour,
                'visits' => $hourlyStats->get($hour)?->visits ?? 0,
                'revenue' => $hourlyStats->get($hour)?->revenue ?? 0,
            ];
        }

        return response()->json($stats);
    }

    /**
     * Get visit workflow status summary
     */
    public function getVisitWorkflowSummary()
    {
        $today = today();

        return response()->json([
            'today' => [
                'payment_pending' => PatientVisit::whereDate('created_at', $today)
                    ->where('overall_status', 'payment')->count(),
                'vision_test_pending' => PatientVisit::whereDate('created_at', $today)
                    ->where('overall_status', 'vision_test')->count(),
                'prescription_pending' => PatientVisit::whereDate('created_at', $today)
                    ->where('overall_status', 'prescription')->count(),
                'completed' => PatientVisit::whereDate('created_at', $today)
                    ->where('overall_status', 'completed')->count(),
            ],
            'overall' => [
                'payment_pending' => PatientVisit::where('overall_status', 'payment')->count(),
                'vision_test_pending' => PatientVisit::where('overall_status', 'vision_test')->count(),
                'prescription_pending' => PatientVisit::where('overall_status', 'prescription')->count(),
                'completed' => PatientVisit::where('overall_status', 'completed')->count(),
            ]
        ]);
    }
}
