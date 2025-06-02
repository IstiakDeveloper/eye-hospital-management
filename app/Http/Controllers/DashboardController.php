<?php

namespace App\Http\Controllers;

use App\Repositories\AppointmentRepository;
use App\Repositories\DoctorRepository;
use App\Repositories\PatientRepository;
use App\Repositories\VisionTestRepository;
use App\Repositories\PrescriptionRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected $appointmentRepository;
    protected $patientRepository;
    protected $doctorRepository;
    protected $visionTestRepository;
    protected $prescriptionRepository;

    public function __construct(
        AppointmentRepository $appointmentRepository,
        PatientRepository $patientRepository,
        DoctorRepository $doctorRepository,
        VisionTestRepository $visionTestRepository,
        PrescriptionRepository $prescriptionRepository
    ) {
        $this->appointmentRepository = $appointmentRepository;
        $this->patientRepository = $patientRepository;
        $this->doctorRepository = $doctorRepository;
        $this->visionTestRepository = $visionTestRepository;
        $this->prescriptionRepository = $prescriptionRepository;
    }

    /**
     * Display the dashboard.
     */
    public function index()
    {
        $user = auth()->user();
        $data = [
            'userRole' => $user->role->name ?? 'user',
            'userName' => $user->name,
        ];

        switch (true) {
            case $user->isSuperAdmin():
                return $this->adminDashboard($data);

            case $user->isDoctor():
                return $this->doctorDashboard($data, $user);

            case $user->isReceptionist():
                return $this->receptionistDashboard($data);

            default:
                return $this->defaultDashboard($data);
        }
    }

    /**
     * Admin Dashboard Data
     */
    private function adminDashboard(array $data): \Inertia\Response
    {
        // Overall Statistics
        $data['stats'] = [
            'totalPatients' => $this->patientRepository->getCount(),
            'totalDoctors' => $this->doctorRepository->getCount(),
            'todayAppointments' => $this->appointmentRepository->getTodayAppointmentsCount(),
            'pendingAppointments' => $this->appointmentRepository->getPendingAppointmentsCount(),
            'completedAppointments' => $this->appointmentRepository->getCompletedAppointmentsCount(),
            'monthlyPatients' => $this->patientRepository->getMonthlyCount(),
            'monthlyRevenue' => $this->appointmentRepository->getMonthlyRevenue(),
        ];

        // Recent Activities
        $data['recentPatients'] = $this->patientRepository->getRecent(8);
        $data['recentVisionTests'] = $this->visionTestRepository->getRecent(5);
        $data['todayAppointments'] = $this->appointmentRepository->getTodayAppointmentsWithDetails();
        $data['upcomingAppointments'] = $this->appointmentRepository->getUpcomingAppointments(5);

        // Doctor Performance
        $data['doctorStats'] = $this->doctorRepository->getDoctorStats();

        // Quick Actions
        $data['quickStats'] = [
            'patientsToday' => $this->patientRepository->getTodayCount(),
            'visionTestsToday' => $this->visionTestRepository->getTodayCount(),
            'prescriptionsToday' => $this->prescriptionRepository->getTodayCount(),
        ];

        return Inertia::render('Dashboard/AdminDashboard', $data);
    }

    /**
     * Doctor Dashboard Data
     */
    private function doctorDashboard(array $data, $user): \Inertia\Response
    {
        $doctorId = $user->doctor->id;

        // Doctor specific appointments
        $data['todayAppointments'] = $this->appointmentRepository->getTodayAppointmentsForDoctor($doctorId);
        $data['upcomingAppointments'] = $this->appointmentRepository->getUpcomingAppointmentsForDoctor($doctorId, 10);
        $data['recentAppointments'] = $this->appointmentRepository->getRecentAppointmentsForDoctor($doctorId, 5);

        // Doctor Statistics
        $data['doctorStats'] = [
            'todayPatients' => count($data['todayAppointments']),
            'totalPatients' => $this->appointmentRepository->getTotalPatientsForDoctor($doctorId),
            'completedToday' => $this->appointmentRepository->getCompletedTodayForDoctor($doctorId),
            'pendingToday' => $this->appointmentRepository->getPendingTodayForDoctor($doctorId),
            'monthlyPatients' => $this->appointmentRepository->getMonthlyPatientsForDoctor($doctorId),
            'averageConsultationTime' => $this->appointmentRepository->getAverageConsultationTime($doctorId),
        ];

        // Recent Prescriptions
        $data['recentPrescriptions'] = $this->prescriptionRepository->getRecentForDoctor($doctorId, 5);

        // Patients need follow-up
        $data['followUpPatients'] = $this->prescriptionRepository->getFollowUpPatientsForDoctor($doctorId);

        // Doctor profile info
        $data['doctorInfo'] = [
            'specialization' => $user->doctor->specialization,
            'qualification' => $user->doctor->qualification,
            'consultationFee' => $user->doctor->consultation_fee,
        ];

        return Inertia::render('Dashboard/DoctorDashboard', $data);
    }

    /**
     * Receptionist Dashboard Data
     */
    private function receptionistDashboard(array $data): \Inertia\Response
    {
        // Recent Patients with Vision Test Status
        $data['recentPatients'] = $this->patientRepository->getRecentWithVisionTestStatus(10);

        // Patients who need vision tests
        $data['patientsNeedingVisionTest'] = $this->patientRepository->getPatientsWithoutRecentVisionTest(8);

        // Today's appointments for reception management
        $data['todayAppointments'] = $this->appointmentRepository->getTodayAppointmentsWithDetails();
        $data['upcomingAppointments'] = $this->appointmentRepository->getUpcomingAppointments(8);

        // Reception specific stats
        $data['receptionStats'] = [
            'todayRegistrations' => $this->patientRepository->getTodayCount(),
            'todayAppointments' => count($data['todayAppointments']),
            'pendingAppointments' => $this->appointmentRepository->getPendingAppointmentsCount(),
            'completedVisionTests' => $this->visionTestRepository->getTodayCount(),
            'waitingPatients' => $this->appointmentRepository->getWaitingPatientsCount(),
        ];

        // Recent Vision Tests
        $data['recentVisionTests'] = $this->visionTestRepository->getRecentWithPatientDetails(6);

        // Quick Actions Data
        $data['quickActions'] = [
            'totalPatients' => $this->patientRepository->getCount(),
            'activeDoctors' => $this->doctorRepository->getActiveCount(),
        ];

        // Appointment summary by doctor
        $data['appointmentsByDoctor'] = $this->appointmentRepository->getTodayAppointmentsByDoctor();

        return Inertia::render('Dashboard/ReceptionistDashboard', $data);
    }

    /**
     * Default Dashboard for other roles
     */
    private function defaultDashboard(array $data): \Inertia\Response
    {
        $data['message'] = 'Welcome to the Eye Care Management System';

        return Inertia::render('Dashboard/DefaultDashboard', $data);
    }

    /**
     * Get dashboard stats API endpoint
     */
    public function getStats()
    {
        $user = auth()->user();

        if ($user->isSuperAdmin()) {
            return response()->json([
                'totalPatients' => $this->patientRepository->getCount(),
                'totalDoctors' => $this->doctorRepository->getCount(),
                'todayAppointments' => $this->appointmentRepository->getTodayAppointmentsCount(),
                'monthlyRevenue' => $this->appointmentRepository->getMonthlyRevenue(),
            ]);
        }

        if ($user->isDoctor()) {
            $doctorId = $user->doctor->id;
            return response()->json([
                'todayPatients' => $this->appointmentRepository->getTodayAppointmentsCountForDoctor($doctorId),
                'completedToday' => $this->appointmentRepository->getCompletedTodayForDoctor($doctorId),
                'pendingToday' => $this->appointmentRepository->getPendingTodayForDoctor($doctorId),
            ]);
        }

        if ($user->isReceptionist()) {
            return response()->json([
                'todayRegistrations' => $this->patientRepository->getTodayCount(),
                'todayAppointments' => $this->appointmentRepository->getTodayAppointmentsCount(),
                'completedVisionTests' => $this->visionTestRepository->getTodayCount(),
                'waitingPatients' => $this->appointmentRepository->getWaitingPatientsCount(),
            ]);
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    /**
     * Quick actions for different roles
     */
    public function quickAction(Request $request)
    {
        $action = $request->input('action');
        $user = auth()->user();

        switch ($action) {
            case 'mark_appointment_completed':
                if ($user->isDoctor()) {
                    $appointmentId = $request->input('appointment_id');
                    $this->appointmentRepository->markAsCompleted($appointmentId);
                    return response()->json(['success' => true]);
                }
                break;

            case 'add_patient_to_queue':
                if ($user->isReceptionist()) {
                    $patientId = $request->input('patient_id');
                    // Add logic to manage patient queue
                    return response()->json(['success' => true]);
                }
                break;
        }

        return response()->json(['error' => 'Invalid action'], 400);
    }
}
