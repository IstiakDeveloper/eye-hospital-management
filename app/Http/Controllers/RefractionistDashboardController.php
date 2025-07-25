<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\VisionTest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class RefractionistDashboardController extends Controller
{
    /**
     * Display refractionist dashboard
     */
    public function index()
    {
        // Get patient visits ready for vision test (including in-progress ones)
        $visitsForVisionTest = PatientVisit::where('payment_status', 'paid')
            ->where('vision_test_status', '!=', 'completed') // Show all except completed
            ->where('overall_status', 'vision_test')
            ->with(['patient', 'selectedDoctor.user', 'createdBy'])
            ->orderBy('payment_completed_at', 'asc') // First paid, first served
            ->get()
            ->map(function ($visit) {
                return [
                    'id' => $visit->id,
                    'visit_id' => $visit->visit_id,
                    'patient_id' => $visit->patient->patient_id,
                    'patient_database_id' => $visit->patient->id, // Add this for route
                    'patient_name' => $visit->patient->name,
                    'patient_phone' => $visit->patient->phone,
                    'age' => $visit->patient->date_of_birth ? Carbon::parse($visit->patient->date_of_birth)->age : null,
                    'gender' => $visit->patient->gender,
                    'medical_history' => $visit->patient->medical_history,
                    'chief_complaint' => $visit->chief_complaint,
                    'doctor_name' => $visit->selectedDoctor && $visit->selectedDoctor->user
                        ? $visit->selectedDoctor->user->name
                        : 'No Doctor Selected',
                    'payment_completed_at' => $visit->payment_completed_at,
                    'waiting_time' => $visit->payment_completed_at
                        ? Carbon::parse($visit->payment_completed_at)->diffForHumans()
                        : null,
                    'total_amount' => $visit->final_amount,
                    'total_paid' => $visit->total_paid,
                    'visit_notes' => $visit->visit_notes,
                    'vision_test_status' => $visit->vision_test_status,
                    'is_in_progress' => $visit->vision_test_status === 'in_progress',
                ];
            });

        // Get today's statistics
        $todayStats = [
            'total_waiting' => $visitsForVisionTest->count(),
            'tests_completed_today' => PatientVisit::whereDate('vision_test_completed_at', today())->count(),
            'in_progress_tests' => PatientVisit::where('vision_test_status', 'in_progress')->count(),
            'avg_waiting_time' => $this->getAverageWaitingTime(),
        ];

        // Get recent completed tests
        $recentCompletedTests = PatientVisit::where('vision_test_status', 'completed')
            ->whereDate('vision_test_completed_at', today())
            ->with(['patient', 'selectedDoctor.user', 'visionTests' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->orderBy('vision_test_completed_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($visit) {
                $latestVisionTest = $visit->visionTests->first();
                return [
                    'id' => $visit->id,
                    'visit_id' => $visit->visit_id,
                    'patient_id' => $visit->patient->patient_id,
                    'patient_name' => $visit->patient->name,
                    'patient_phone' => $visit->patient->phone,
                    'doctor_name' => $visit->selectedDoctor && $visit->selectedDoctor->user
                        ? $visit->selectedDoctor->user->name
                        : 'No Doctor Selected',
                    'vision_test_completed_at' => $visit->vision_test_completed_at,
                    'test_duration' => $visit->payment_completed_at && $visit->vision_test_completed_at
                        ? Carbon::parse($visit->payment_completed_at)
                        ->diffInMinutes(Carbon::parse($visit->vision_test_completed_at)) . ' minutes'
                        : null,
                    'vision_test_results' => $latestVisionTest ? [
                        'right_eye_sphere' => $latestVisionTest->right_eye_sphere,
                        'left_eye_sphere' => $latestVisionTest->left_eye_sphere,
                        'right_eye_cylinder' => $latestVisionTest->right_eye_cylinder,
                        'left_eye_cylinder' => $latestVisionTest->left_eye_cylinder,
                    ] : null,
                ];
            });

        return Inertia::render('Refractionist/Dashboard', [
            'visitsForVisionTest' => $visitsForVisionTest,
            'todayStats' => $todayStats,
            'recentCompletedTests' => $recentCompletedTests,
        ]);
    }

    /**
     * Start vision test for a patient visit
     */
    /**
     * Start vision test for a patient visit
     */
    public function startVisionTest(Request $request)
    {
        // Get visit ID from request (since we're using POST with visit ID)
        $visitId = $request->route('visit') ?? $request->input('visit_id');

        // Fetch visit with fresh data from database
        $visit = PatientVisit::with('patient')->findOrFail($visitId);

        // Debug information
        \Log::info('Starting vision test for visit', [
            'visit_id' => $visit->visit_id,
            'payment_status' => $visit->payment_status,
            'total_paid' => $visit->total_paid,
            'final_amount' => $visit->final_amount,
            'total_due' => $visit->total_due,
            'overall_status' => $visit->overall_status,
        ]);

        // Fresh check from database - don't recalculate if already correct
        if ($visit->payment_status !== 'paid') {
            // Only recalculate if status seems wrong
            $visit->updateTotals();
            $visit->refresh();

            // If still not paid after recalculation, return error
            if ($visit->payment_status !== 'paid') {
                \Log::warning('Payment not completed after recalculation', [
                    'visit_id' => $visit->visit_id,
                    'payment_status' => $visit->payment_status,
                    'total_paid' => $visit->total_paid,
                    'final_amount' => $visit->final_amount,
                ]);

                return back()->withErrors([
                    'error' => "Visit payment is not completed yet. Status: {$visit->payment_status}, Paid: ৳{$visit->total_paid}, Due: ৳{$visit->total_due}"
                ]);
            }
        }

        // Check if already in progress or completed
        if ($visit->vision_test_status === 'completed') {
            return back()->withErrors(['error' => 'Vision test already completed for this visit']);
        }


        try {
            // Update status to in_progress
            $visit->update([
                'vision_test_status' => 'in_progress',
                'overall_status' => 'vision_test'
            ]);

            \Log::info('Vision test started successfully', [
                'visit_id' => $visit->visit_id,
                'patient_name' => $visit->patient->name,
            ]);

            return redirect()->route('visiontests.create', ['patient' => $visit->patient_id])
                ->with('success', 'Vision test started for ' . $visit->patient->name)
                ->with('visit_id', $visit->id); // Pass visit ID in session

        } catch (\Exception $e) {
            \Log::error('Failed to start vision test', [
                'visit_id' => $visit->visit_id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Failed to start vision test: ' . $e->getMessage()]);
        }
    }

    /**
     * Get queue position for a visit
     */
    public function getQueuePosition(PatientVisit $visit)
    {
        $position = PatientVisit::readyForVisionTest()
            ->where('payment_completed_at', '<', $visit->payment_completed_at)
            ->count() + 1;

        return response()->json(['position' => $position]);
    }

    /**
     * Get real-time queue updates
     */
    public function getQueueUpdates()
    {
        $queue = PatientVisit::readyForVisionTest()
            ->with(['patient', 'selectedDoctor.user'])
            ->orderBy('payment_completed_at', 'asc')
            ->get()
            ->map(function ($visit, $index) {
                return [
                    'id' => $visit->id,
                    'visit_id' => $visit->visit_id,
                    'patient_id' => $visit->patient->patient_id,
                    'patient_name' => $visit->patient->name,
                    'position' => $index + 1,
                    'waiting_time' => $visit->payment_completed_at
                        ? Carbon::parse($visit->payment_completed_at)->diffForHumans()
                        : null,
                    'chief_complaint' => $visit->chief_complaint,
                    'doctor_name' => $visit->selectedDoctor && $visit->selectedDoctor->user
                        ? $visit->selectedDoctor->user->name
                        : 'No Doctor Selected',
                ];
            });

        return response()->json($queue);
    }

    /**
     * Mark visit as priority (emergency cases)
     */
    public function markAsPriority(PatientVisit $visit)
    {
        // Set payment_completed_at to current time to move to front of queue
        $visit->update([
            'payment_completed_at' => now(),
        ]);

        return back()->with('success', 'Visit marked as priority');
    }

    /**
     * Complete vision test and move to prescription
     */
    public function completeVisionTest(PatientVisit $visit)
    {
        if ($visit->vision_test_status !== 'in_progress') {
            return back()->withErrors(['error' => 'Vision test is not in progress']);
        }

        // Use the model method to complete vision test
        $visit->completeVisionTest();

        return back()->with('success', 'Vision test completed. Patient ready for prescription.');
    }

    /**
     * Get today's performance stats
     */
    public function getTodayPerformance()
    {
        $today = today();

        $stats = [
            'tests_completed' => PatientVisit::whereDate('vision_test_completed_at', $today)->count(),
            'average_test_duration' => $this->getAverageTestDuration($today),
            'visits_waiting' => PatientVisit::readyForVisionTest()->count(),
            'tests_in_progress' => PatientVisit::where('vision_test_status', 'in_progress')->count(),
            'total_revenue_tests' => PatientVisit::whereDate('vision_test_completed_at', $today)
                ->sum('final_amount'),
            'unique_patients_today' => PatientVisit::whereDate('vision_test_completed_at', $today)
                ->distinct('patient_id')
                ->count(),
        ];

        // Hourly breakdown
        $hourlyStats = PatientVisit::whereDate('vision_test_completed_at', $today)
            ->selectRaw('HOUR(vision_test_completed_at) as hour, COUNT(*) as count')
            ->groupBy('hour')
            ->orderBy('hour')
            ->pluck('count', 'hour')
            ->toArray();

        // Fill missing hours with zeros
        $hourlyBreakdown = [];
        for ($hour = 8; $hour <= 18; $hour++) {
            $hourlyBreakdown[] = [
                'hour' => sprintf('%02d:00', $hour),
                'tests' => $hourlyStats[$hour] ?? 0,
            ];
        }

        return response()->json([
            'stats' => $stats,
            'hourly_breakdown' => $hourlyBreakdown,
        ]);
    }

    /**
     * Get weekly performance comparison
     */
    public function getWeeklyPerformance()
    {
        $weeklyStats = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $testsCompleted = PatientVisit::whereDate('vision_test_completed_at', $date)->count();

            $weeklyStats[] = [
                'date' => $date->format('M d'),
                'day' => $date->format('D'),
                'tests' => $testsCompleted,
            ];
        }

        return response()->json($weeklyStats);
    }

    /**
     * Get vision test statistics by doctor
     */
    public function getStatsByDoctor()
    {
        $doctorStats = PatientVisit::whereDate('vision_test_completed_at', today())
            ->with('selectedDoctor.user')
            ->get()
            ->groupBy('selected_doctor_id')
            ->map(function ($visits, $doctorId) {
                $doctor = $visits->first()->selectedDoctor;
                return [
                    'doctor_id' => $doctorId,
                    'doctor_name' => $doctor && $doctor->user ? $doctor->user->name : 'No Doctor',
                    'tests_completed' => $visits->count(),
                    'avg_duration' => $visits->avg(function ($visit) {
                        return $visit->payment_completed_at && $visit->vision_test_completed_at
                            ? Carbon::parse($visit->payment_completed_at)
                            ->diffInMinutes(Carbon::parse($visit->vision_test_completed_at))
                            : 0;
                    }),
                ];
            })
            ->values();

        return response()->json($doctorStats);
    }

    /**
     * Search visits in queue
     */
    public function searchQueue(Request $request)
    {
        $searchTerm = $request->get('search');

        $visits = PatientVisit::readyForVisionTest()
            ->with(['patient', 'selectedDoctor.user'])
            ->whereHas('patient', function ($query) use ($searchTerm) {
                $query->where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('phone', 'like', '%' . $searchTerm . '%')
                    ->orWhere('patient_id', 'like', '%' . $searchTerm . '%');
            })
            ->orWhere('visit_id', 'like', '%' . $searchTerm . '%')
            ->orWhere('chief_complaint', 'like', '%' . $searchTerm . '%')
            ->orderBy('payment_completed_at', 'asc')
            ->get()
            ->map(function ($visit) {
                return [
                    'id' => $visit->id,
                    'visit_id' => $visit->visit_id,
                    'patient_id' => $visit->patient->patient_id,
                    'patient_name' => $visit->patient->name,
                    'patient_phone' => $visit->patient->phone,
                    'chief_complaint' => $visit->chief_complaint,
                    'waiting_time' => $visit->payment_completed_at
                        ? Carbon::parse($visit->payment_completed_at)->diffForHumans()
                        : null,
                ];
            });

        return response()->json($visits);
    }

    /**
     * Calculate average waiting time for visits ready for vision test
     */
    private function getAverageWaitingTime()
    {
        $waitingVisits = PatientVisit::readyForVisionTest()
            ->whereNotNull('payment_completed_at')
            ->get();

        if ($waitingVisits->isEmpty()) {
            return 0;
        }

        $totalMinutes = $waitingVisits->sum(function ($visit) {
            return Carbon::parse($visit->payment_completed_at)->diffInMinutes(now());
        });

        return round($totalMinutes / $waitingVisits->count());
    }

    /**
     * Calculate average test duration for a specific date
     */
    private function getAverageTestDuration($date)
    {
        $completedVisits = PatientVisit::whereDate('vision_test_completed_at', $date)
            ->whereNotNull('payment_completed_at')
            ->whereNotNull('vision_test_completed_at')
            ->get();

        if ($completedVisits->isEmpty()) {
            return 0;
        }

        $totalMinutes = $completedVisits->sum(function ($visit) {
            return Carbon::parse($visit->payment_completed_at)
                ->diffInMinutes(Carbon::parse($visit->vision_test_completed_at));
        });

        return round($totalMinutes / $completedVisits->count());
    }

    /**
     * Get visits by status for dashboard widgets
     */
    public function getVisitsByStatus()
    {
        $statusCounts = [
            'waiting' => PatientVisit::readyForVisionTest()->count(),
            'in_progress' => PatientVisit::where('vision_test_status', 'in_progress')->count(),
            'completed_today' => PatientVisit::whereDate('vision_test_completed_at', today())->count(),
            'ready_for_prescription' => PatientVisit::readyForPrescription()->count(),
        ];

        return response()->json($statusCounts);
    }

    /**
     * Update visit notes
     */
    public function updateVisitNotes(Request $request, PatientVisit $visit)
    {
        $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $visit->update([
            'visit_notes' => $request->notes,
        ]);

        return back()->with('success', 'Visit notes updated successfully');
    }
}
