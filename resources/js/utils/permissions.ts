import { usePage } from '@inertiajs/react';

interface Role {
    name: string;
}

interface PageProps {
    auth: {
        user: {
            role: Role;
            permissions: string[];
        };
    };
    [key: string]: any;
}

export function hasPermission(permission: string): boolean {
    const { auth } = usePage<PageProps>().props;

    const user = auth?.user;

    if (!user) {
        return false;
    }

    // Wildcard permission grants all access (Super Admin)
    if (user.permissions?.includes('*')) {
        return true;
    }

    return user.permissions?.includes(permission) ?? false;
}

export function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => hasPermission(permission));
}

export function hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => hasPermission(permission));
}
