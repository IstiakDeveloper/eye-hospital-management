<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Repositories\PatientRepository;
use App\Repositories\DoctorRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PatientController extends Controller
{
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
     * @param  \App\Repositories\PatientRepository  $patientRepository
     * @param  \App\Repositories\DoctorRepository  $doctorRepository
     * @return void
     */
    public function __construct(PatientRepository $patientRepository, DoctorRepository $doctorRepository)
    {
        $this->patientRepository = $patientRepository;
        $this->doctorRepository = $doctorRepository;
    }

    /**
     * Display a listing of the patients.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth()->user();

        // Check user role and get appropriate patients
        if ($user->role_id == 2) { // Doctor role
            $doctor = $this->doctorRepository->findByUserId($user->id);

            if (!$doctor) {
                abort(403, 'Doctor profile not found');
            }

            // Get only doctor's patients (patients who have appointments with this doctor)
            $patients = $this->patientRepository->getDoctorPatientsPaginated($doctor->id);
        } else {
            // Admin or other roles can see all patients
            $patients = $this->patientRepository->getAllPaginated();
        }

        return Inertia::render('Patients/Index', [
            'patients' => $patients,
            'userRole' => $user->role_id
        ]);
    }

    /**
     * Show the form for creating a new patient.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        return Inertia::render('Patients/Create');
    }

    /**
     * Store a newly created patient in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other',
            'medical_history' => 'nullable|string',
        ]);

        $data = $request->all();
        $data['registered_by'] = auth()->id();

        $patient = $this->patientRepository->create($data);

        return redirect()->route('patients.show', $patient->id)
            ->with('success', 'Patient registered successfully!');
    }

    /**
     * Display the specified patient.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function show($id)
    {
        $user = auth()->user();
        $patient = $this->patientRepository->findById($id);

        if (!$patient) {
            abort(404, 'Patient not found');
        }

        // Check if doctor can access this patient
        if ($user->role_id == 2) { // Doctor role
            $doctor = $this->doctorRepository->findByUserId($user->id);

            if (!$doctor) {
                abort(403, 'Doctor profile not found');
            }

            // Check if this patient has any appointments with this doctor
            $hasAccess = $this->patientRepository->doctorHasAccessToPatient($doctor->id, $patient->id);

            if (!$hasAccess) {
                abort(403, 'You do not have access to this patient');
            }
        }

        // Load patient data based on user role
        if ($user->role_id == 2) { // Doctor role
            $doctor = $this->doctorRepository->findByUserId($user->id);

            $patient->load([
                'visionTests' => function ($query) {
                    $query->orderBy('test_date', 'desc');
                },
                'appointments' => function ($query) use ($doctor) {
                    $query->where('doctor_id', $doctor->id)
                        ->with(['doctor', 'doctor.user'])
                        ->orderBy('appointment_date', 'desc')
                        ->orderBy('appointment_time', 'desc');
                },
                'prescriptions' => function ($query) use ($doctor) {
                    $query->where('doctor_id', $doctor->id)
                        ->with(['doctor', 'doctor.user', 'prescriptionMedicines', 'prescriptionMedicines.medicine'])
                        ->orderBy('created_at', 'desc');
                }
            ]);
        } else {
            // Admin can see all data
            $patient->load([
                'visionTests' => function ($query) {
                    $query->orderBy('test_date', 'desc');
                },
                'appointments' => function ($query) {
                    $query->with(['doctor', 'doctor.user'])
                        ->orderBy('appointment_date', 'desc')
                        ->orderBy('appointment_time', 'desc');
                },
                'prescriptions' => function ($query) {
                    $query->with(['doctor', 'doctor.user', 'prescriptionMedicines', 'prescriptionMedicines.medicine'])
                        ->orderBy('created_at', 'desc');
                }
            ]);
        }

        return Inertia::render('Patients/Show', [
            'patient' => $patient,
            'userRole' => $user->role_id
        ]);
    }

    /**
     * Show the form for editing the specified patient.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function edit($id)
    {
        $user = auth()->user();
        $patient = $this->patientRepository->findById($id);

        if (!$patient) {
            abort(404, 'Patient not found');
        }

        // Check if doctor can edit this patient
        if ($user->role_id == 2) { // Doctor role
            $doctor = $this->doctorRepository->findByUserId($user->id);

            if (!$doctor) {
                abort(403, 'Doctor profile not found');
            }

            $hasAccess = $this->patientRepository->doctorHasAccessToPatient($doctor->id, $patient->id);

            if (!$hasAccess) {
                abort(403, 'You do not have access to edit this patient');
            }
        }

        return Inertia::render('Patients/Edit', [
            'patient' => $patient,
            'userRole' => $user->role_id
        ]);
    }

    /**
     * Update the specified patient in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, $id)
    {
        $user = auth()->user();

        // Check access for doctors
        if ($user->role_id == 2) { // Doctor role
            $doctor = $this->doctorRepository->findByUserId($user->id);

            if (!$doctor) {
                abort(403, 'Doctor profile not found');
            }

            $hasAccess = $this->patientRepository->doctorHasAccessToPatient($doctor->id, $id);

            if (!$hasAccess) {
                abort(403, 'You do not have access to edit this patient');
            }
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other',
            'medical_history' => 'nullable|string',
        ]);

        $success = $this->patientRepository->update($id, $request->all());

        if (!$success) {
            return back()->with('error', 'Failed to update patient details.');
        }

        return redirect()->route('patients.show', $id)
            ->with('success', 'Patient details updated successfully!');
    }

    /**
     * Search for patients.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function search(Request $request)
    {
        $request->validate([
            'term' => 'required|string|min:2'
        ]);

        $user = auth()->user();

        if ($user->role_id == 2) { // Doctor role
            $doctor = $this->doctorRepository->findByUserId($user->id);

            if (!$doctor) {
                return response()->json([]);
            }

            // Search only doctor's patients
            $patients = $this->patientRepository->searchDoctorPatients($doctor->id, $request->term);
        } else {
            // Admin can search all patients
            $patients = $this->patientRepository->search($request->term);
        }

        return response()->json($patients);
    }

    /**
     * Get doctor's patient list for dashboard/reports
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDoctorPatients()
    {
        $user = auth()->user();

        if ($user->role_id != 2) {
            abort(403, 'Access denied');
        }

        $doctor = $this->doctorRepository->findByUserId($user->id);

        if (!$doctor) {
            abort(403, 'Doctor profile not found');
        }

        $patients = $this->patientRepository->getDoctorPatients($doctor->id);

        return response()->json($patients);
    }
}
