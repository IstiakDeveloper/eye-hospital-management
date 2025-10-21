import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Printer, Calendar, X } from 'lucide-react';

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

interface TestsByType {
  [key: string]: {
    count: number;
    amount: number;
  };
}

interface Props {
  testGroups: TestGroup[];
  summary: Summary;
  testsByType: TestsByType;
  date: string;
}

export default function CleanDailyReport({ testGroups, summary, testsByType, date }: Props) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return `৳${Number(amount).toFixed(2)}`;
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDateChange = (newDate: string) => {
    router.get('/medical-tests/reports/daily', { date: newDate });
  };

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

      {/* Floating Controls */}
      {showControls && (
        <div className="print-controls fixed top-4 right-4 z-50 bg-white rounded-lg shadow-xl p-4 space-y-3">
          <button
            onClick={() => setShowControls(false)}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                handleDateChange(e.target.value);
              }}
              className="px-3 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
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

      {/* A4 Report Container */}
      <div className="report-container">

        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b-4 border-blue-600">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার</h1>
          <p className="text-sm text-gray-600">সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ।</p>
          <p className="text-sm text-gray-600">📞 ০১৩০৭-৮৮৫৫৬৬, ০১৩৩৪-৯২৫৯১০ • ✉️ niehpc@gmail.com</p>
          <h2 className="text-lg font-bold text-gray-800 mt-3">Medical Test Daily Report</h2>
          <p className="text-sm font-semibold text-blue-600 mt-1">
            Date: {new Date(selectedDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        {/* Summary Section */}
        <div className="mb-5">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-t">
            <h3 className="font-bold text-sm">📊 Summary Overview</h3>
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
                <td className="px-3 py-2 font-semibold border border-gray-300 bg-orange-50 text-orange-900">Discount</td>
                <td className="px-3 py-2 text-right font-bold border border-gray-300 bg-orange-50">{formatCurrency(summary.total_discount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Main Table */}
        <div className="mb-5">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-2 rounded-t">
            <h3 className="font-bold text-sm">📋 Test Groups Details</h3>
          </div>
          <table className="w-full border-collapse border border-gray-300 text-xs">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-2 py-2 text-left border border-gray-600">SL</th>
                <th className="px-2 py-2 text-left border border-gray-600">Group #</th>
                <th className="px-2 py-2 text-left border border-gray-600">Patient</th>
                <th className="px-2 py-2 text-left border border-gray-600">Tests</th>
                <th className="px-2 py-2 text-right border border-gray-600">Amount</th>
                <th className="px-2 py-2 text-right border border-gray-600">Paid</th>
                <th className="px-2 py-2 text-right border border-gray-600">Due</th>
                <th className="px-2 py-2 text-center border border-gray-600">Status</th>
                <th className="px-2 py-2 text-left border border-gray-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {testGroups.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-gray-500 border border-gray-300">
                    No data found for this date
                  </td>
                </tr>
              ) : (
                testGroups.map((group, idx) => (
                  <tr key={group.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-2 text-center border border-gray-300">{idx + 1}</td>
                    <td className="px-2 py-2 font-semibold text-blue-600 border border-gray-300">{group.group_number}</td>
                    <td className="px-2 py-2 border border-gray-300">
                      <div className="font-semibold">{group.patient.name}</div>
                      <div className="text-gray-600">{group.patient.patient_id}</div>
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <div className="font-semibold">{group.tests.length} Test(s)</div>
                      {group.tests.slice(0, 2).map((test, i) => (
                        <div key={i} className="text-gray-600">{test.medical_test.name}</div>
                      ))}
                      {group.tests.length > 2 && <div className="text-blue-600">+{group.tests.length - 2}</div>}
                    </td>
                    <td className="px-2 py-2 text-right font-bold border border-gray-300">{formatCurrency(group.final_amount)}</td>
                    <td className="px-2 py-2 text-right font-bold text-green-700 border border-gray-300">{formatCurrency(group.paid_amount)}</td>
                    <td className="px-2 py-2 text-right font-bold text-red-700 border border-gray-300">{formatCurrency(group.due_amount)}</td>
                    <td className="px-2 py-2 text-center border border-gray-300">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        group.payment_status === 'paid' ? 'bg-green-200 text-green-900' :
                        group.payment_status === 'partial' ? 'bg-yellow-200 text-yellow-900' :
                        'bg-red-200 text-red-900'
                      }`}>
                        {group.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-2 py-2 border border-gray-300">{formatTime(group.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-blue-100 border-t-2 border-blue-600">
                <td colSpan={4} className="px-2 py-2 text-right font-bold uppercase border border-gray-300">Total:</td>
                <td className="px-2 py-2 text-right font-bold text-blue-900 border border-gray-300">{formatCurrency(summary.total_amount)}</td>
                <td className="px-2 py-2 text-right font-bold text-green-900 border border-gray-300">{formatCurrency(summary.total_paid)}</td>
                <td className="px-2 py-2 text-right font-bold text-red-900 border border-gray-300" colSpan={3}>{formatCurrency(summary.total_due)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Test Type Summary */}
        {Object.keys(testsByType).length > 0 && (
          <div className="mb-5">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-2 rounded-t">
              <h3 className="font-bold text-sm">🧪 Test Type Summary</h3>
            </div>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-green-800 text-white">
                  <th className="px-3 py-2 text-left border border-green-600">SL</th>
                  <th className="px-3 py-2 text-left border border-green-600">Test Name</th>
                  <th className="px-3 py-2 text-center border border-green-600">Count</th>
                  <th className="px-3 py-2 text-right border border-green-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(testsByType).map(([name, data], idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-green-50'}>
                    <td className="px-3 py-2 text-center border border-gray-300">{idx + 1}</td>
                    <td className="px-3 py-2 font-semibold border border-gray-300">{name}</td>
                    <td className="px-3 py-2 text-center border border-gray-300">
                      <span className="inline-block bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                        {data.count}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-bold border border-gray-300">{formatCurrency(data.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-gray-300 text-center text-xs text-gray-600">
          <p>Generated: {new Date().toLocaleString('en-GB')}</p>
          <p className="mt-1">This is a computer-generated report</p>
        </div>

      </div>
    </div>
  );
}
