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
    Receipt,
    Scissors,
    Clock
} from 'lucide-react';
import FlashMessages from '@/components/FlashMessage';

interface PageProps {
    [key: string]: any;
    auth: {
        user: {
            name: string;
            email: string;
            role: {
                name: string;
            };
            permissions?: string[];
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
    const [operationsOpen, setOperationsOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(false);

    const userRole = auth.user.role.name;
    const userPermissions = auth.user.permissions || [];

    // Debug: Log permissions to console
    React.useEffect(() => {
        console.log('🔐 User Permissions Debug:', {
            role: userRole,
            totalPermissions: userPermissions.length,
            permissions: userPermissions,
            hasWildcard: userPermissions.includes('*')
        });
    }, [userRole, userPermissions]);

    // Permission check helper
    const hasPermission = (permission: string): boolean => {
        // Super Admin has all permissions (indicated by wildcard)
        if (userPermissions.includes('*')) return true;
        const result = userPermissions.includes(permission);
        // Debug specific permission checks
        if (!result && typeof window !== 'undefined') {
            console.log(`❌ Permission denied: ${permission}`);
        }
        return result;
    };

    // Check any permission
    const hasAnyPermission = (permissions: string[]): boolean => {
        if (userPermissions.includes('*')) return true;
        return permissions.some(permission => userPermissions.includes(permission));
    };

    // Role checking helper - Fixed to show only specific role permissions
    const hasRole = (allowedRoles: string[]) => {
        return allowedRoles.includes(userRole);
    };

    // Special helper for Super Admin permissions
    const isSuperAdmin = () => {
        return userRole === 'Super Admin';
    };

    // ========================================
    // 🎯 SUPER ADMIN NAVIGATION HIDE CONFIG
    // ========================================
    // Ekhane list korben je navigation Super Admin er jonno HIDE korte chan
    // Example: ['Patients', 'Appointments', 'Vision Tests']
    // Empty array rakhle kono navigation hide hobe na
    const hiddenNavigationsForSuperAdmin: string[] = [
        // 'Dashboard',           // ❌ Hide korle Dashboard dekhabe na
        // 'Patients',            // ❌ Hide korle Patients dekhabe na
        // 'Patient Visits',      // ❌ Hide korle Patient Visits dekhabe na
        // 'Pending Visits',      // ❌ Hide korle Pending Visits dekhabe na
        'Appointments',        // ❌ Hide korle Appointments dekhabe na
        // 'Vision Tests',        // ❌ Hide korle Vision Tests dekhabe na
        'POS System',          // ❌ Hide korle Medicine POS dekhabe na
        'Sales History',         // ❌ Hide korle Medicine Sales History dekhabe na
        'My Reports',          // ❌ Hide korle Medicine Reports dekhabe na
        'Optics POS',          // ❌ Hide korle Optics POS dekhabe na
        'Optics Sales',        // ❌ Hide korle Optics Sales dekhabe na
        'Optics Reports',      // ❌ Hide korle Optics Reports dekhabe na
        // 'Medicine Corner',     // ❌ Hide korle puro Medicine Corner dekhabe na
        // 'Optics Corner',       // ❌ Hide korle puro Optics Corner dekhabe na
        // 'Medical Tests',       // ❌ Hide korle puro Medical Tests section dekhabe na
        // 'Operations',          // ❌ Hide korle puro Operations section dekhabe na
        // 'Accounts and Report',  // ❌ Hide korle puro Accounts and Report section dekhabe na
    ];

    // Admin section navigation hide config
    const hiddenAdminNavigationsForSuperAdmin: string[] = [
        // 'Roles & Permissions', // ❌ Hide korle Roles & Permissions dekhabe na
        // 'Doctors',             // ❌ Hide korle Doctors dekhabe na
        // 'Users',               // ❌ Hide korle Users dekhabe na
        // 'Medicines',           // ❌ Hide korle Medicines dekhabe na
        // 'Reports',             // ❌ Hide korle Reports dekhabe na
    ];

    // Quick Actions hide config for Super Admin
    const hiddenQuickActionsForSuperAdmin: string[] = [
        // 'Add Patient',        // ❌ Hide korle Add Patient button dekhabe na
        // 'Book Test',          // ❌ Hide korle Book Test button dekhabe na
        // 'Book Operation',     // ❌ Hide korle Book Operation button dekhabe na
        'Quick Sale',         // ❌ Hide korle Quick Sale (Medicine) button dekhabe na
        'Optics Sale',        // ❌ Hide korle Optics Sale button dekhabe na
        // 'Add User',           // ❌ Hide korle Add User button dekhabe na
    ];

    // Helper function to check if navigation should be visible for Super Admin
    const shouldShowNavigationForSuperAdmin = (navigationName: string): boolean => {
        // Jodi Super Admin na hoy, tahole always show korbe
        if (!isSuperAdmin()) return true;

        // Jodi Super Admin hoy, tahole check korbe hidden list e ache kina
        return !hiddenNavigationsForSuperAdmin.includes(navigationName);
    };

    // Helper function for admin section
    const shouldShowAdminNavigationForSuperAdmin = (navigationName: string): boolean => {
        // Jodi Super Admin na hoy, tahole always show korbe
        if (!isSuperAdmin()) return true;

        // Jodi Super Admin hoy, tahole check korbe hidden list e ache kina
        return !hiddenAdminNavigationsForSuperAdmin.includes(navigationName);
    };

    // Helper function for quick actions
    const shouldShowQuickActionForSuperAdmin = (actionName: string): boolean => {
        // Jodi Super Admin na hoy, tahole always show korbe
        if (!isSuperAdmin()) return true;

        // Jodi Super Admin hoy, tahole check korbe hidden list e ache kina
        return !hiddenQuickActionsForSuperAdmin.includes(actionName);
    };

    // Dashboard route helper based on permissions (not role)
    const getDashboardRoute = () => {
        // Permission-based dashboard routing
        // Priority order: Check Admin first, then specific roles

        // 1. Check for Super Admin permission FIRST (wildcard or explicit admin dashboard permission)
        // Super Admin should ALWAYS go to Admin Dashboard
        if (hasPermission('admin.dashboard') || userPermissions.includes('*')) {
            return 'dashboard';
        }

        // 2. Check for Doctor permissions
        if (hasPermission('dashboard.doctor')) {
            return 'doctor.dashboard';
        }

        // 3. Check for Receptionist permissions
        if (hasPermission('dashboard.receptionist')) {
            return 'receptionist.dashboard';
        }

        // 4. Check for Refractionist permissions
        if (hasPermission('dashboard.refractionist')) {
            return 'refractionist.dashboard';
        }

        // 5. Check for Medicine Seller permissions
        if (hasPermission('dashboard.medicine-seller')) {
            return 'medicine-seller.dashboard';
        }

        // 6. Check for Optics Seller permissions
        if (hasPermission('dashboard.optics-seller')) {
            return 'optics-seller.dashboard';
        }

        // 7. Fallback to default dashboard
        return 'dashboard';
    };    // Get current route name
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

        // For patients.index - EXACT match only
        if (currentPattern === 'patients.index') {
            return currentRouteName === 'patients.index' ||
                currentRouteName === 'patients.show' ||
                currentRouteName === 'patients.edit' ||
                currentRouteName === 'patients.create';
        }

        // For visits.* - EXACT match for visit routes
        if (currentPattern === 'visits.*') {
            return currentRouteName?.startsWith('visits.') ||
                window.location.pathname.startsWith('/visits');
        }

        // For patients.pending-visits - EXACT match only
        if (currentPattern === 'patients.pending-visits') {
            return currentRouteName === 'patients.pending-visits';
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

        // For operations and operation bookings
        if (currentPattern === 'operations.*') {
            return currentRouteName?.includes('operations') ||
                currentRouteName?.includes('operation-bookings') ||
                window.location.pathname.includes('/operations') ||
                window.location.pathname.includes('/operation-bookings');
        }

        // For reports section
        if (currentPattern === 'reports.*') {
            return window.location.pathname.includes('/reports') ||
                window.location.pathname.includes('/medicine/reports') ||
                window.location.pathname.includes('/optics/reports') ||
                window.location.pathname.includes('/hospital-account/reports') ||
                window.location.pathname.includes('/operation-account/reports');
        }

        // For account sections
        if (currentPattern === 'account.*') {
            return currentRouteName?.includes('main-account') ||
                currentRouteName?.includes('hospital-account') ||
                currentRouteName?.includes('medicine-account') ||
                currentRouteName?.includes('optics-account') ||
                currentRouteName?.includes('operation-account') ||
                window.location.pathname.includes('/main-account') ||
                window.location.pathname.includes('/hospital-account') ||
                window.location.pathname.includes('/medicine-account') ||
                window.location.pathname.includes('/optics-account') ||
                window.location.pathname.includes('/operation-account') ||
                window.location.pathname.includes('/medicine/reports/') ||
                window.location.pathname.includes('/optics/reports/') ||
                window.location.pathname.includes('/reports/income-expenditure') ||
                window.location.pathname.includes('/reports/receipt-payment');
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

    // Check if operations section is active
    const isOperationsActive = () => {
        return currentRouteName?.includes('operations') ||
            currentRouteName?.includes('operation-bookings') ||
            window.location.pathname.includes('/operations') ||
            window.location.pathname.includes('/operation-bookings');
    };

    // Check if any operations child is active
    const isOperationsChildActive = () => {
        const operationPaths = [
            '/operations',
            '/operation-bookings'
        ];
        return operationPaths.some(path => window.location.pathname.startsWith(path));
    };

    // Check if account section is active
    const isAccountSectionActive = () => {
        return currentRouteName?.includes('main-account') ||
            currentRouteName?.includes('hospital-account') ||
            currentRouteName?.includes('medicine-account') ||
            currentRouteName?.includes('optics-account') ||
            currentRouteName?.includes('operation-account') ||
            window.location.pathname.includes('/main-account') ||
            window.location.pathname.includes('/hospital-account') ||
            window.location.pathname.includes('/medicine-account') ||
            window.location.pathname.includes('/optics-account') ||
            window.location.pathname.includes('/operation-account') ||
            window.location.pathname.includes('/medicine/reports/') ||
            window.location.pathname.includes('/optics/reports/') ||
            window.location.pathname.includes('/reports/income-expenditure') ||
            window.location.pathname.includes('/reports/receipt-payment');
    };

    // Check if any account section child is active
    const isAccountSectionChildActive = () => {
        const accountPaths = [
            '/main-account',
            '/hospital-account',
            '/medicine-account',
            '/optics-account',
            '/operation-account',
            '/medicine/reports/',
            '/optics/reports/',
            '/reports/income-expenditure',
            '/reports/receipt-payment'
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

    // Navigation items with permission-based access - NO ROLE FILTERING
    const navigationItems: NavItem[] = [
        {
            name: 'Dashboard',
            href: route(getDashboardRoute()),
            icon: Home,
            current: 'dashboard',
            roles: [] // Empty - show to everyone with dashboard permission
        },
        // Patients - Check permission ONLY
        ...(hasPermission('patients.view') ? [{
            name: 'Patients',
            href: route('patients.index'),
            icon: Users,
            current: 'patients.index',
            roles: [] // Empty - show to anyone with patients.view permission
        }] : []),
        // Visits - Check permission ONLY
        ...(hasPermission('visits.view') ? [{
            name: 'Patient Visits',
            href: route('visits.index'),
            icon: Receipt,
            current: 'visits.*',
            roles: [] // Empty - show to anyone with visits.view permission
        }] : []),
        ...(hasPermission('visits.view') ? [{
            name: 'Pending Visits',
            href: route('patients.pending-visits'),
            icon: LucideWaypoints,
            current: 'patients.pending-visits',
            roles: [] // Empty - show to anyone with visits.view permission
        }] : []),

        // Appointments - Check permission ONLY
        ...(hasPermission('appointments.view') ? [{
            name: 'Appointments',
            href: route('appointments.index'),
            icon: Calendar,
            current: 'appointments.*',
            roles: [] // Empty - show to anyone with appointments.view permission
        }] : []),

        // Vision Tests - Check permission ONLY (for Refractionist or anyone with permission)
        ...(hasPermission('vision-tests.view') ? [{
            name: 'Vision Tests',
            href: route('visiontests.index'),
            icon: Eye,
            current: 'visiontests.*',
            roles: [] // Empty - show to anyone with vision-tests.view permission
        }] : []),

        // Medicine Seller - Permission-based ONLY
        ...(hasPermission('medicine-seller.pos') ? [{
            name: 'POS System',
            href: route('medicine-seller.pos'),
            icon: CreditCard,
            current: 'medicine-seller.pos',
            roles: [] // Empty - show to anyone with medicine-seller.pos permission
        }] : []),
        ...(hasPermission('medicine-seller.sales') ? [{
            name: 'Sales History',
            href: route('medicine-seller.sales'),
            icon: History,
            current: 'medicine-seller.sales',
            roles: [] // Empty - show to anyone with medicine-seller.sales permission
        }] : []),
        ...(hasPermission('medicine-seller.reports') ? [{
            name: 'My Reports',
            href: route('medicine-seller.report'),
            icon: FileBarChart,
            current: 'medicine-seller.report',
            roles: [] // Empty - show to anyone with medicine-seller.reports permission
        }] : []),
        // Optics Seller - Permission-based ONLY
        ...(hasPermission('optics-seller.pos') ? [{
            name: 'Optics POS',
            href: route('optics-seller.pos'),
            icon: Glasses,
            current: 'optics-seller.pos',
            roles: [] // Empty - show to anyone with optics-seller.pos permission
        }] : []),
        ...(hasPermission('optics-seller.sales') ? [{
            name: 'Optics Sales',
            href: route('optics-seller.sales'),
            icon: ShoppingBag,
            current: 'optics-seller.sales',
            roles: [] // Empty - show to anyone with optics-seller.sales permission
        }] : []),
        ...(hasPermission('optics-seller.reports') ? [{
            name: 'Optics Reports',
            href: route('optics-seller.report'),
            icon: BarChart3,
            current: 'optics-seller.report',
            roles: [] // Empty - show to anyone with optics-seller.reports permission
        }] : []),
        // Medicine Corner - Permission-based dropdown - NO ROLE CHECK
        ...(hasAnyPermission(['medicine-corner.view', 'medicine-corner.stock', 'medicine-corner.purchase', 'medicine-corner.sales', 'medicine-corner.vendors', 'medicine-corner.reports']) ? [{
            name: 'Medicine Corner',
            href: '#',
            icon: Pill,
            current: 'medicine.*',
            roles: [], // Empty - show to anyone with any medicine corner permission
            children: [
                ...(hasPermission('medicine-corner.view') ? [{
                    name: 'Dashboard',
                    href: route('medicine-corner.dashboard'),
                    icon: Home,
                    current: 'medicine-corner.dashboard',
                    roles: [] // Empty - only show if has explicit dashboard permission
                }] : []),
                ...(hasPermission('medicine-corner.stock') ? [{
                    name: 'Stock Management',
                    href: '/medicine-corner/stock',
                    icon: Package,
                    current: 'medicine-corner.stock',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('medicine-corner.view') ? [{
                    name: 'Medicine List',
                    href: '/medicine-corner/medicines',
                    icon: Pill,
                    current: 'medicine-corner.medicines',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('medicine-corner.purchase') ? [{
                    name: 'Purchase Entry',
                    href: '/medicine-corner/purchase',
                    icon: ShoppingCart,
                    current: 'medicine-corner.purchase',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('medicine-corner.sales') ? [{
                    name: 'Sales Management',
                    href: '/medicine-corner/sales',
                    icon: ShoppingBag,
                    current: 'medicine-corner.sales',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('medicine-corner.vendors') ? [
                    {
                        name: 'Vendor Management',
                        href: route('medicine-vendors.index'),
                        icon: Building2,
                        current: 'medicine-vendors.index',
                        roles: [] // Empty
                    },
                    {
                        name: 'Vendor Dues',
                        href: route('medicine-vendors.due-report'),
                        icon: AlertTriangle,
                        current: 'medicine-vendors.due-report',
                        roles: [] // Empty
                    },
                    {
                        name: 'Payment History',
                        href: route('medicine-vendors.payment-history'),
                        icon: History,
                        current: 'medicine-vendors.payment-history',
                        roles: [] // Empty
                    },
                    {
                        name: 'Vendor Analytics',
                        href: route('medicine-vendors.analytics'),
                        icon: BarChart3,
                        current: 'medicine-vendors.analytics',
                        roles: [] // Empty
                    }
                ] : []),
                ...(hasPermission('medicine-corner.reports') ? [{
                    name: 'Reports',
                    href: '/medicine-corner/reports',
                    icon: FileBarChart,
                    current: 'medicine-corner.reports',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('medicine-corner.stock') ? [{
                    name: 'Alerts',
                    href: '/medicine-corner/alerts',
                    icon: AlertTriangle,
                    current: 'medicine-corner.alerts',
                    roles: [] // Empty
                }] : [])
            ].filter(child => child)
        }] : []),

        ...(hasAnyPermission(['optics.view', 'optics.frames', 'optics.stock', 'optics.purchases', 'optics.vendors', 'optics.sales', 'optics.lens-types']) ? [{
            name: 'Optics Corner',
            href: '#',
            icon: Glasses,
            current: 'optics.*',
            roles: [], // Empty - show to anyone with any optics permission
            children: [
                ...(hasPermission('optics.view') ? [{
                    name: 'Dashboard',
                    href: route('optics.dashboard'),
                    icon: Home,
                    current: 'optics.dashboard',
                    roles: [] // Empty - only show if has explicit dashboard permission
                }] : []),
                ...(hasPermission('optics.frames') ? [{
                    name: 'Frames Management',
                    href: route('optics.frames'),
                    icon: Glasses,
                    current: 'optics.frames',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('optics.stock') ? [{
                    name: 'Stock Management',
                    href: route('optics.stock'),
                    icon: Package,
                    current: 'optics.stock',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('optics.purchases') ? [{
                    name: 'Purchase Entry',
                    href: route('optics.purchases.index'),
                    icon: ShoppingCart,
                    current: 'optics.purchases',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('optics.vendors') ? [{
                    name: 'Vendors Management',
                    href: route('optics.vendors.index'),
                    icon: Truck,
                    current: 'optics.vendors',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('optics.sales') ? [{
                    name: 'Sales Management',
                    href: route('optics.sales'),
                    icon: ShoppingBag,
                    current: 'optics.sales',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('optics.lens-types') ? [{
                    name: 'Lens Types',
                    href: route('optics.lens-types'),
                    icon: Eye,
                    current: 'optics.lens-types',
                    roles: [] // Empty
                }] : [])
            ].filter(child => child)
        }] : []),

        ...(hasAnyPermission(['medical-tests.view', 'medical-tests.create']) ? [{
            name: 'Medical Tests',
            href: '#',
            icon: Activity,
            current: 'medical-tests.*',
            roles: [], // Empty - show to anyone with medical test permissions
            children: [
                ...(hasPermission('medical-tests.manage-tests') ? [{
                    name: 'Test Management',
                    href: route('medical-tests.tests.index'),
                    icon: Settings,
                    current: 'medical-tests.tests.*',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('medical-tests.create') ? [{
                    name: 'Book Tests',
                    href: route('medical-tests.index'),
                    icon: CalendarDays,
                    current: 'medical-tests.index',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('medical-tests.reports') ? [
                    {
                        name: 'Daily Reports',
                        href: route('medical-tests.reports.daily'),
                        icon: FileBarChart,
                        current: 'medical-tests.reports.daily',
                        roles: [] // Empty
                    },
                    {
                        name: 'Monthly Reports',
                        href: route('medical-tests.reports.monthly'),
                        icon: BarChart3,
                        current: 'medical-tests.reports.monthly',
                        roles: [] // Empty
                    },
                    {
                        name: 'Test-wise Reports',
                        href: route('medical-tests.reports.test-wise'),
                        icon: Activity,
                        current: 'medical-tests.reports.test-wise',
                        roles: [] // Empty
                    }
                ] : [])
            ].filter(child => child)
        }] : []),

        ...(hasAnyPermission(['operations.view', 'operation-bookings.view']) ? [{
            name: 'Operations',
            href: '#',
            icon: Scissors,
            current: 'operations.*',
            roles: [], // Empty - show to anyone with operations permissions
            children: [
                ...(hasPermission('operations.view') ? [{
                    name: 'Operation Types',
                    href: route('operations.index'),
                    icon: Scissors,
                    current: 'operations.index',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('operation-bookings.view') ? [
                    {
                        name: 'All Bookings',
                        href: route('operation-bookings.index'),
                        icon: Calendar,
                        current: 'operation-bookings.index',
                        roles: [] // Empty
                    },
                    {
                        name: "Today's Operations",
                        href: route('operation-bookings.today'),
                        icon: Clock,
                        current: 'operation-bookings.today',
                        roles: [] // Empty
                    }
                ] : [])
            ].filter(child => child)
        }] : []),

        // Reports Section - Main nav with dropdown
        ...(hasAnyPermission([
            'medicine.reports.buy-sale-stock',
            'optics.reports.buy-sale-stock',
            'hospital.reports.medical-test-income',
            'hospital.reports.new-patient-income',
            'hospital.reports.followup-patient-income',
            'operation.reports.income',
            'reports.receipt-payment',
            'reports.income-expenditure',
            'reports.balance-sheet'
        ]) ? [{
            name: 'Reports',
            href: '#',
            icon: FileBarChart,
            current: 'reports.*',
            roles: [], // Empty - show to anyone with report permissions
            children: [
                ...(hasPermission('medicine.reports.buy-sale-stock') ? [{
                    name: 'Medicine Buy Sale Stock',
                    href: '/medicine/reports/buy-sale-stock',
                    icon: Pill,
                    current: 'medicine.reports.buy-sale-stock',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('optics.reports.buy-sale-stock') ? [{
                    name: 'Optics Buy Sale Stock',
                    href: '/optics/reports/buy-sale-stock',
                    icon: Glasses,
                    current: 'optics.reports.buy-sale-stock',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('hospital.reports.medical-test-income') ? [{
                    name: 'Medical Test Income',
                    href: '/hospital-account/reports/medical-test-income',
                    icon: Activity,
                    current: 'reports.medical-test-income',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('hospital.reports.new-patient-income') ? [{
                    name: 'New Patient Income',
                    href: '/hospital-account/reports/new-patient-income',
                    icon: Users,
                    current: 'reports.new-patient-income',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('hospital.reports.followup-patient-income') ? [{
                    name: 'Followup Patient Income',
                    href: '/hospital-account/reports/followup-patient-income',
                    icon: Users,
                    current: 'reports.followup-patient-income',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('operation.reports.income') ? [{
                    name: 'Operation Income',
                    href: '/operation-account/reports/operation-income',
                    icon: Scissors,
                    current: 'operation-account.reports.operation-income',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('reports.receipt-payment') ? [{
                    name: 'Receipt & Payment',
                    href: '/reports/receipt-payment',
                    icon: Receipt,
                    current: 'reports.receipt-payment',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('reports.income-expenditure') ? [{
                    name: 'Income & Expenditure',
                    href: '/reports/income-expenditure',
                    icon: DollarSign,
                    current: 'reports.income-expenditure',
                    roles: [] // Empty
                }] : []),
                ...(hasPermission('reports.balance-sheet') ? [{
                    name: 'Balance Sheet',
                    href: '/reports/balance-sheet',
                    icon: Calculator,
                    current: 'reports.balance-sheet',
                    roles: [] // Empty
                }] : [])
            ].filter(child => child)
        }] : []),

        // Accounts Section - Hospital Account only
        ...(hasPermission('hospital-account.view') ? [{
            name: 'Accounts',
            href: '#',
            icon: Building2,
            current: 'account.*',
            roles: [], // Empty - show to anyone with account permissions
            children: [
                ...(hasPermission('hospital-account.view') ? [{
                    name: 'Hospital Account',
                    href: '/hospital-account',
                    icon: Building2,
                    current: 'hospital-account.*',
                    roles: [] // Empty
                }] : [])
            ].filter(child => child)
        }] : [])
    ].filter(item => item);

    // Admin navigation with permission check - NO ROLE FILTERING
    const adminNavigation: NavItem[] = [
        ...(hasPermission('roles.view') ? [{
            name: 'Roles & Permissions',
            href: route('roles.index'),
            icon: Shield,
            current: 'roles.*',
            roles: [] // Empty - show to anyone with roles.view permission
        }] : []),
        ...(hasPermission('doctors.view') ? [{
            name: 'Doctors',
            href: route('doctors.index'),
            icon: Stethoscope,
            current: 'doctors.*',
            roles: [] // Empty - show to anyone with doctors.view permission
        }] : []),
        ...(hasPermission('users.view') ? [{
            name: 'Users',
            href: route('users.index'),
            icon: UserPlus,
            current: 'users.*',
            roles: [] // Empty - show to anyone with users.view permission
        }] : []),
        ...(hasPermission('medicines.view') ? [{
            name: 'Medicines',
            href: route('medicines.index'),
            icon: Pill,
            current: 'medicines.*',
            roles: [] // Empty - show to anyone with medicines.view permission
        }] : []),
        ...(hasPermission('reports.view') ? [{
            name: 'Reports',
            href: route('reports.index'),
            icon: Proportions,
            current: 'reports.*',
            roles: [] // Empty - show to anyone with reports.view permission
        }] : [])
    ].filter(item => item);

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
                            {navigationItems
                                // 🎯 Filter for Super Admin hidden navigations
                                .filter(item => shouldShowNavigationForSuperAdmin(item.name))
                                .map((item) => {
                                    // ✅ PERMISSION-BASED ONLY - NO ROLE FILTERING
                                    // Navigation items are already filtered by permissions when creating the array
                                    // So we just render them directly without any role check

                                    const Icon = item.icon;
                                    const isActive = isRouteActive(item.current);
                                    const isMedicineCorner = item.name === 'Medicine Corner';
                                    const isOpticsCorner = item.name === 'Optics Corner';
                                    const isAccountSection = item.name === 'Accounts';
                                    const isMedicalTests = item.name === 'Medical Tests';
                                    const isOperations = item.name === 'Operations';
                                    const isReportsSection = item.name === 'Reports';

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
                                                        // No role filtering here - permission check already done at parent level

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

                                    // Operations Section with dropdown
                                    if (isOperations) {
                                        const operationsActive = isOperationsActive();
                                        const anyChildActive = isOperationsChildActive();
                                        const shouldShowAsActive = operationsActive || anyChildActive;

                                        return (
                                            <div key={item.name}>
                                                <button
                                                    onClick={() => setOperationsOpen(!operationsOpen)}
                                                    className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${shouldShowAsActive
                                                        ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-700'
                                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${shouldShowAsActive ? 'text-purple-700' : 'text-gray-400 group-hover:text-gray-500'
                                                        }`} />
                                                    <span className="flex-1 text-left">{item.name}</span>
                                                    <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${operationsOpen || anyChildActive ? 'rotate-90' : ''
                                                        } ${shouldShowAsActive ? 'text-purple-700' : 'text-gray-400'}`} />
                                                </button>

                                                {/* Operations Dropdown Items */}
                                                <div className={`mt-1 space-y-1 transition-all duration-200 overflow-hidden ${operationsOpen || anyChildActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                    }`}>
                                                    {item.children?.map((childItem) => {
                                                        const ChildIcon = childItem.icon;
                                                        let isChildActive = false;

                                                        if (childItem.current === 'operations.index') {
                                                            isChildActive = !!(currentRouteName === 'operations.index' ||
                                                                currentRouteName?.startsWith('operations.') ||
                                                                (window.location.pathname === '/operations' && !window.location.pathname.includes('operation-bookings')));
                                                        } else if (childItem.current === 'operation-bookings.today') {
                                                            // Check Today's Operations FIRST (more specific)
                                                            isChildActive = !!(currentRouteName === 'operation-bookings.today' ||
                                                                window.location.pathname === '/operation-bookings/today');
                                                        } else if (childItem.current === 'operation-bookings.index') {
                                                            // Check All Bookings (excluding today)
                                                            isChildActive = !!(
                                                                (currentRouteName === 'operation-bookings.index' ||
                                                                    (currentRouteName?.startsWith('operation-bookings.') && currentRouteName !== 'operation-bookings.today')) &&
                                                                window.location.pathname !== '/operation-bookings/today'
                                                            );
                                                        }

                                                        return (
                                                            <Link
                                                                key={childItem.name}
                                                                href={childItem.href}
                                                                className={`group flex items-center pl-11 pr-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isChildActive
                                                                    ? 'bg-purple-100 text-purple-800 border-r-2 border-purple-600'
                                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                    }`}
                                                            >
                                                                <ChildIcon className={`flex-shrink-0 h-4 w-4 mr-2 ${isChildActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'
                                                                    }`} />
                                                                <span>{childItem.name}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Reports Section with dropdown
                                    if (isReportsSection) {
                                        const reportsActive = window.location.pathname.includes('/reports') ||
                                            window.location.pathname.includes('/medicine/reports') ||
                                            window.location.pathname.includes('/optics/reports') ||
                                            window.location.pathname.includes('/hospital-account/reports') ||
                                            window.location.pathname.includes('/operation-account/reports');
                                        const shouldShowAsActive = reportsActive;

                                        return (
                                            <div key={item.name}>
                                                <button
                                                    onClick={() => setReportsOpen(!reportsOpen)}
                                                    className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${shouldShowAsActive
                                                        ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-700'
                                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${shouldShowAsActive ? 'text-orange-700' : 'text-gray-400 group-hover:text-gray-500'
                                                        }`} />
                                                    <span className="flex-1 text-left">{item.name}</span>
                                                    <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${reportsOpen || reportsActive ? 'rotate-90' : ''
                                                        } ${shouldShowAsActive ? 'text-orange-700' : 'text-gray-400'}`} />
                                                </button>

                                                {/* Reports Dropdown Items */}
                                                <div className={`mt-1 space-y-1 transition-all duration-200 overflow-hidden ${reportsOpen || reportsActive ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                    {item.children?.map((childItem) => {
                                                        const ChildIcon = childItem.icon;
                                                        const isChildActive = window.location.pathname === childItem.href ||
                                                            window.location.pathname.startsWith(childItem.href);

                                                        return (
                                                            <Link
                                                                key={childItem.name}
                                                                href={childItem.href}
                                                                className={`group flex items-center pl-11 pr-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isChildActive
                                                                    ? 'bg-orange-100 text-orange-800 border-r-2 border-orange-600'
                                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                    }`}
                                                            >
                                                                <ChildIcon className={`flex-shrink-0 h-4 w-4 mr-2 ${isChildActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
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
                                                            isChildActive = !!(currentRouteName?.startsWith('main-account') ||
                                                                window.location.pathname.startsWith('/main-account'));
                                                        } else {
                                                            // For other account routes
                                                            isChildActive = !!(childItem.href && window.location.pathname.startsWith(childItem.href)) ||
                                                                !!(currentRouteName?.startsWith(childItem.current.replace('.*', '')));
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

                    {/* Admin Section - Permission-based, NOT role-based */}
                    {adminNavigation.length > 0 && (
                        <div className="px-4 mt-8">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                Administration
                            </p>
                            <nav className="space-y-1">
                                {adminNavigation
                                    // 🎯 Filter for Super Admin hidden navigations
                                    .filter(item => shouldShowAdminNavigationForSuperAdmin(item.name))
                                    .map((item) => {
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

                {/* Quick Actions - Permission-based ONLY */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="space-y-2">
                        {/* Patient Creation - Show to anyone with permission */}
                        {hasPermission('patients.create') && shouldShowQuickActionForSuperAdmin('Add Patient') && (
                            <Link
                                href={route('patients.create')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Patient
                            </Link>
                        )}

                        {/* Medical Test Booking - Show to anyone with permission */}
                        {hasPermission('medical-tests.create') && shouldShowQuickActionForSuperAdmin('Book Test') && (
                            <Link
                                href={route('medical-tests.create')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-medium rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-sm"
                            >
                                <Activity className="h-4 w-4 mr-2" />
                                Book Test
                            </Link>
                        )}

                        {/* Operation Booking - Show to anyone with permission */}
                        {hasPermission('operation-bookings.create') && shouldShowQuickActionForSuperAdmin('Book Operation') && (
                            <Link
                                href={route('operation-bookings.create')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm"
                            >
                                <Scissors className="h-4 w-4 mr-2" />
                                Book Operation
                            </Link>
                        )}

                        {/* Prescription - Only show if user doesn't have patients.create to avoid duplication */}
                        {hasPermission('prescriptions.create') && !hasPermission('patients.create') && (
                            <Link
                                href={route('patients.index')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                New Prescription
                            </Link>
                        )}

                        {/* Vision Test - Only show if user doesn't have patients.create to avoid duplication */}
                        {hasPermission('vision-tests.create') && !hasPermission('patients.create') && (
                            <Link
                                href={route('patients.index')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white text-sm font-medium rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-sm"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Vision Test
                            </Link>
                        )}

                        {/* Medicine POS - Show to anyone with permission */}
                        {hasPermission('medicine-seller.pos') && shouldShowQuickActionForSuperAdmin('Quick Sale') && (
                            <Link
                                href={route('medicine-seller.pos')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-sm"
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Quick Sale
                            </Link>
                        )}

                        {/* Optics POS - Show to anyone with permission */}
                        {hasPermission('optics-seller.pos') && shouldShowQuickActionForSuperAdmin('Optics Sale') && (
                            <Link
                                href={route('optics-seller.pos')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-sm"
                            >
                                <Glasses className="h-4 w-4 mr-2" />
                                Optics Sale
                            </Link>
                        )}

                        {/* User Creation - Show to anyone with permission */}
                        {hasPermission('users.create') && shouldShowQuickActionForSuperAdmin('Add User') && (
                            <Link
                                href={route('users.create')}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-sm"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add User
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
                                                href={route('appearance')}
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

            {/* Print Styles */}
            <style>{`
                @media print {
                    /* Hide sidebar, header, and navigation */
                    .fixed.inset-y-0.left-0,
                    header {
                        display: none !important;
                    }

                    /* Make main content full width */
                    .h-screen.flex {
                        display: block !important;
                        height: auto !important;
                    }

                    main {
                        overflow: visible !important;
                        background: white !important;
                    }

                    main > div {
                        padding: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
