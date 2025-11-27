import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Printer, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Patient {
  patient_id: string;
  name: string;
  phone: string;
}

interface MedicalTest {
  name: string;
  code: string;
}

interface Test {
  medical_test: MedicalTest;
  final_price: number;
}

interface TestGroup {
  id: number;
  group_number: string;
  patient: Patient;
  tests: Test[];
  final_amount: number;
  paid_amount: number;
  due_amount: number;
  total_discount: number;
  payment_status: string;
  test_date: string;
  created_at: string;
}

interface Summary {
  total_tests: number;
  total_amount: number;
  total_paid: number;
  total_due: number;
  total_discount: number;
  total_groups: number;
}

interface Props {
  testGroups: TestGroup[];
  summary: Summary;
  year: number;
  month: number;
}

export default function MonthlyReport({ testGroups, summary, year, month }: Props) {
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatCurrency = (amount: number | string | null | undefined) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return `৳${num.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMonthChange = (newMonth: number, newYear: number) => {
    router.get('/medical-tests/reports/monthly', { month: newMonth, year: newYear });
  };

  const goToPreviousMonth = () => {
    const newMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const newYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    handleMonthChange(newMonth, newYear);
  };

  const goToNextMonth = () => {
    const newMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    const newYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
    handleMonthChange(newMonth, newYear);
  };

  // Group by date
  const groupedByDate = testGroups.reduce((acc, group) => {
    const date = group.test_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(group);
    return acc;
  }, {} as Record<string, TestGroup[]>);

  return (
    <div className="min-h-screen bg-gray-100">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
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
            width: 297mm;
            min-height: 210mm;
            margin: 20px auto;
            background: white;
            padding: 15mm;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {showControls && (
        <div className="print-controls fixed top-4 right-4 z-50 bg-white rounded-lg shadow-xl p-4 space-y-3">
          <button
            onClick={() => setShowControls(false)}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const newMonth = parseInt(e.target.value);
                  setSelectedMonth(newMonth);
                  handleMonthChange(newMonth, selectedYear);
                }}
                className="px-3 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx + 1}>{name}</option>
                ))}
              </select>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => {
                  const newYear = parseInt(e.target.value);
                  setSelectedYear(newYear);
                  handleMonthChange(selectedMonth, newYear);
                }}
                className="px-3 py-1 border rounded text-sm w-24 focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <Printer className="w-4 h-4" />
            Print PDF
          </button>

          <button
            onClick={() => router.visit('/medical-tests')}
            className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition text-sm"
          >
            Back to List
          </button>
        </div>
      )}

      <div className="report-container">
        <div className="text-center mb-6 pb-4 border-b-4 border-blue-600">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার</h1>
          <p className="text-sm text-gray-600">সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ।</p>
          <p className="text-sm text-gray-600">📞 ০১৩০৭-৮৮৫৫৬৬, ০১৩৩৪-৯২৫৯১০ • ✉️ niehpc@gmail.com</p>
          <h2 className="text-lg font-bold text-gray-800 mt-3">Monthly Medical Test Report</h2>
          <p className="text-sm font-semibold text-blue-600 mt-1">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </p>
        </div>

        <div className="mb-5">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-t">
            <h3 className="font-bold text-sm">📊 Monthly Summary</h3>
          </div>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <tbody>
              <tr className="bg-blue-50">
                <td className="px-3 py-2 font-semibold border border-gray-300 text-blue-900">Total Groups</td>
                <td className="px-3 py-2 text-right font-bold border border-gray-300">{summary.total_groups}</td>
                <td className="px-3 py-2 font-semibold border border-gray-300 bg-purple-50 text-purple-900">Total Tests</td>
                <td className="px-3 py-2 text-right font-bold border border-gray-300 bg-purple-50">{summary.total_tests}</td>
              </tr>
              <tr className="bg-green-50">
                <td className="px-3 py-2 font-semibold border border-gray-300 text-green-900">Total Amount</td>
                <td className="px-3 py-2 text-right font-bold border border-gray-300">{formatCurrency(summary.total_amount)}</td>
                <td className="px-3 py-2 font-semibold border border-gray-300 bg-emerald-50 text-emerald-900">Paid Amount</td>
                <td className="px-3 py-2 text-right font-bold border border-gray-300 bg-emerald-50">{formatCurrency(summary.total_paid)}</td>
              </tr>
              <tr className="bg-red-50">
                <td className="px-3 py-2 font-semibold border border-gray-300 text-red-900">Due Amount</td>
                <td className="px-3 py-2 text-right font-bold border border-gray-300">{formatCurrency(summary.total_due)}</td>
                <td className="px-3 py-2 font-semibold border border-gray-300 bg-orange-50 text-orange-900">Total Discount</td>
                <td className="px-3 py-2 text-right font-bold border border-gray-300 bg-orange-50">{formatCurrency(summary.total_discount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-5">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-2 rounded-t">
            <h3 className="font-bold text-sm">📋 Day-wise Summary</h3>
          </div>
          <table className="w-full border-collapse border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-2 py-2 text-left border border-gray-600">Date</th>
                <th className="px-2 py-2 text-center border border-gray-600">Groups</th>
                <th className="px-2 py-2 text-center border border-gray-600">Tests</th>
                <th className="px-2 py-2 text-right border border-gray-600">Amount</th>
                <th className="px-2 py-2 text-right border border-gray-600">Paid</th>
                <th className="px-2 py-2 text-right border border-gray-600">Due</th>
                <th className="px-2 py-2 text-right border border-gray-600">Discount</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedByDate).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-500 border border-gray-300">
                    No data found for this month
                  </td>
                </tr>
              ) : (
                Object.entries(groupedByDate).map(([date, groups], idx) => {
                  const dayTotal = groups.reduce((sum, g) => sum + g.final_amount, 0);
                  const dayPaid = groups.reduce((sum, g) => sum + g.paid_amount, 0);
                  const dayDue = groups.reduce((sum, g) => sum + g.due_amount, 0);
                  const dayDiscount = groups.reduce((sum, g) => sum + g.total_discount, 0);
                  const dayTests = groups.reduce((sum, g) => sum + g.tests.length, 0);

                  return (
                    <tr key={date} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-2 py-2 font-semibold border border-gray-300">
                        {new Date(date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-2 py-2 text-center font-bold border border-gray-300">{groups.length}</td>
                      <td className="px-2 py-2 text-center font-bold border border-gray-300">{dayTests}</td>
                      <td className="px-2 py-2 text-right font-bold border border-gray-300">{formatCurrency(dayTotal)}</td>
                      <td className="px-2 py-2 text-right font-bold text-green-700 border border-gray-300">{formatCurrency(dayPaid)}</td>
                      <td className="px-2 py-2 text-right font-bold text-red-700 border border-gray-300">{formatCurrency(dayDue)}</td>
                      <td className="px-2 py-2 text-right font-bold text-orange-700 border border-gray-300">{formatCurrency(dayDiscount)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-blue-100 border-t-2 border-blue-600">
                <td className="px-2 py-2 text-right font-bold uppercase border border-gray-300" colSpan={2}>Monthly Total:</td>
                <td className="px-2 py-2 text-center font-bold text-purple-900 border border-gray-300">{summary.total_tests}</td>
                <td className="px-2 py-2 text-right font-bold text-blue-900 border border-gray-300">{formatCurrency(summary.total_amount)}</td>
                <td className="px-2 py-2 text-right font-bold text-green-900 border border-gray-300">{formatCurrency(summary.total_paid)}</td>
                <td className="px-2 py-2 text-right font-bold text-red-900 border border-gray-300">{formatCurrency(summary.total_due)}</td>
                <td className="px-2 py-2 text-right font-bold text-orange-900 border border-gray-300">{formatCurrency(summary.total_discount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 pt-3 border-t border-gray-300 text-center text-xs text-gray-600">
          <p>Generated: {new Date().toLocaleString('en-GB')}</p>
          <p className="mt-1">This is a computer-generated report</p>
        </div>
      </div>
    </div>
  );
}
