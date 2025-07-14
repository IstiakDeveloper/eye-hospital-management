<?php

namespace App\Http\Controllers;

use App\Models\Patient;
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

        // Get recent patients (last 10)
        $recentPatients = Patient::with(['selectedDoctor.user', 'payments'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                    'email' => $patient->email,
                    'registration_status' => $patient->registration_status,
                    'payment_status' => $patient->payment_status,
                    'total_paid' => $patient->payments->sum('amount'),
                    'final_amount' => $patient->final_amount ?? 0,
                    'created_at' => $patient->created_at,
                    'doctor_name' => $patient->selectedDoctor && $patient->selectedDoctor->user
                        ? $patient->selectedDoctor->user->name
                        : null,
                ];
            });

        // Get today's payments summary
        $todayPayments = $this->getTodayPaymentsSummary();

        // Get pending patients (payment not completed)
        $pendingPatients = Patient::where('payment_status', '!=', 'paid')
            ->with(['selectedDoctor.user'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                    'payment_status' => $patient->payment_status,
                    'total_due' => ($patient->final_amount ?? 0) - $patient->payments->sum('amount'),
                    'created_at' => $patient->created_at,
                ];
            });

        return Inertia::render('Receptionist/Dashboard', [
            'stats' => $stats,
            'recentPatients' => $recentPatients,
            'todayPayments' => $todayPayments,
            'pendingPatients' => $pendingPatients,
        ]);
    }

    /**
     * Quick search patients for autocomplete
     */
    public function quickSearch(Request $request)
    {
        $request->validate(['term' => 'required|string|min:2']);

        $patients = Patient::where('name', 'like', '%' . $request->term . '%')
            ->orWhere('phone', 'like', '%' . $request->term . '%')
            ->orWhere('patient_id', 'like', '%' . $request->term . '%')
            ->with(['selectedDoctor.user'])
            ->limit(8)
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                    'email' => $patient->email,
                    'registration_status' => $patient->registration_status,
                    'payment_status' => $patient->payment_status,
                    'created_at' => $patient->created_at,
                    'doctor_name' => $patient->selectedDoctor && $patient->selectedDoctor->user
                        ? $patient->selectedDoctor->user->name
                        : null,
                ];
            });

        return response()->json($patients);
    }

    /**
     * Get patient for receipt printing
     */
    public function getPatientReceipt(Patient $patient)
    {
        $patient->load([
            'selectedDoctor.user',
            'payments' => function ($query) {
                $query->latest();
            }
        ]);

        $latestPayment = $patient->payments->first();
        $invoice = $patient->invoices()->latest()->first();

        return response()->json([
            'patient' => $patient,
            'payment' => $latestPayment,
            'invoice' => $invoice,
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
     * Process quick patient registration
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
            // Register patient with minimal data
            $result = $this->registrationService->registerPatient(
                $request->only(['name', 'phone', 'email']),
                $request->selected_doctor_id,
                []
            );

            $patient = $result['patient'];

            // Process payment if amount provided
            if ($request->payment_amount > 0) {
                $payment = $this->registrationService->processRegistrationPayment($patient, [
                    'amount' => $request->payment_amount,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Patient registered successfully!',
                'patient' => $patient->fresh(['selectedDoctor.user', 'payments']),
                'redirect_url' => route('patients.receipt', $patient),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get today's appointments/registrations
     */
    public function getTodayActivity()
    {
        $today = today();

        $todayPatients = Patient::whereDate('created_at', $today)
            ->with(['selectedDoctor.user', 'payments'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                    'registration_status' => $patient->registration_status,
                    'payment_status' => $patient->payment_status,
                    'total_paid' => $patient->payments->sum('amount'),
                    'final_amount' => $patient->final_amount ?? 0,
                    'created_at' => $patient->created_at,
                    'doctor_name' => $patient->selectedDoctor && $patient->selectedDoctor->user
                        ? $patient->selectedDoctor->user->name
                        : null,
                ];
            });

        return response()->json($todayPatients);
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
            'today_registrations' => Patient::whereDate('created_at', $today)->count(),
            'today_revenue' => PatientPayment::whereDate('payment_date', $today)->sum('amount'),
            'today_pending_payments' => Patient::whereDate('created_at', $today)
                ->where('payment_status', '!=', 'paid')->count(),

            // This month's stats
            'month_registrations' => Patient::where('created_at', '>=', $thisMonth)->count(),
            'month_revenue' => PatientPayment::where('payment_date', '>=', $thisMonth)->sum('amount'),

            // Overall stats
            'total_patients' => Patient::count(),
            'pending_payments_count' => Patient::where('payment_status', '!=', 'paid')->count(),
            'pending_payments_amount' => $this->getPendingPaymentsAmount(),

            // Recent activity
            'last_registration_time' => Patient::latest()->first()?->created_at,
            'last_payment_time' => PatientPayment::latest()->first()?->payment_date,

            // Quick actions count
            'patients_ready_for_vision_test' => Patient::where('registration_status', 'completed')
                ->where('payment_status', 'paid')->count(),
        ];
    }

    /**
     * Get today's payments summary
     */
    private function getTodayPaymentsSummary()
    {
        $today = today();

        $payments = PatientPayment::with(['patient', 'paymentMethod'])
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
                    'patient_name' => $payment->patient->name,
                    'patient_id' => $payment->patient->patient_id,
                    'payment_method' => $payment->paymentMethod->name ?? 'Cash',
                    'payment_date' => $payment->payment_date,
                    'created_at' => $payment->created_at,
                ];
            }),
        ];
    }

    /**
     * Get pending payments total amount
     */
    private function getPendingPaymentsAmount()
    {
        return Patient::where('payment_status', '!=', 'paid')
            ->get()
            ->sum(function ($patient) {
                return ($patient->final_amount ?? 0) - $patient->payments->sum('amount');
            });
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
     * Mark patient as completed (ready for vision test)
     */
    public function markPatientCompleted(Patient $patient)
    {
        if ($patient->payment_status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Patient payment must be completed first',
            ], 422);
        }

        $patient->update(['registration_status' => 'completed']);

        return response()->json([
            'success' => true,
            'message' => 'Patient marked as ready for vision test!',
        ]);
    }

    /**
     * Get hourly registration stats for today
     */
    public function getTodayHourlyStats()
    {
        $today = today();

        $hourlyStats = Patient::whereDate('created_at', $today)
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('COUNT(*) as registrations'),
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
                'registrations' => $hourlyStats->get($hour)?->registrations ?? 0,
                'revenue' => $hourlyStats->get($hour)?->revenue ?? 0,
            ];
        }

        return response()->json($stats);
    }
}
