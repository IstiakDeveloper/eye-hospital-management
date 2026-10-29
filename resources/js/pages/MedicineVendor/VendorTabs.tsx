import { Link } from '@inertiajs/react';

const tabs = [
    { id: 'vendors', name: 'Vendors', routeName: 'medicine-vendors.index' },
    { id: 'dues', name: 'Dues', routeName: 'medicine-vendors.due-report' },
    { id: 'payments', name: 'Payments', routeName: 'medicine-vendors.payment-history' },
] as const;

export default function VendorTabs({ current }: { current: 'vendors' | 'dues' | 'payments' | 'analytics' }) {
    return (
        <div className="flex gap-1 border-b border-slate-200">
            {tabs.map((tab) => {
                const active = tab.id === current;

                return (
                    <Link
                        key={tab.id}
                        href={route(tab.routeName)}
                        className={`-mb-px border-b-2 px-3 py-1.5 text-[12px] font-medium ${
                            active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {tab.name}
                    </Link>
                );
            })}
        </div>
    );
}
