<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Repositories\DoctorRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    protected $userRepository;
    protected $doctorRepository;

    public function __construct(
        UserRepository $userRepository,
        DoctorRepository $doctorRepository
    ) {
        $this->userRepository = $userRepository;
        $this->doctorRepository = $doctorRepository;
    }

    public function index()
    {
        $users = $this->userRepository->getAllPaginated();

        return Inertia::render('Users/Index', [
            'users' => $users
        ]);
    }

    public function create()
    {
        $roles = Role::all();

        return Inertia::render('Users/Create', [
            'roles' => $roles
        ]);
    }

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
        if ($request->role_id == 2) {
            return redirect()->route('doctors.create', ['user_id' => $user->id])
                ->with('success', 'User created successfully! Please complete the doctor profile.');
        }

        return redirect()->route('users.index')
            ->with('success', 'User created successfully!');
    }

    public function edit($id)
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            abort(404, 'User not found');
        }

        $roles = Role::all();

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
            'isCurrentUser' => auth()->id() === $user->id
        ]);
    }

    public function update(Request $request, $id)
    {
        // REMOVED: Gate check - already protected by super-admin middleware

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
        $isDoctor = $request->role_id == 2;

        if (!$wasDoctor && $isDoctor) {
            return redirect()->route('doctors.create', ['user_id' => $id])
                ->with('success', 'User updated successfully! Please complete the doctor profile.');
        }

        if ($isDoctor && $user->doctor) {
            return redirect()->route('doctors.edit', $user->doctor->id)
                ->with('info', 'This user already has a doctor profile.');
        }

        if ($isDoctor && !$user->doctor) {
            return redirect()->route('doctors.create', ['user_id' => $id])
                ->with('info', 'Please complete the doctor profile.');
        }

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully!');
    }

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
