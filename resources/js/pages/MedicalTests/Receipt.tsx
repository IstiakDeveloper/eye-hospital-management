import { router } from '@inertiajs/react';
import { ArrowLeft, Building, FileCheck, Printer } from 'lucide-react';
import { useEffect } from 'react';

interface Patient {
    patient_id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
    address?: string;
}

interface Visit {
    visit_id: string;
}

interface MedicalTest {
    name: string;
    code: string;
    category: string;
}

interface Test {
    id: number;
    medical_test: MedicalTest;
    original_price: number;
    discount_amount: number;
    final_price: number;
}

interface PaymentMethod {
    name: string;
}

interface ReceivedBy {
    name: string;
}

interface Payment {
    payment_number: string;
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    received_by: ReceivedBy;
}

interface TestGroup {
    id: number;
    group_number: string;
    patient: Patient;
    visit?: Visit;
    tests: Test[];
    payments: Payment[];
    total_original_price: number;
    total_discount: number;
    final_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    test_date: string;
    created_at: string;
}

interface Props {
    testGroup: TestGroup;
}

export default function MedicalTestReceipt({ testGroup }: Props) {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const formatCurrency = (amount: number) => {
        return `৳${parseFloat(amount.toString()).toFixed(2)}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('en-BD', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="min-h-screen bg-white">
            <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            font-size: 10px;
            overflow: hidden !important;
          }

          .no-print {
            display: none !important;
          }

          .receipt-box {
            width: 100% !important;
            height: 30vh !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            padding: 5px !important;
            margin: 0 !important;
            font-size: 9px !important;
            border: 2px solid #1e40af !important;
          }

          .header-text {
            font-size: 12px !important;
          }

          .subheader-text {
            font-size: 8px !important;
          }

          .info-text {
            font-size: 8px !important;
          }

          .test-item {
            font-size: 8px !important;
          }

          .total-text {
            font-size: 9px !important;
          }
        }

        @media screen {
          .receipt-box {
            width: 100%;
            max-width: 900px;
            margin: 20px auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #1e40af;
          }
        }
      `}</style>

            <div className="no-print fixed top-4 right-4 z-50 flex gap-3">
                <button
                    onClick={() => router.visit('/medical-tests')}
                    className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                >
                    <Printer className="h-4 w-4" />
                    Print
                </button>
            </div>

            <div className="receipt-box bg-white">
                <div className="hospital-header mb-4 border-b-2 border-blue-600 pb-3">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Hospital Logo"
                            className="h-12 w-12 flex-shrink-0 object-contain"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                    fallback.style.display = 'flex';
                                }
                            }}
                        />
                        <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                            <Building className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1 text-center">
                            <h1 className="text-base leading-tight font-bold text-gray-900">নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার</h1>
                            <p className="text-[10px] font-semibold text-blue-600 uppercase">Test Receipt</p>
                            <div className="text-[10px] text-gray-700">
                                <span className="font-semibold">ঠিকানা:</span> সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ। |
                                <span className="ml-1 font-semibold">যোগাযোগ:</span> ০১৩০৭-৮৮৫৫৬৬, ০১৩৩৪-৯২৫৯১০ | niehpc@gmail.com
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-2 grid grid-cols-2 gap-2">
                    <div>
                        <div className="mb-2 border-l-4 border-blue-600 bg-blue-50 p-2">
                            <div className="mb-1 text-xs font-bold text-blue-800">PATIENT DETAILS</div>
                            <div className="info-text space-y-0.5">
                                <div className="flex">
                                    <span className="w-16 text-gray-600">ID:</span>
                                    <span className="font-bold">{testGroup.patient.patient_id}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-16 text-gray-600">Name:</span>
                                    <span className="font-bold">{testGroup.patient.name}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-16 text-gray-600">Phone:</span>
                                    <span className="font-bold">{testGroup.patient.phone}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-16 text-gray-600">Age/Sex:</span>
                                    <span className="font-bold">
                                        {testGroup.patient.age || 'N/A'} / {testGroup.patient.gender || 'N/A'}
                                    </span>
                                </div>
                                {testGroup.visit && (
                                    <div className="flex">
                                        <span className="w-16 text-gray-600">Visit:</span>
                                        <span className="font-bold">{testGroup.visit.visit_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-l-4 border-green-600 bg-green-50 p-2">
                            <div className="mb-1 text-xs font-bold text-green-800">RECEIPT INFO</div>
                            <div className="info-text space-y-0.5">
                                <div className="flex">
                                    <span className="w-20 text-gray-600">Test Date:</span>
                                    <span className="font-bold">{formatDate(testGroup.test_date)}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-20 text-gray-600">Issue Date:</span>
                                    <span className="font-bold">{formatDate(testGroup.created_at)}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-20 text-gray-600">Issue Time:</span>
                                    <span className="font-bold">{formatTime(testGroup.created_at)}</span>
                                </div>
                                {testGroup.payments.length > 0 && (
                                    <>
                                        <div className="flex">
                                            <span className="w-20 text-gray-600">Method:</span>
                                            <span className="font-bold">{testGroup.payments[0].payment_method.name}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-20 text-gray-600">Received:</span>
                                            <span className="font-bold">{testGroup.payments[0].received_by.name}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded border border-gray-300 p-2">
                        <div className="mb-1.5 flex items-center gap-1 text-xs font-bold text-gray-800">
                            <FileCheck className="h-3 w-3" />
                            TESTS ORDERED ({testGroup.tests.length})
                        </div>
                        <div className="max-h-32 space-y-1 overflow-hidden">
                            {testGroup.tests.slice(0, 6).map((test, idx) => (
                                <div key={test.id} className="test-item border-b border-gray-200 pb-1">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="text-xs font-semibold">
                                                {idx + 1}. {test.medical_test.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {test.medical_test.code} • {test.medical_test.category}
                                            </div>
                                        </div>
                                        <div className="ml-2 text-right">
                                            <div className="text-xs font-bold">{formatCurrency(test.final_price)}</div>
                                            {test.discount_amount > 0 && (
                                                <div className="text-xs text-red-600 line-through">{formatCurrency(test.original_price)}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {testGroup.tests.length > 6 && (
                                <div className="pt-1 text-center text-xs font-medium text-blue-600">+{testGroup.tests.length - 6} more tests</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="total-text mb-2 grid grid-cols-4 gap-2">
                    <div className="rounded border border-gray-300 bg-gray-100 p-2 text-center">
                        <div className="text-xs text-gray-600">Subtotal</div>
                        <div className="text-sm font-bold">{formatCurrency(testGroup.total_original_price)}</div>
                    </div>

                    {testGroup.total_discount > 0 ? (
                        <div className="rounded border border-red-300 bg-red-50 p-2 text-center">
                            <div className="text-xs text-red-600">Discount</div>
                            <div className="text-sm font-bold text-red-600">-{formatCurrency(testGroup.total_discount)}</div>
                        </div>
                    ) : (
                        <div className="col-span-2 rounded border border-blue-300 bg-blue-50 p-2 text-center">
                            <div className="text-xs text-blue-600">Total Amount</div>
                            <div className="text-base font-bold text-blue-700">{formatCurrency(testGroup.final_amount)}</div>
                        </div>
                    )}

                    {testGroup.total_discount > 0 && (
                        <div className="rounded border border-blue-300 bg-blue-50 p-2 text-center">
                            <div className="text-xs text-blue-600">Total</div>
                            <div className="text-base font-bold text-blue-700">{formatCurrency(testGroup.final_amount)}</div>
                        </div>
                    )}

                    <div className={testGroup.total_discount > 0 ? '' : ''}>
                        <div className="h-full rounded border border-green-300 bg-green-50 p-2 text-center">
                            <div className="text-xs text-green-600">Paid</div>
                            <div className="text-base font-bold text-green-700">{formatCurrency(testGroup.paid_amount)}</div>
                        </div>
                    </div>
                </div>

                {testGroup.due_amount > 0 && (
                    <div className="mb-2 rounded border-2 border-red-400 bg-red-100 p-2 text-center">
                        <div className="text-xs font-bold text-red-700">REMAINING DUE</div>
                        <div className="text-lg font-bold text-red-700">{formatCurrency(testGroup.due_amount)}</div>
                    </div>
                )}

                <div className="border-t border-gray-300 pt-2">
                    <div className="flex items-center justify-between text-xs">
                        <div className="text-gray-600">Reports available in 24-48 hours</div>
                        <div
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                                testGroup.payment_status === 'paid'
                                    ? 'bg-green-600 text-white'
                                    : testGroup.payment_status === 'partial'
                                      ? 'bg-yellow-500 text-white'
                                      : 'bg-red-600 text-white'
                            }`}
                        >
                            {testGroup.payment_status.toUpperCase()}
                        </div>
                        <div className="text-gray-500">Print: {formatDate(new Date().toString())}</div>
                    </div>
                </div>
            </div>

            <div className="no-print mt-6 mb-6 text-center">
                <button onClick={() => window.history.back()} className="rounded-lg bg-gray-600 px-6 py-3 text-white hover:bg-gray-700">
                    Back to Tests
                </button>
            </div>
        </div>
    );
}
