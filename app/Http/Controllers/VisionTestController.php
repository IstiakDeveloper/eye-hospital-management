<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Repositories\PatientRepository;
use App\Repositories\VisionTestRepository;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VisionTestController extends Controller
{
    protected $visionTestRepository;
    protected $patientRepository;

    public function __construct(
        VisionTestRepository $visionTestRepository,
        PatientRepository $patientRepository
    ) {
        $this->visionTestRepository = $visionTestRepository;
        $this->patientRepository = $patientRepository;
    }

    /**
     * Display a listing of vision tests
     */
    public function index()
    {
        $visionTests = $this->visionTestRepository->getRecentWithPatientDetails(20);
        $stats = $this->visionTestRepository->getVisionTestStatistics();

        return Inertia::render('VisionTests/Index', [
            'visionTests' => $visionTests,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new vision test.
     */
    public function create(Patient $patient)
    {
        // Check if patient payment is completed
        if ($patient->payment_status !== 'paid') {
            return redirect()->route('refractionist.dashboard')->withErrors([
                'error' => 'Patient payment is not completed yet.'
            ]);
        }

        // Check if vision test already completed
        if ($patient->vision_test_status === 'completed') {
            return redirect()->route('refractionist.dashboard')->withErrors([
                'error' => 'Vision test already completed for this patient.'
            ]);
        }

        // Get the latest vision test for pre-filling form
        $latestTest = $this->visionTestRepository->getLatestForPatient($patient->id);

        return Inertia::render('VisionTests/Create', [
            'patient' => $patient,
            'latestTest' => $latestTest
        ]);
    }

    /**
     * Store a newly created vision test in storage.
     */
    public function store(Request $request, Patient $patient)
    {
        // Check if patient payment is completed
        if ($patient->payment_status !== 'paid') {
            return back()->withErrors([
                'error' => 'Patient payment is not completed yet.'
            ]);
        }

        $request->validate([
            'right_eye_vision' => 'nullable|string|max:20',
            'left_eye_vision' => 'nullable|string|max:20',
            'right_eye_power' => 'nullable|numeric',
            'left_eye_power' => 'nullable|numeric',
            'right_eye_pressure' => 'nullable|string|max:20',
            'left_eye_pressure' => 'nullable|string|max:20',
            'right_eye_sphere' => 'nullable|numeric|between:-20,20',
            'left_eye_sphere' => 'nullable|numeric|between:-20,20',
            'right_eye_cylinder' => 'nullable|numeric|between:-10,10',
            'left_eye_cylinder' => 'nullable|numeric|between:-10,10',
            'right_eye_axis' => 'nullable|integer|between:0,180',
            'left_eye_axis' => 'nullable|integer|between:0,180',
            'additional_notes' => 'nullable|string',
        ]);

        $data = $request->all();
        $data['patient_id'] = $patient->id;
        $data['performed_by'] = auth()->id();
        $data['test_date'] = now();

        // Create vision test
        $visionTest = $this->visionTestRepository->create($data);

        // Update patient progression - Complete vision test stage
        $patient->update([
            'vision_test_status' => 'completed',
            'overall_status' => 'prescription',
            'vision_test_completed_at' => now(),
        ]);

        // Auto-create appointment with selected doctor
        \Log::info('Attempting to create appointment', [
            'patient_id' => $patient->id,
            'selected_doctor_id' => $patient->selected_doctor_id,
            'has_selected_doctor' => !empty($patient->selected_doctor_id)
        ]);

        $appointment = $this->createAppointmentWithSelectedDoctor($patient);

        $message = 'Vision test completed successfully!';
        if ($appointment) {
            $message .= ' Appointment has been automatically scheduled with Dr. ' . $appointment->doctor->user->name;
        } else {
            $message .= ' Patient is ready for doctor consultation.';
        }

        return redirect()->route('refractionist.dashboard')
            ->with('success', $message);
    }

    /**
     * Create appointment with the doctor selected during patient registration
     */
    private function createAppointmentWithSelectedDoctor(Patient $patient)
    {
        try {
            $schedulingService = app(\App\Services\AppointmentSchedulingService::class);
            $appointment = $schedulingService->createPostVisionTestAppointment($patient);

            if ($appointment) {
                \Log::info('Appointment created successfully', [
                    'appointment_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'doctor_id' => $patient->selected_doctor_id
                ]);

                // Load the doctor relationship
                $appointment->load('doctor.user');
                return $appointment;
            } else {
                \Log::warning('No appointment created', [
                    'patient_id' => $patient->id,
                    'selected_doctor_id' => $patient->selected_doctor_id
                ]);
                return null;
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create appointment', [
                'error' => $e->getMessage(),
                'patient_id' => $patient->id,
                'selected_doctor_id' => $patient->selected_doctor_id
            ]);
            return null;
        }
    }

    /**
     * Display the specified vision test.
     */
    public function show($id)
    {
        $visionTest = $this->visionTestRepository->findById($id);

        if (!$visionTest) {
            abort(404, 'Vision test not found');
        }

        $visionTest->load(['patient', 'performedBy']);

        return Inertia::render('VisionTests/Show', [
            'visionTest' => $visionTest
        ]);
    }

    /**
     * Show the form for editing the specified vision test.
     */
    public function edit($id)
    {
        $visionTest = $this->visionTestRepository->findById($id);

        if (!$visionTest) {
            abort(404, 'Vision test not found');
        }

        $visionTest->load('patient');

        return Inertia::render('VisionTests/Edit', [
            'visionTest' => $visionTest
        ]);
    }

    /**
     * Update the specified vision test in storage.
     */
    public function update(Request $request, $id)
    {
        $visionTest = $this->visionTestRepository->findById($id);

        if (!$visionTest) {
            abort(404, 'Vision test not found');
        }

        $request->validate([
            'right_eye_vision' => 'nullable|string|max:20',
            'left_eye_vision' => 'nullable|string|max:20',
            'right_eye_power' => 'nullable|numeric',
            'left_eye_power' => 'nullable|numeric',
            'right_eye_pressure' => 'nullable|string|max:20',
            'left_eye_pressure' => 'nullable|string|max:20',
            'right_eye_sphere' => 'nullable|numeric|between:-20,20',
            'left_eye_sphere' => 'nullable|numeric|between:-20,20',
            'right_eye_cylinder' => 'nullable|numeric|between:-10,10',
            'left_eye_cylinder' => 'nullable|numeric|between:-10,10',
            'right_eye_axis' => 'nullable|integer|between:0,180',
            'left_eye_axis' => 'nullable|integer|between:0,180',
            'additional_notes' => 'nullable|string',
        ]);

        $success = $this->visionTestRepository->update($id, $request->all());

        if (!$success) {
            return back()->with('error', 'Failed to update vision test.');
        }

        return redirect()->route('visiontests.show', $id)
            ->with('success', 'Vision test updated successfully!');
    }

    /**
     * Print the vision test report.
     */
    public function print($id)
    {
        $visionTest = $this->visionTestRepository->findById($id);

        if (!$visionTest) {
            abort(404, 'Vision test not found');
        }

        $visionTest->load(['patient', 'performedBy']);

        // Generate PDF with precise settings
        $pdf = Pdf::loadView('vision-tests.print', [
            'visionTest' => $visionTest
        ]);

        $pdf->setPaper('A4', 'portrait');
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled' => true,
            'defaultFont' => 'Arial',
            'dpi' => 96,
            'defaultPaperSize' => 'A4',
            'orientation' => 'portrait',
        ]);

        $filename = 'vision-test-' . $visionTest->patient->name . '-' . $visionTest->patient->patient_id . '-' . date('Y-m-d') . '.pdf';

        return $pdf->download($filename);
    }
}
