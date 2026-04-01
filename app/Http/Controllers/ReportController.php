<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Prescription;
use App\Models\VisionTest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Reports/Index');
    }

    public function patients(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $startDate = $request->input('start_date') ?: $today;
        $endDate = $request->input('end_date') ?: $startDate;
        if ($startDate > $endDate) {
            [$startDate, $endDate] = [$endDate, $startDate];
        }

        $baseQuery = PatientVisit::query()
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate);

        if ($request->filled('gender')) {
            $baseQuery->whereHas('patient', function ($q) use ($request) {
                $q->where('gender', $request->gender);
            });
        }

        $summary = [
            'total_visits' => (clone $baseQuery)->count(),
            'new_visits' => (clone $baseQuery)->where('is_followup', false)->count(),
            'followup_visits' => (clone $baseQuery)->where('is_followup', true)->count(),
            'total_fee' => (float) (clone $baseQuery)->sum('final_amount'),
            'total_paid' => (float) (clone $baseQuery)->sum('total_paid'),
        ];

        $perPage = (int) $request->get('per_page', 50);
        $allowed = [25, 50, 100, 200];
        if (! in_array($perPage, $allowed, true)) {
            $perPage = 50;
        }

        $visits = (clone $baseQuery)
            ->with([
                'patient:id,patient_id,name,address,phone,gender,date_of_birth,registered_by',
                'patient.registeredBy:id,name',
                'selectedDoctor.user:id,name',
                'createdBy:id,name',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Reports/Patients', [
            'visits' => $visits,
            'summary' => $summary,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'gender' => $request->input('gender'),
                'per_page' => $perPage,
            ],
        ]);
    }

    public function doctors(Request $request)
    {
        $doctors = Doctor::with(['user'])
            ->select('id', 'user_id', 'specialization', 'qualification', 'consultation_fee', 'is_available', 'created_at')
            ->get();

        return Inertia::render('Reports/Doctors', [
            'doctors' => $doctors,
        ]);
    }

    public function appointments(Request $request)
    {
        $query = Appointment::with(['patient', 'doctor.user'])
            ->select('id', 'patient_id', 'doctor_id', 'appointment_date', 'appointment_time', 'serial_number', 'status', 'created_at');

        // Date range filter
        if ($request->filled('start_date')) {
            $query->whereDate('appointment_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('appointment_date', '<=', $request->end_date);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $appointments = $query->orderBy('appointment_date', 'desc')->get();

        return Inertia::render('Reports/Appointments', [
            'appointments' => $appointments,
            'filters' => $request->only(['start_date', 'end_date', 'status']),
        ]);
    }

    public function visionTests(Request $request)
    {
        $query = VisionTest::with(['patient', 'performedBy'])
            ->select('id', 'patient_id', 'right_eye_vision', 'left_eye_vision', 'right_eye_power', 'left_eye_power', 'right_eye_pressure', 'left_eye_pressure', 'performed_by', 'test_date', 'created_at');

        // Date range filter
        if ($request->filled('start_date')) {
            $query->whereDate('test_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('test_date', '<=', $request->end_date);
        }

        $visionTests = $query->orderBy('test_date', 'desc')->get();

        return Inertia::render('Reports/VisionTests', [
            'visionTests' => $visionTests,
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }

    public function prescriptions(Request $request)
    {
        $query = Prescription::with(['patient', 'doctor.user', 'prescriptionMedicines.medicine'])
            ->select('id', 'patient_id', 'doctor_id', 'diagnosis', 'followup_date', 'created_at');

        // Date range filter
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $prescriptions = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Reports/Prescriptions', [
            'prescriptions' => $prescriptions,
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }

    public function dashboard(Request $request)
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();
        $thisYear = Carbon::now()->startOfYear();

        $stats = [
            'total_patients' => Patient::count(),
            'total_doctors' => Doctor::count(),
            'today_appointments' => Appointment::whereDate('appointment_date', $today)->count(),
            'pending_appointments' => Appointment::where('status', 'pending')->count(),
            'completed_appointments_today' => Appointment::whereDate('appointment_date', $today)->where('status', 'completed')->count(),
            'vision_tests_today' => VisionTest::whereDate('test_date', $today)->count(),
            'prescriptions_today' => Prescription::whereDate('created_at', $today)->count(),
            'monthly_patients' => Patient::where('created_at', '>=', $thisMonth)->count(),
            'monthly_appointments' => Appointment::where('created_at', '>=', $thisMonth)->count(),
            'yearly_patients' => Patient::where('created_at', '>=', $thisYear)->count(),
        ];

        $monthlyPatients = Patient::select(
            DB::raw('MONTH(created_at) as month'),
            DB::raw('COUNT(*) as count')
        )
            ->whereYear('created_at', Carbon::now()->year)
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $weeklyAppointments = Appointment::select(
            DB::raw('DATE(appointment_date) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('appointment_date', '>=', Carbon::now()->subWeek())
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Reports/Dashboard', [
            'stats' => $stats,
            'monthlyPatients' => $monthlyPatients,
            'weeklyAppointments' => $weeklyAppointments,
        ]);
    }

    public function revenue(Request $request)
    {
        $query = Prescription::with(['patient', 'doctor.user'])
            ->join('doctors', 'prescriptions.doctor_id', '=', 'doctors.id')
            ->select('prescriptions.*', 'doctors.consultation_fee');

        // Date range filter
        if ($request->filled('start_date')) {
            $query->whereDate('prescriptions.created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('prescriptions.created_at', '<=', $request->end_date);
        }

        $prescriptions = $query->orderBy('prescriptions.created_at', 'desc')->get();

        $totalRevenue = $prescriptions->sum('consultation_fee');

        return Inertia::render('Reports/Revenue', [
            'prescriptions' => $prescriptions,
            'totalRevenue' => $totalRevenue,
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }

    public function medicines(Request $request)
    {
        $query = DB::table('prescription_medicines')
            ->join('medicines', 'prescription_medicines.medicine_id', '=', 'medicines.id')
            ->join('prescriptions', 'prescription_medicines.prescription_id', '=', 'prescriptions.id')
            ->select(
                'medicines.name',
                'medicines.generic_name',
                'medicines.type',
                DB::raw('COUNT(*) as usage_count'),
                'prescription_medicines.dosage',
                'prescription_medicines.duration'
            )
            ->groupBy('medicines.id', 'prescription_medicines.dosage', 'prescription_medicines.duration');

        // Date range filter
        if ($request->filled('start_date')) {
            $query->whereDate('prescriptions.created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('prescriptions.created_at', '<=', $request->end_date);
        }

        $medicines = $query->orderBy('usage_count', 'desc')->get();

        return Inertia::render('Reports/Medicines', [
            'medicines' => $medicines,
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }
}
