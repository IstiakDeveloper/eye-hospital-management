import React, { useState, ReactNode } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Eye,
    Users,
    Calendar,
    FileText,
    Pill,
    Home,
    Menu,
    X,
    LogOut,
    User,
    Bell,
    ChevronDown,
    ChevronRight,
    Settings,
    Stethoscope,
    UserPlus,
    CalendarDays,
    Activity,
    Shield,
    Search,
    Plus,
    Proportions,
    Package,
    ShoppingCart,
    BarChart3,
    AlertTriangle,
    DollarSign,
    CreditCard,
    History,
    FileBarChart
} from 'lucide-react';
import FlashMessages from '@/components/FlashMessage';

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
    children?: NavItem[];
}

export default function AdminLayout({ children, title = 'Dashboard' }: AdminLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [medicineCornerOpen, setMedicineCornerOpen] = useState(false);

    const userRole = auth.user.role.name;

    // Role checking helper - Fixed to show only specific role permissions
    const hasRole = (allowedRoles: string[]) => {
        return allowedRoles.includes(userRole);
    };

    // Special helper for Super Admin permissions
    const isSuperAdmin = () => {
        return userRole === 'Super Admin';
    };

    // Dashboard route helper based on role
    const getDashboardRoute = () => {
        const dashboardRoutes: { [key: string]: string } = {
            'Receptionist': 'receptionist.dashboard',
            'Doctor': 'doctor.dashboard',
            'Refractionist': 'refractionist.dashboard',
            'Medicine Seller': 'medicine-seller.dashboard',
            'Super Admin': 'dashboard'
        };

        return dashboardRoutes[userRole] || 'dashboard';
    };

    // Get current route name
    const currentRouteName = route().current();

    // Active route detection helper
    const isRouteActive = (currentPattern: string) => {
        // For dashboard routes, check if current route ends with 'dashboard'
        if (currentPattern === 'dashboard') {
            return currentRouteName === 'dashboard' ||
                currentRouteName === 'receptionist.dashboard' ||
                currentRouteName === 'doctor.dashboard' ||
                currentRouteName === 'refractionist.dashboard' ||
                currentRouteName === 'medicine-seller.dashboard';
        }

        // For medicine corner routes (Super Admin)
        if (currentPattern === 'medicine.*') {
            return currentRouteName?.includes('medicine-corner') ||
                window.location.pathname.includes('/medicine-corner');
        }

        // For medicine seller routes
        if (currentPattern === 'medicine-seller.*') {
            return currentRouteName?.includes('medicine-seller') ||
                window.location.pathname.includes('/medicine-seller');
        }

        // For other routes, use pattern matching
        return route().current(currentPattern);
    };

    // Check if medicine corner is active (parent or any child)
    const isMedicineCornerActive = () => {
        return currentRouteName?.includes('medicine-corner') ||
            window.location.pathname.includes('/medicine-corner');
    };

    // Check if any medicine corner child is active
    const isMedicineCornerChildActive = () => {
        const medicineCornerPaths = [
            '/medicine-corner/stock',
            '/medicine-corner/medicines',
            '/medicine-corner/purchase',
            '/medicine-corner/reports',
            '/medicine-corner/alerts'
        ];
        return medicineCornerPaths.some(path => window.location.pathname === path);
    };

    // Navigation items with role-based access
    const navigationItems: NavItem[] = [
        {
            name: 'Dashboard',
            href: route(getDashboardRoute()),
            icon: Home,
            current: 'dashboard',
            roles: ['Super Admin', 'Doctor', 'Receptionist', 'Refractionist', 'Medicine Seller']
        },
        {
            name: 'Patients',
            href: route('patients.index'),
            icon: Users,
            current: 'patients.*',
            roles: ['Super Admin', 'Doctor', 'Receptionist']
        },
        {
            name: 'Appointments',
            href: route('appointments.today'),
            icon: Calendar,
            current: 'appointments.*',
            roles: ['Super Admin'],
            badge: 'Today'
        },
        // POS System for Medicine Seller
        {
            name: 'POS System',
            href: route('medicine-seller.pos'),
            icon: CreditCard,
            current: 'medicine-seller.pos',
            roles: ['Medicine Seller']
        },
        // Sales Management for Medicine Seller
        {
            name: 'Sales History',
            href: route('medicine-seller.sales'),
            icon: History,
            current: 'medicine-seller.sales',
            roles: ['Medicine Seller']
        },
        // My Reports for Medicine Seller
        {
            name: 'My Reports',
            href: route('medicine-seller.report'),
            icon: FileBarChart,
            current: 'medicine-seller.report',
            roles: ['Medicine Seller']
        },
        // Medicine Corner with dropdown (Super Admin only)
        {
            name: 'Medicine Corner',
            href: '#',
            icon: Pill,
            current: 'medicine.*',
            roles: ['Super Admin'],
            children: [
                {
                    name: 'Stock Management',
                    href: '/medicine-corner/stock',
                    icon: Package,
                    current: 'medicine.stock',
                    roles: ['Super Admin']
                },
                {
                    name: 'Medicine List',
                    href: '/medicine-corner/medicines',
                    icon: Pill,
                    current: 'medicine.list',
                    roles: ['Super Admin']
                },
                {
                    name: 'Purchase Entry',
                    href: '/medicine-corner/purchase',
                    icon: ShoppingCart,
                    current: 'medicine.purchase',
                    roles: ['Super Admin']
                },
                {
                    name: 'Sales Management',
                    href: '/medicine-corner/sales',
                    icon: ShoppingCart,
                    current: 'medicine-corner.sales',
                    roles: ['Super Admin']
                },
                {
                    name: 'Reports',
                    href: '/medicine-corner/reports',
                    icon: BarChart3,
                    current: 'medicine.reports',
                    roles: ['Super Admin']
                },
                {
                    name: 'Alerts',
                    href: '/medicine-corner/alerts',
                    icon: AlertTriangle,
                    current: 'medicine.alerts',
                    roles: ['Super Admin']
                }
            ]
        }
    ];

    // Admin only navigation
    const adminNavigation: NavItem[] = [
        {
            name: 'Doctors',
            href: route('doctors.index'),
            icon: Stethoscope,
            current: 'doctors.*',
            roles: ['Super Admin']
        },
        {
            name: 'Users',
            href: route('users.index'),
            icon: UserPlus,
            current: 'users.*',
            roles: ['Super Admin']
        },
        {
            name: 'Medicines',
            href: route('medicines.index'),
            icon: Pill,
            current: 'medicines.*',
            roles: ['Super Admin']
        },
        {
            name: 'Reports',
            href: route('reports.index'),
            icon: Proportions,
            current: 'reports.*',
            roles: ['Super Admin']
        }
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
            case 'Refractionist':
                return 'bg-gradient-to-r from-orange-600 to-orange-700 text-white';
            case 'Medicine Seller':
                return 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white';
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
            case 'Refractionist':
                return <Eye className="h-4 w-4" />;
            case 'Medicine Seller':
                return <Pill className="h-4 w-4" />;
            default:
                return <User className="h-4 w-4" />;
        }
    };

    return (
        <div className="h-screen flex overflow-hidden bg-slate-50">
            {/* Flash Messages */}
            <FlashMessages />

            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 md:hidden backdrop-blur-sm"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 flex flex-col z-50 bg-white border-r border-gray-200 shadow-xl transition-all duration-300 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0 md:static md:z-auto w-72 md:flex-shrink-0`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-6 py-4 h-16 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <Link href={route(getDashboardRoute())} className="flex items-center">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <Eye className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="ml-3 text-xl font-bold text-white">Eye Hospital</span>
                    </Link>
                    <button
                        className="md:hidden rounded-lg p-2 text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                        onClick={toggleSidebar}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* User Info Card */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full h-12 w-12 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {auth.user.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{auth.user.name}</p>
                            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleColor(userRole)}`}>
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
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Main Menu
                        </p>
                        <nav className="space-y-1">
                            {navigationItems.map((item) => {
                                // For Super Admin, check if they should see this item
                                if (userRole === 'Super Admin' && !item.roles.includes('Super Admin')) {
                                    return null;
                                }

                                // For other roles, use hasRole
                                if (userRole !== 'Super Admin' && !hasRole(item.roles)) {
                                    return null;
                                }

                                const Icon = item.icon;
                                const isActive = isRouteActive(item.current);
                                const isMedicineCorner = item.name === 'Medicine Corner';
                                const medicineCornerActive = isMedicineCornerActive();

                                // Medicine Corner with dropdown
                                if (isMedicineCorner) {
                                    const medicineCornerActive = isMedicineCornerActive();
                                    const anyChildActive = isMedicineCornerChildActive();
                                    const shouldShowAsActive = medicineCornerActive || anyChildActive;

                                    return (
                                        <div key={item.name}>
                                            <button
                                                onClick={() => setMedicineCornerOpen(!medicineCornerOpen)}
                                                className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${shouldShowAsActive
                                                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                    }`}
                                            >
                                                <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${shouldShowAsActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                                                    }`} />
                                                <span className="flex-1 text-left">{item.name}</span>
                                                <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${medicineCornerOpen || anyChildActive ? 'rotate-90' : ''
                                                    } ${shouldShowAsActive ? 'text-blue-700' : 'text-gray-400'}`} />
                                            </button>

                                            {/* Dropdown Items */}
                                            <div className={`mt-1 space-y-1 transition-all duration-200 overflow-hidden ${medicineCornerOpen || anyChildActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                }`}>
                                                {item.children?.map((childItem) => {
                                                    const ChildIcon = childItem.icon;
                                                    const isChildActive = window.location.pathname === childItem.href;

                                                    return (
                                                        <Link
                                                            key={childItem.name}
                                                            href={childItem.href}
                                                            className={`group flex items-center pl-11 pr-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isChildActive
                                                                    ? 'bg-blue-100 text-blue-800 border-r-2 border-blue-600'
                                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                }`}
                                                        >
                                                            <ChildIcon className={`flex-shrink-0 h-4 w-4 mr-2 ${isChildActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                                                                }`} />
                                                            <span>{childItem.name}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }

                                // Regular navigation items
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                                            }`} />
                                        <span className="flex-1">{item.name}</span>
                                        {item.badge && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
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
                        <div className="px-4 mt-8">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Administration
                            </p>
                            <nav className="space-y-1">
                                {adminNavigation.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = isRouteActive(item.current);

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                                    ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-700'
                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                        >
                                            <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-purple-700' : 'text-gray-400 group-hover:text-gray-500'
                                                }`} />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="space-y-2">
                        {userRole === 'Receptionist' && (
                            <Link
                                href={route('patients.create')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Patient
                            </Link>
                        )}
                        {userRole === 'Doctor' && (
                            <Link
                                href={route('patients.index')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                New Prescription
                            </Link>
                        )}
                        {userRole === 'Refractionist' && (
                            <Link
                                href={route('patients.index')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white text-sm font-medium rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-sm"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Vision Test
                            </Link>
                        )}
                        {userRole === 'Medicine Seller' && (
                            <Link
                                href={route('medicine-seller.pos')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-sm"
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Quick Sale
                            </Link>
                        )}
                        {userRole === 'Super Admin' && (
                            <Link
                                href="/medicine-corner/purchase"
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-sm"
                            >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Quick Purchase
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Top navigation */}
                <header className="bg-white shadow-sm border-b border-gray-200 z-10">
                    <div className="flex items-center justify-between px-4 py-3 h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                type="button"
                                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                onClick={toggleSidebar}
                            >
                                <Menu className="h-6 w-6" />
                            </button>

                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                                <p className="text-sm text-gray-500">
                                    Welcome back, {auth.user.name.split(' ')[0]}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Search */}
                            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                                <Search className="h-5 w-5" />
                            </button>

                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative"
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                >
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                                </button>

                                {notificationsOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                        <div className="p-4 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-sm text-gray-500 text-center py-4">No new notifications</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="flex items-center space-x-2 p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <span className="text-white font-medium text-sm">
                                            {auth.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                        <div className="py-1">
                                            <Link
                                                href={route('profile.edit')}
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <User className="mr-3 h-4 w-4 text-gray-400" />
                                                Profile Settings
                                            </Link>
                                            <Link
                                                href="#"
                                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <Settings className="mr-3 h-4 w-4 text-gray-400" />
                                                Preferences
                                            </Link>
                                            <hr className="my-1 border-gray-200" />
                                            <button
                                                onClick={logout}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
