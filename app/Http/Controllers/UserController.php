<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Repositories\DoctorRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * The user repository instance.
     *
     * @var \App\Repositories\UserRepository
     */
    protected $userRepository;

    /**
     * The doctor repository instance.
     *
     * @var \App\Repositories\DoctorRepository
     */
    protected $doctorRepository;

    /**
     * Create a new controller instance.
     *
     * @param  \App\Repositories\UserRepository  $userRepository
     * @param  \App\Repositories\DoctorRepository  $doctorRepository
     * @return void
     */
    public function __construct(
        UserRepository $userRepository,
        DoctorRepository $doctorRepository
    ) {
        $this->userRepository = $userRepository;
        $this->doctorRepository = $doctorRepository;
    }

    /**
     * Display a listing of the users.
     *
     * @return \Inertia\Response
     */
    public function index()
    {

        $users = $this->userRepository->getAllPaginated();

        return Inertia::render('Users/Index', [
            'users' => $users
        ]);
    }

    /**
     * Show the form for creating a new user.
     *
     * @return \Inertia\Response
     */
    public function create()
    {

        $roles = Role::all();

        return Inertia::render('Users/Create', [
            'roles' => $roles
        ]);
    }

    /**
     * Store a newly created user in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = $this->userRepository->create($request->all());

        // If the user is a doctor, create a doctor profile
        if ($request->role_id == 2) { // Doctor role ID
            return redirect()->route('doctors.create', ['user_id' => $user->id])
                ->with('success', 'User created successfully! Please complete the doctor profile.');
        }

        return redirect()->route('users.index')
            ->with('success', 'User created successfully!');
    }

    /**
     * Show the form for editing the specified user.
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function edit($id)
    {

        $user = $this->userRepository->findById($id);

        if (!$user) {
            abort(404, 'User not found');
        }

        $roles = Role::all();

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles
        ]);
    }

    /**
     * Update the specified user in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, $id)
    {
        if (!Gate::allows('manage-users')) {
            abort(403);
        }

        $user = $this->userRepository->findById($id);

        if (!$user) {
            abort(404, 'User not found');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'role_id' => 'required|exists:roles,id',
            'is_active' => 'boolean',
        ]);

        $success = $this->userRepository->update($id, $request->all());

        if (!$success) {
            return back()->with('error', 'Failed to update user.');
        }

        // Handle role change to/from doctor
        $wasDoctor = $user->isDoctor();
        $isDoctor = $request->role_id == 2; // Doctor role ID

        if (!$wasDoctor && $isDoctor) {
            // User is now a doctor, redirect to create doctor profile
            return redirect()->route('doctors.create', ['user_id' => $id])
                ->with('success', 'User updated successfully! Please complete the doctor profile.');
        }

        // If user is a doctor and already has a doctor profile, redirect to edit
        if ($isDoctor && $user->doctor) {
            return redirect()->route('doctors.edit', $user->doctor->id)
                ->with('info', 'This user already has a doctor profile.');
        }

        // If user is a doctor but doesn't have a doctor profile, redirect to create
        if ($isDoctor && !$user->doctor) {
            return redirect()->route('doctors.create', ['user_id' => $id])
                ->with('info', 'Please complete the doctor profile.');
        }

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully!');
    }

    /**
     * Remove the specified user from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy($id)
    {

        if ($id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $success = $this->userRepository->delete($id);

        if (!$success) {
            return back()->with('error', 'Failed to delete user.');
        }

        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully!');
    }
}
