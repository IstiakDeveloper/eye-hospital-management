<?php

namespace App\Http\Controllers;

use App\Repositories\DoctorRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
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
        $userId = $request->query('user_id');
        $user = null;

        if ($userId) {
            $user = $this->userRepository->findById($userId);

            if (!$user) {
                abort(404, 'User not found');
            }

            if ($user->isDoctor() && $user->doctor) {
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
        // dd($request->all());
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => [
                    'required',
                    'string',
                    'email',
                    'max:255',
                    Rule::unique('users')->ignore($request->user_id), // Laravel use Illuminate\Validation\Rule
                ],
                'phone' => 'nullable|string|max:20',
               'password' => 'nullable|string|min:6',
                'specialization' => 'nullable|string|max:255',
                'qualification' => 'nullable|string',
                'experience_years' => 'nullable|integer|min:0',
                'consultation_fee' => 'nullable|numeric|min:0',
                'registration_number' => 'nullable|string|max:100',
                'chamber_address' => 'nullable|string',
                'visiting_hours' => 'nullable|string',
                'is_available' => 'boolean'
            ]);

            // Check if creating from existing user
            $userId = $request->input('user_id');

            if ($userId) {
                // Create doctor profile for existing user
                $doctorData = collect($validated)->except(['name', 'email', 'phone', 'password'])->toArray();
                $doctor = $this->doctorRepository->createFromExistingUser($userId, $doctorData);
            } else {
                // Create new user and doctor
                $userData = collect($validated)->only(['name', 'email', 'phone', 'password'])->toArray();
                $doctorData = collect($validated)->except(['name', 'email', 'phone', 'password'])->toArray();

                $doctor = $this->doctorRepository->createWithUser($userData, $doctorData);
            }

            return redirect()->route('doctors.index')
                ->with('success', 'Doctor created successfully!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to create doctor: ' . $e->getMessage())->withInput();
        }
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

        // Get today's appointments
        $todayAppointments = $doctor->appointments()
            ->where('appointment_date', today())
            ->with(['patient'])
            ->orderBy('appointment_time')
            ->get();

        // Get upcoming appointments (next 7 days, excluding today)
        $upcomingAppointments = $doctor->appointments()
            ->where('appointment_date', '>', today())
            ->where('appointment_date', '<=', today()->addDays(7))
            ->with(['patient'])
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit(10)
            ->get();

        // Calculate statistics
        $totalAppointments = $doctor->appointments()->count();
        $completedAppointments = $doctor->appointments()->where('status', 'completed')->count();
        $todayAppointmentsCount = $todayAppointments->count();

        $stats = [
            'totalAppointments' => $totalAppointments,
            'completedAppointments' => $completedAppointments,
            'todayAppointments' => $todayAppointmentsCount,
        ];

        return Inertia::render('Doctors/Show', [
            'doctor' => $doctor,
            'todayAppointments' => $todayAppointments,
            'upcomingAppointments' => $upcomingAppointments,
            'stats' => $stats
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
        $doctor = $this->doctorRepository->findById($id);

        if (!$doctor) {
            abort(404, 'Doctor not found');
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $doctor->user_id,
            'phone' => 'nullable|string|max:20',
            'registration_number' => 'nullable|string|max:50',
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

        // Update doctor details
        $doctorData = $request->only([
            'specialization',
            'qualification',
            'bio',
            'consultation_fee',
            'is_available',
            'registration_number'
        ]);

        $success = $this->doctorRepository->update($id, $doctorData);

        if (!$success) {
            return back()->with('error', 'Failed to update doctor profile.');
        }

        return redirect()->route('doctors.show', $id)
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
        $success = $this->doctorRepository->delete($id);

        if (!$success) {
            return back()->with('error', 'Failed to delete doctor profile.');
        }

        return redirect()->route('doctors.index')
            ->with('success', 'Doctor profile deleted successfully!');
    }
}
