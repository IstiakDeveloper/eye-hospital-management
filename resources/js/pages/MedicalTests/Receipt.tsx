import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Printer, ArrowLeft, Stethoscope, FileCheck, Building } from 'lucide-react';

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
            year: 'numeric'
        });
    };

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('en-BD', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
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
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Printer className="w-4 h-4" />
                    Print
                </button>
            </div>

            <div className="receipt-box bg-white">

                <div className="hospital-header border-b-2 border-blue-600 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Hospital Logo"
                            className="h-12 w-12 object-contain flex-shrink-0"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                    fallback.style.display = 'flex';
                                }
                            }}
                        />
                        <div className="h-12 w-12 bg-blue-600 rounded-full hidden items-center justify-center flex-shrink-0">
                            <Building className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1 text-center">
                            <h1 className="text-base font-bold text-gray-900 leading-tight">
                                নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার
                            </h1>
                            <p className="text-[10px] text-blue-600 font-semibold uppercase">Test Receipt</p>
                            <div className="text-[10px] text-gray-700">
                                <span className="font-semibold">ঠিকানা:</span> সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ। |
                                <span className="font-semibold ml-1">যোগাযোগ:</span> ০১৩০৭-৮৮৫৫৬৬, ০১৩৩৪-৯২৫৯১০ | niehpc@gmail.com
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">

                    <div>
                        <div className="bg-blue-50 border-l-4 border-blue-600 p-2 mb-2">
                            <div className="font-bold text-xs text-blue-800 mb-1">PATIENT DETAILS</div>
                            <div className="space-y-0.5 info-text">
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
                                    <span className="font-bold">{testGroup.patient.age || 'N/A'} / {testGroup.patient.gender || 'N/A'}</span>
                                </div>
                                {testGroup.visit && (
                                    <div className="flex">
                                        <span className="w-16 text-gray-600">Visit:</span>
                                        <span className="font-bold">{testGroup.visit.visit_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-green-50 border-l-4 border-green-600 p-2">
                            <div className="font-bold text-xs text-green-800 mb-1">RECEIPT INFO</div>
                            <div className="space-y-0.5 info-text">
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

                    <div className="border border-gray-300 rounded p-2">
                        <div className="font-bold text-xs text-gray-800 mb-1.5 flex items-center gap-1">
                            <FileCheck className="h-3 w-3" />
                            TESTS ORDERED ({testGroup.tests.length})
                        </div>
                        <div className="space-y-1 max-h-32 overflow-hidden">
                            {testGroup.tests.slice(0, 6).map((test, idx) => (
                                <div key={test.id} className="test-item border-b border-gray-200 pb-1">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-semibold text-xs">{idx + 1}. {test.medical_test.name}</div>
                                            <div className="text-xs text-gray-500">{test.medical_test.code} • {test.medical_test.category}</div>
                                        </div>
                                        <div className="text-right ml-2">
                                            <div className="font-bold text-xs">{formatCurrency(test.final_price)}</div>
                                            {test.discount_amount > 0 && (
                                                <div className="text-xs text-red-600 line-through">{formatCurrency(test.original_price)}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {testGroup.tests.length > 6 && (
                                <div className="text-center text-xs text-blue-600 font-medium pt-1">
                                    +{testGroup.tests.length - 6} more tests
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 total-text mb-2">
                    <div className="bg-gray-100 border border-gray-300 rounded p-2 text-center">
                        <div className="text-xs text-gray-600">Subtotal</div>
                        <div className="font-bold text-sm">{formatCurrency(testGroup.total_original_price)}</div>
                    </div>

                    {testGroup.total_discount > 0 ? (
                        <div className="bg-red-50 border border-red-300 rounded p-2 text-center">
                            <div className="text-xs text-red-600">Discount</div>
                            <div className="font-bold text-sm text-red-600">-{formatCurrency(testGroup.total_discount)}</div>
                        </div>
                    ) : (
                        <div className="bg-blue-50 border border-blue-300 rounded p-2 text-center col-span-2">
                            <div className="text-xs text-blue-600">Total Amount</div>
                            <div className="font-bold text-base text-blue-700">{formatCurrency(testGroup.final_amount)}</div>
                        </div>
                    )}

                    {testGroup.total_discount > 0 && (
                        <div className="bg-blue-50 border border-blue-300 rounded p-2 text-center">
                            <div className="text-xs text-blue-600">Total</div>
                            <div className="font-bold text-base text-blue-700">{formatCurrency(testGroup.final_amount)}</div>
                        </div>
                    )}

                    <div className={testGroup.total_discount > 0 ? '' : ''}>
                        <div className="bg-green-50 border border-green-300 rounded p-2 text-center h-full">
                            <div className="text-xs text-green-600">Paid</div>
                            <div className="font-bold text-base text-green-700">{formatCurrency(testGroup.paid_amount)}</div>
                        </div>
                    </div>
                </div>

                {testGroup.due_amount > 0 && (
                    <div className="bg-red-100 border-2 border-red-400 rounded p-2 text-center mb-2">
                        <div className="text-xs text-red-700 font-bold">REMAINING DUE</div>
                        <div className="font-bold text-lg text-red-700">{formatCurrency(testGroup.due_amount)}</div>
                    </div>
                )}

                <div className="pt-2 border-t border-gray-300">
                    <div className="flex justify-between items-center text-xs">
                        <div className="text-gray-600">Reports available in 24-48 hours</div>
                        <div className={`px-3 py-1 rounded-full font-bold text-xs ${testGroup.payment_status === 'paid'
                            ? 'bg-green-600 text-white'
                            : testGroup.payment_status === 'partial'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-red-600 text-white'
                            }`}>
                            {testGroup.payment_status.toUpperCase()}
                        </div>
                        <div className="text-gray-500">Print: {formatDate(new Date().toString())}</div>
                    </div>
                </div>
            </div>

            <div className="no-print text-center mt-6 mb-6">
                <button
                    onClick={() => window.history.back()}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
                >
                    Back to Tests
                </button>
            </div>
        </div>
    );
}
