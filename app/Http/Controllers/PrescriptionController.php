<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\VisionTest;
use App\Models\Prescription;
use App\Models\PrescriptionMedicine;
use App\Models\PrescriptionGlasses;
use App\Models\Medicine;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class PrescriptionController extends Controller
{
    /**
     * Display a listing of prescriptions (Admin/Staff view)
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();

            // Check if user can view all prescriptions
            if (!in_array($user->role, ['super_admin', 'receptionist'])) {
                return redirect()->route('dashboard')
                    ->with('error', 'You are not authorized to view all prescriptions');
            }

            $prescriptions = Prescription::with(['patient', 'doctor.user', 'prescriptionMedicines', 'prescriptionGlasses'])
                ->when($request->search, function ($query, $search) {
                    $query->whereHas('patient', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('patient_id', 'like', "%{$search}%");
                    });
                })
                ->when($request->doctor_id, function ($query, $doctorId) {
                    $query->where('doctor_id', $doctorId);
                })
                ->when($request->date_from, function ($query, $dateFrom) {
                    $query->whereDate('created_at', '>=', $dateFrom);
                })
                ->when($request->date_to, function ($query, $dateTo) {
                    $query->whereDate('created_at', '<=', $dateTo);
                })
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            $doctors = Doctor::with('user')->get();

            return Inertia::render('Prescriptions/Index', [
                'prescriptions' => $prescriptions,
                'doctors' => $doctors,
                'filters' => $request->only(['search', 'doctor_id', 'date_from', 'date_to']),
            ]);
        } catch (\Exception $e) {
            Log::error('Prescription Index Error: ' . $e->getMessage());
            return redirect()->route('dashboard')
                ->with('error', 'Failed to load prescriptions');
        }
    }

    /**
     * Show the form for creating a new prescription (Doctor's view)
     */
    public function create($patientId, $appointmentId = null)
    {
        try {
            $user = auth()->user();

            // Check if user is authenticated
            if (!$user) {
                return redirect()->route('login');
            }

            // Ensure the user is a doctor
            $doctor = $user->doctor;
            if (!$doctor) {
                $doctor = Doctor::where('user_id', $user->id)->first();
                if (!$doctor) {
                    return redirect()->route('dashboard')
                        ->with('error', 'Only doctors can create prescriptions. Please contact administrator.');
                }
            }

            // Get patient with comprehensive data
            $patient = Patient::where('id', $patientId)
                ->with([
                    'visits' => function ($query) {
                        $query->with(['selectedDoctor.user', 'payments'])
                            ->orderBy('created_at', 'desc')
                            ->limit(5);
                    },
                    'visionTests' => function ($query) {
                        $query->with('performedBy')
                            ->orderBy('test_date', 'desc')
                            ->limit(3);
                    },
                    'prescriptions' => function ($query) {
                        $query->with(['prescriptionMedicines.medicine', 'prescriptionGlasses', 'doctor.user'])
                            ->orderBy('created_at', 'desc')
                            ->limit(5);
                    },
                    'appointments' => function ($query) {
                        $query->with('doctor.user')
                            ->orderBy('appointment_date', 'desc')
                            ->limit(3);
                    }
                ])
                ->first();

            if (!$patient) {
                return redirect()->route('doctor.dashboard')
                    ->with('error', 'Patient not found');
            }

            // Get current appointment if provided
            $appointment = null;
            if ($appointmentId) {
                $appointment = Appointment::where('id', $appointmentId)
                    ->where('patient_id', $patientId)
                    ->first();

                if (!$appointment) {
                    return redirect()->route('doctor.view-patient', $patient->id)
                        ->with('error', 'Appointment not found for this patient.');
                }
            }

            // Get latest visit and vision test
            $latestVisit = $patient->visits->first();
            $latestVisionTest = $patient->visionTests->first();

            // Get today's appointment if no specific appointment provided
            $todaysAppointment = null;
            if (!$appointment) {
                $todaysAppointment = Appointment::where('doctor_id', $doctor->id)
                    ->where('patient_id', $patientId)
                    ->whereDate('appointment_date', today())
                    ->first();
            }

            // Get all active medicines
            $medicines = Medicine::where('is_active', true)
                ->withSum(['stocks as available_quantity' => function ($query) {
                    $query->where('is_active', true);
                }], 'available_quantity')
                ->orderBy('type')
                ->orderBy('name')
                ->get()
                ->map(function ($medicine) {
                    return [
                        'id' => $medicine->id,
                        'name' => $medicine->name,
                        'generic_name' => $medicine->generic_name,
                        'type' => $medicine->type ?? 'General',
                        'manufacturer' => $medicine->manufacturer,
                        'available_quantity' => $medicine->available_quantity ?? 0,
                    ];
                });

            // Format patient data for frontend
            $formattedPatient = [
                'id' => $patient->id,
                'patient_id' => $patient->patient_id,
                'name' => $patient->name,
                'phone' => $patient->phone,
                'email' => $patient->email,
                'address' => $patient->address,
                'date_of_birth' => $patient->date_of_birth,
                'gender' => $patient->gender,
                'medical_history' => $patient->medical_history,
                'age' => $patient->date_of_birth ? Carbon::parse($patient->date_of_birth)->age : null,
                // Recent data
                'recent_visits' => $patient->visits->map(function ($visit) {
                    return [
                        'id' => $visit->id,
                        'visit_id' => $visit->visit_id,
                        'chief_complaint' => $visit->chief_complaint,
                        'visit_notes' => $visit->visit_notes,
                        'overall_status' => $visit->overall_status,
                        'created_at' => $visit->created_at->format('M d, Y'),
                        'doctor_name' => $visit->selectedDoctor ? $visit->selectedDoctor->user->name : 'N/A',
                    ];
                }),
                'recent_prescriptions' => $patient->prescriptions->map(function ($prescription) {
                    return [
                        'id' => $prescription->id,
                        'diagnosis' => $prescription->diagnosis,
                        'created_at' => $prescription->created_at->format('M d, Y'),
                        'doctor_name' => $prescription->doctor->user->name,
                        'medicines_count' => $prescription->prescriptionMedicines->count(),
                        'has_glasses' => $prescription->prescriptionGlasses->count() > 0,
                        'glasses_count' => $prescription->prescriptionGlasses->count(),
                    ];
                }),
            ];

            // Format latest vision test
            $formattedVisionTest = null;
            if ($latestVisionTest) {
                $formattedVisionTest = [
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
                    'performed_by' => $latestVisionTest->performedBy ? $latestVisionTest->performedBy->name : 'Unknown',
                ];
            }

            // Format appointment data
            $formattedAppointment = null;
            if ($appointment || $todaysAppointment) {
                $apt = $appointment ?: $todaysAppointment;
                $formattedAppointment = [
                    'id' => $apt->id,
                    'appointment_date' => $apt->appointment_date,
                    'appointment_time' => $apt->appointment_time ?? 'N/A',
                    'serial_number' => $apt->serial_number ?? 'N/A',
                    'status' => $apt->status ?? 'pending',
                    'formatted_date' => Carbon::parse($apt->appointment_date)->format('M d, Y'),
                ];
            }

            return Inertia::render('Prescriptions/Create', [
                'patient' => $formattedPatient,
                'appointment' => $formattedAppointment,
                'latestVisit' => $latestVisit ? [
                    'id' => $latestVisit->id,
                    'visit_id' => $latestVisit->visit_id,
                    'chief_complaint' => $latestVisit->chief_complaint,
                    'visit_notes' => $latestVisit->visit_notes,
                    'overall_status' => $latestVisit->overall_status,
                    'formatted_date' => $latestVisit->created_at->format('M d, Y'),
                ] : null,
                'latestVisionTest' => $formattedVisionTest,
                'medicines' => $medicines,
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $user->name,
                    'specialization' => $doctor->specialization ?? 'General',
                    'consultation_fee' => $doctor->consultation_fee ?? 0,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Prescription Create Error: ' . $e->getMessage());
            return redirect()->route('doctor.dashboard')
                ->with('error', 'Failed to load prescription form: ' . $e->getMessage());
        }
    }

    /**
     * Store a newly created prescription (Doctor's simplified version)
     */
    public function store(Request $request, $patientId)
    {
        try {
            $user = auth()->user();

            // Check authentication
            if (!$user) {
                return redirect()->route('login');
            }

            // Ensure the user is a doctor
            $doctor = $user->doctor;
            if (!$doctor) {
                $doctor = Doctor::where('user_id', $user->id)->first();
                if (!$doctor) {
                    return back()->with('error', 'Only doctors can create prescriptions');
                }
            }

            $patient = Patient::findOrFail($patientId);

            // Find the active visit for prescription
            $activeVisit = $patient->visits()
                ->whereIn('overall_status', ['prescription', 'vision_test'])
                ->latest()
                ->first();

            // Enhanced validation for simplified system
            $request->validate([
                'appointment_id' => 'nullable|exists:appointments,id',
                'visit_id' => 'nullable|exists:patient_visits,id',
                'diagnosis' => 'required|string|max:1000',
                'advice' => 'nullable|string|max:2000',
                'notes' => 'nullable|string|max:1000',
                'followup_date' => 'nullable|date|after:today',
                'includes_glasses' => 'boolean',
                'glasses_notes' => 'nullable|string|max:1000',

                // Medicines validation
                'medicines' => 'nullable|array',
                'medicines.*.medicine_id' => 'required_with:medicines|exists:medicines,id',
                'medicines.*.dosage' => 'required_with:medicines|string|max:255',
                'medicines.*.frequency' => 'nullable|string|max:255',
                'medicines.*.duration' => 'nullable|string|max:255',
                'medicines.*.instructions' => 'nullable|string|max:500',
                'medicines.*.quantity' => 'nullable|integer|min:1',

                // Simplified glasses validation - only medical data
                'glasses' => 'nullable|array',
                'glasses.*.prescription_type' => 'required_with:glasses|in:distance,reading,progressive,bifocal,computer',
                'glasses.*.right_eye_sphere' => 'nullable|numeric|between:-20,20',
                'glasses.*.right_eye_cylinder' => 'nullable|numeric|between:-10,10',
                'glasses.*.right_eye_axis' => 'nullable|integer|between:0,180',
                'glasses.*.right_eye_add' => 'nullable|numeric|between:0,5',
                'glasses.*.left_eye_sphere' => 'nullable|numeric|between:-20,20',
                'glasses.*.left_eye_cylinder' => 'nullable|numeric|between:-10,10',
                'glasses.*.left_eye_axis' => 'nullable|integer|between:0,180',
                'glasses.*.left_eye_add' => 'nullable|numeric|between:0,5',
                'glasses.*.pupillary_distance' => 'nullable|numeric|between:45,85',
                'glasses.*.segment_height' => 'nullable|numeric|between:10,30',
                'glasses.*.special_instructions' => 'nullable|string|max:500',
            ]);

            DB::beginTransaction();

            // Determine visit_id to use
            $visitId = null;
            if ($request->visit_id) {
                // Use provided visit_id
                $visitId = $request->visit_id;
            } elseif ($activeVisit) {
                // Use active visit
                $visitId = $activeVisit->id;
            }

            // Create prescription - INCLUDE visit_id
            $prescription = Prescription::create([
                'patient_id' => $patientId,
                'visit_id' => $visitId,  // ✅ THIS WAS MISSING!
                'doctor_id' => $doctor->id,
                'appointment_id' => $request->appointment_id,
                'diagnosis' => $request->diagnosis,
                'advice' => $request->advice,
                'notes' => $request->notes,
                'followup_date' => $request->followup_date,
                'includes_glasses' => $request->boolean('includes_glasses'),
                'glasses_notes' => $request->glasses_notes,
                'created_by' => $user->id,
            ]);

            // Add medicines to prescription if provided
            if ($request->has('medicines') && is_array($request->medicines)) {
                foreach ($request->medicines as $medicineData) {
                    PrescriptionMedicine::create([
                        'prescription_id' => $prescription->id,
                        'medicine_id' => $medicineData['medicine_id'],
                        'dosage' => $medicineData['dosage'],
                        'frequency' => $medicineData['frequency'] ?? null,
                        'duration' => $medicineData['duration'] ?? null,
                        'instructions' => $medicineData['instructions'] ?? null,
                        'quantity' => $medicineData['quantity'] ?? null,
                    ]);
                }
            }

            // Add glasses prescription (medical data only)
            if ($request->has('glasses') && is_array($request->glasses)) {
                foreach ($request->glasses as $glassData) {
                    PrescriptionGlasses::create([
                        'prescription_id' => $prescription->id,
                        'prescription_type' => $glassData['prescription_type'],
                        'right_eye_sphere' => $glassData['right_eye_sphere'] ?? null,
                        'right_eye_cylinder' => $glassData['right_eye_cylinder'] ?? null,
                        'right_eye_axis' => $glassData['right_eye_axis'] ?? null,
                        'right_eye_add' => $glassData['right_eye_add'] ?? null,
                        'left_eye_sphere' => $glassData['left_eye_sphere'] ?? null,
                        'left_eye_cylinder' => $glassData['left_eye_cylinder'] ?? null,
                        'left_eye_axis' => $glassData['left_eye_axis'] ?? null,
                        'left_eye_add' => $glassData['left_eye_add'] ?? null,
                        'pupillary_distance' => $glassData['pupillary_distance'] ?? null,
                        'segment_height' => $glassData['segment_height'] ?? null,
                        'special_instructions' => $glassData['special_instructions'] ?? null,
                        // No commercial data (frames, lenses, pricing, delivery)
                    ]);
                }
            }

            // Update appointment status if provided
            if ($request->appointment_id) {
                $appointment = $patient->appointments()->find($request->appointment_id);
                if ($appointment && $appointment->doctor_id === $doctor->id) {
                    $appointment->update(['status' => 'completed']);
                }
            }

            // Update visit status if we have an active visit
            if ($activeVisit) {
                $activeVisit->update([
                    'prescription_status' => 'completed',
                    'overall_status' => 'completed',
                    'prescription_completed_at' => now(),
                ]);
            }

            DB::commit();

            // Log successful prescription creation - Enhanced logging
            Log::info('Prescription created successfully', [
                'prescription_id' => $prescription->id,
                'patient_id' => $patientId,
                'visit_id' => $visitId,  // ✅ Log visit_id
                'prescription_visit_id' => $prescription->visit_id,  // ✅ Confirm it's saved
                'doctor_id' => $doctor->id,
                'medicines_count' => $request->has('medicines') ? count($request->medicines) : 0,
                'glasses_count' => $request->has('glasses') ? count($request->glasses) : 0,
                'includes_glasses' => $request->boolean('includes_glasses'),
            ]);

            return redirect()->route('prescriptions.show', $prescription->id)
                ->with('success', 'Prescription created successfully!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::error('Prescription Validation Error', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Prescription Store Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return back()->with('error', 'Failed to create prescription: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Display the specified prescription
     */
    public function show($id)
    {
        try {
            $prescription = Prescription::with([
                'patient',
                'doctor.user',
                'appointment',
                'prescriptionMedicines.medicine',
                'prescriptionGlasses',
                'createdBy'
            ])->findOrFail($id);

            // Check if user can view this prescription
            $user = auth()->user();
            $canView = false;

            if ($user->role === 'super_admin') {
                $canView = true;
            } elseif ($user->role->name === 'Doctor' && $user->doctor && $user->doctor->id === $prescription->doctor_id) {
                $canView = true;
            } elseif (in_array($user->role, ['receptionist', 'refractionist'])) {
                $canView = true; // Staff can view all prescriptions
            }

            if (!$canView) {
                return redirect()->route('dashboard')
                    ->with('error', 'You are not authorized to view this prescription');
            }

            // Format prescription data for frontend
            $formattedPrescription = [
                'id' => $prescription->id,
                'diagnosis' => $prescription->diagnosis,
                'advice' => $prescription->advice,
                'notes' => $prescription->notes,
                'followup_date' => $prescription->followup_date,
                'includes_glasses' => $prescription->includes_glasses,
                'glasses_notes' => $prescription->glasses_notes,
                'created_at' => $prescription->created_at,
                'formatted_date' => $prescription->created_at->format('M d, Y'),
                'formatted_time' => $prescription->created_at->format('h:i A'),
                'patient' => [
                    'id' => $prescription->patient->id,
                    'patient_id' => $prescription->patient->patient_id,
                    'name' => $prescription->patient->name,
                    'phone' => $prescription->patient->phone,
                    'age' => $prescription->patient->date_of_birth ?
                        Carbon::parse($prescription->patient->date_of_birth)->age : null,
                    'gender' => $prescription->patient->gender,
                    'address' => $prescription->patient->address,
                ],
                'doctor' => [
                    'id' => $prescription->doctor->id,
                    'name' => $prescription->doctor->user->name,
                    'specialization' => $prescription->doctor->specialization ?? 'General',
                ],
                'appointment' => $prescription->appointment ? [
                    'id' => $prescription->appointment->id,
                    'appointment_date' => $prescription->appointment->appointment_date,
                    'appointment_time' => $prescription->appointment->appointment_time,
                    'serial_number' => $prescription->appointment->serial_number,
                    'formatted_date' => Carbon::parse($prescription->appointment->appointment_date)->format('M d, Y'),
                ] : null,
                'medicines' => $prescription->prescriptionMedicines->map(function ($prescriptionMedicine) {
                    return [
                        'id' => $prescriptionMedicine->id,
                        'medicine' => [
                            'id' => $prescriptionMedicine->medicine->id,
                            'name' => $prescriptionMedicine->medicine->name,
                            'generic_name' => $prescriptionMedicine->medicine->generic_name,
                            'type' => $prescriptionMedicine->medicine->type ?? 'General',
                            'manufacturer' => $prescriptionMedicine->medicine->manufacturer,
                        ],
                        'dosage' => $prescriptionMedicine->dosage,
                        'frequency' => $prescriptionMedicine->frequency,
                        'duration' => $prescriptionMedicine->duration,
                        'instructions' => $prescriptionMedicine->instructions,
                        'quantity' => $prescriptionMedicine->quantity,
                    ];
                }),
                'glasses' => $prescription->prescriptionGlasses->map(function ($prescriptionGlass) {
                    return [
                        'id' => $prescriptionGlass->id,
                        'prescription_type' => $prescriptionGlass->prescription_type,
                        'right_eye_sphere' => $prescriptionGlass->right_eye_sphere,
                        'right_eye_cylinder' => $prescriptionGlass->right_eye_cylinder,
                        'right_eye_axis' => $prescriptionGlass->right_eye_axis,
                        'right_eye_add' => $prescriptionGlass->right_eye_add,
                        'left_eye_sphere' => $prescriptionGlass->left_eye_sphere,
                        'left_eye_cylinder' => $prescriptionGlass->left_eye_cylinder,
                        'left_eye_axis' => $prescriptionGlass->left_eye_axis,
                        'left_eye_add' => $prescriptionGlass->left_eye_add,
                        'pupillary_distance' => $prescriptionGlass->pupillary_distance,
                        'segment_height' => $prescriptionGlass->segment_height,
                        'special_instructions' => $prescriptionGlass->special_instructions,
                        'right_eye_prescription' => $this->formatEyePrescription(
                            $prescriptionGlass->right_eye_sphere,
                            $prescriptionGlass->right_eye_cylinder,
                            $prescriptionGlass->right_eye_axis,
                            $prescriptionGlass->right_eye_add
                        ),
                        'left_eye_prescription' => $this->formatEyePrescription(
                            $prescriptionGlass->left_eye_sphere,
                            $prescriptionGlass->left_eye_cylinder,
                            $prescriptionGlass->left_eye_axis,
                            $prescriptionGlass->left_eye_add
                        ),
                    ];
                }),
                'can_edit' => $user->role === 'doctor' && $user->doctor &&
                    $user->doctor->id === $prescription->doctor_id,
                'can_print' => true,
                'created_by' => $prescription->createdBy ? $prescription->createdBy->name : 'Unknown',
            ];

            return Inertia::render('Prescriptions/Show', [
                'prescription' => $formattedPrescription
            ]);
        } catch (\Exception $e) {
            Log::error('Prescription Show Error: ' . $e->getMessage());
            return redirect()->route('dashboard')
                ->with('error', 'Prescription not found or access denied');
        }
    }

    /**
     * Show the form for editing the specified prescription
     */
    public function edit($id)
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return redirect()->route('login');
            }

            $doctor = $user->doctor;
            if (!$doctor) {
                $doctor = Doctor::where('user_id', $user->id)->first();
                if (!$doctor) {
                    return redirect()->route('dashboard')
                        ->with('error', 'Only doctors can edit prescriptions');
                }
            }

            $prescription = Prescription::with([
                'patient',
                'doctor.user',
                'appointment',
                'prescriptionMedicines.medicine',
                'prescriptionGlasses'
            ])->findOrFail($id);

            // Check if current doctor can edit this prescription
            if ($prescription->doctor_id !== $doctor->id) {
                return redirect()->route('prescriptions.show', $id)
                    ->with('error', 'You can only edit your own prescriptions');
            }

            $medicines = Medicine::where('is_active', true)
                ->orderBy('type')
                ->orderBy('name')
                ->get()
                ->map(function ($medicine) {
                    return [
                        'id' => $medicine->id,
                        'name' => $medicine->name,
                        'generic_name' => $medicine->generic_name,
                        'type' => $medicine->type ?? 'General',
                        'manufacturer' => $medicine->manufacturer,
                    ];
                });

            // Format prescription for editing
            $formattedPrescription = [
                'id' => $prescription->id,
                'diagnosis' => $prescription->diagnosis,
                'advice' => $prescription->advice,
                'notes' => $prescription->notes,
                'followup_date' => $prescription->followup_date,
                'includes_glasses' => $prescription->includes_glasses,
                'glasses_notes' => $prescription->glasses_notes,
                'patient' => [
                    'id' => $prescription->patient->id,
                    'patient_id' => $prescription->patient->patient_id,
                    'name' => $prescription->patient->name,
                    'phone' => $prescription->patient->phone,
                    'age' => $prescription->patient->date_of_birth ?
                        Carbon::parse($prescription->patient->date_of_birth)->age : null,
                    'gender' => $prescription->patient->gender,
                ],
                'medicines' => $prescription->prescriptionMedicines->map(function ($prescriptionMedicine) {
                    return [
                        'id' => $prescriptionMedicine->id,
                        'medicine_id' => $prescriptionMedicine->medicine_id,
                        'dosage' => $prescriptionMedicine->dosage,
                        'frequency' => $prescriptionMedicine->frequency,
                        'duration' => $prescriptionMedicine->duration,
                        'instructions' => $prescriptionMedicine->instructions,
                        'quantity' => $prescriptionMedicine->quantity,
                    ];
                }),
                'glasses' => $prescription->prescriptionGlasses->map(function ($prescriptionGlass) {
                    return [
                        'id' => $prescriptionGlass->id,
                        'prescription_type' => $prescriptionGlass->prescription_type,
                        'right_eye_sphere' => $prescriptionGlass->right_eye_sphere,
                        'right_eye_cylinder' => $prescriptionGlass->right_eye_cylinder,
                        'right_eye_axis' => $prescriptionGlass->right_eye_axis,
                        'right_eye_add' => $prescriptionGlass->right_eye_add,
                        'left_eye_sphere' => $prescriptionGlass->left_eye_sphere,
                        'left_eye_cylinder' => $prescriptionGlass->left_eye_cylinder,
                        'left_eye_axis' => $prescriptionGlass->left_eye_axis,
                        'left_eye_add' => $prescriptionGlass->left_eye_add,
                        'pupillary_distance' => $prescriptionGlass->pupillary_distance,
                        'segment_height' => $prescriptionGlass->segment_height,
                        'special_instructions' => $prescriptionGlass->special_instructions,
                    ];
                }),
            ];

            return Inertia::render('Prescriptions/Edit', [
                'prescription' => $formattedPrescription,
                'medicines' => $medicines,
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $user->name,
                    'specialization' => $doctor->specialization ?? 'General',
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Prescription Edit Error: ' . $e->getMessage());
            return redirect()->route('dashboard')
                ->with('error', 'Failed to load prescription for editing');
        }
    }

    /**
     * Update the specified prescription
     */
    public function update(Request $request, $id)
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return redirect()->route('login');
            }

            $doctor = $user->doctor;
            if (!$doctor) {
                $doctor = Doctor::where('user_id', $user->id)->first();
                if (!$doctor) {
                    return back()->with('error', 'Only doctors can update prescriptions');
                }
            }

            $prescription = Prescription::findOrFail($id);

            // Check if current doctor can edit this prescription
            if ($prescription->doctor_id !== $doctor->id) {
                return back()->with('error', 'You can only edit your own prescriptions');
            }

            $request->validate([
                'diagnosis' => 'required|string|max:1000',
                'advice' => 'nullable|string|max:2000',
                'notes' => 'nullable|string|max:1000',
                'followup_date' => 'nullable|date|after:today',
                'includes_glasses' => 'boolean',
                'glasses_notes' => 'nullable|string|max:1000',

                // Medicines validation
                'medicines' => 'nullable|array',
                'medicines.*.medicine_id' => 'required_with:medicines|exists:medicines,id',
                'medicines.*.dosage' => 'required_with:medicines|string|max:255',
                'medicines.*.frequency' => 'nullable|string|max:255',
                'medicines.*.duration' => 'nullable|string|max:255',
                'medicines.*.instructions' => 'nullable|string|max:500',
                'medicines.*.quantity' => 'nullable|integer|min:1',

                // Glasses validation
                'glasses' => 'nullable|array',
                'glasses.*.prescription_type' => 'required_with:glasses|in:distance,reading,progressive,bifocal,computer',
                'glasses.*.right_eye_sphere' => 'nullable|numeric|between:-20,20',
                'glasses.*.right_eye_cylinder' => 'nullable|numeric|between:-10,10',
                'glasses.*.right_eye_axis' => 'nullable|integer|between:0,180',
                'glasses.*.right_eye_add' => 'nullable|numeric|between:0,5',
                'glasses.*.left_eye_sphere' => 'nullable|numeric|between:-20,20',
                'glasses.*.left_eye_cylinder' => 'nullable|numeric|between:-10,10',
                'glasses.*.left_eye_axis' => 'nullable|integer|between:0,180',
                'glasses.*.left_eye_add' => 'nullable|numeric|between:0,5',
                'glasses.*.pupillary_distance' => 'nullable|numeric|between:45,85',
                'glasses.*.segment_height' => 'nullable|numeric|between:10,30',
                'glasses.*.special_instructions' => 'nullable|string|max:500',
            ]);

            DB::beginTransaction();

            // Update prescription
            $prescription->update([
                'diagnosis' => $request->diagnosis,
                'advice' => $request->advice,
                'notes' => $request->notes,
                'followup_date' => $request->followup_date,
                'includes_glasses' => $request->boolean('includes_glasses'),
                'glasses_notes' => $request->glasses_notes,
            ]);

            // Delete existing prescription medicines and glasses
            $prescription->prescriptionMedicines()->delete();
            $prescription->prescriptionGlasses()->delete();

            // Add new medicines to prescription
            if ($request->has('medicines') && is_array($request->medicines)) {
                foreach ($request->medicines as $medicineData) {
                    PrescriptionMedicine::create([
                        'prescription_id' => $prescription->id,
                        'medicine_id' => $medicineData['medicine_id'],
                        'dosage' => $medicineData['dosage'],
                        'frequency' => $medicineData['frequency'] ?? null,
                        'duration' => $medicineData['duration'] ?? null,
                        'instructions' => $medicineData['instructions'] ?? null,
                        'quantity' => $medicineData['quantity'] ?? null,
                    ]);
                }
            }

            // Add new glasses to prescription
            if ($request->has('glasses') && is_array($request->glasses)) {
                foreach ($request->glasses as $glassData) {
                    PrescriptionGlasses::create([
                        'prescription_id' => $prescription->id,
                        'prescription_type' => $glassData['prescription_type'],
                        'right_eye_sphere' => $glassData['right_eye_sphere'] ?? null,
                        'right_eye_cylinder' => $glassData['right_eye_cylinder'] ?? null,
                        'right_eye_axis' => $glassData['right_eye_axis'] ?? null,
                        'right_eye_add' => $glassData['right_eye_add'] ?? null,
                        'left_eye_sphere' => $glassData['left_eye_sphere'] ?? null,
                        'left_eye_cylinder' => $glassData['left_eye_cylinder'] ?? null,
                        'left_eye_axis' => $glassData['left_eye_axis'] ?? null,
                        'left_eye_add' => $glassData['left_eye_add'] ?? null,
                        'pupillary_distance' => $glassData['pupillary_distance'] ?? null,
                        'segment_height' => $glassData['segment_height'] ?? null,
                        'special_instructions' => $glassData['special_instructions'] ?? null,
                    ]);
                }
            }

            DB::commit();

            // Log successful prescription update
            Log::info('Prescription updated successfully', [
                'prescription_id' => $prescription->id,
                'doctor_id' => $doctor->id,
                'medicines_count' => $request->has('medicines') ? count($request->medicines) : 0,
                'glasses_count' => $request->has('glasses') ? count($request->glasses) : 0,
            ]);

            return redirect()->route('prescriptions.show', $id)
                ->with('success', 'Prescription updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Prescription Update Error: ' . $e->getMessage());
            return back()->with('error', 'Failed to update prescription: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Print the prescription - Updated for simplified glasses
     */

    public function print($id)
    {
        try {
            $prescription = Prescription::with([
                'patient',
                'doctor.user',
                'appointment',
                'prescriptionMedicines.medicine',
                'prescriptionGlasses'
            ])->findOrFail($id);

            // Check if user can print this prescription
            $user = auth()->user();
            $canPrint = false;

            if ($user->role === 'super_admin') {
                $canPrint = true;
            } elseif ($user->role->name === 'Doctor' && $user->doctor) {
                $canPrint = true;
            } elseif (in_array($user->role, ['receptionist', 'refractionist'])) {
                $canPrint = true;
            }

            if (!$canPrint) {
                return redirect()->route('dashboard')
                    ->with('error', 'You are not authorized to print this prescription');
            }

            // Log print action
            Log::info('Prescription accessed for print', [
                'prescription_id' => $prescription->id,
                'patient_id' => $prescription->patient_id,
                'accessed_by' => $user->name,
                'has_glasses' => $prescription->prescriptionGlasses->count() > 0,
            ]);

            // Return Inertia response with data for React component
            return Inertia::render('Prescriptions/Print', [
                'prescription' => [
                    'id' => $prescription->id,
                    'patient' => [
                        'id' => $prescription->patient->id,
                        'patient_id' => $prescription->patient->patient_id,
                        'name' => $prescription->patient->name,
                        'age' => $prescription->patient->age,
                        'gender' => $prescription->patient->gender,
                        'phone' => $prescription->patient->phone,
                        'address' => $prescription->patient->address,
                    ],
                    'doctor' => [
                        'id' => $prescription->doctor->id,
                        'name' => $prescription->doctor->user->name,
                        'specialization' => $prescription->doctor->specialization,
                        'bmdc_number' => $prescription->doctor->bmdc_number,
                        'qualification' => $prescription->doctor->qualification,
                    ],
                    'appointment' => $prescription->appointment ? [
                        'id' => $prescription->appointment->id,
                        'appointment_date' => $prescription->appointment->appointment_date,
                        'appointment_time' => $prescription->appointment->appointment_time,
                    ] : null,
                    'diagnosis' => $prescription->diagnosis,
                    'advice' => $prescription->advice,
                    'notes' => $prescription->notes,
                    'followup_date' => $prescription->followup_date,
                    'created_at' => $prescription->created_at->format('Y-m-d H:i:s'),
                    'medicines' => $prescription->prescriptionMedicines->map(function ($medicine) {
                        return [
                            'id' => $medicine->id,
                            'medicine_name' => $medicine->medicine->name,
                            'dosage' => $medicine->dosage,
                            'frequency' => $medicine->frequency,
                            'duration' => $medicine->duration,
                            'instructions' => $medicine->instructions,
                        ];
                    }),
                    'glasses' => $prescription->prescriptionGlasses->map(function ($glass) {
                        return [
                            'id' => $glass->id,
                            'eye' => $glass->eye,
                            'sphere' => $glass->sphere,
                            'cylinder' => $glass->cylinder,
                            'axis' => $glass->axis,
                            'addition' => $glass->addition,
                            'prism' => $glass->prism,
                            'notes' => $glass->notes,
                        ];
                    }),
                ],
                'print_metadata' => [
                    'print_date' => now()->format('M d, Y h:i A'),
                    'printed_by' => $user->name,
                    'has_glasses' => $prescription->prescriptionGlasses->count() > 0,
                    'glasses_count' => $prescription->prescriptionGlasses->count(),
                    'filename' => 'prescription-' . $prescription->patient->patient_id . '-' .
                        $prescription->created_at->format('Y-m-d') . '.pdf',
                ],
                'user' => [
                    'name' => $user->name,
                    'role' => $user->role,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Prescription Print Error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to load prescription for printing');
        }
    }

    /**
     * Download blank prescription form for a patient
     */
    public function downloadBlankPrescription($patientId)
    {
        try {
            $user = auth()->user();

            // Check authentication
            if (!$user) {
                return redirect()->route('login');
            }

            // Ensure the user is a doctor
            $doctor = $user->doctor;
            if (!$doctor) {
                $doctor = Doctor::where('user_id', $user->id)->first();
                if (!$doctor) {
                    return back()->withErrors([
                        'error' => 'Only doctors can download prescription forms.'
                    ]);
                }
            }

            // Get patient
            $patient = Patient::findOrFail($patientId);

            Log::info('Blank prescription accessed', [
                'patient_id' => $patient->id,
                'patient_code' => $patient->patient_id,
                'doctor_id' => $doctor->id,
                'accessed_by' => $user->name,
            ]);

            // Return Inertia response for blank prescription
            return Inertia::render('Prescriptions/BlankPrint', [
                'prescription' => [
                    'id' => 'BLANK',
                    'patient' => [
                        'id' => $patient->id,
                        'patient_id' => $patient->patient_id,
                        'name' => $patient->name,
                        'age' => $patient->age,
                        'gender' => $patient->gender,
                        'phone' => $patient->phone,
                        'address' => $patient->address,
                    ],
                    'doctor' => [
                        'id' => $doctor->id,
                        'name' => $user->name,
                        'specialization' => $doctor->specialization,
                        'bmdc_number' => $doctor->bmdc_number,
                        'qualification' => $doctor->qualification,
                    ],
                    'appointment' => null,
                    'diagnosis' => '',
                    'advice' => '',
                    'notes' => '',
                    'followup_date' => null,
                    'created_at' => now()->format('Y-m-d H:i:s'),
                    'medicines' => [],
                    'glasses' => [],
                ],
                'print_metadata' => [
                    'print_date' => now()->format('M d, Y h:i A'),
                    'printed_by' => $user->name,
                    'has_glasses' => false,
                    'glasses_count' => 0,
                    'filename' => 'blank-prescription-' . $patient->patient_id . '.pdf',
                    'is_blank_prescription' => true,
                ],
                'user' => [
                    'name' => $user->name,
                    'role' => $user->role,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Blank Prescription Error: ' . $e->getMessage(), [
                'patient_id' => $patientId,
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'error' => 'Failed to load blank prescription: ' . $e->getMessage()
            ]);
        }
    }


    /**
     * Get prescription history for a patient
     */
    public function getPatientPrescriptions(Request $request, $patientId)
    {
        try {
            $patient = Patient::findOrFail($patientId);

            $prescriptions = $patient->prescriptions()
                ->with(['doctor.user', 'prescriptionMedicines.medicine', 'prescriptionGlasses'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            return response()->json([
                'success' => true,
                'prescriptions' => $prescriptions
            ]);
        } catch (\Exception $e) {
            Log::error('Get Patient Prescriptions Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get prescriptions'], 500);
        }
    }

    /**
     * Mark followup as completed
     */
    public function completeFollowup($id)
    {
        try {
            $user = auth()->user();
            $prescription = Prescription::findOrFail($id);

            // Check if user can complete followup
            $canComplete = false;
            if ($user->role === 'doctor' && $user->doctor && $user->doctor->id === $prescription->doctor_id) {
                $canComplete = true;
            } elseif ($user->role === 'super_admin') {
                $canComplete = true;
            }

            if (!$canComplete) {
                return back()->with('error', 'You are not authorized to complete this follow-up');
            }

            $prescription->update(['followup_date' => null]);

            Log::info('Follow-up completed', [
                'prescription_id' => $prescription->id,
                'completed_by' => $user->name,
            ]);

            return back()->with('success', 'Follow-up marked as completed');
        } catch (\Exception $e) {
            Log::error('Complete Followup Error: ' . $e->getMessage());
            return back()->with('error', 'Failed to complete follow-up');
        }
    }

    /**
     * Get prescription statistics for dashboard
     */
    public function getStats(Request $request)
    {
        try {
            $user = auth()->user();
            $doctorId = null;

            // If doctor, get their own stats
            if ($user->role === 'doctor' && $user->doctor) {
                $doctorId = $user->doctor->id;
            }

            $period = $request->get('period', 'week'); // today, week, month, year

            $dateRange = match ($period) {
                'today' => [now()->startOfDay(), now()->endOfDay()],
                'week' => [now()->startOfWeek(), now()->endOfWeek()],
                'month' => [now()->startOfMonth(), now()->endOfMonth()],
                'year' => [now()->startOfYear(), now()->endOfYear()],
                default => [now()->startOfWeek(), now()->endOfWeek()],
            };

            $query = Prescription::whereBetween('created_at', $dateRange);

            if ($doctorId) {
                $query->where('doctor_id', $doctorId);
            }

            $stats = [
                'total_prescriptions' => $query->count(),
                'unique_patients' => $query->distinct('patient_id')->count(),
                'total_medicines' => $query->withCount('prescriptionMedicines')->get()->sum('prescription_medicines_count'),
                'total_glasses' => $query->withCount('prescriptionGlasses')->get()->sum('prescription_glasses_count'),
                'with_followup' => $query->whereNotNull('followup_date')->count(),
                'overdue_followups' => Prescription::where('followup_date', '<', now())
                    ->whereNotNull('followup_date')
                    ->when($doctorId, function ($q) use ($doctorId) {
                        $q->where('doctor_id', $doctorId);
                    })
                    ->count(),
            ];

            // Daily breakdown
            $dailyStats = Prescription::selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->whereBetween('created_at', $dateRange)
                ->when($doctorId, function ($q) use ($doctorId) {
                    $q->where('doctor_id', $doctorId);
                })
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
            Log::error('Get Prescription Stats Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get statistics'], 500);
        }
    }

    /**
     * Search prescriptions (API endpoint)
     */
    public function search(Request $request)
    {
        try {
            $request->validate([
                'term' => 'required|string|min:2|max:100',
                'limit' => 'sometimes|integer|min:1|max:50'
            ]);

            $searchTerm = $request->term;
            $limit = $request->get('limit', 10);

            $prescriptions = Prescription::with(['patient', 'doctor.user'])
                ->where(function ($query) use ($searchTerm) {
                    $query->where('diagnosis', 'like', "%{$searchTerm}%")
                        ->orWhereHas('patient', function ($q) use ($searchTerm) {
                            $q->where('name', 'like', "%{$searchTerm}%")
                                ->orWhere('patient_id', 'like', "%{$searchTerm}%");
                        });
                })
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($prescription) {
                    return [
                        'id' => $prescription->id,
                        'diagnosis' => $prescription->diagnosis,
                        'patient_name' => $prescription->patient->name,
                        'patient_id' => $prescription->patient->patient_id,
                        'doctor_name' => $prescription->doctor->user->name,
                        'created_at' => $prescription->created_at->format('M d, Y'),
                        'medicines_count' => $prescription->prescriptionMedicines->count(),
                        'glasses_count' => $prescription->prescriptionGlasses->count(),
                    ];
                });

            return response()->json([
                'success' => true,
                'prescriptions' => $prescriptions,
                'total_found' => $prescriptions->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Search Prescriptions Error: ' . $e->getMessage());
            return response()->json(['error' => 'Search failed'], 500);
        }
    }

    /**
     * Get upcoming follow-ups
     */
    public function getUpcomingFollowups(Request $request)
    {
        try {
            $user = auth()->user();
            $doctorId = null;

            // If doctor, get their own follow-ups
            if ($user->role === 'doctor' && $user->doctor) {
                $doctorId = $user->doctor->id;
            }

            $days = $request->get('days', 7);

            $followups = Prescription::with(['patient', 'doctor.user'])
                ->where('followup_date', '>=', now())
                ->where('followup_date', '<=', now()->addDays($days))
                ->whereNotNull('followup_date')
                ->when($doctorId, function ($q) use ($doctorId) {
                    $q->where('doctor_id', $doctorId);
                })
                ->orderBy('followup_date')
                ->get()
                ->map(function ($prescription) {
                    return [
                        'id' => $prescription->id,
                        'followup_date' => $prescription->followup_date,
                        'formatted_date' => Carbon::parse($prescription->followup_date)->format('M d, Y'),
                        'days_remaining' => Carbon::parse($prescription->followup_date)->diffInDays(now()),
                        'patient' => [
                            'id' => $prescription->patient->id,
                            'name' => $prescription->patient->name,
                            'patient_id' => $prescription->patient->patient_id,
                            'phone' => $prescription->patient->phone,
                        ],
                        'doctor' => [
                            'name' => $prescription->doctor->user->name,
                        ],
                        'diagnosis' => $prescription->diagnosis,
                    ];
                });

            return response()->json([
                'success' => true,
                'followups' => $followups,
                'total_count' => $followups->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Get Upcoming Followups Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get follow-ups'], 500);
        }
    }

    /**
     * Export prescription data
     */
    public function export(Request $request)
    {
        try {
            $user = auth()->user();

            // Check permissions
            if (!in_array($user->role, ['super_admin', 'doctor'])) {
                return back()->with('error', 'You are not authorized to export prescriptions');
            }

            $format = $request->get('format', 'csv'); // csv, pdf, excel
            $doctorId = null;

            // If doctor, export only their prescriptions
            if ($user->role === 'doctor' && $user->doctor) {
                $doctorId = $user->doctor->id;
            }

            $prescriptions = Prescription::with(['patient', 'doctor.user', 'prescriptionMedicines.medicine', 'prescriptionGlasses'])
                ->when($doctorId, function ($q) use ($doctorId) {
                    $q->where('doctor_id', $doctorId);
                })
                ->when($request->date_from, function ($q) use ($request) {
                    $q->whereDate('created_at', '>=', $request->date_from);
                })
                ->when($request->date_to, function ($q) use ($request) {
                    $q->whereDate('created_at', '<=', $request->date_to);
                })
                ->orderBy('created_at', 'desc')
                ->get();

            // For now, return JSON data (implement CSV/PDF export as needed)
            $exportData = $prescriptions->map(function ($prescription) {
                return [
                    'prescription_id' => $prescription->id,
                    'date' => $prescription->created_at->format('Y-m-d'),
                    'time' => $prescription->created_at->format('H:i'),
                    'patient_name' => $prescription->patient->name,
                    'patient_id' => $prescription->patient->patient_id,
                    'doctor_name' => $prescription->doctor->user->name,
                    'diagnosis' => $prescription->diagnosis,
                    'advice' => $prescription->advice,
                    'medicines_count' => $prescription->prescriptionMedicines->count(),
                    'glasses_count' => $prescription->prescriptionGlasses->count(),
                    'followup_date' => $prescription->followup_date,
                ];
            });

            Log::info('Prescriptions exported', [
                'exported_by' => $user->name,
                'format' => $format,
                'count' => $exportData->count(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $exportData,
                'total_count' => $exportData->count(),
                'exported_at' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Export Prescriptions Error: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed'], 500);
        }
    }

    /**
     * Duplicate a prescription (create new based on existing)
     */
    public function duplicate($id)
    {
        try {
            $user = auth()->user();
            $doctor = $user->doctor;

            if (!$doctor) {
                $doctor = Doctor::where('user_id', $user->id)->first();
                if (!$doctor) {
                    return back()->with('error', 'Only doctors can duplicate prescriptions');
                }
            }

            $originalPrescription = Prescription::with(['prescriptionMedicines', 'prescriptionGlasses'])->findOrFail($id);

            // Redirect to create page with pre-filled data
            return redirect()->route('prescriptions.create.patient', $originalPrescription->patient_id)
                ->with('duplicate_data', [
                    'diagnosis' => $originalPrescription->diagnosis,
                    'advice' => $originalPrescription->advice,
                    'glasses_notes' => $originalPrescription->glasses_notes,
                    'medicines' => $originalPrescription->prescriptionMedicines->map(function ($medicine) {
                        return [
                            'medicine_id' => $medicine->medicine_id,
                            'dosage' => $medicine->dosage,
                            'frequency' => $medicine->frequency,
                            'duration' => $medicine->duration,
                            'instructions' => $medicine->instructions,
                            'quantity' => $medicine->quantity,
                        ];
                    })->toArray(),
                    'glasses' => $originalPrescription->prescriptionGlasses->map(function ($glass) {
                        return [
                            'prescription_type' => $glass->prescription_type,
                            'right_eye_sphere' => $glass->right_eye_sphere,
                            'right_eye_cylinder' => $glass->right_eye_cylinder,
                            'right_eye_axis' => $glass->right_eye_axis,
                            'right_eye_add' => $glass->right_eye_add,
                            'left_eye_sphere' => $glass->left_eye_sphere,
                            'left_eye_cylinder' => $glass->left_eye_cylinder,
                            'left_eye_axis' => $glass->left_eye_axis,
                            'left_eye_add' => $glass->left_eye_add,
                            'pupillary_distance' => $glass->pupillary_distance,
                            'segment_height' => $glass->segment_height,
                            'special_instructions' => $glass->special_instructions,
                        ];
                    })->toArray(),
                ]);
        } catch (\Exception $e) {
            Log::error('Duplicate Prescription Error: ' . $e->getMessage());
            return back()->with('error', 'Failed to duplicate prescription');
        }
    }

    /**
     * Delete a prescription (admin only)
     */
    public function destroy($id)
    {
        try {
            $user = auth()->user();

            // Only super admin can delete prescriptions
            if ($user->role !== 'super_admin') {
                return back()->with('error', 'Only administrators can delete prescriptions');
            }

            $prescription = Prescription::findOrFail($id);

            DB::beginTransaction();

            // Delete prescription medicines and glasses first
            $prescription->prescriptionMedicines()->delete();
            $prescription->prescriptionGlasses()->delete();

            // Delete prescription
            $prescription->delete();

            DB::commit();

            Log::info('Prescription deleted', [
                'prescription_id' => $id,
                'deleted_by' => $user->name,
            ]);

            return back()->with('success', 'Prescription deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Prescription Delete Error: ' . $e->getMessage());
            return back()->with('error', 'Failed to delete prescription');
        }
    }

    /**
     * Get prescription template (for quick prescription creation)
     */
    public function getTemplate(Request $request)
    {
        try {
            $user = auth()->user();
            $doctor = $user->doctor;

            if (!$doctor) {
                return response()->json(['error' => 'Doctor profile not found'], 404);
            }

            $templateType = $request->get('type', 'common'); // common, eye_related, etc.

            $templates = [
                'common' => [
                    'diagnosis' => 'Common cold and fever',
                    'advice' => 'Take rest, drink plenty of water, avoid cold foods',
                    'medicines' => [
                        ['name' => 'Paracetamol', 'dosage' => '500mg', 'frequency' => '1-1-1', 'duration' => '3 days'],
                    ]
                ],
                'eye_related' => [
                    'diagnosis' => 'Refractive error',
                    'advice' => 'Use prescribed glasses, avoid eye strain, take regular breaks from screen',
                    'medicines' => [
                        ['name' => 'Eye drops', 'dosage' => '1 drop', 'frequency' => '2-3 times daily', 'duration' => '1 week'],
                    ]
                ],
            ];

            return response()->json([
                'success' => true,
                'template' => $templates[$templateType] ?? $templates['common'],
            ]);
        } catch (\Exception $e) {
            Log::error('Get Prescription Template Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get template'], 500);
        }
    }

    /**
     * Helper method to format eye prescription
     */
    private function formatEyePrescription($sphere, $cylinder, $axis, $add)
    {
        $parts = [];

        if ($sphere) {
            $parts[] = "SPH: " . ($sphere > 0 ? '+' : '') . $sphere;
        }
        if ($cylinder) {
            $parts[] = "CYL: " . ($cylinder > 0 ? '+' : '') . $cylinder;
        }
        if ($axis) {
            $parts[] = "AXIS: " . $axis . "°";
        }
        if ($add) {
            $parts[] = "ADD: +" . $add;
        }

        return implode(' / ', $parts) ?: 'N/A';
    }
}
