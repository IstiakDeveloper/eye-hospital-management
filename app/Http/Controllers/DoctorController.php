<?php

namespace App\Http\Controllers;

use App\Repositories\DoctorRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class DoctorController extends Controller
{
    /**
     * The doctor repository instance.
     *
     * @var \App\Repositories\DoctorRepository
     */
    protected $doctorRepository;

    /**
     * The user repository instance.
     *
     * @var \App\Repositories\UserRepository
     */
    protected $userRepository;

    /**
     * Create a new controller instance.
     *
     * @param  \App\Repositories\DoctorRepository  $doctorRepository
     * @param  \App\Repositories\UserRepository  $userRepository
     * @return void
     */
    public function __construct(
        DoctorRepository $doctorRepository,
        UserRepository $userRepository
    ) {
        $this->doctorRepository = $doctorRepository;
        $this->userRepository = $userRepository;
    }

    /**
     * Display a listing of the doctors.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $doctors = $this->doctorRepository->getAllPaginated();

        return Inertia::render('Doctors/Index', [
            'doctors' => $doctors
        ]);
    }

    /**
     * Show the form for creating a new doctor.
     *
     * @return \Inertia\Response
     */
    public function create(Request $request)
    {
        if (!Gate::allows('manage-doctors')) {
            abort(403);
        }

        $userId = $request->query('user_id');
        $user = null;

        if ($userId) {
            $user = $this->userRepository->findById($userId);

            if (!$user) {
                abort(404, 'User not found');
            }

            if ($user->isDoctor()) {
                return redirect()->route('doctors.edit', $user->doctor->id)
                    ->with('info', 'This user already has a doctor profile.');
            }
        }

        return Inertia::render('Doctors/Create', [
            'user' => $user
        ]);
    }

    /**
     * Store a newly created doctor in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        if (!Gate::allows('manage-doctors')) {
            abort(403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'specialization' => 'required|string|max:255',
            'qualification' => 'required|string|max:255',
            'bio' => 'nullable|string',
            'consultation_fee' => 'required|numeric|min:0',
            'is_available' => 'boolean',
        ]);

        $user = $this->userRepository->findById($request->user_id);

        if (!$user) {
            return back()->with('error', 'User not found.');
        }

        // If user is not a doctor yet, update role
        if (!$user->isDoctor()) {
            $this->userRepository->update($user->id, ['role_id' => 2]); // Doctor role ID
        }

        $doctor = $this->doctorRepository->create($request->all());

        return redirect()->route('doctors.index')
            ->with('success', 'Doctor profile created successfully!');
    }

    /**
     * Display the specified doctor.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function show($id)
    {
        $doctor = $this->doctorRepository->findById($id);

        if (!$doctor) {
            abort(404, 'Doctor not found');
        }

        // Load today's appointments
        $doctor->load([
            'appointments' => function ($query) {
                $query->where('appointment_date', today())
                    ->with('patient')
                    ->orderBy('appointment_time');
            }
        ]);

        return Inertia::render('Doctors/Show', [
            'doctor' => $doctor
        ]);
    }

    /**
     * Show the form for editing the specified doctor.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function edit($id)
    {
        if (!Gate::allows('manage-doctors')) {
            abort(403);
        }

        $doctor = $this->doctorRepository->findById($id);

        if (!$doctor) {
            abort(404, 'Doctor not found');
        }

        return Inertia::render('Doctors/Edit', [
            'doctor' => $doctor
        ]);
    }

    /**
     * Update the specified doctor in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, $id)
    {
        if (!Gate::allows('manage-doctors')) {
            abort(403);
        }

        $doctor = $this->doctorRepository->findById($id);

        if (!$doctor) {
            abort(404, 'Doctor not found');
        }

        $request->validate([
            'specialization' => 'required|string|max:255',
            'qualification' => 'required|string|max:255',
            'bio' => 'nullable|string',
            'consultation_fee' => 'required|numeric|min:0',
            'is_available' => 'boolean',
        ]);

        // Update user details if provided
        if ($request->has('name') || $request->has('email') || $request->has('phone')) {
            $userData = $request->only(['name', 'email', 'phone']);

            if (!empty($userData)) {
                $this->userRepository->update($doctor->user_id, $userData);
            }
        }

        $success = $this->doctorRepository->update($id, $request->only([
            'specialization', 'qualification', 'bio', 'consultation_fee', 'is_available'
        ]));

        if (!$success) {
            return back()->with('error', 'Failed to update doctor profile.');
        }

        return redirect()->route('doctors.index')
            ->with('success', 'Doctor profile updated successfully!');
    }

    /**
     * Update the availability of the specified doctor.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function updateAvailability(Request $request, $id)
    {
        if (!Gate::allows('manage-doctors')) {
            abort(403);
        }

        $doctor = $this->doctorRepository->findById($id);

        if (!$doctor) {
            abort(404, 'Doctor not found');
        }

        $request->validate([
            'is_available' => 'required|boolean',
        ]);

        $success = $this->doctorRepository->updateAvailability($id, $request->is_available);

        if (!$success) {
            return back()->with('error', 'Failed to update doctor availability.');
        }

        return back()->with('success', 'Doctor availability updated successfully!');
    }

    /**
     * Remove the specified doctor from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy($id)
    {
        if (!Gate::allows('manage-doctors')) {
            abort(403);
        }

        $success = $this->doctorRepository->delete($id);

        if (!$success) {
            return back()->with('error', 'Failed to delete doctor profile.');
        }

        return redirect()->route('doctors.index')
            ->with('success', 'Doctor profile deleted successfully!');
    }
}
