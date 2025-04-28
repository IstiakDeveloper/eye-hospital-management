<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Repositories\PatientRepository;
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
     * Create a new controller instance.
     *
     * @param  \App\Repositories\PatientRepository  $patientRepository
     * @return void
     */
    public function __construct(PatientRepository $patientRepository)
    {
        $this->patientRepository = $patientRepository;
    }

    /**
     * Display a listing of the patients.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $patients = $this->patientRepository->getAllPaginated();

        return Inertia::render('Patients/Index', [
            'patients' => $patients
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
        $patient = $this->patientRepository->findById($id);

        if (!$patient) {
            abort(404, 'Patient not found');
        }
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

        // dd($patient);

        return Inertia::render('Patients/Show', [
            'patient' => $patient
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
        $patient = $this->patientRepository->findById($id);

        if (!$patient) {
            abort(404, 'Patient not found');
        }

        return Inertia::render('Patients/Edit', [
            'patient' => $patient
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

        $patients = $this->patientRepository->search($request->term);

        return response()->json($patients);
    }
}
