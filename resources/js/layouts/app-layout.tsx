import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Calendar,
    CalendarDays,
    ChevronDown,
    Eye,
    FileText,
    Home,
    LogOut,
    Menu,
    Pill,
    Plus,
    Search,
    Settings,
    Shield,
    Stethoscope,
    User,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import React, { ReactNode, useState } from 'react';

interface PageProps {
    auth: {
        user: {
            name: string;
            email: string;
            role: {
                name: string;
            };
        };
    };
}

interface AdminLayoutProps {
    children: ReactNode;
    title?: string;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<any>;
    current: string;
    roles: string[];
    badge?: string;
}

export default function AdminLayout({ children, title = 'Dashboard' }: AdminLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const userRole = auth.user.role.name;

    // Role checking helper
    const hasRole = (allowedRoles: string[]) => {
        return allowedRoles.includes(userRole) || userRole === 'Super Admin';
    };

    // Navigation items with role-based access
    const navigationItems: NavItem[] = [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            icon: Home,
            current: 'dashboard',
            roles: ['Super Admin', 'Doctor', 'Receptionist'],
        },
        {
            name: 'Patients',
            href: route('patients.index'),
            icon: Users,
            current: 'patients.*',
            roles: ['Super Admin', 'Doctor', 'Receptionist'],
        },
        {
            name: 'Appointments',
            href: route('appointments.today'),
            icon: Calendar,
            current: 'appointments.*',
            roles: ['Super Admin', 'Doctor', 'Receptionist'],
            badge: 'Today',
        },
        {
            name: 'Vision Tests',
            href: route('patients.index'), // Default to patients, they can navigate from there
            icon: Eye,
            current: 'visiontests.*',
            roles: ['Super Admin', 'Receptionist'],
        },
        {
            name: 'Prescriptions',
            href: route('patients.index'), // Default to patients, they can navigate from there
            icon: FileText,
            current: 'prescriptions.*',
            roles: ['Super Admin', 'Doctor'],
        },
    ];

    // Admin only navigation
    const adminNavigation: NavItem[] = [
        {
            name: 'Doctors',
            href: route('doctors.index'),
            icon: Stethoscope,
            current: 'doctors.*',
            roles: ['Super Admin'],
        },
        {
            name: 'Users',
            href: route('users.index'),
            icon: UserPlus,
            current: 'users.*',
            roles: ['Super Admin'],
        },
        {
            name: 'Medicines',
            href: route('medicines.index'),
            icon: Pill,
            current: 'medicines.*',
            roles: ['Super Admin'],
        },
    ];

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const logout = () => {
        router.post(route('logout'));
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Super Admin':
                return 'bg-gradient-to-r from-purple-600 to-purple-700 text-white';
            case 'Doctor':
                return 'bg-gradient-to-r from-green-600 to-green-700 text-white';
            case 'Receptionist':
                return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'Super Admin':
                return <Shield className="h-4 w-4" />;
            case 'Doctor':
                return <Stethoscope className="h-4 w-4" />;
            case 'Receptionist':
                return <CalendarDays className="h-4 w-4" />;
            default:
                return <User className="h-4 w-4" />;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && <div className="bg-opacity-50 fixed inset-0 z-40 bg-gray-900 backdrop-blur-sm md:hidden" onClick={toggleSidebar}></div>}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 flex transform flex-col border-r border-gray-200 bg-white shadow-xl transition-all duration-300 ease-in-out ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } w-72 md:static md:z-auto md:flex-shrink-0 md:translate-x-0`}
            >
                {/* Logo */}
                <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <Link href={route('dashboard')} className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                            <Eye className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="ml-3 text-xl font-bold text-white">Eye Hospital</span>
                    </Link>
                    <button
                        className="hover:bg-opacity-20 rounded-lg p-2 text-white transition-colors hover:bg-white md:hidden"
                        onClick={toggleSidebar}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* User Info Card */}
                <div className="border-b border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-lg">
                                {auth.user.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">{auth.user.name}</p>
                            <div
                                className={`mt-1 inline-flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium ${getRoleColor(userRole)}`}
                            >
                                {getRoleIcon(userRole)}
                                <span>{userRole}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4">
                    {/* Main Navigation */}
                    <div className="px-4">
                        <p className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">Main Menu</p>
                        <nav className="space-y-1">
                            {navigationItems.map((item) => {
                                if (!hasRole(item.roles)) return null;

                                const Icon = item.icon;
                                const isActive = route().current(item.current);

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? 'border-r-2 border-blue-700 bg-blue-50 text-blue-700'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        <Icon
                                            className={`mr-3 h-5 w-5 flex-shrink-0 ${
                                                isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                                            }`}
                                        />
                                        <span className="flex-1">{item.name}</span>
                                        {item.badge && (
                                            <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Admin Section */}
                    {userRole === 'Super Admin' && (
                        <div className="mt-8 px-4">
                            <p className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">Administration</p>
                            <nav className="space-y-1">
                                {adminNavigation.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = route().current(item.current);

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                                                isActive
                                                    ? 'border-r-2 border-purple-700 bg-purple-50 text-purple-700'
                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        >
                                            <Icon
                                                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                                                    isActive ? 'text-purple-700' : 'text-gray-400 group-hover:text-gray-500'
                                                }`}
                                            />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="space-y-2">
                        {hasRole(['Receptionist']) && (
                            <Link
                                href={route('patients.create')}
                                className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:from-green-700 hover:to-green-800"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Patient
                            </Link>
                        )}
                        {hasRole(['Doctor']) && (
                            <Link
                                href={route('patients.index')}
                                className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:from-blue-700 hover:to-blue-800"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                New Prescription
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top navigation */}
                <header className="z-10 border-b border-gray-200 bg-white shadow-sm">
                    <div className="flex h-16 items-center justify-between px-4 py-3">
                        <div className="flex items-center space-x-4">
                            <button
                                type="button"
                                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 md:hidden"
                                onClick={toggleSidebar}
                            >
                                <Menu className="h-6 w-6" />
                            </button>

                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                                <p className="text-sm text-gray-500">Welcome back, {auth.user.name.split(' ')[0]}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Search */}
                            <button className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100">
                                <Search className="h-5 w-5" />
                            </button>

                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                >
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                                </button>

                                {notificationsOpen && (
                                    <div className="ring-opacity-5 absolute right-0 z-50 mt-2 w-80 rounded-lg bg-white shadow-lg ring-1 ring-black">
                                        <div className="border-b border-gray-200 p-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                        </div>
                                        <div className="p-4">
                                            <p className="py-4 text-center text-sm text-gray-500">No new notifications</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="flex items-center space-x-2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
                                        <span className="text-sm font-medium text-white">{auth.user.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </button>

                                {userMenuOpen && (
                                    <div className="ring-opacity-5 absolute right-0 z-50 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black">
                                        <div className="py-1">
                                            <Link
                                                href={route('profile.edit')}
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                                            >
                                                <User className="mr-3 h-4 w-4 text-gray-400" />
                                                Profile Settings
                                            </Link>
                                            <Link
                                                href="#"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                                            >
                                                <Settings className="mr-3 h-4 w-4 text-gray-400" />
                                                Preferences
                                            </Link>
                                            <hr className="my-1 border-gray-200" />
                                            <button
                                                onClick={logout}
                                                className="flex w-full items-center px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                                            >
                                                <LogOut className="mr-3 h-4 w-4" />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    <div className="p-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
