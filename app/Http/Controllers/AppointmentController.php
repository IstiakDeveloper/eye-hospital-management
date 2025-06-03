<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Repositories\AppointmentRepository;
use App\Repositories\DoctorRepository;
use App\Repositories\PatientRepository;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    /**
     * The appointment repository instance.
     *
     * @var \App\Repositories\AppointmentRepository
     */
    protected $appointmentRepository;

    /**
     * The patient repository instance.
     *
     * @var \App\Repositories\PatientRepository
     */
    protected $patientRepository;

    /**
     * The doctor repository instance.
     *
     * @var \App\Repositories\DoctorRepository
     */
    protected $doctorRepository;

    /**
     * Create a new controller instance.
     *
     * @param  \App\Repositories\AppointmentRepository  $appointmentRepository
     * @param  \App\Repositories\PatientRepository  $patientRepository
     * @param  \App\Repositories\DoctorRepository  $doctorRepository
     * @return void
     */
    public function __construct(
        AppointmentRepository $appointmentRepository,
        PatientRepository $patientRepository,
        DoctorRepository $doctorRepository
    ) {
        $this->appointmentRepository = $appointmentRepository;
        $this->patientRepository = $patientRepository;
        $this->doctorRepository = $doctorRepository;
    }

    public function index()
    {
        $appointments = $this->appointmentRepository->getAllPaginated();

        return Inertia::render('Appointments/Index', [
            'appointments' => $appointments
        ]);
    }

    /**
     * Show the form for creating a new appointment.
     *
     * @param  int|null  $patientId
     * @return \Inertia\Response
     */
    public function create($patientId = null)
    {
        $patient = null;

        if ($patientId) {
            $patient = $this->patientRepository->findById($patientId);

            if (!$patient) {
                abort(404, 'Patient not found');
            }
        }

        $doctors = $this->doctorRepository->getAllActive();

        return Inertia::render('Appointments/Create', [
            'patient' => $patient,
            'doctors' => $doctors
        ]);
    }

    /**
     * Store a newly created appointment in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required|string',
        ]);

        $data = $request->all();
        $data['created_by'] = auth()->id();
        // serial_number will be auto-generated in the model boot method

        $appointment = $this->appointmentRepository->create($data);

        return redirect()->route('appointments.show', $appointment->id)
            ->with('success', 'Appointment created successfully!');
    }

    /**
     * Display the specified appointment.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function show($id)
    {
        $appointment = $this->appointmentRepository->findById($id);

        if (!$appointment) {
            abort(404, 'Appointment not found');
        }

        return Inertia::render('Appointments/Show', [
            'appointment' => $appointment
        ]);
    }

    /**
     * Show the form for editing the specified appointment.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function edit($id)
    {
        $appointment = $this->appointmentRepository->findById($id);

        if (!$appointment) {
            abort(404, 'Appointment not found');
        }

        $doctors = $this->doctorRepository->getAllActive();

        return Inertia::render('Appointments/Edit', [
            'appointment' => $appointment,
            'doctors' => $doctors
        ]);
    }

    /**
     * Update the specified appointment in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, $id)
    {
        $appointment = $this->appointmentRepository->findById($id);

        if (!$appointment) {
            abort(404, 'Appointment not found');
        }

        $request->validate([
            'doctor_id' => 'required|exists:doctors,id',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required|string',
        ]);

        $success = $this->appointmentRepository->update($id, $request->all());

        if (!$success) {
            return back()->with('error', 'Failed to update appointment.');
        }

        return redirect()->route('appointments.show', $id)
            ->with('success', 'Appointment updated successfully!');
    }

    /**
     * Update the status of the specified appointment.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateStatus(Request $request, $id)
    {
        $appointment = $this->appointmentRepository->findById($id);

        if (!$appointment) {
            abort(404, 'Appointment not found');
        }

        $request->validate([
            'status' => 'required|in:pending,completed,cancelled',
        ]);

        $success = $this->appointmentRepository->updateStatus($id, $request->status);

        if (!$success) {
            return back()->with('error', 'Failed to update appointment status.');
        }

        return redirect()->route('appointments.show', $id)
            ->with('success', 'Appointment status updated successfully!');
    }

    /**
     * Print the appointment slip.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function print($id)
    {
        $appointment = $this->appointmentRepository->findById($id);

        if (!$appointment) {
            abort(404, 'Appointment not found');
        }

        $appointment->load(['patient', 'doctor', 'doctor.user']);

        // Generate PDF with receipt-specific settings
        $pdf = Pdf::loadView('appointments.print', [
            'appointment' => $appointment
        ]);

        // Set custom receipt size (80mm x 120mm)
        $pdf->setPaper([0, 0, 226.77, 340.16], 'portrait'); // 80mm x 120mm in points

        // Optimize DomPDF settings for receipt printing
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled' => true,
            'defaultFont' => 'Arial',
            'dpi' => 96,
            'orientation' => 'portrait',
            'isRemoteEnabled' => false,
            'debugKeepTemp' => false,
            'chroot' => public_path(),
            'fontDir' => storage_path('fonts/'),
            'fontCache' => storage_path('fonts/'),
            'tempDir' => sys_get_temp_dir(),
            'rootDir' => public_path(),
            'isJavascriptEnabled' => false,
            'defaultMediaType' => 'print',
            'isFontSubsettingEnabled' => true,
            'isPhpEnabled' => false
        ]);

        // Set proper filename
        $filename = 'appointment-slip-' . $appointment->patient->patient_id . '-' . $appointment->id . '.pdf';

        // For download
        return $pdf->download($filename);

        // OR for direct print (uncomment below and comment above)
        // return $pdf->stream($filename);
    }

    /**
     * Display today's appointments.
     *
     * @return \Inertia\Response
     */
    public function today()
    {
        $user = auth()->user();

        if ($user->isDoctor()) {
            $doctorId = $user->doctor->id;
            $appointments = $this->appointmentRepository->getTodayAppointmentsForDoctor($doctorId);
        } else {
            $appointments = $this->appointmentRepository->getTodayAppointments();
        }

        return Inertia::render('Appointments/Today', [
            'appointments' => $appointments
        ]);
    }
}
