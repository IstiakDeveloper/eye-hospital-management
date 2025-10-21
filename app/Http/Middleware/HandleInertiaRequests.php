<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;
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
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => function () {
                $user = Auth::user();

                if (!$user) {
                    return ['user' => null];
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
                    ],
                ];
            },
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => !$request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',

            // Flash messages
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
        ];
    }

    /**
     * Get all permissions for the user
     *
     * @param \App\Models\User $user
     * @return array<string>
     */
    private function getUserPermissions($user): array
    {
        // Super Admin has all permissions (indicated by wildcard)
        if ($user->role && $user->role->name === 'Super Admin') {
            return ['*']; // Frontend will check for this wildcard
        }

        if (!$user->role) {
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
