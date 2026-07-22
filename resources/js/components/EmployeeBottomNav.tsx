import { Link, usePage } from '@inertiajs/react';
import { Calendar, Clock, Home, MapPin } from 'lucide-react';

export function EmployeeBottomNav() {
    const { url } = usePage();

    const navItems = [
        {
            name: 'Dashboard',
            href: route('employee.dashboard'),
            icon: Home,
            active: url.startsWith('/employee/dashboard') || url === '/employee',
        },
        {
            name: 'Attendance',
            href: route('employee.attendance.index'),
            icon: Clock,
            active: url.startsWith('/employee/attendance'),
        },
        {
            name: 'Leaves',
            href: route('employee.leaves.index'),
            icon: Calendar,
            active: url.startsWith('/employee/leaves'),
        },
        {
            name: 'Movements',
            href: route('employee.movements.index'),
            icon: MapPin,
            active: url.startsWith('/employee/movements'),
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 sm:hidden shadow-lg no-print">
            <div className="grid grid-cols-4 gap-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                                item.active
                                    ? 'text-blue-600 font-extrabold bg-blue-50/80 scale-105'
                                    : 'text-slate-500 font-medium hover:text-slate-800'
                            }`}
                        >
                            <Icon className={`w-5 h-5 mb-0.5 ${item.active ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="text-[10px] tracking-tight">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
