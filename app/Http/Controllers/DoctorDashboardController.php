<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Appointment;
use App\Models\VisionTest;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DoctorDashboardController extends Controller
{
    /**
     * Display doctor dashboard with today's appointments by serial
     */
    // Fixed Controller - যদি prescriptions table এ visit_id না থাকে

    public function index()
    {
        $doctor = auth()->user()->doctor;

        if (!$doctor) {
            return redirect()->route('dashboard')
                ->withErrors(['error' => 'Doctor profile not found.']);
        }

        // Get today's ACTIVE visits for this doctor (not completed)
        $todaysActiveVisits = PatientVisit::where('selected_doctor_id', $doctor->id)
            ->whereDate('created_at', today())
            ->whereIn('overall_status', ['payment', 'vision_test', 'prescription']) // Only active statuses
            ->with(['patient', 'selectedDoctor.user', 'payments'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($visit, $index) {
                $hasVisionTest = VisionTest::where('patient_id', $visit->patient_id)
                    ->whereDate('test_date', today())
                    ->exists();

                // Check prescription by patient_id and doctor_id for today
                $hasPrescription = Prescription::where('patient_id', $visit->patient_id)
                    ->where('doctor_id', $visit->selected_doctor_id)
                    ->whereDate('created_at', today())
                    ->exists();

                return [
                    'id' => $visit->id,
                    'visit_id' => $visit->visit_id,
                    'patient_database_id' => $visit->patient_id,
                    'patient_id' => $visit->patient->patient_id,
                    'patient_name' => $visit->patient->name,
                    'patient_phone' => $visit->patient->phone,
                    'patient_age' => $visit->patient->date_of_birth
                        ? Carbon::parse($visit->patient->date_of_birth)->age
                        : null,
                    'patient_gender' => $visit->patient->gender,
                    'chief_complaint' => $visit->chief_complaint,
                    'medical_history' => $visit->patient->medical_history,
                    'visit_date' => $visit->created_at->toISOString(),
                    'overall_status' => $visit->overall_status,
                    'payment_status' => $visit->payment_status,
                    'vision_test_status' => $visit->vision_test_status,
                    'has_vision_test' => $hasVisionTest,
                    'has_prescription' => $hasPrescription,
                    'waiting_time' => $visit->created_at->diffForHumans(),
                    'serial_number' => $index + 1,
                    'final_amount' => $visit->final_amount ?? 0,
                    'total_paid' => $visit->total_paid ?? 0,
                    'total_due' => $visit->total_due ?? 0,
                ];
            });

        // Get today's statistics
        $todayStats = [
            'total_visits' => PatientVisit::where('selected_doctor_id', $doctor->id)
                ->whereDate('created_at', today())
                ->count(),
            'completed_visits' => PatientVisit::where('selected_doctor_id', $doctor->id)
                ->whereDate('created_at', today())
                ->where('overall_status', 'completed')
                ->count(),
            'pending_prescriptions' => PatientVisit::where('selected_doctor_id', $doctor->id)
                ->whereDate('created_at', today())
                ->where('overall_status', 'prescription')
                ->where('payment_status', 'paid')
                ->where('vision_test_status', 'completed')
                ->whereDoesntHave('prescriptions', function ($query) use ($doctor) {
                    $query->where('doctor_id', $doctor->id)
                        ->whereDate('created_at', today());
                })
                ->count(),
            'prescriptions_written' => Prescription::where('doctor_id', $doctor->id)
                ->whereDate('created_at', today())
                ->count(),
            'total_revenue' => PatientVisit::where('selected_doctor_id', $doctor->id)
                ->whereDate('created_at', today())
                ->sum('doctor_fee'),
        ];

        // Get recent prescriptions (without visit_id)
        $recentPrescriptions = Prescription::where('doctor_id', $doctor->id)
            ->with(['patient'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($prescription) {
                // Find related visit by patient and date
                $relatedVisit = PatientVisit::where('patient_id', $prescription->patient_id)
                    ->whereDate('created_at', $prescription->created_at->toDateString())
                    ->first();

                return [
                    'id' => $prescription->id,
                    'patient_name' => $prescription->patient->name,
                    'patient_id' => $prescription->patient->patient_id,
                    'visit_id' => $relatedVisit ? $relatedVisit->visit_id : 'N/A',
                    'created_at' => $prescription->created_at->format('M d, H:i'),
                    'medicines_count' => $prescription->prescriptionMedicines->count(),
                ];
            });

        return Inertia::render('Doctor/Dashboard', [
            'doctor' => [
                'id' => $doctor->id,
                'name' => auth()->user()->name,
                'specialization' => $doctor->specialization,
                'consultation_fee' => $doctor->consultation_fee,
            ],
            'todaysActiveVisits' => $todaysActiveVisits,
            'todayStats' => $todayStats,
            'recentPrescriptions' => $recentPrescriptions,
        ]);
    }

    /**
     * View specific patient details for consultation - COMPLETE A to Z VERSION
     */
    public function viewPatient(Patient $patient)
    {
        $doctor = auth()->user()->doctor;

        if (!$doctor) {
            return redirect()->route('doctor.dashboard')
                ->withErrors(['error' => 'Doctor profile not found.']);
        }

        // Load patient with ALL comprehensive data using proper relationships
        $patient = Patient::where('id', $patient->id)
            ->with([
                'visits' => function ($query) {
                    $query->with(['selectedDoctor.user', 'payments'])
                        ->orderBy('created_at', 'desc');
                },
                'visionTests' => function ($query) {
                    $query->with('performedBy')
                        ->orderBy('test_date', 'desc');
                },
                'prescriptions' => function ($query) {
                    $query->with(['prescriptionMedicines.medicine', 'doctor.user'])
                        ->orderBy('created_at', 'desc');
                },
                'appointments' => function ($query) {
                    $query->with('doctor.user')
                        ->orderBy('appointment_date', 'desc');
                }
            ])
            ->first();

        if (!$patient) {
            return redirect()->route('doctor.dashboard')
                ->withErrors(['error' => 'Patient not found.']);
        }

        // Get latest visit and vision test
        $latestVisit = $patient->visits->first();
        $latestVisionTest = $patient->visionTests->first();

        // Get today's appointment for this patient with this doctor
        $todaysAppointment = Appointment::where('doctor_id', $doctor->id)
            ->where('patient_id', $patient->id)
            ->whereDate('appointment_date', today())
            ->first();

        // Calculate comprehensive patient statistics
        $totalAmountPaid = $patient->visits->sum('total_paid') ?? 0;
        $totalAmountDue = $patient->visits->sum('total_due') ?? 0;
        $myPrescriptions = $patient->prescriptions->where('doctor_id', $doctor->id)->count();

        $patientStats = [
            'total_visits' => $patient->visits->count(),
            'total_prescriptions' => $patient->prescriptions->count(),
            'total_vision_tests' => $patient->visionTests->count(),
            'total_appointments' => $patient->appointments->count(),
            'my_prescriptions' => $myPrescriptions,
            'total_amount_paid' => $totalAmountPaid,
            'total_amount_due' => $totalAmountDue,
            'last_visit_date' => $latestVisit ? $latestVisit->created_at->format('M d, Y') : null,
            'last_vision_test_date' => $latestVisionTest ? Carbon::parse($latestVisionTest->test_date)->format('M d, Y') : null,
        ];

        // Format ALL visits with complete data and error handling
        $formattedVisits = $patient->visits->map(function ($visit) {
            return [
                'id' => $visit->id,
                'visit_id' => $visit->visit_id ?? 'N/A',
                'selected_doctor_id' => $visit->selected_doctor_id,
                'final_amount' => $visit->final_amount ?? 0,
                'total_paid' => $visit->total_paid ?? 0,
                'total_due' => $visit->total_due ?? 0,
                'payment_status' => $visit->payment_status ?? 'pending',
                'vision_test_status' => $visit->vision_test_status ?? 'pending',
                'overall_status' => $visit->overall_status ?? 'pending',
                'chief_complaint' => $visit->chief_complaint,
                'visit_notes' => $visit->visit_notes,
                'created_at' => $visit->created_at->toISOString(),
                'formatted_date' => $visit->created_at->format('M d, Y'),
                'formatted_time' => $visit->created_at->format('h:i A'),
                'selected_doctor' => $visit->selectedDoctor ? [
                    'id' => $visit->selectedDoctor->id,
                    'name' => $visit->selectedDoctor->user->name ?? 'Unknown Doctor',
                    'specialization' => $visit->selectedDoctor->specialization ?? 'General',
                ] : null,
                'payments' => $visit->payments ? $visit->payments->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'amount' => $payment->amount ?? 0,
                        'payment_date' => $payment->payment_date,
                        'payment_method' => $payment->payment_method ?? 'cash',
                        'notes' => $payment->notes,
                        'formatted_date' => Carbon::parse($payment->payment_date)->format('M d, Y'),
                    ];
                }) : collect([]),
            ];
        });

        // Format ALL vision tests with complete data and error handling
        $formattedVisionTests = $patient->visionTests->map(function ($test) {
            return [
                'id' => $test->id,
                'test_date' => $test->test_date,
                'formatted_date' => Carbon::parse($test->test_date)->format('M d, Y'),
                'formatted_time' => Carbon::parse($test->test_date)->format('h:i A'),
                'right_eye_vision' => $test->right_eye_vision,
                'left_eye_vision' => $test->left_eye_vision,
                'right_eye_sphere' => $test->right_eye_sphere,
                'left_eye_sphere' => $test->left_eye_sphere,
                'right_eye_cylinder' => $test->right_eye_cylinder,
                'left_eye_cylinder' => $test->left_eye_cylinder,
                'right_eye_axis' => $test->right_eye_axis,
                'left_eye_axis' => $test->left_eye_axis,
                'pupillary_distance' => $test->pupillary_distance,
                'additional_notes' => $test->additional_notes,
                'performed_by' => [
                    'id' => $test->performedBy ? $test->performedBy->id : null,
                    'name' => $test->performedBy ? $test->performedBy->name : 'Unknown',
                ],
                'can_print' => true,
            ];
        });

        // Format ALL prescriptions with complete data and error handling
        $formattedPrescriptions = $patient->prescriptions->map(function ($prescription) use ($doctor) {
            return [
                'id' => $prescription->id,
                'created_at' => $prescription->created_at->toISOString(),
                'formatted_date' => $prescription->created_at->format('M d, Y'),
                'formatted_time' => $prescription->created_at->format('h:i A'),
                'doctor' => [
                    'id' => $prescription->doctor->id,
                    'name' => $prescription->doctor->user->name ?? 'Unknown Doctor',
                    'specialization' => $prescription->doctor->specialization ?? 'General',
                ],
                'prescription_medicines' => $prescription->prescriptionMedicines ? $prescription->prescriptionMedicines->map(function ($medicine) {
                    return [
                        'id' => $medicine->id,
                        'medicine' => [
                            'id' => $medicine->medicine->id ?? null,
                            'name' => $medicine->medicine->name ?? 'Unknown Medicine',
                            'strength' => $medicine->medicine->strength ?? null,
                            'type' => $medicine->medicine->type ?? null,
                        ],
                        'dosage' => $medicine->dosage ?? 'N/A',
                        'frequency' => $medicine->frequency ?? 'N/A',
                        'duration' => $medicine->duration ?? 'N/A',
                        'instructions' => $medicine->instructions,
                        'quantity' => $medicine->quantity ?? null,
                    ];
                }) : collect([]),
                'medicines_count' => $prescription->prescriptionMedicines->count(),
                'can_print' => true,
                'can_edit' => $prescription->doctor_id === $doctor->id,
            ];
        });

        // Format ALL appointments with complete data and error handling
        $formattedAppointments = $patient->appointments->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'appointment_date' => $appointment->appointment_date,
                'appointment_time' => $appointment->appointment_time ?? 'N/A',
                'serial_number' => $appointment->serial_number ?? 'N/A',
                'status' => $appointment->status ?? 'pending',
                'formatted_date' => Carbon::parse($appointment->appointment_date)->format('M d, Y'),
                'doctor' => [
                    'id' => $appointment->doctor->id,
                    'name' => $appointment->doctor->user->name ?? 'Unknown Doctor',
                    'specialization' => $appointment->doctor->specialization ?? 'General',
                ],
                'is_today' => Carbon::parse($appointment->appointment_date)->isToday(),
                'is_past' => Carbon::parse($appointment->appointment_date)->isPast(),
            ];
        });

        return Inertia::render('Doctor/PatientView', [
            'patient' => [
                'id' => $patient->id,
                'patient_id' => $patient->patient_id,
                'name' => $patient->name,
                'phone' => $patient->phone,
                'nid_card' => $patient->nid_card,
                'email' => $patient->email,
                'address' => $patient->address,
                'date_of_birth' => $patient->date_of_birth,
                'gender' => $patient->gender,
                'medical_history' => $patient->medical_history,
                'created_at' => $patient->created_at->toISOString(),
                'formatted_registration_date' => $patient->created_at->format('M d, Y'),
                'age' => $patient->date_of_birth ? Carbon::parse($patient->date_of_birth)->age : null,
                // ALL FORMATTED DATA
                'visits' => $formattedVisits,
                'visionTests' => $formattedVisionTests,
                'prescriptions' => $formattedPrescriptions,
                'appointments' => $formattedAppointments,
                'stats' => $patientStats,
            ],
            'latestVisit' => $latestVisit ? [
                'id' => $latestVisit->id,
                'visit_id' => $latestVisit->visit_id ?? 'N/A',
                'chief_complaint' => $latestVisit->chief_complaint,
                'visit_notes' => $latestVisit->visit_notes,
                'overall_status' => $latestVisit->overall_status ?? 'pending',
                'payment_status' => $latestVisit->payment_status ?? 'pending',
                'vision_test_status' => $latestVisit->vision_test_status ?? 'pending',
                'final_amount' => $latestVisit->final_amount ?? 0,
                'total_paid' => $latestVisit->total_paid ?? 0,
                'total_due' => $latestVisit->total_due ?? 0,
                'formatted_date' => $latestVisit->created_at->format('M d, Y'),
            ] : null,
            'latestVisionTest' => $latestVisionTest ? [
                'id' => $latestVisionTest->id,
                'test_date' => $latestVisionTest->test_date,
                'formatted_date' => Carbon::parse($latestVisionTest->test_date)->format('M d, Y'),
                'right_eye_vision' => $latestVisionTest->right_eye_vision,
                'left_eye_vision' => $latestVisionTest->left_eye_vision,
                'right_eye_sphere' => $latestVisionTest->right_eye_sphere,
                'left_eye_sphere' => $latestVisionTest->left_eye_sphere,
                'right_eye_cylinder' => $latestVisionTest->right_eye_cylinder,
                'left_eye_cylinder' => $latestVisionTest->left_eye_cylinder,
                'right_eye_axis' => $latestVisionTest->right_eye_axis,
                'left_eye_axis' => $latestVisionTest->left_eye_axis,
                'pupillary_distance' => $latestVisionTest->pupillary_distance,
                'additional_notes' => $latestVisionTest->additional_notes,
                'performed_by' => [
                    'name' => $latestVisionTest->performedBy ? $latestVisionTest->performedBy->name : 'Unknown',
                ],
            ] : null,
            'todaysAppointment' => $todaysAppointment ? [
                'id' => $todaysAppointment->id,
                'serial_number' => $todaysAppointment->serial_number ?? 'N/A',
                'appointment_time' => $todaysAppointment->appointment_time ?? 'N/A',
                'status' => $todaysAppointment->status ?? 'pending',
            ] : null,
            'doctor' => [
                'id' => $doctor->id,
                'name' => auth()->user()->name,
                'specialization' => $doctor->specialization,
                'consultation_fee' => $doctor->consultation_fee,
            ],
        ]);
    }

    /**
     * Mark appointment as completed
     */
    public function completeAppointment(Appointment $appointment)
    {
        try {
            $doctor = auth()->user()->doctor;

            if (!$doctor) {
                return back()->withErrors(['error' => 'Doctor profile not found.']);
            }

            // Verify appointment belongs to this doctor
            if ($appointment->doctor_id !== $doctor->id) {
                return back()->withErrors(['error' => 'Unauthorized action.']);
            }

            DB::beginTransaction();

            $appointment->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            // Update visit status if exists
            $latestVisit = PatientVisit::where('patient_id', $appointment->patient_id)
                ->latest()
                ->first();

            if ($latestVisit && $latestVisit->overall_status === 'prescription') {
                $latestVisit->update([
                    'prescription_status' => 'completed',
                    'overall_status' => 'completed',
                    'prescription_completed_at' => now(),
                ]);
            }

            DB::commit();

            return back()->with('success', 'Appointment marked as completed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to complete appointment: ' . $e->getMessage()]);
        }
    }

    /**
     * Get next patient in queue
     */
    public function getNextPatient()
    {
        try {
            $doctor = auth()->user()->doctor;

            if (!$doctor) {
                return response()->json(['error' => 'Doctor profile not found'], 404);
            }

            $nextAppointment = Appointment::where('doctor_id', $doctor->id)
                ->whereDate('appointment_date', today())
                ->where('status', 'pending')
                ->with('patient')
                ->orderBy('serial_number', 'asc')
                ->first();

            if ($nextAppointment) {
                return response()->json([
                    'has_next' => true,
                    'appointment' => [
                        'id' => $nextAppointment->id,
                        'serial_number' => $nextAppointment->serial_number ?? 'N/A',
                        'patient_name' => $nextAppointment->patient->name,
                        'patient_id' => $nextAppointment->patient->patient_id,
                        'patient_database_id' => $nextAppointment->patient->id,
                        'appointment_time' => $nextAppointment->appointment_time ?? 'N/A',
                    ]
                ]);
            }

            return response()->json(['has_next' => false]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to get next patient: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get doctor's performance stats
     */
    public function getPerformanceStats(Request $request)
    {
        try {
            $doctor = auth()->user()->doctor;

            if (!$doctor) {
                return response()->json(['error' => 'Doctor profile not found'], 404);
            }

            $period = $request->get('period', 'week'); // week, month, year

            $dateRange = match ($period) {
                'week' => [now()->startOfWeek(), now()->endOfWeek()],
                'month' => [now()->startOfMonth(), now()->endOfMonth()],
                'year' => [now()->startOfYear(), now()->endOfYear()],
                default => [now()->startOfWeek(), now()->endOfWeek()],
            };

            $stats = [
                'appointments_count' => Appointment::where('doctor_id', $doctor->id)
                    ->whereBetween('appointment_date', $dateRange)
                    ->count(),
                'completed_appointments' => Appointment::where('doctor_id', $doctor->id)
                    ->whereBetween('appointment_date', $dateRange)
                    ->where('status', 'completed')
                    ->count(),
                'prescriptions_written' => Prescription::where('doctor_id', $doctor->id)
                    ->whereBetween('created_at', $dateRange)
                    ->count(),
                'unique_patients' => Appointment::where('doctor_id', $doctor->id)
                    ->whereBetween('appointment_date', $dateRange)
                    ->distinct('patient_id')
                    ->count(),
                'revenue_generated' => PatientVisit::whereHas('appointments', function ($query) use ($doctor, $dateRange) {
                    $query->where('doctor_id', $doctor->id)
                        ->whereBetween('appointment_date', $dateRange);
                })->sum('total_paid'),
            ];

            // Daily breakdown for the period
            $dailyStats = Appointment::where('doctor_id', $doctor->id)
                ->whereBetween('appointment_date', $dateRange)
                ->selectRaw('DATE(appointment_date) as date, COUNT(*) as appointments,
                            SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'daily_breakdown' => $dailyStats,
                'period' => $period,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to get performance stats: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Search patients for doctor with enhanced filtering
     */
    public function searchPatients(Request $request)
    {
        try {
            $request->validate([
                'term' => 'required|string|min:2|max:100',
                'limit' => 'sometimes|integer|min:1|max:50'
            ]);

            $searchTerm = $request->term;
            $limit = $request->get('limit', 10);

            $patients = Patient::where(function ($query) use ($searchTerm) {
                $query->where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('phone', 'like', '%' . $searchTerm . '%')
                    ->orWhere('patient_id', 'like', '%' . $searchTerm . '%')
                    ->orWhere('email', 'like', '%' . $searchTerm . '%');
            })
                ->with([
                    'visionTests' => function ($query) {
                        $query->latest()->limit(1);
                    },
                    'visits' => function ($query) {
                        $query->latest()->limit(1);
                    },
                    'prescriptions' => function ($query) {
                        $query->latest()->limit(1);
                    }
                ])
                ->limit($limit)
                ->get()
                ->map(function ($patient) {
                    $latestVisionTest = $patient->visionTests->first();
                    $latestVisit = $patient->visits->first();
                    $latestPrescription = $patient->prescriptions->first();

                    return [
                        'id' => $patient->id,
                        'patient_id' => $patient->patient_id,
                        'name' => $patient->name,
                        'phone' => $patient->phone,
                        'email' => $patient->email,
                        'age' => $patient->date_of_birth ? Carbon::parse($patient->date_of_birth)->age : null,
                        'gender' => $patient->gender,
                        'has_vision_test' => $latestVisionTest ? true : false,
                        'last_vision_test_date' => $latestVisionTest ? Carbon::parse($latestVisionTest->test_date)->format('M d, Y') : null,
                        'last_visit' => $latestVisit ? $latestVisit->created_at->diffForHumans() : null,
                        'last_visit_date' => $latestVisit ? $latestVisit->created_at->format('M d, Y') : null,
                        'last_prescription' => $latestPrescription ? $latestPrescription->created_at->diffForHumans() : null,
                        'medical_history' => $patient->medical_history ? true : false,
                    ];
                });

            return response()->json([
                'success' => true,
                'patients' => $patients,
                'total_found' => $patients->count(),
                'search_term' => $searchTerm,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Search failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update appointment status (for call next patient, etc.)
     */
    public function updateAppointmentStatus(Request $request, Appointment $appointment)
    {
        try {
            $doctor = auth()->user()->doctor;

            if (!$doctor) {
                return response()->json(['error' => 'Doctor profile not found'], 404);
            }

            // Verify appointment belongs to this doctor
            if ($appointment->doctor_id !== $doctor->id) {
                return response()->json(['error' => 'Unauthorized action'], 403);
            }

            $request->validate([
                'status' => 'required|in:pending,in_progress,completed,cancelled'
            ]);

            DB::beginTransaction();

            $oldStatus = $appointment->status;
            $newStatus = $request->status;

            $appointment->update([
                'status' => $newStatus,
                'status_updated_at' => now(),
                'status_updated_by' => auth()->id(),
            ]);

            // Log status change
            \Log::info("Appointment status updated", [
                'appointment_id' => $appointment->id,
                'patient_id' => $appointment->patient_id,
                'doctor_id' => $doctor->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'updated_by' => auth()->user()->name,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Appointment status updated successfully',
                'appointment' => [
                    'id' => $appointment->id,
                    'status' => $appointment->status,
                    'updated_at' => $appointment->updated_at,
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update appointment status: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get patient's complete medical summary for doctor
     */
    public function getPatientSummary(Request $request, Patient $patient)
    {
        try {
            $doctor = auth()->user()->doctor;

            if (!$doctor) {
                return response()->json(['error' => 'Doctor profile not found'], 404);
            }

            // Get comprehensive patient summary
            $summary = [
                'patient_info' => [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'age' => $patient->date_of_birth ? Carbon::parse($patient->date_of_birth)->age : null,
                    'gender' => $patient->gender,
                    'phone' => $patient->phone,
                    'medical_history' => $patient->medical_history,
                ],
                'visit_summary' => [
                    'total_visits' => $patient->visits()->count(),
                    'last_visit' => $patient->visits()->latest()->first()?->created_at?->format('M d, Y'),
                    'total_amount_paid' => $patient->visits()->sum('total_paid'),
                    'total_amount_due' => $patient->visits()->sum('total_due'),
                ],
                'vision_test_summary' => [
                    'total_tests' => $patient->visionTests()->count(),
                    'last_test' => $patient->visionTests()->latest()->first()?->test_date,
                    'latest_results' => $patient->visionTests()->latest()->first(),
                ],
                'prescription_summary' => [
                    'total_prescriptions' => $patient->prescriptions()->count(),
                    'my_prescriptions' => $patient->prescriptions()->where('doctor_id', $doctor->id)->count(),
                    'last_prescription' => $patient->prescriptions()->latest()->first()?->created_at?->format('M d, Y'),
                ],
                'appointment_summary' => [
                    'total_appointments' => $patient->appointments()->count(),
                    'with_me' => $patient->appointments()->where('doctor_id', $doctor->id)->count(),
                    'next_appointment' => $patient->appointments()
                        ->where('appointment_date', '>', now())
                        ->orderBy('appointment_date')
                        ->first(),
                ]
            ];
            return response()->json([
                'success' => true,
                'patient_summary' => $summary,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to get patient summary: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get doctor's daily schedule and queue
     */
    public function getDailySchedule(Request $request)
    {
        try {
            $doctor = auth()->user()->doctor;

            if (!$doctor) {
                return response()->json(['error' => 'Doctor profile not found'], 404);
            }

            $date = $request->get('date', today()->toDateString());

            $appointments = Appointment::where('doctor_id', $doctor->id)
                ->whereDate('appointment_date', $date)
                ->with(['patient', 'visit'])
                ->orderBy('serial_number', 'asc')
                ->get()
                ->map(function ($appointment) {
                    $latestVisit = PatientVisit::where('patient_id', $appointment->patient_id)
                        ->latest()
                        ->first();

                    return [
                        'id' => $appointment->id,
                        'serial_number' => $appointment->serial_number ?? 'N/A',
                        'appointment_time' => $appointment->appointment_time ?? 'N/A',
                        'status' => $appointment->status ?? 'pending',
                        'patient' => [
                            'id' => $appointment->patient->id,
                            'patient_id' => $appointment->patient->patient_id,
                            'name' => $appointment->patient->name,
                            'phone' => $appointment->patient->phone,
                            'age' => $appointment->patient->date_of_birth ?
                                Carbon::parse($appointment->patient->date_of_birth)->age : null,
                            'gender' => $appointment->patient->gender,
                        ],
                        'visit' => $latestVisit ? [
                            'id' => $latestVisit->id,
                            'visit_id' => $latestVisit->visit_id,
                            'chief_complaint' => $latestVisit->chief_complaint,
                            'overall_status' => $latestVisit->overall_status,
                        ] : null,
                        'waiting_time' => Carbon::parse($appointment->created_at)->diffForHumans(),
                    ];
                });

            $schedule_stats = [
                'total_appointments' => $appointments->count(),
                'completed' => $appointments->where('status', 'completed')->count(),
                'pending' => $appointments->where('status', 'pending')->count(),
                'in_progress' => $appointments->where('status', 'in_progress')->count(),
                'cancelled' => $appointments->where('status', 'cancelled')->count(),
            ];

            return response()->json([
                'success' => true,
                'date' => $date,
                'appointments' => $appointments,
                'stats' => $schedule_stats,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to get daily schedule: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get doctor's recent activities and notifications
     */
    public function getRecentActivities(Request $request)
    {
        try {
            $doctor = auth()->user()->doctor;

            if (!$doctor) {
                return response()->json(['error' => 'Doctor profile not found'], 404);
            }

            $limit = $request->get('limit', 20);
            $days = $request->get('days', 7);

            // Get recent prescriptions
            $recentPrescriptions = Prescription::where('doctor_id', $doctor->id)
                ->with('patient')
                ->whereBetween('created_at', [now()->subDays($days), now()])
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($prescription) {
                    return [
                        'type' => 'prescription',
                        'id' => $prescription->id,
                        'patient_name' => $prescription->patient->name,
                        'patient_id' => $prescription->patient->patient_id,
                        'created_at' => $prescription->created_at,
                        'formatted_date' => $prescription->created_at->format('M d, Y H:i'),
                        'medicines_count' => $prescription->prescriptionMedicines->count(),
                    ];
                });

            // Get recent appointments
            $recentAppointments = Appointment::where('doctor_id', $doctor->id)
                ->with('patient')
                ->whereBetween('appointment_date', [now()->subDays($days), now()->addDays(1)])
                ->orderBy('appointment_date', 'desc')
                ->orderBy('appointment_time', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($appointment) {
                    return [
                        'type' => 'appointment',
                        'id' => $appointment->id,
                        'patient_name' => $appointment->patient->name,
                        'patient_id' => $appointment->patient->patient_id,
                        'appointment_date' => $appointment->appointment_date,
                        'appointment_time' => $appointment->appointment_time ?? 'N/A',
                        'status' => $appointment->status ?? 'pending',
                        'serial_number' => $appointment->serial_number ?? 'N/A',
                        'formatted_date' => Carbon::parse($appointment->appointment_date)->format('M d, Y'),
                    ];
                });

            // Merge and sort all activities
            $allActivities = $recentPrescriptions->concat($recentAppointments)
                ->sortByDesc(function ($item) {
                    return $item['type'] === 'prescription' ? $item['created_at'] : $item['appointment_date'];
                })
                ->take($limit)
                ->values();

            return response()->json([
                'success' => true,
                'activities' => $allActivities,
                'total_count' => $allActivities->count(),
                'period_days' => $days,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to get recent activities: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export patient data for doctor (CSV/PDF)
     */
    public function exportPatientData(Request $request, Patient $patient)
    {
        try {
            $doctor = auth()->user()->doctor;

            if (!$doctor) {
                return response()->json(['error' => 'Doctor profile not found'], 404);
            }

            $format = $request->get('format', 'json'); // json, csv, pdf

            // Get comprehensive patient data
            $patientData = [
                'patient_info' => [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                    'email' => $patient->email,
                    'date_of_birth' => $patient->date_of_birth,
                    'age' => $patient->date_of_birth ? Carbon::parse($patient->date_of_birth)->age : null,
                    'gender' => $patient->gender,
                    'address' => $patient->address,
                    'nid_card' => $patient->nid_card,
                    'medical_history' => $patient->medical_history,
                    'registration_date' => $patient->created_at->format('Y-m-d'),
                ],
                'visits' => $patient->visits()->with(['selectedDoctor.user', 'payments'])->get()->map(function ($visit) {
                    return [
                        'visit_id' => $visit->visit_id,
                        'date' => $visit->created_at->format('Y-m-d'),
                        'time' => $visit->created_at->format('H:i'),
                        'doctor' => $visit->selectedDoctor ? $visit->selectedDoctor->user->name : 'N/A',
                        'chief_complaint' => $visit->chief_complaint,
                        'visit_notes' => $visit->visit_notes,
                        'final_amount' => $visit->final_amount ?? 0,
                        'total_paid' => $visit->total_paid ?? 0,
                        'total_due' => $visit->total_due ?? 0,
                        'payment_status' => $visit->payment_status ?? 'pending',
                        'overall_status' => $visit->overall_status ?? 'pending',
                    ];
                }),
                'vision_tests' => $patient->visionTests()->with('performedBy')->get()->map(function ($test) {
                    return [
                        'test_date' => $test->test_date,
                        'right_eye_vision' => $test->right_eye_vision,
                        'left_eye_vision' => $test->left_eye_vision,
                        'right_eye_sphere' => $test->right_eye_sphere,
                        'left_eye_sphere' => $test->left_eye_sphere,
                        'right_eye_cylinder' => $test->right_eye_cylinder,
                        'left_eye_cylinder' => $test->left_eye_cylinder,
                        'right_eye_axis' => $test->right_eye_axis,
                        'left_eye_axis' => $test->left_eye_axis,
                        'pupillary_distance' => $test->pupillary_distance,
                        'additional_notes' => $test->additional_notes,
                        'performed_by' => $test->performedBy ? $test->performedBy->name : 'Unknown',
                    ];
                }),
                'prescriptions' => $patient->prescriptions()->with(['prescriptionMedicines.medicine', 'doctor.user'])->get()->map(function ($prescription) {
                    return [
                        'prescription_id' => $prescription->id,
                        'date' => $prescription->created_at->format('Y-m-d'),
                        'time' => $prescription->created_at->format('H:i'),
                        'doctor' => $prescription->doctor->user->name,
                        'medicines' => $prescription->prescriptionMedicines->map(function ($medicine) {
                            return [
                                'name' => $medicine->medicine->name ?? 'Unknown',
                                'strength' => $medicine->medicine->strength,
                                'dosage' => $medicine->dosage,
                                'frequency' => $medicine->frequency,
                                'duration' => $medicine->duration,
                                'instructions' => $medicine->instructions,
                            ];
                        }),
                    ];
                }),
                'appointments' => $patient->appointments()->with('doctor.user')->get()->map(function ($appointment) {
                    return [
                        'appointment_date' => $appointment->appointment_date,
                        'appointment_time' => $appointment->appointment_time ?? 'N/A',
                        'serial_number' => $appointment->serial_number ?? 'N/A',
                        'status' => $appointment->status ?? 'pending',
                        'doctor' => $appointment->doctor->user->name,
                    ];
                }),
            ];

            if ($format === 'json') {
                return response()->json([
                    'success' => true,
                    'patient_data' => $patientData,
                    'exported_at' => now()->toISOString(),
                    'exported_by' => auth()->user()->name,
                ]);
            }

            // For CSV/PDF formats, you would implement the export logic here
            // This is a basic JSON response for now
            return response()->json([
                'success' => true,
                'message' => 'Export functionality for ' . $format . ' format will be implemented',
                'data_summary' => [
                    'patient_name' => $patient->name,
                    'total_visits' => count($patientData['visits']),
                    'total_vision_tests' => count($patientData['vision_tests']),
                    'total_prescriptions' => count($patientData['prescriptions']),
                    'total_appointments' => count($patientData['appointments']),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Quick patient registration from doctor panel
     */
    public function quickPatientRegistration(Request $request)
    {
        try {
            $doctor = auth()->user()->doctor;

            if (!$doctor) {
                return response()->json(['error' => 'Doctor profile not found'], 404);
            }

            $request->validate([
                'name' => 'required|string|max:255',
                'phone' => 'required|string|max:20|unique:patients,phone',
                'date_of_birth' => 'nullable|date|before:today',
                'gender' => 'nullable|in:male,female,other',
                'email' => 'nullable|email|unique:patients,email',
                'medical_history' => 'nullable|string',
                'chief_complaint' => 'nullable|string',
            ]);

            DB::beginTransaction();

            // Generate patient ID
            $lastPatient = Patient::latest('id')->first();
            $nextId = $lastPatient ? $lastPatient->id + 1 : 1;
            $patientId = 'P' . str_pad($nextId, 6, '0', STR_PAD_LEFT);

            // Create patient
            $patient = Patient::create([
                'patient_id' => $patientId,
                'name' => $request->name,
                'phone' => $request->phone,
                'date_of_birth' => $request->date_of_birth,
                'gender' => $request->gender,
                'email' => $request->email,
                'medical_history' => $request->medical_history,
                'created_by' => auth()->id(),
            ]);

            // Create appointment for today
            $todayAppointments = Appointment::where('doctor_id', $doctor->id)
                ->whereDate('appointment_date', today())
                ->count();

            $appointment = Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'appointment_date' => today(),
                'appointment_time' => now()->addMinutes(30)->format('H:i'),
                'serial_number' => $todayAppointments + 1,
                'status' => 'pending',
                'created_by' => auth()->id(),
            ]);

            // Create initial visit if chief complaint provided
            if ($request->chief_complaint) {
                $visitId = 'V' . str_pad(PatientVisit::count() + 1, 8, '0', STR_PAD_LEFT);

                PatientVisit::create([
                    'visit_id' => $visitId,
                    'patient_id' => $patient->id,
                    'selected_doctor_id' => $doctor->id,
                    'chief_complaint' => $request->chief_complaint,
                    'overall_status' => 'registration',
                    'payment_status' => 'pending',
                    'vision_test_status' => 'pending',
                    'final_amount' => $doctor->consultation_fee ?? 0,
                    'total_paid' => 0,
                    'total_due' => $doctor->consultation_fee ?? 0,
                    'created_by' => auth()->id(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Patient registered successfully',
                'patient' => [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                ],
                'appointment' => [
                    'id' => $appointment->id,
                    'serial_number' => $appointment->serial_number,
                    'appointment_time' => $appointment->appointment_time,
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Registration failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get doctor's weekly/monthly summary
     */
    public function getDoctorSummary(Request $request)
    {
        try {
            $doctor = auth()->user()->doctor;

            if (!$doctor) {
                return response()->json(['error' => 'Doctor profile not found'], 404);
            }

            $period = $request->get('period', 'week'); // week, month, year
            $startDate = match ($period) {
                'week' => now()->startOfWeek(),
                'month' => now()->startOfMonth(),
                'year' => now()->startOfYear(),
                default => now()->startOfWeek(),
            };
            $endDate = match ($period) {
                'week' => now()->endOfWeek(),
                'month' => now()->endOfMonth(),
                'year' => now()->endOfYear(),
                default => now()->endOfWeek(),
            };

            $summary = [
                'period' => $period,
                'date_range' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => $endDate->format('Y-m-d'),
                ],
                'appointments' => [
                    'total' => Appointment::where('doctor_id', $doctor->id)
                        ->whereBetween('appointment_date', [$startDate, $endDate])
                        ->count(),
                    'completed' => Appointment::where('doctor_id', $doctor->id)
                        ->whereBetween('appointment_date', [$startDate, $endDate])
                        ->where('status', 'completed')
                        ->count(),
                    'cancelled' => Appointment::where('doctor_id', $doctor->id)
                        ->whereBetween('appointment_date', [$startDate, $endDate])
                        ->where('status', 'cancelled')
                        ->count(),
                ],
                'prescriptions' => [
                    'total' => Prescription::where('doctor_id', $doctor->id)
                        ->whereBetween('created_at', [$startDate, $endDate])
                        ->count(),
                    'total_medicines' => Prescription::where('doctor_id', $doctor->id)
                        ->whereBetween('created_at', [$startDate, $endDate])
                        ->withCount('prescriptionMedicines')
                        ->get()
                        ->sum('prescription_medicines_count'),
                ],
                'patients' => [
                    'unique_patients' => Appointment::where('doctor_id', $doctor->id)
                        ->whereBetween('appointment_date', [$startDate, $endDate])
                        ->distinct('patient_id')
                        ->count(),
                    'new_patients' => Patient::whereHas('appointments', function ($query) use ($doctor, $startDate, $endDate) {
                        $query->where('doctor_id', $doctor->id)
                            ->whereBetween('appointment_date', [$startDate, $endDate]);
                    })
                        ->whereBetween('created_at', [$startDate, $endDate])
                        ->count(),
                ],
                'performance' => [
                    'avg_daily_appointments' => Appointment::where('doctor_id', $doctor->id)
                        ->whereBetween('appointment_date', [$startDate, $endDate])
                        ->selectRaw('DATE(appointment_date) as date, COUNT(*) as count')
                        ->groupBy('date')
                        ->get()
                        ->avg('count'),
                    'completion_rate' => Appointment::where('doctor_id', $doctor->id)
                        ->whereBetween('appointment_date', [$startDate, $endDate])
                        ->selectRaw('
                           COUNT(*) as total,
                           SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed
                       ')
                        ->first(),
                ]
            ];

            // Calculate completion rate percentage
            $performanceData = $summary['performance']['completion_rate'];
            $summary['performance']['completion_rate'] = $performanceData->total > 0
                ? round(($performanceData->completed / $performanceData->total) * 100, 2)
                : 0;

            return response()->json([
                'success' => true,
                'doctor_summary' => $summary,
                'generated_at' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate summary: ' . $e->getMessage()], 500);
        }
    }
}
