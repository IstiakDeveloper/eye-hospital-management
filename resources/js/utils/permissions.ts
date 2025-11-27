import { usePage } from '@inertiajs/react';
import { Permission, Role } from '@/types';

interface PageProps {
    auth: {
        user: {
            role: Role;
        }
    }
    [key: string]: any;
}

export function hasPermission(permission: string): boolean {
    const { auth } = usePage<PageProps>().props;

    // Super Admin has all permissions
    if (auth.user.role.name === 'Super Admin') {
        return true;
    }

    return auth.user.role.permissions.some(p => p.slug === permission);
}

export function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => hasPermission(permission));
}

export function hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => hasPermission(permission));
}
