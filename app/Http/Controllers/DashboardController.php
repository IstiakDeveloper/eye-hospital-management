<?php

namespace App\Http\Controllers;

use App\Repositories\AppointmentRepository;
use App\Repositories\DoctorRepository;
use App\Repositories\PatientRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
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

    /**
     * Display the dashboard.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth()->user();
        $data = [];

        // Today's appointments
        if ($user->isDoctor()) {
            $doctorId = $user->doctor->id;
            $data['todayAppointments'] = $this->appointmentRepository->getTodayAppointmentsForDoctor($doctorId);
        } else {
            $data['todayAppointments'] = $this->appointmentRepository->getTodayAppointments();
        }

        // For receptionist and admin
        if ($user->isReceptionist() || $user->isSuperAdmin()) {
            // Recently registered patients
            $data['recentPatients'] = $this->patientRepository->getRecent(5);
        }

        // For super admin
        if ($user->isSuperAdmin()) {
            // Statistics
            $data['stats'] = [
                'patientsCount' => $this->patientRepository->getCount(),
                'doctorsCount' => $this->doctorRepository->getCount(),
                'appointmentsToday' => count($data['todayAppointments']),
            ];
        }

        return Inertia::render('dashboard', $data);
    }
}
