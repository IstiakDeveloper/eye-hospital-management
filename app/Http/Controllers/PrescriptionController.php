<?php

namespace App\Http\Controllers;

use App\Repositories\AppointmentRepository;
use App\Repositories\MedicineRepository;
use App\Repositories\PatientRepository;
use App\Repositories\PrescriptionRepository;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PrescriptionController extends Controller
{
    /**
     * The prescription repository instance.
     *
     * @var \App\Repositories\PrescriptionRepository
     */
    protected $prescriptionRepository;

    /**
     * The patient repository instance.
     *
     * @var \App\Repositories\PatientRepository
     */
    protected $patientRepository;

    /**
     * The appointment repository instance.
     *
     * @var \App\Repositories\AppointmentRepository
     */
    protected $appointmentRepository;

    /**
     * The medicine repository instance.
     *
     * @var \App\Repositories\MedicineRepository
     */
    protected $medicineRepository;

    /**
     * Create a new controller instance.
     *
     * @param  \App\Repositories\PrescriptionRepository  $prescriptionRepository
     * @param  \App\Repositories\PatientRepository  $patientRepository
     * @param  \App\Repositories\AppointmentRepository  $appointmentRepository
     * @param  \App\Repositories\MedicineRepository  $medicineRepository
     * @return void
     */
    public function __construct(
        PrescriptionRepository $prescriptionRepository,
        PatientRepository $patientRepository,
        AppointmentRepository $appointmentRepository,
        MedicineRepository $medicineRepository
    ) {
        $this->prescriptionRepository = $prescriptionRepository;
        $this->patientRepository = $patientRepository;
        $this->appointmentRepository = $appointmentRepository;
        $this->medicineRepository = $medicineRepository;
    }

    /**
     * Show the form for creating a new prescription.
     *
     * @param  int  $patientId
     * @param  int|null  $appointmentId
     * @return \Inertia\Response
     */

    public function create($patientId, $appointmentId = null)
    {
        $patient = $this->patientRepository->findById($patientId);

        if (!$patient) {
            abort(404, 'Patient not found');
        }

        $appointment = null;
        if ($appointmentId) {
            $appointment = $this->appointmentRepository->findById($appointmentId);

            if (!$appointment || $appointment->patient_id != $patientId) {
                abort(404, 'Appointment not found for this patient');
            }
        }

        $patient->load([
            'visionTests' => function ($query) {
                $query->orderBy('test_date', 'desc');
            },
            'prescriptions' => function ($query) {
                $query->with(['prescriptionMedicines', 'prescriptionMedicines.medicine'])
                    ->orderBy('created_at', 'desc');
            }
        ]);

        $medicines = $this->medicineRepository->getAllActive();

        $doctor = Auth::user();

        return Inertia::render('Prescriptions/Create', [
            'patient' => $patient,
            'appointment' => $appointment,
            'medicines' => $medicines,
            'doctor' => $doctor,
        ]);
    }


    /**
     * Store a newly created prescription in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $patientId
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request, $patientId)
    {
        $patient = $this->patientRepository->findById($patientId);

        if (!$patient) {
            abort(404, 'Patient not found');
        }

        $request->validate([
            'appointment_id' => 'nullable|exists:appointments,id',
            'diagnosis' => 'nullable|string',
            'advice' => 'nullable|string',
            'notes' => 'nullable|string',
            'followup_date' => 'nullable|date',
            'medicines' => 'required|array|min:1',
            'medicines.*.medicine_id' => 'required|exists:medicines,id',
            'medicines.*.dosage' => 'required|string',
            'medicines.*.duration' => 'nullable|string',
            'medicines.*.instructions' => 'nullable|string',
        ]);

        $user = auth()->user();

        // Ensure the user is a doctor
        if (!$user->isDoctor()) {
            abort(403, 'Only doctors can create prescriptions');
        }

        $prescriptionData = [
            'patient_id' => $patientId,
            'doctor_id' => $user->doctor->id,
            'appointment_id' => $request->appointment_id,
            'diagnosis' => $request->diagnosis,
            'advice' => $request->advice,
            'notes' => $request->notes,
            'followup_date' => $request->followup_date,
            'created_by' => $user->id,
        ];

        $prescription = $this->prescriptionRepository->createWithMedicines(
            $prescriptionData,
            $request->medicines
        );

        if (!$prescription) {
            return back()->with('error', 'Failed to create prescription.');
        }

        // Update appointment status if provided
        if ($request->appointment_id) {
            $this->appointmentRepository->updateStatus($request->appointment_id, 'completed');
        }

        return redirect()->route('prescriptions.show', $prescription->id)
            ->with('success', 'Prescription created successfully!');
    }

    /**
     * Display the specified prescription.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function show($id)
    {
        $prescription = $this->prescriptionRepository->findById($id);

        if (!$prescription) {
            abort(404, 'Prescription not found');
        }

        return Inertia::render('Prescriptions/Show', [
            'prescription' => $prescription
        ]);
    }

    /**
     * Show the form for editing the specified prescription.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function edit($id)
    {
        $prescription = $this->prescriptionRepository->findById($id);

        if (!$prescription) {
            abort(404, 'Prescription not found');
        }

        $medicines = $this->medicineRepository->getAllActive();

        return Inertia::render('Prescriptions/Edit', [
            'prescription' => $prescription,
            'medicines' => $medicines,
        ]);
    }

    /**
     * Update the specified prescription in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, $id)
    {
        $prescription = $this->prescriptionRepository->findById($id);

        if (!$prescription) {
            abort(404, 'Prescription not found');
        }

        $request->validate([
            'diagnosis' => 'nullable|string',
            'advice' => 'nullable|string',
            'notes' => 'nullable|string',
            'followup_date' => 'nullable|date',
            'medicines' => 'required|array|min:1',
            'medicines.*.medicine_id' => 'required|exists:medicines,id',
            'medicines.*.dosage' => 'required|string',
            'medicines.*.duration' => 'nullable|string',
            'medicines.*.instructions' => 'nullable|string',
        ]);

        $prescriptionData = [
            'diagnosis' => $request->diagnosis,
            'advice' => $request->advice,
            'notes' => $request->notes,
            'followup_date' => $request->followup_date,
        ];

        $success = $this->prescriptionRepository->updateWithMedicines(
            $id,
            $prescriptionData,
            $request->medicines
        );

        if (!$success) {
            return back()->with('error', 'Failed to update prescription.');
        }

        return redirect()->route('prescriptions.show', $id)
            ->with('success', 'Prescription updated successfully!');
    }

    /**
     * Print the prescription.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function print($id)
    {
        $prescription = $this->prescriptionRepository->findById($id);

        if (!$prescription) {
            abort(404, 'Prescription not found');
        }

        // Generate PDF with precise settings
        $pdf = Pdf::loadView('prescriptions.print', [
            'prescription' => $prescription
        ]);

        // Set exact A4 portrait with no margins (we handle margins in CSS)
        $pdf->setPaper('A4', 'portrait');

        // Optimize DomPDF settings for medical prescription
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled' => true,
            'defaultFont' => 'Times-Roman',
            'dpi' => 96,
            'defaultPaperSize' => 'A4',
            'orientation' => 'portrait',
            'isRemoteEnabled' => false,
            'debugKeepTemp' => false,
            'chroot' => public_path(),
            'fontDir' => storage_path('fonts/'),
            'fontCache' => storage_path('fonts/'),
            'tempDir' => sys_get_temp_dir(),
            'rootDir' => public_path(),
            'isJavascriptEnabled' => false,
            'isRemoteEnabled' => false,
            'defaultMediaType' => 'print'
        ]);

        // Set proper filename
        $filename = 'prescription-' . $prescription->patient->name . '-' . $prescription->patient->patient_id . '-' . date('Y-m-d') . '.pdf';

        // For download
        return $pdf->download($filename);

        // OR for view in browser (uncomment below and comment above)
        // return $pdf->stream($filename);
    }
}
