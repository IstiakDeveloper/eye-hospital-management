import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Printer, ArrowLeft, Scissors, Building, DollarSign, Calendar, User } from 'lucide-react';

interface Patient {
    patient_id: string;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
    address?: string;
}

interface Operation {
    operation_name: string;
    operation_type: string;
}

interface Doctor {
    user: {
        name: string;
    };
    specialization?: string;
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

interface OperationBooking {
    id: number;
    booking_no: string;
    patient: Patient;
    operation: Operation;
    doctor: Doctor;
    scheduled_date: string;
    scheduled_time: string;
    base_amount?: number;
    discount_type?: 'percentage' | 'amount';
    discount_value?: number;
    discount_amount?: number;
    total_amount: number;
    advance_payment: number;
    due_amount: number;
    payment_status: string;
    status: string;
    notes?: string;
    payments: Payment[];
    created_at: string;
    // Eye surgery specific fields
    surgery_type?: string;
    eye_side?: 'left' | 'right';
    lens_type?: string;
    power?: string;
    surgery_remarks?: string;
}

interface Props {
    booking: OperationBooking;
}

export default function OperationBookingReceipt({ booking }: Props) {

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null) return '৳0.00';
        return `৳${parseFloat(amount.toString()).toFixed(2)}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (time: string) => {
        return time.slice(0, 5);
    };

    const formatDateTime = (date: string) => {
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
            margin: 3mm;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            font-size: 9px;
            overflow: hidden !important;
          }

          .no-print {
            display: none !important;
          }

          .receipt-box {
            width: 100% !important;
            height: 33.33vh !important;
            max-height: 33.33vh !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            padding: 4px !important;
            margin: 0 !important;
            font-size: 8px !important;
            border: 1.5px solid #7c3aed !important;
            position: relative !important;
          }

          .hospital-header {
            padding-bottom: 2px !important;
            margin-bottom: 3px !important;
          }

          .hospital-header h1 {
            font-size: 11px !important;
            line-height: 1.1 !important;
            margin-bottom: 1px !important;
          }

          .hospital-header p {
            font-size: 7px !important;
            line-height: 1.2 !important;
            margin: 0 !important;
          }

          .header-text {
            font-size: 11px !important;
          }

          .subheader-text {
            font-size: 7px !important;
          }

          .info-text {
            font-size: 7px !important;
            line-height: 1.2 !important;
          }

          .total-text {
            font-size: 8px !important;
          }

          .grid {
            gap: 3px !important;
          }

          .p-2 {
            padding: 3px !important;
          }

          .mb-2 {
            margin-bottom: 3px !important;
          }

          .text-xs {
            font-size: 7px !important;
          }

          .text-sm {
            font-size: 8px !important;
          }

          .text-base {
            font-size: 9px !important;
          }

          table {
            font-size: 7px !important;
          }

          table th, table td {
            padding: 2px !important;
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
            border: 2px solid #7c3aed;
          }
        }
      `}</style>

            <div className="no-print fixed top-4 right-4 z-50 flex gap-3">
                <button
                    onClick={() => router.visit('/operation-bookings')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                    <Printer className="w-4 h-4" />
                    Print
                </button>
            </div>

            <div className="receipt-box bg-white">

                <div className="hospital-header border-b-2 border-purple-600 pb-3 mb-4">
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
                        <div className="h-12 w-12 bg-purple-600 rounded-full hidden items-center justify-center flex-shrink-0">
                            <Building className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1 text-center">
                            <h1 className="text-base font-bold text-gray-900 leading-tight">
                                নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার
                            </h1>
                            <p className="text-[10px] text-purple-600 font-semibold uppercase">Operation Booking Receipt</p>
                            <div className="text-[10px] text-gray-700">
                                <span className="font-semibold">ঠিকানা:</span> সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ। |
                                <span className="font-semibold ml-1">যোগাযোগ:</span> ০১৩০৭-৮৮৫৫৬৬, ০১৩৩৪-৯২৫৯১০ | niehpc@gmail.com
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">

                    <div>
                        <div className="bg-purple-50 border-l-4 border-purple-600 p-2 mb-2">
                            <div className="font-bold text-xs text-purple-800 mb-1">PATIENT DETAILS</div>
                            <div className="space-y-0.5 info-text">
                                <div className="flex">
                                    <span className="w-16 text-gray-600">ID:</span>
                                    <span className="font-bold">{booking.patient.patient_id}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-16 text-gray-600">Name:</span>
                                    <span className="font-bold">{booking.patient.name}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-16 text-gray-600">Phone:</span>
                                    <span className="font-bold">{booking.patient.phone}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-16 text-gray-600">Age/Sex:</span>
                                    <span className="font-bold">{booking.patient.age || 'N/A'} / {booking.patient.gender || 'N/A'}</span>
                                </div>
                                {booking.patient.address && (
                                    <div className="flex">
                                        <span className="w-16 text-gray-600">Address:</span>
                                        <span className="font-bold text-xs">{booking.patient.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-green-50 border-l-4 border-green-600 p-2">
                            <div className="font-bold text-xs text-green-800 mb-1">RECEIPT INFO</div>
                            <div className="space-y-0.5 info-text">
                                <div className="flex">
                                    <span className="w-20 text-gray-600">Booking:</span>
                                    <span className="font-bold">{booking.booking_no}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-20 text-gray-600">Issue Date:</span>
                                    <span className="font-bold">{formatDate(booking.created_at)}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-20 text-gray-600">Issue Time:</span>
                                    <span className="font-bold">{formatDateTime(booking.created_at)}</span>
                                </div>
                                {booking.payments.length > 0 && (
                                    <>
                                        <div className="flex">
                                            <span className="w-20 text-gray-600">Method:</span>
                                            <span className="font-bold">{booking.payments[0].payment_method.name}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-20 text-gray-600">Received:</span>
                                            <span className="font-bold">{booking.payments[0].received_by.name}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="border border-purple-300 rounded p-2 mb-2 bg-purple-50">
                            <div className="font-bold text-xs text-purple-800 mb-1.5 flex items-center gap-1">
                                <Scissors className="h-3 w-3" />
                                OPERATION DETAILS
                            </div>
                            <div className="space-y-1 info-text">
                                <div>
                                    <div className="text-gray-600 text-xs">Operation Name</div>
                                    <div className="font-bold text-sm">{booking.operation.operation_name}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 text-xs">Type</div>
                                    <div className="font-semibold">{booking.operation.operation_type}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <div>
                                        <div className="text-gray-600 text-xs">Date</div>
                                        <div className="font-bold">{formatDate(booking.scheduled_date)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600 text-xs">Time</div>
                                        <div className="font-bold">{formatTime(booking.scheduled_time)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-blue-300 rounded p-2 bg-blue-50">
                            <div className="font-bold text-xs text-blue-800 mb-1.5 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                PERFORMING DOCTOR
                            </div>
                            <div className="info-text">
                                <div className="font-bold text-sm">{booking.doctor.user.name}</div>
                                {booking.doctor.specialization && (
                                    <div className="text-gray-600 text-xs">{booking.doctor.specialization}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Eye Surgery Details */}
                {(booking.surgery_type || booking.eye_side || booking.lens_type || booking.power) && (
                    <div className="bg-indigo-50 border border-indigo-300 rounded p-2 mb-2">
                        <div className="font-bold text-xs text-indigo-800 mb-1.5">EYE SURGERY DETAILS</div>
                        <div className="grid grid-cols-4 gap-2 info-text">
                            {booking.surgery_type && (
                                <div>
                                    <div className="text-gray-600 text-[9px]">Surgery Type</div>
                                    <div className="font-bold text-xs">{booking.surgery_type}</div>
                                </div>
                            )}
                            {booking.eye_side && (
                                <div>
                                    <div className="text-gray-600 text-[9px]">Eye Side</div>
                                    <div className="font-bold text-xs">
                                        {booking.eye_side === 'left' ? 'Left Eye' : 'Right Eye'}
                                    </div>
                                </div>
                            )}
                            {booking.lens_type && (
                                <div>
                                    <div className="text-gray-600 text-[9px]">Lens Type</div>
                                    <div className="font-bold text-xs">{booking.lens_type}</div>
                                </div>
                            )}
                            {booking.power && (
                                <div>
                                    <div className="text-gray-600 text-[9px]">Power</div>
                                    <div className="font-bold text-xs">{booking.power}</div>
                                </div>
                            )}
                        </div>
                        {booking.surgery_remarks && (
                            <div className="mt-1 pt-1 border-t border-indigo-200">
                                <div className="text-gray-600 text-[9px]">Remarks</div>
                                <div className="text-xs text-gray-700">{booking.surgery_remarks}</div>
                            </div>
                        )}
                    </div>
                )}

                {booking.notes && (
                    <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mb-2">
                        <div className="font-bold text-xs text-yellow-800 mb-1">NOTES</div>
                        <div className="text-xs text-gray-700">{booking.notes}</div>
                    </div>
                )}

                {/* Payment Summary */}
                {booking.discount_amount && booking.discount_amount > 0 ? (
                    <div className="grid grid-cols-4 gap-2 total-text mb-2">
                        <div className="bg-gray-50 border border-gray-300 rounded p-2 text-center">
                            <div className="text-xs text-gray-600">Base Amount</div>
                            <div className="font-bold text-sm text-gray-700">{formatCurrency(booking.base_amount)}</div>
                        </div>
                        <div className="bg-orange-50 border border-orange-300 rounded p-2 text-center">
                            <div className="text-xs text-orange-600">Discount</div>
                            <div className="font-bold text-sm text-orange-700">-{formatCurrency(booking.discount_amount)}</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-300 rounded p-2 text-center">
                            <div className="text-xs text-blue-600">Total Cost</div>
                            <div className="font-bold text-sm text-blue-700">{formatCurrency(booking.total_amount)}</div>
                        </div>
                        <div className="bg-green-50 border border-green-300 rounded p-2 text-center">
                            <div className="text-xs text-green-600">Paid Amount</div>
                            <div className="font-bold text-sm text-green-700">{formatCurrency(booking.advance_payment)}</div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2 total-text mb-2">
                        <div className="bg-blue-50 border border-blue-300 rounded p-2 text-center">
                            <div className="text-xs text-blue-600">Total Cost</div>
                            <div className="font-bold text-base text-blue-700">{formatCurrency(booking.total_amount)}</div>
                        </div>
                        <div className="bg-green-50 border border-green-300 rounded p-2 text-center">
                            <div className="text-xs text-green-600">Paid Amount</div>
                            <div className="font-bold text-base text-green-700">{formatCurrency(booking.advance_payment)}</div>
                        </div>
                        <div className={`border rounded p-2 text-center ${booking.due_amount > 0
                            ? 'bg-red-50 border-red-300'
                            : 'bg-green-50 border-green-300'
                            }`}>
                            <div className={`text-xs ${booking.due_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                Due Amount
                            </div>
                            <div className={`font-bold text-base ${booking.due_amount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                {formatCurrency(booking.due_amount)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Due Amount - Always show separately if there is due */}
                {booking.discount_amount && booking.discount_amount > 0 && booking.due_amount > 0 && (
                    <div className="mb-2">
                        <div className="bg-red-50 border border-red-300 rounded p-2 text-center">
                            <div className="text-xs text-red-600">Due Amount</div>
                            <div className="font-bold text-base text-red-700">{formatCurrency(booking.due_amount)}</div>
                        </div>
                    </div>
                )}

                {booking.payments.length > 0 && (
                    <div className="mb-2">
                        <div className="font-bold text-xs text-gray-800 mb-1">PAYMENT HISTORY</div>
                        <table className="w-full text-xs border border-gray-300">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-1 text-left border-b">Date</th>
                                    <th className="p-1 text-left border-b">Payment #</th>
                                    <th className="p-1 text-left border-b">Method</th>
                                    <th className="p-1 text-right border-b">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {booking.payments.map((payment, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="p-1">{formatDate(payment.payment_date)}</td>
                                        <td className="p-1">{payment.payment_number}</td>
                                        <td className="p-1">{payment.payment_method.name}</td>
                                        <td className="p-1 text-right font-bold">{formatCurrency(payment.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="pt-2 border-t border-gray-300">
                    <div className="flex justify-between items-center text-xs">
                        <div className="text-gray-600">Please arrive 30 minutes before scheduled time</div>
                        <div className="flex gap-2">
                            <div className={`px-3 py-1 rounded-full font-bold text-xs ${booking.status === 'completed'
                                ? 'bg-green-600 text-white'
                                : booking.status === 'confirmed'
                                    ? 'bg-purple-600 text-white'
                                    : booking.status === 'scheduled'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-600 text-white'
                                }`}>
                                {booking.status.toUpperCase()}
                            </div>
                            <div className={`px-3 py-1 rounded-full font-bold text-xs ${booking.payment_status === 'paid'
                                ? 'bg-green-600 text-white'
                                : booking.payment_status === 'partial'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-red-600 text-white'
                                }`}>
                                {booking.payment_status.toUpperCase()}
                            </div>
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
                    Back to Bookings
                </button>
            </div>
        </div>
    );
}
