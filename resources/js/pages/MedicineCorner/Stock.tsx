import Pagination from '@/components/ui/pagination';
import AdminLayout from '@/layouts/admin-layout';
import { formatTaka, moneyAmount } from '@/lib/money';
import { Head, router } from '@inertiajs/react';
import { Filter, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Vendor {
    id: number;
    name: string;
    company_name?: string;
}

interface Stock {
    id: number;
    batch_number: string;
    purchase_date?: string | null;
    expiry_date?: string | null;
    quantity: number | string;
    available_quantity: number | string;
    buy_price: number | string | null;
    sale_price: number | string | null;
    due_amount: number | string | null;
    payment_status: 'pending' | 'partial' | 'paid';
    medicine: {
        id: number;
        name: string;
        generic_name?: string;
        unit: string;
    };
    vendor?: Vendor | null;
}

interface PageLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface StockPageProps {
    stocks: {
        data: Stock[];
        links: PageLink[];
        total?: number;
        meta?: {
            total?: number;
        };
    };
    vendors: Vendor[];
    totalStockValue: number | string;
    filters: {
        search?: string | null;
        from_date?: string | null;
        to_date?: string | null;
        vendor_id?: number | string | null;
    };
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date?: string | null): string {
    if (!date) {
        return '—';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, monthNumber, day] = date.split('-');
        const month = months[Number(monthNumber) - 1];

        return month ? `${day} ${month} ${year}` : '—';
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Dhaka',
    }).format(parsed);
}

