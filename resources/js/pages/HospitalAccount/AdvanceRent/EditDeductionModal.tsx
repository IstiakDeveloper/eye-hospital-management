import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

export interface EditableDeduction {
    id: number;
    month: number;
    year: number;
    amount: number | string;
    notes?: string | null;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function EditDeductionModal({ deduction, onClose }: { deduction: EditableDeduction; onClose: () => void }) {
    const { data, setData, put, processing, errors } = useForm({
        amount: String(Number(deduction.amount)),
        month: deduction.month,
        year: deduction.year,
        notes: deduction.notes ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(`/hospital-account/advance-rent/deductions/${deduction.id}`, {
            onSuccess: () => onClose(),
        });
    };

    const formError = errors.amount || (errors as Record<string, string | undefined>).error;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <form onSubmit={submit} className="w-full max-w-md rounded-lg bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold">Edit Deduction</h3>

                {formError && (
                    <div className="mb-4 rounded border border-red-300 bg-red-50 p-3">
                        <p className="text-sm font-medium text-red-700">{formError}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={data.amount}
                            onChange={(event) => setData('amount', event.target.value)}
                            className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Month</label>
                            <select
                                value={data.month}
                                onChange={(event) => setData('month', parseInt(event.target.value))}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                            >
                                {months.map((name, index) => (
                                    <option key={name} value={index + 1}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Year</label>
                            <input
                                type="number"
                                min="2020"
                                max="2100"
                                value={data.year}
                                onChange={(event) => setData('year', parseInt(event.target.value))}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Notes (Optional)</label>
                        <textarea
                            value={data.notes}
                            onChange={(event) => setData('notes', event.target.value)}
                            className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-400"
                            rows={2}
                        />
                        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex-1 rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                    >
                        {processing ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
