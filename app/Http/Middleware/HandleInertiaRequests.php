<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;
use Inertia\Support\Header;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $shared = [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => function () {
                $user = Auth::user();

                if (! $user) {
                    return ['user' => null];
                }

                $activeMovement = null;
                if ($user->employee) {
                    $activeMovement = \App\Models\EmployeeMovement::where('employee_id', $user->employee->id)
                        ->whereNull('end_time')
                        ->first();
                }

                return [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role ? [
                            'id' => $user->role->id,
                            'name' => $user->role->name,
                        ] : null,
                        // Share user permissions with frontend
                        'permissions' => $this->getUserPermissions($user),
                        'activeMovement' => $activeMovement,
                    ],
                ];
            },
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',

            // Flash messages
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
                'import_errors' => $request->session()->get('import_errors'),
            ],
        ];

        if (! $request->headers->has(Header::INERTIA)) {
            $shared['ziggy'] = fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ];
        }

        return $shared;
    }

    /**
     * Get all permissions for the user
     *
     * @param  \App\Models\User  $user
     * @return array<string>
     */
    private function getUserPermissions($user): array
    {
        return Cache::remember(
            User::inertiaPermissionCacheKey($user->id),
            now()->addMinutes(10),
            fn (): array => $this->resolveUserPermissions($user),
        );
    }

    /**
     * @param  \App\Models\User  $user
     * @return array<string>
     */
    private function resolveUserPermissions($user): array
    {
        // Super Admin has all permissions (indicated by wildcard)
        if ($user->role && $user->role->name === 'Super Admin') {
            return ['*'];
        }

        if (! $user->role) {
            return [];
        }

        // Get role permissions
        $rolePermissions = $user->role->permissions()
            ->pluck('name')
            ->toArray();

        // Get user-specific granted permissions
        $userGrantedPermissions = $user->userPermissions()
            ->where('granted', true)
            ->with('permission')
            ->get()
            ->pluck('permission.name')
            ->toArray();

        // Get user-specific revoked permissions
        $userRevokedPermissions = $user->userPermissions()
            ->where('granted', false)
            ->with('permission')
            ->get()
            ->pluck('permission.name')
            ->toArray();

        // Check for wildcard permission in user permissions
        if (in_array('*', $userGrantedPermissions)) {
            return ['*'];
        }

        // Merge role and user granted permissions
        $allPermissions = array_unique(array_merge($rolePermissions, $userGrantedPermissions));

        // Remove revoked permissions
        $finalPermissions = array_values(array_diff($allPermissions, $userRevokedPermissions));

        return $finalPermissions;
    }
}