export default function Stock({ stocks, vendors, totalStockValue, filters }: StockPageProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [fromDate, setFromDate] = useState(filters.from_date ?? '');
    const [toDate, setToDate] = useState(filters.to_date ?? '');
    const [vendorId, setVendorId] = useState(filters.vendor_id ? String(filters.vendor_id) : '');
    const [syncingSalePrices, setSyncingSalePrices] = useState(false);
    const [deletingStockId, setDeletingStockId] = useState<number | null>(null);

    const hasActiveFilters = useMemo(() => {
        return Boolean(search || fromDate || toDate || vendorId);
    }, [search, fromDate, toDate, vendorId]);

    const batchCount = stocks.meta?.total ?? stocks.total ?? stocks.data.length;

    const applyFilters = () => {
        const params: Record<string, string> = {};
        if (search) {
            params.search = search;
        }
        if (fromDate) {
            params.from_date = fromDate;
        }
        if (toDate) {
            params.to_date = toDate;
        }
        if (vendorId) {
            params.vendor_id = vendorId;
        }

        router.get(route('medicine-corner.stock'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setFromDate('');
        setToDate('');
        setVendorId('');

        router.get(route('medicine-corner.stock'), {}, { preserveScroll: true, replace: true });
    };

    const handleDeleteStock = (stock: Stock) => {
        const available = moneyAmount(stock.available_quantity);
        const quantity = moneyAmount(stock.quantity);
        if (available !== quantity) {
            window.alert('Cannot delete this stock batch because some units were already sold.');
            return;
        }

        const ok = window.confirm(
            `Delete this stock entry?\n\nMedicine: ${stock.medicine.name}\nBatch: ${stock.batch_number}\nQuantity: ${quantity}\n\nThis will refund any paid amount back to Hospital Account and remove vendor purchase records.`,
        );
        if (!ok) {
            return;
        }

        setDeletingStockId(stock.id);
        router.delete(route('medicine-corner.delete-stock', stock.id), {
            preserveScroll: true,
            onFinish: () => setDeletingStockId(null),
        });
    };

    return (
        <AdminLayout>
            <Head title="Stock Management" />

            <div className="mx-auto max-w-6xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">Stock</h1>
                        <p className="text-[12px] text-slate-500">On-hand batches, newest purchase first</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                const ok = window.confirm('Update each medicine standard sale price from its latest stock batch sale price?');
                                if (!ok) {
                                    return;
                                }
                                setSyncingSalePrices(true);
                                router.post(
                                    route('medicine-corner.sync-sale-prices'),
                                    {},
                                    {
                                        preserveScroll: true,
                                        onFinish: () => setSyncingSalePrices(false),
                                    },
                                );
                            }}
                            disabled={syncingSalePrices}
                            className="inline-flex h-7 items-center gap-1 rounded border border-slate-300 px-2 text-[12px] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${syncingSalePrices ? 'animate-spin' : ''}`} />
                            {syncingSalePrices ? 'Syncing' : 'Sync prices'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.visit(route('medicine-corner.purchase'))}
                            className="inline-flex h-7 items-center gap-1 rounded bg-slate-800 px-2.5 text-[12px] text-white hover:bg-slate-700"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add stock
                        </button>
                    </div>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        applyFilters();
                    }}
                    className="flex flex-wrap items-center gap-2"
                >
                    <div className="relative min-w-[180px] flex-1">
                        <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Medicine, batch, vendor"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-7 w-full rounded border border-slate-300 pr-2 pl-7 text-[12px]"
                        />
                    </div>
                    <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">Purchase date</span>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="h-7 rounded border border-slate-300 px-2 text-[12px]"
                    />
                    <span className="text-[12px] text-slate-400">to</span>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="h-7 rounded border border-slate-300 px-2 text-[12px]"
                    />
                    <select
                        value={vendorId}
                        onChange={(e) => setVendorId(e.target.value)}
                        className="h-7 max-w-[200px] rounded border border-slate-300 px-2 text-[12px]"
                    >
                        <option value="">Vendor</option>
                        {vendors.map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                                {vendor.name}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        className="inline-flex h-7 items-center gap-1 rounded bg-slate-800 px-2.5 text-[12px] text-white hover:bg-slate-700"
                    >
                        <Filter className="h-3.5 w-3.5" />
                        Show
                    </button>
                    {hasActiveFilters && (
                        <button type="button" onClick={clearFilters} className="h-7 rounded px-2 text-[12px] text-slate-600 hover:bg-slate-100">
                            Clear
                        </button>
                    )}
                </form>

                <div className="grid grid-cols-2 overflow-hidden rounded border border-slate-200 bg-white">
                    <div className="px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Stock value</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{formatTaka(totalStockValue)}</p>
                    </div>
                    <div className="border-l border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Batches</p>
                        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{batchCount}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded border border-slate-200 bg-white">
                    <table className="w-full border-collapse text-left text-[12px]">
                        <thead className="bg-slate-50 text-[11px] tracking-wide text-slate-500 uppercase">
                            <tr>
                                <th className="px-3 py-1.5 font-medium">Purchase date</th>
                                <th className="px-3 py-1.5 font-medium">Medicine</th>
                                <th className="px-3 py-1.5 font-medium">Batch</th>
                                <th className="px-3 py-1.5 font-medium">Vendor</th>
                                <th className="px-3 py-1.5 text-right font-medium">On hand</th>
                                <th className="px-3 py-1.5 text-right font-medium">Buy</th>
                                <th className="px-3 py-1.5 text-right font-medium">Sale</th>
                                <th className="px-3 py-1.5 font-medium">Expiry</th>
                                <th className="px-3 py-1.5 text-right font-medium" />
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.data.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-3 py-8 text-center text-[12px] text-slate-500">
                                        No stock in this purchase range.
                                    </td>
                                </tr>
                            )}
                            {stocks.data.map((stock) => {
                                const available = moneyAmount(stock.available_quantity);
                                const quantity = moneyAmount(stock.quantity);
                                const due = moneyAmount(stock.due_amount);
                                const canDelete = available === quantity;

                                return (
                                    <tr key={stock.id} className="border-t border-slate-100 text-slate-800">
                                        <td className="px-3 py-1.5 font-medium whitespace-nowrap text-slate-900">
                                            {formatDate(stock.purchase_date)}
                                        </td>
                                        <td className="px-3 py-1.5">
                                            <p className="font-medium text-slate-900">{stock.medicine.name}</p>
                                            {stock.medicine.generic_name && (
                                                <p className="text-[11px] text-slate-500">{stock.medicine.generic_name}</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-1.5 text-slate-600">{stock.batch_number}</td>
                                        <td className="px-3 py-1.5">
                                            <p>{stock.vendor?.name ?? '—'}</p>
                                            {stock.vendor?.company_name && <p className="text-[11px] text-slate-500">{stock.vendor.company_name}</p>}
                                        </td>
                                        <td className="px-3 py-1.5 text-right tabular-nums">
                                            {available}
                                            <span className="text-slate-400">/{quantity}</span>
                                            {due > 0 && <p className="text-[11px] text-red-700">Due {formatTaka(due)}</p>}
                                        </td>
                                        <td className="px-3 py-1.5 text-right tabular-nums">{formatTaka(stock.buy_price)}</td>
                                        <td className="px-3 py-1.5 text-right tabular-nums">{formatTaka(stock.sale_price)}</td>
                                        <td className="px-3 py-1.5 whitespace-nowrap text-slate-600">{formatDate(stock.expiry_date)}</td>
                                        <td className="px-3 py-1.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => router.visit(route('medicine-corner.edit-stock', stock.id))}
                                                    className="inline-flex h-6 items-center rounded px-1.5 text-[11px] text-slate-700 hover:bg-slate-100"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteStock(stock)}
                                                    disabled={!canDelete || deletingStockId === stock.id}
                                                    className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-red-700 hover:bg-red-50 disabled:text-slate-300"
                                                    title={canDelete ? 'Delete stock' : 'Some units were already sold'}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    {deletingStockId === stock.id ? '…' : 'Delete'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {Array.isArray(stocks.links) && stocks.links.length > 3 && (
                        <div className="border-t border-slate-200 px-3 py-1.5">
                            <Pagination links={stocks.links} className="mt-0" />
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
