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
    FileBarChart,
    Calculator,
    Building2,
    Glasses,
    ShoppingBag,
    LucideWaypoints,
    Truck,
    Receipt
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
    const [accountSectionOpen, setAccountSectionOpen] = useState(false);
    const [opticsCornerOpen, setOpticsCornerOpen] = useState(false);
    const [medicalTestsOpen, setMedicalTestsOpen] = useState(false);

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
            'Optics Seller': 'optics-seller.dashboard',
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
                currentRouteName === 'medicine-seller.dashboard' ||
                currentRouteName === 'optics-seller.dashboard';
        }

        // For medicine corner routes (Super Admin)
        if (currentPattern === 'medicine.*') {
            return currentRouteName?.includes('medicine-corner') ||
                currentRouteName?.includes('medicine-vendors') ||
                window.location.pathname.includes('/medicine-corner') ||
                window.location.pathname.includes('/medicine-vendors');
        }

        // For medicine seller routes
        if (currentPattern === 'medicine-seller.*') {
            return currentRouteName?.includes('medicine-seller') ||
                window.location.pathname.includes('/medicine-seller');
        }

        // For optics seller routes
        if (currentPattern === 'optics-seller.*') {
            return currentRouteName?.includes('optics-seller') ||
                window.location.pathname.includes('/optics-seller');
        }

        if (currentPattern === 'medical-tests.*') {
            return currentRouteName?.includes('medical-tests') ||
                window.location.pathname.includes('/medical-tests');
        }

        // For account sections
        if (currentPattern === 'account.*') {
            return currentRouteName?.includes('main-account') ||
                currentRouteName?.includes('hospital-account') ||
                currentRouteName?.includes('medicine-account') ||
                currentRouteName?.includes('optics-account') ||
                window.location.pathname.includes('/main-account') ||
                window.location.pathname.includes('/hospital-account') ||
                window.location.pathname.includes('/medicine-account') ||
                window.location.pathname.includes('/optics-account');
        }

        if (currentPattern === 'optics.*') {
            return currentRouteName?.includes('optics') ||
                window.location.pathname.includes('/optics');
        }

        // For other routes, use pattern matching
        return route().current(currentPattern);
    };

    // Check if medicine corner is active (parent or any child)
    const isMedicineCornerActive = () => {
        return currentRouteName?.includes('medicine-corner') ||
            currentRouteName?.includes('medicine-vendors') ||
            window.location.pathname.includes('/medicine-corner') ||
            window.location.pathname.includes('/medicine-vendors');
    };

    // Check if any medicine corner child is active
    const isMedicineCornerChildActive = () => {
        const medicineCornerPaths = [
            '/medicine-corner/stock',
            '/medicine-corner/medicines',
            '/medicine-corner/purchase',
            '/medicine-corner/sales',
            '/medicine-corner/reports',
            '/medicine-corner/alerts'
        ];

        const medicineVendorPaths = [
            '/medicine-vendors',
            '/medicine-vendors/reports/due-report',
            '/medicine-vendors/reports/payment-history',
            '/medicine-vendors/reports/analytics'
        ];

        return medicineCornerPaths.some(path => window.location.pathname === path) ||
            medicineVendorPaths.some(path => window.location.pathname.startsWith(path)) ||
            currentRouteName?.startsWith('medicine-vendors.');
    };

    const isMedicalTestsActive = () => {
        return currentRouteName?.includes('medical-tests') ||
            window.location.pathname.includes('/medical-tests');
    };

    const isMedicalTestsChildActive = () => {
        const medicalTestPaths = [
            '/medical-tests/tests',
            '/medical-tests',
            '/medical-tests/reports/daily',
            '/medical-tests/reports/monthly',
            '/medical-tests/reports/test-wise'
        ];
        return medicalTestPaths.some(path => window.location.pathname.startsWith(path));
    };

    // Check if account section is active
    const isAccountSectionActive = () => {
        return currentRouteName?.includes('main-account') ||
            currentRouteName?.includes('hospital-account') ||
            currentRouteName?.includes('medicine-account') ||
            currentRouteName?.includes('optics-account') ||
            window.location.pathname.includes('/main-account') ||
            window.location.pathname.includes('/hospital-account') ||
            window.location.pathname.includes('/medicine-account') ||
            window.location.pathname.includes('/optics-account');
    };

    // Check if any account section child is active
    const isAccountSectionChildActive = () => {
        const accountPaths = [
            '/main-account',
            '/hospital-account',
            '/medicine-account',
            '/optics-account'
        ];
        return accountPaths.some(path => window.location.pathname.startsWith(path));
    };

    const isOpticsCornerActive = () => {
        return currentRouteName?.includes('optics') ||
            window.location.pathname.includes('/optics');
    };

    const isOpticsCornerChildActive = () => {
        const opticsCornerPaths = [
            '/optics',
            '/optics/frames',
            '/optics/stock',
            '/optics/purchases',
            '/optics/vendors',
            '/optics/sales',
            '/optics/lens-types',
            '/optics/account',
            '/optics/reports'
        ];
        return opticsCornerPaths.some(path => {
            if (path === '/optics') {
                return window.location.pathname === '/optics' || window.location.pathname === '/optics/';
            }
            return window.location.pathname.startsWith(path);
        });
    };

    // Navigation items with role-based access
    const navigationItems: NavItem[] = [
        {
            name: 'Dashboard',
            href: route(getDashboardRoute()),
            icon: Home,
            current: 'dashboard',
            roles: ['Super Admin', 'Doctor', 'Receptionist', 'Refractionist', 'Medicine Seller', 'Optics Seller']
        },
        {
            name: 'Patients',
            href: route('patients.index'),
            icon: Users,
            current: 'patients.*',
            roles: ['Super Admin', 'Doctor', 'Receptionist']
        },
        {
            name: 'Pending Visits',
            href: route('patients.pending-visits'),
            icon: LucideWaypoints,
            current: 'patients.*',
            roles: ['Super Admin', 'Receptionist']
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
        // POS System for Optics Seller
        {
            name: 'Optics POS',
            href: route('optics-seller.pos'),
            icon: Glasses,
            current: 'optics-seller.pos',
            roles: ['Optics Seller']
        },
        // Sales Management for Optics Seller
        {
            name: 'Optics Sales',
            href: route('optics-seller.sales'),
            icon: ShoppingBag,
            current: 'optics-seller.sales',
            roles: ['Optics Seller']
        },
        // My Reports for Optics Seller
        {
            name: 'Optics Reports',
            href: route('optics-seller.report'),
            icon: BarChart3,
            current: 'optics-seller.report',
            roles: ['Optics Seller']
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
                    current: 'medicine-corner.stock',
                    roles: ['Super Admin']
                },
                {
                    name: 'Medicine List',
                    href: '/medicine-corner/medicines',
                    icon: Pill,
                    current: 'medicine-corner.medicines',
                    roles: ['Super Admin']
                },
                {
                    name: 'Purchase Entry',
                    href: '/medicine-corner/purchase',
                    icon: ShoppingCart,
                    current: 'medicine-corner.purchase',
                    roles: ['Super Admin']
                },
                {
                    name: 'Sales Management',
                    href: '/medicine-corner/sales',
                    icon: ShoppingBag,
                    current: 'medicine-corner.sales',
                    roles: ['Super Admin']
                },
                {
                    name: 'Vendor Management',
                    href: route('medicine-vendors.index'),
                    icon: Building2,
                    current: 'medicine-vendors.index',
                    roles: ['Super Admin']
                },
                {
                    name: 'Vendor Dues',
                    href: route('medicine-vendors.due-report'),
                    icon: AlertTriangle,
                    current: 'medicine-vendors.due-report',
                    roles: ['Super Admin']
                },
                {
                    name: 'Payment History',
                    href: route('medicine-vendors.payment-history'),
                    icon: History,
                    current: 'medicine-vendors.payment-history',
                    roles: ['Super Admin']
                },
                {
                    name: 'Vendor Analytics',
                    href: route('medicine-vendors.analytics'),
                    icon: BarChart3,
                    current: 'medicine-vendors.analytics',
                    roles: ['Super Admin']
                },
                {
                    name: 'Reports',
                    href: '/medicine-corner/reports',
                    icon: FileBarChart,
                    current: 'medicine-corner.reports',
                    roles: ['Super Admin']
                },
                {
                    name: 'Alerts',
                    href: '/medicine-corner/alerts',
                    icon: AlertTriangle,
                    current: 'medicine-corner.alerts',
                    roles: ['Super Admin']
                }
            ]
        },

        {
            name: 'Optics Corner',
            href: '#',
            icon: Glasses,
            current: 'optics.*',
            roles: ['Super Admin'],
            children: [
                {
                    name: 'Dashboard',
                    href: route('optics.dashboard'),
                    icon: Home,
                    current: 'optics.dashboard',
                    roles: ['Super Admin']
                },
                {
                    name: 'Frames Management',
                    href: route('optics.frames'),
                    icon: Glasses,
                    current: 'optics.frames',
                    roles: ['Super Admin']
                },
                {
                    name: 'Stock Management',
                    href: route('optics.stock'),
                    icon: Package,
                    current: 'optics.stock',
                    roles: ['Super Admin']
                },
                {
                    name: 'Purchase Entry',
                    href: route('optics.purchases'),
                    icon: ShoppingCart,
                    current: 'optics.purchases',
                    roles: ['Super Admin']
                },
                {
                    name: 'Vendors Management',
                    href: route('optics.vendors'),
                    icon: Truck,
                    current: 'optics.vendors',
                    roles: ['Super Admin']
                },
                {
                    name: 'Sales Management',
                    href: route('optics.sales'),
                    icon: ShoppingBag,
                    current: 'optics.sales',
                    roles: ['Super Admin']
                },
                {
                    name: 'Lens Types',
                    href: route('optics.lens-types'),
                    icon: Eye,
                    current: 'optics.lens-types',
                    roles: ['Super Admin']
                },
                // {
                //     name: 'Account',
                //     href: route('optics.account'),
                //     icon: DollarSign,
                //     current: 'optics.account',
                //     roles: ['Super Admin']
                // },
                // {
                //     name: 'Reports & Analytics',
                //     href: route('optics.reports'),
                //     icon: BarChart3,
                //     current: 'optics.reports',
                //     roles: ['Super Admin']
                // }
            ]
        },

        {
            name: 'Medical Tests',
            href: '#',
            icon: Activity,
            current: 'medical-tests.*',
            roles: ['Super Admin', 'Receptionist'],
            children: [
                {
                    name: 'Test Management',
                    href: route('medical-tests.tests.index'),
                    icon: Settings,
                    current: 'medical-tests.tests.*',
                    roles: ['Super Admin']
                },
                {
                    name: 'Book Tests',
                    href: route('medical-tests.index'),
                    icon: CalendarDays,
                    current: 'medical-tests.index',
                    roles: ['Super Admin', 'Receptionist']
                },
                {
                    name: 'Daily Reports',
                    href: route('medical-tests.reports.daily'),
                    icon: FileBarChart,
                    current: 'medical-tests.reports.daily',
                    roles: ['Super Admin']
                },
                {
                    name: 'Monthly Reports',
                    href: route('medical-tests.reports.monthly'),
                    icon: BarChart3,
                    current: 'medical-tests.reports.monthly',
                    roles: ['Super Admin']
                },
                {
                    name: 'Test-wise Reports',
                    href: route('medical-tests.reports.test-wise'),
                    icon: Activity,
                    current: 'medical-tests.reports.test-wise',
                    roles: ['Super Admin']
                }
            ]
        },

        {
            name: 'Account Management',
            href: '#',
            icon: Calculator,
            current: 'account.*',
            roles: ['Super Admin'],
            children: [
                {
                    name: 'Main Account',
                    href: route('main-account.index'),
                    icon: DollarSign,
                    current: 'main-account.*',
                    roles: ['Super Admin']
                },
                {
                    name: 'Hospital Account',
                    href: '/hospital-account',
                    icon: Building2,
                    current: 'hospital-account.*',
                    roles: ['Super Admin']
                },
                {
                    name: 'Medicine Account',
                    href: '/medicine-account',
                    icon: Pill,
                    current: 'medicine-account.*',
                    roles: ['Super Admin']
                },
                {
                    name: 'Optics Account',
                    href: '/optics-account',
                    icon: Glasses,
                    current: 'optics-account.*',
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
            case 'Optics Seller':
                return 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white';
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
            case 'Optics Seller':
                return <Glasses className="h-4 w-4" />;
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

                {/* Navigation - Updated section with role filtering */}
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
                                const isOpticsCorner = item.name === 'Optics Corner';
                                const isAccountSection = item.name === 'Account Management';
                                const isMedicalTests = item.name === 'Medical Tests';

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
                                                    let isChildActive = false;

                                                    // Special handling for medicine vendor routes
                                                    if (childItem.current === 'medicine-vendors.index') {
                                                        isChildActive = currentRouteName === 'medicine-vendors.index' ||
                                                            currentRouteName === 'medicine-vendors.show' ||
                                                            window.location.pathname === '/medicine-vendors';
                                                    } else if (childItem.current === 'medicine-vendors.due-report') {
                                                        isChildActive = currentRouteName === 'medicine-vendors.due-report' ||
                                                            window.location.pathname === '/medicine-vendors/reports/due-report';
                                                    } else if (childItem.current === 'medicine-vendors.payment-history') {
                                                        isChildActive = currentRouteName === 'medicine-vendors.payment-history' ||
                                                            window.location.pathname === '/medicine-vendors/reports/payment-history';
                                                    } else if (childItem.current === 'medicine-vendors.analytics') {
                                                        isChildActive = currentRouteName === 'medicine-vendors.analytics' ||
                                                            window.location.pathname === '/medicine-vendors/reports/analytics';
                                                    } else {
                                                        // For medicine-corner routes
                                                        isChildActive = window.location.pathname === childItem.href ||
                                                            currentRouteName === childItem.current;
                                                    }

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

                                // OpticsCorner with dropdown
                                if (isOpticsCorner) {
                                    const opticsCornerActive = isOpticsCornerActive();
                                    const anyChildActive = isOpticsCornerChildActive();
                                    const shouldShowAsActive = opticsCornerActive || anyChildActive;

                                    return (
                                        <div key={item.name}>
                                            <button
                                                onClick={() => setOpticsCornerOpen(!opticsCornerOpen)}
                                                className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${shouldShowAsActive
                                                    ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                    }`}
                                            >
                                                <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${shouldShowAsActive ? 'text-indigo-700' : 'text-gray-400 group-hover:text-gray-500'
                                                    }`} />
                                                <span className="flex-1 text-left">{item.name}</span>
                                                <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${opticsCornerOpen || anyChildActive ? 'rotate-90' : ''
                                                    } ${shouldShowAsActive ? 'text-indigo-700' : 'text-gray-400'}`} />
                                            </button>

                                            {/* OpticsCorner Dropdown Items */}
                                            <div className={`mt-1 space-y-1 transition-all duration-200 overflow-hidden ${opticsCornerOpen || anyChildActive ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                                }`}>
                                                {item.children?.map((childItem) => {
                                                    const ChildIcon = childItem.icon;
                                                    let isChildActive = false;

                                                    if (childItem.current === 'optics.dashboard') {
                                                        isChildActive = currentRouteName === 'optics.dashboard' ||
                                                            window.location.pathname === '/optics' ||
                                                            window.location.pathname === '/optics/';
                                                    } else if (childItem.current === 'optics.frames') {
                                                        isChildActive = currentRouteName?.startsWith('optics.frames') ||
                                                            window.location.pathname.startsWith('/optics/frames');
                                                    } else if (childItem.current === 'optics.stock') {
                                                        isChildActive = currentRouteName?.startsWith('optics.stock') ||
                                                            window.location.pathname.startsWith('/optics/stock');
                                                    } else if (childItem.current === 'optics.purchases') {
                                                        isChildActive = currentRouteName?.startsWith('optics.purchases') ||
                                                            window.location.pathname.startsWith('/optics/purchases');
                                                    } else if (childItem.current === 'optics.vendors') {
                                                        isChildActive = currentRouteName?.startsWith('optics.vendors') ||
                                                            window.location.pathname.startsWith('/optics/vendors');
                                                    } else if (childItem.current === 'optics.sales') {
                                                        isChildActive = currentRouteName?.startsWith('optics.sales') ||
                                                            window.location.pathname.startsWith('/optics/sales');
                                                    } else if (childItem.current === 'optics.lens-types') {
                                                        isChildActive = currentRouteName === 'optics.lens-types' ||
                                                            window.location.pathname === '/optics/lens-types';
                                                    } else if (childItem.current === 'optics.account') {
                                                        isChildActive = currentRouteName === 'optics.account' ||
                                                            window.location.pathname === '/optics/account';
                                                    } else if (childItem.current === 'optics.reports') {
                                                        isChildActive = currentRouteName === 'optics.reports' ||
                                                            window.location.pathname === '/optics/reports';
                                                    }

                                                    return (
                                                        <Link
                                                            key={childItem.name}
                                                            href={childItem.href}
                                                            className={`group flex items-center pl-11 pr-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isChildActive
                                                                ? 'bg-indigo-100 text-indigo-800 border-r-2 border-indigo-600'
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                }`}
                                                        >
                                                            <ChildIcon className={`flex-shrink-0 h-4 w-4 mr-2 ${isChildActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                                                                }`} />
                                                            <span>{childItem.name}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }


                                if (isMedicalTests) {
                                    const medicalTestsActive = isMedicalTestsActive();
                                    const anyChildActive = isMedicalTestsChildActive();
                                    const shouldShowAsActive = medicalTestsActive || anyChildActive;

                                    return (
                                        <div key={item.name}>
                                            <button
                                                onClick={() => setMedicalTestsOpen(!medicalTestsOpen)}
                                                className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${shouldShowAsActive
                                                    ? 'bg-teal-50 text-teal-700 border-r-2 border-teal-700'
                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                    }`}
                                            >
                                                <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${shouldShowAsActive ? 'text-teal-700' : 'text-gray-400 group-hover:text-gray-500'
                                                    }`} />
                                                <span className="flex-1 text-left">{item.name}</span>
                                                <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${medicalTestsOpen || anyChildActive ? 'rotate-90' : ''
                                                    } ${shouldShowAsActive ? 'text-teal-700' : 'text-gray-400'}`} />
                                            </button>

                                            {/* Medical Tests Dropdown Items */}
                                            <div className={`mt-1 space-y-1 transition-all duration-200 overflow-hidden ${medicalTestsOpen || anyChildActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                }`}>
                                                {item.children?.map((childItem) => {
                                                    // Filter children based on role
                                                    if (!hasRole(childItem.roles)) {
                                                        return null;
                                                    }

                                                    const ChildIcon = childItem.icon;
                                                    const isChildActive = currentRouteName === childItem.current ||
                                                        currentRouteName?.startsWith(childItem.current.replace('.*', '')) ||
                                                        window.location.pathname === childItem.href ||
                                                        window.location.pathname.startsWith(childItem.href);

                                                    return (
                                                        <Link
                                                            key={childItem.name}
                                                            href={childItem.href}
                                                            className={`group flex items-center pl-11 pr-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isChildActive
                                                                ? 'bg-teal-100 text-teal-800 border-r-2 border-teal-600'
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                }`}
                                                        >
                                                            <ChildIcon className={`flex-shrink-0 h-4 w-4 mr-2 ${isChildActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-500'
                                                                }`} />
                                                            <span>{childItem.name}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }

                                // Account Section with dropdown
                                if (isAccountSection) {
                                    const accountSectionActive = isAccountSectionActive();
                                    const anyAccountChildActive = isAccountSectionChildActive();
                                    const shouldShowAsActive = accountSectionActive || anyAccountChildActive;

                                    return (
                                        <div key={item.name}>
                                            <button
                                                onClick={() => setAccountSectionOpen(!accountSectionOpen)}
                                                className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${shouldShowAsActive
                                                    ? 'bg-emerald-50 text-emerald-700 border-r-2 border-emerald-700'
                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                    }`}
                                            >
                                                <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${shouldShowAsActive ? 'text-emerald-700' : 'text-gray-400 group-hover:text-gray-500'
                                                    }`} />
                                                <span className="flex-1 text-left">{item.name}</span>
                                                <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${accountSectionOpen || anyAccountChildActive ? 'rotate-90' : ''
                                                    } ${shouldShowAsActive ? 'text-emerald-700' : 'text-gray-400'}`} />
                                            </button>

                                            {/* Account Dropdown Items */}
                                            <div className={`mt-1 space-y-1 transition-all duration-200 overflow-hidden ${accountSectionOpen || anyAccountChildActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                {item.children?.map((childItem) => {
                                                    const ChildIcon = childItem.icon;
                                                    let isChildActive = false;

                                                    // Special handling for main-account routes
                                                    if (childItem.current === 'main-account.*') {
                                                        isChildActive = currentRouteName?.startsWith('main-account') ||
                                                            window.location.pathname.startsWith('/main-account');
                                                    } else {
                                                        // For other account routes
                                                        isChildActive = window.location.pathname.startsWith(childItem.href) ||
                                                            currentRouteName?.startsWith(childItem.current.replace('.*', ''));
                                                    }

                                                    return (
                                                        <Link
                                                            key={childItem.name}
                                                            href={childItem.href}
                                                            className={`group flex items-center pl-11 pr-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isChildActive
                                                                ? 'bg-emerald-100 text-emerald-800 border-r-2 border-emerald-600'
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                }`}
                                                        >
                                                            <ChildIcon className={`flex-shrink-0 h-4 w-4 mr-2 ${isChildActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
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
                            <>
                                <Link
                                    href={route('patients.create')}
                                    className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Patient
                                </Link>
                                <Link
                                    href={route('medical-tests.create')}
                                    className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-medium rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-sm"
                                >
                                    <Activity className="h-4 w-4 mr-2" />
                                    Book Test
                                </Link>
                            </>
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
                        {userRole === 'Optics Seller' && (
                            <Link
                                href={route('optics-seller.pos')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-sm"
                            >
                                <Glasses className="h-4 w-4 mr-2" />
                                Optics Sale
                            </Link>
                        )}
                        {userRole === 'Super Admin' && (
                            <div className="space-y-2">
                                <Link
                                    href="/medicine-corner/purchase"
                                    className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-sm"
                                >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Medicine Purchase
                                </Link>

                                <Link
                                    href={route('medicine-vendors.index')}
                                    className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
                                >
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Manage Vendors
                                </Link>

                                <Link
                                    href="/optics/frames/create"
                                    className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-sm"
                                >
                                    <Glasses className="h-4 w-4 mr-2" />
                                    Add Frame
                                </Link>
                            </div>
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
