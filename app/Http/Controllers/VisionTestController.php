<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Repositories\PatientRepository;
use App\Repositories\VisionTestRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VisionTestController extends Controller
{
    /**
     * The vision test repository instance.
     *
     * @var \App\Repositories\VisionTestRepository
     */
    protected $visionTestRepository;

    /**
     * The patient repository instance.
     *
     * @var \App\Repositories\PatientRepository
     */
    protected $patientRepository;

    /**
     * Create a new controller instance.
     *
     * @param  \App\Repositories\VisionTestRepository  $visionTestRepository
     * @param  \App\Repositories\PatientRepository  $patientRepository
     * @return void
     */
    public function __construct(
        VisionTestRepository $visionTestRepository,
        PatientRepository $patientRepository
    ) {
        $this->visionTestRepository = $visionTestRepository;
        $this->patientRepository = $patientRepository;
    }

    /**
     * Show the form for creating a new vision test.
     *
     * @param  int  $patientId
     * @return \Inertia\Response
     */
    public function create($patientId)
    {
        $patient = $this->patientRepository->findById($patientId);

        if (!$patient) {
            abort(404, 'Patient not found');
        }

        // Get the latest vision test for pre-filling form
        $latestTest = $this->visionTestRepository->getLatestForPatient($patientId);

        return Inertia::render('VisionTests/Create', [
            'patient' => $patient,
            'latestTest' => $latestTest
        ]);
    }

    /**
     * Store a newly created vision test in storage.
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
            'right_eye_vision' => 'nullable|string|max:20',
            'left_eye_vision' => 'nullable|string|max:20',
            'right_eye_power' => 'nullable|numeric',
            'left_eye_power' => 'nullable|numeric',
            'right_eye_pressure' => 'nullable|string|max:20',
            'left_eye_pressure' => 'nullable|string|max:20',
            'additional_notes' => 'nullable|string',
        ]);

        $data = $request->all();
        $data['patient_id'] = $patientId;
        $data['performed_by'] = auth()->id();
        $data['test_date'] = now();

        $visionTest = $this->visionTestRepository->create($data);

        return redirect()->route('patients.show', $patientId)
            ->with('success', 'Vision test recorded successfully!');
    }

    /**
     * Display the specified vision test.
     *
     * @param  int  $id
     * @return \Inertia\Response
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
     *
     * @param  int  $id
     * @return \Inertia\Response
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
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
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
            'additional_notes' => 'nullable|string',
        ]);

        $success = $this->visionTestRepository->update($id, $request->all());

        if (!$success) {
            return back()->with('error', 'Failed to update vision test.');
        }

        return redirect()->route('patients.show', $visionTest->patient_id)
            ->with('success', 'Vision test updated successfully!');
    }

    /**
     * Print the vision test report.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function print($id)
    {
        $visionTest = $this->visionTestRepository->findById($id);

        if (!$visionTest) {
            abort(404, 'Vision test not found');
        }

        $visionTest->load(['patient', 'performedBy']);

        // Logic for printing vision test report
        // This could be returning a PDF view or other printable format

        return view('vision-tests.print', [
            'visionTest' => $visionTest
        ]);
    }
}
