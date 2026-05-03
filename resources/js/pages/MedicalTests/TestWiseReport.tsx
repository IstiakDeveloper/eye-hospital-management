import { router } from '@inertiajs/react';
import { Calendar, Printer, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TestData {
    test_name: string;
    test_code: string;
    count: number;
    total_amount: number;
    total_discount: number;
    total_original: number;
}

interface Props {
    tests: TestData[];
    startDate: string;
    endDate: string;
}

export default function TestWiseReport({ tests, startDate, endDate }: Props) {
    const [selectedStartDate, setSelectedStartDate] = useState(startDate);
    const [selectedEndDate, setSelectedEndDate] = useState(endDate);
    const [showControls, setShowControls] = useState(true);
    const [sortBy, setSortBy] = useState<'count' | 'amount'>('count');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const formatCurrency = (amount: number) => {
        return `৳${Number(amount).toFixed(2)}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleDateChange = () => {
        router.get('/medical-tests/reports/test-wise', {
            start_date: selectedStartDate,
            end_date: selectedEndDate,
        });
    };

    // Calculate totals
    const totalTests = tests.reduce((sum, t) => sum + t.count, 0);
    const totalAmount = tests.reduce((sum, t) => sum + t.total_amount, 0);
    const totalDiscount = tests.reduce((sum, t) => sum + t.total_discount, 0);
    const totalOriginal = tests.reduce((sum, t) => sum + t.total_original, 0);

    // Sort tests
    const sortedTests = [...tests].sort((a, b) => {
        if (sortBy === 'count') {
            return sortOrder === 'desc' ? b.count - a.count : a.count - b.count;
        } else {
            return sortOrder === 'desc' ? b.total_amount - a.total_amount : a.total_amount - b.total_amount;
        }
    });

    return (
        <div className="min-h-screen bg-gray-100">
            <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-controls {
            display: none !important;
          }

          .report-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
          }

          * {
            page-break-inside: avoid !important;
          }
        }

        @media screen {
          .report-container {
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            background: white;
            padding: 15mm;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
        }
      `}</style>

            {showControls && (
                <div className="print-controls fixed top-4 right-4 z-50 space-y-3 rounded-lg bg-white p-4 shadow-xl">
                    <button onClick={() => setShowControls(false)} className="absolute top-2 right-2 rounded p-1 hover:bg-gray-100">
                        <X className="h-4 w-4" />
                    </button>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Start Date</label>
                        <input
                            type="date"
                            value={selectedStartDate}
                            onChange={(e) => setSelectedStartDate(e.target.value)}
                            className="w-full rounded border px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">End Date</label>
                        <input
                            type="date"
                            value={selectedEndDate}
                            onChange={(e) => setSelectedEndDate(e.target.value)}
                            className="w-full rounded border px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        onClick={handleDateChange}
                        className="flex w-full items-center justify-center gap-2 rounded bg-green-600 px-4 py-2 text-sm text-white transition hover:bg-green-700"
                    >
                        <Calendar className="h-4 w-4" />
                        Update Report
                    </button>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'count' | 'amount')}
                            className="w-full rounded border px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="count">Test Count</option>
                            <option value="amount">Total Amount</option>
                        </select>
                    </div>

                    <button
                        onClick={() => window.print()}
                        className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                    >
                        <Printer className="h-4 w-4" />
                        Print PDF
                    </button>

                    <button
                        onClick={() => router.visit('/medical-tests')}
                        className="w-full rounded border border-gray-300 px-4 py-2 text-sm transition hover:bg-gray-50"
                    >
                        Back to List
                    </button>
                </div>
            )}

            <div className="report-container">
                <div className="mb-6 border-b-4 border-green-600 pb-4 text-center">
                    <h1 className="mb-1 text-2xl font-bold text-gray-900">মৌসুমী চক্ষু হাসপাতাল</h1>
                    <p className="text-sm text-gray-600">সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ।</p>
                    <p className="text-sm text-gray-600">📞 ০১৩০৭-৮৮৫৫৬৬, ০১৩৩৪-৯২৫৯১০ • ✉️ niehpc@gmail.com</p>
                    <h2 className="mt-3 text-lg font-bold text-gray-800">Test-wise Performance Report</h2>
                    <p className="mt-1 text-sm font-semibold text-green-600">
                        Period: {formatDate(selectedStartDate)} - {formatDate(selectedEndDate)}
                    </p>
                </div>

                <div className="mb-5">
                    <div className="rounded-t bg-gradient-to-r from-green-600 to-green-700 px-3 py-2 text-white">
                        <h3 className="text-sm font-bold">📊 Overall Summary</h3>
                    </div>
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                        <tbody>
                            <tr className="bg-green-50">
                                <td className="border border-gray-300 px-3 py-2 font-semibold text-green-900">Total Test Types</td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-bold">{tests.length}</td>
                                <td className="border border-gray-300 bg-blue-50 px-3 py-2 font-semibold text-blue-900">Total Tests Done</td>
                                <td className="border border-gray-300 bg-blue-50 px-3 py-2 text-right font-bold">{totalTests}</td>
                            </tr>
                            <tr className="bg-purple-50">
                                <td className="border border-gray-300 px-3 py-2 font-semibold text-purple-900">Original Amount</td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-bold">{formatCurrency(totalOriginal)}</td>
                                <td className="border border-gray-300 bg-orange-50 px-3 py-2 font-semibold text-orange-900">Total Discount</td>
                                <td className="border border-gray-300 bg-orange-50 px-3 py-2 text-right font-bold">
                                    {formatCurrency(totalDiscount)}
                                </td>
                            </tr>
                            <tr className="bg-emerald-50">
                                <td className="border border-gray-300 px-3 py-2 font-semibold text-emerald-900">Final Revenue</td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-bold">{formatCurrency(totalAmount)}</td>
                                <td className="border border-gray-300 bg-yellow-50 px-3 py-2 font-semibold text-yellow-900">Avg per Test</td>
                                <td className="border border-gray-300 bg-yellow-50 px-3 py-2 text-right font-bold">
                                    {formatCurrency(totalTests > 0 ? totalAmount / totalTests : 0)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mb-5">
                    <div className="flex items-center justify-between rounded-t bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-white">
                        <h3 className="text-sm font-bold">🧪 Test-wise Breakdown</h3>
                        <span className="text-xs">
                            Sorted by: {sortBy === 'count' ? 'Test Count' : 'Revenue'} ({sortOrder === 'desc' ? 'High to Low' : 'Low to High'})
                        </span>
                    </div>
                    <table className="w-full border-collapse border border-gray-300 text-xs">
                        <thead>
                            <tr className="bg-gray-800 text-white">
                                <th className="border border-gray-600 px-2 py-2 text-left">Rank</th>
                                <th className="border border-gray-600 px-2 py-2 text-left">Test Name</th>
                                <th className="border border-gray-600 px-2 py-2 text-left">Code</th>
                                <th className="border border-gray-600 px-2 py-2 text-center">Count</th>
                                <th className="border border-gray-600 px-2 py-2 text-right">Original</th>
                                <th className="border border-gray-600 px-2 py-2 text-right">Discount</th>
                                <th className="border border-gray-600 px-2 py-2 text-right">Revenue</th>
                                <th className="border border-gray-600 px-2 py-2 text-right">Avg/Test</th>
                                <th className="border border-gray-600 px-2 py-2 text-center">% Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTests.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                                        No test data found for this period
                                    </td>
                                </tr>
                            ) : (
                                sortedTests.map((test, idx) => {
                                    const revenuePercent = totalAmount > 0 ? ((test.total_amount / totalAmount) * 100).toFixed(1) : '0.0';
                                    const avgPerTest = test.count > 0 ? test.total_amount / test.count : 0;
                                    const isTop3 = idx < 3;

                                    return (
                                        <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isTop3 ? 'bg-yellow-50' : ''}`}>
                                            <td className="border border-gray-300 px-2 py-2 text-center">
                                                <span
                                                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                        idx === 0
                                                            ? 'bg-yellow-400 text-yellow-900'
                                                            : idx === 1
                                                              ? 'bg-gray-300 text-gray-900'
                                                              : idx === 2
                                                                ? 'bg-orange-300 text-orange-900'
                                                                : 'bg-blue-100 text-blue-900'
                                                    }`}
                                                >
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 font-semibold">{test.test_name}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-gray-600">{test.test_code}</td>
                                            <td className="border border-gray-300 px-2 py-2 text-center">
                                                <span className="inline-block rounded-full bg-blue-200 px-2 py-0.5 font-bold text-blue-900">
                                                    {test.count}
                                                </span>
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right font-semibold">
                                                {formatCurrency(test.total_original)}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right font-semibold text-red-700">
                                                {formatCurrency(test.total_discount)}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right font-bold text-green-700">
                                                {formatCurrency(test.total_amount)}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-right font-semibold">
                                                {formatCurrency(avgPerTest)}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-center">
                                                <span
                                                    className={`inline-block rounded px-2 py-0.5 font-bold ${
                                                        parseFloat(revenuePercent) >= 10
                                                            ? 'bg-green-200 text-green-900'
                                                            : parseFloat(revenuePercent) >= 5
                                                              ? 'bg-blue-200 text-blue-900'
                                                              : 'bg-gray-200 text-gray-900'
                                                    }`}
                                                >
                                                    {revenuePercent}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-green-600 bg-green-100">
                                <td colSpan={3} className="border border-gray-300 px-2 py-2 text-right font-bold uppercase">
                                    Total:
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-center font-bold text-blue-900">
                                    <span className="inline-block rounded-full bg-blue-300 px-2 py-0.5 font-bold text-blue-900">{totalTests}</span>
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-right font-bold text-purple-900">
                                    {formatCurrency(totalOriginal)}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-right font-bold text-red-900">
                                    {formatCurrency(totalDiscount)}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-right font-bold text-green-900">
                                    {formatCurrency(totalAmount)}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-right font-bold">
                                    {formatCurrency(totalTests > 0 ? totalAmount / totalTests : 0)}
                                </td>
                                <td className="border border-gray-300 px-2 py-2 text-center font-bold">100%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Top Performers Section */}
                {sortedTests.length >= 3 && (
                    <div className="mb-5">
                        <div className="rounded-t bg-gradient-to-r from-yellow-500 to-yellow-600 px-3 py-2 text-white">
                            <h3 className="text-sm font-bold">🏆 Top 3 Performers</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3 border border-t-0 border-gray-300 p-3">
                            {sortedTests.slice(0, 3).map((test, idx) => {
                                const medals = ['🥇', '🥈', '🥉'];
                                const colors = ['from-yellow-400 to-yellow-500', 'from-gray-300 to-gray-400', 'from-orange-300 to-orange-400'];

                                return (
                                    <div key={idx} className={`bg-gradient-to-br ${colors[idx]} rounded-lg p-3 text-center shadow-md`}>
                                        <div className="mb-2 text-3xl">{medals[idx]}</div>
                                        <div className="mb-1 text-sm font-bold text-gray-900">{test.test_name}</div>
                                        <div className="mb-2 text-xs text-gray-700">{test.test_code}</div>
                                        <div className="bg-opacity-50 space-y-1 rounded bg-white p-2">
                                            <div className="text-xs">
                                                <span className="font-semibold">Count:</span> {test.count}
                                            </div>
                                            <div className="text-xs">
                                                <span className="font-semibold">Revenue:</span> {formatCurrency(test.total_amount)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Performance Insights */}
                <div className="mb-5">
                    <div className="rounded-t bg-gradient-to-r from-indigo-600 to-indigo-700 px-3 py-2 text-white">
                        <h3 className="text-sm font-bold">💡 Key Insights</h3>
                    </div>
                    <div className="space-y-2 border border-t-0 border-gray-300 p-4 text-xs">
                        <div className="flex items-start gap-2">
                            <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                            <div>
                                <span className="font-semibold">Most Popular Test:</span> {sortedTests[0]?.test_name || 'N/A'} with{' '}
                                {sortedTests[0]?.count || 0} bookings
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                            <div>
                                <span className="font-semibold">Highest Revenue Test:</span>{' '}
                                {[...tests].sort((a, b) => b.total_amount - a.total_amount)[0]?.test_name || 'N/A'} generating{' '}
                                {formatCurrency([...tests].sort((a, b) => b.total_amount - a.total_amount)[0]?.total_amount || 0)}
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <TrendingDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600" />
                            <div>
                                <span className="font-semibold">Average Discount Rate:</span>{' '}
                                {totalOriginal > 0 ? ((totalDiscount / totalOriginal) * 100).toFixed(1) : '0.0'}% across all tests
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 font-bold text-purple-600">📈</span>
                            <div>
                                <span className="font-semibold">Revenue per Test Average:</span>{' '}
                                {formatCurrency(totalTests > 0 ? totalAmount / totalTests : 0)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t border-gray-300 pt-3 text-center text-xs text-gray-600">
                    <p>Generated: {new Date().toLocaleString('en-GB')}</p>
                    <p className="mt-1">
                        This is a computer-generated report • Total Period:{' '}
                        {Math.ceil((new Date(selectedEndDate).getTime() - new Date(selectedStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                    </p>
                </div>
            </div>
        </div>
    );
}
