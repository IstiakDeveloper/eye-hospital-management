import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Eye, Printer, QrCode } from 'lucide-react';
import React from 'react';

interface VisionTest {
    id: number;
    patient_id: number;
    visit_id: number;
    performed_by: number;
    test_date: string;
    complains: string;

    // Eye Examinations
    right_eye_diagnosis: string;
    left_eye_diagnosis: string;
    right_eye_lids: string;
    left_eye_lids: string;
    right_eye_conjunctiva: string;
    left_eye_conjunctiva: string;
    right_eye_cornea: string;
    left_eye_cornea: string;
    right_eye_anterior_chamber: string;
    left_eye_anterior_chamber: string;
    right_eye_iris: string;
    left_eye_iris: string;
    right_eye_pupil: string;
    left_eye_pupil: string;
    right_eye_lens: string;
    left_eye_lens: string;
    right_eye_ocular_movements: string;
    left_eye_ocular_movements: string;

    // Vision Tests
    right_eye_vision_without_glass: string;
    left_eye_vision_without_glass: string;
    right_eye_vision_with_glass: string;
    left_eye_vision_with_glass: string;
    right_eye_iop: string;
    left_eye_iop: string;
    right_eye_ducts: string;
    left_eye_ducts: string;
    right_eye_fundus: string;
    left_eye_fundus: string;

    // Medical Information
    blood_pressure: string;
    urine_sugar: string;
    blood_sugar: string;
    detailed_history: string;

    // Medical Conditions
    is_one_eyed: boolean;
    is_diabetic: boolean;
    is_cardiac: boolean;
    is_asthmatic: boolean;
    is_hypertensive: boolean;
    is_thyroid: boolean;
    other_conditions: string;
    drugs_used: string;

    // Relations
    patient: {
        id: number;
        name: string;
        patient_id: string;
        phone: string;
        address: string;
        age: number;
        gender: string;
    };

    performed_by_user: {
        id: number;
        name: string;
    };
}

interface PatientVisit {
    id: number;
    patient_id: number;
    selected_doctor_id: number;
    created_at: string;
    selectedDoctor: {
        user: {
            name: string;
        };
    };
}

interface Props {
    visionTest: VisionTest;
    patientVisits: PatientVisit[];
}

const Show: React.FC<Props> = ({ visionTest, patientVisits }) => {
    const { url } = usePage();

    const handlePrint = () => {
        window.open(route('visiontests.print', visionTest.id), '_blank');
    };

    const CheckboxField = ({ label, checked }: { label: string; checked: boolean }) => (
        <div className="flex items-center gap-2">
            <div
                className={`flex h-4 w-4 items-center justify-center rounded border-2 border-gray-400 ${
                    checked ? 'border-black bg-black' : 'bg-white'
                }`}
            >
                {checked && <span className="text-xs text-white">✓</span>}
            </div>
            <span className="text-sm font-medium text-gray-900">{label}</span>
        </div>
    );

    return (
        <AdminLayout>
            <Head title={`Vision Test Report - ${visionTest.patient.name}`} />

            {/* Header Actions */}
            <div className="mb-6 border-b bg-white shadow-sm">
                <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/visiontests" className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900">
                                <ArrowLeft className="h-5 w-5" />
                                Back to Vision Tests
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                            >
                                <Printer className="h-4 w-4" />
                                Print Report
                            </button>

                            <Link
                                href={`/visiontests/${visionTest.id}/edit`}
                                className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vision Test Report */}
            <div className="mx-auto pb-8">
                <div className="rounded-lg border bg-white shadow-lg">
                    {/* Hospital Header */}
                    <div className="rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                                    <Eye className="h-8 w-8 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">নওগাঁ ইসলামিয়া চক্ষু হাসপাতাল এন্ড ফ্যাকো সেন্টার</h1>
                                    <p className="text-blue-100">সার্কিট হাউজ সংলগ্ন, মেইন রোড, নওগাঁ।</p>
                                    <p className="text-blue-100">মোবাইল: ০১৩০৭-৮৮৫৫৬৬; ইমেইল: niehpc@gmail.com</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <QrCode className="h-16 w-16 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Date and Title */}
                    <div className="border-b bg-gray-50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{format(new Date(visionTest.test_date), 'dd/MM/yyyy')}</p>
                                <p className="text-sm text-gray-600">{format(new Date(visionTest.test_date), 'hh:mm a')}</p>
                            </div>
                            <div className="text-center">
                                <h2 className="border border-gray-400 px-8 py-2 text-xl font-bold text-gray-900">Particulars of Patient</h2>
                            </div>
                            <div></div>
                        </div>
                    </div>

                    {/* Patient Information Grid */}
                    <div className="p-6">
                        <div className="mb-6 grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex">
                                    <label className="w-20 font-semibold text-gray-900">Invoice:</label>
                                    <div className="flex-1 border-b border-gray-400 pb-1">000001</div>
                                </div>
                                <div className="flex">
                                    <label className="w-20 font-semibold text-gray-900">Name:</label>
                                    <div className="flex-1 border-b border-gray-400 pb-1">{visionTest.patient.name}</div>
                                </div>
                                <div className="flex">
                                    <label className="w-20 font-semibold text-gray-900">Age:</label>
                                    <div className="flex-1 border-b border-gray-400 pb-1">{visionTest.patient.age}</div>
                                </div>
                                <div className="flex">
                                    <label className="w-20 font-semibold text-gray-900">Sex:</label>
                                    <div className="flex-1 border-b border-gray-400 pb-1 capitalize">{visionTest.patient.gender}</div>
                                </div>
                                <div className="flex">
                                    <label className="w-20 font-semibold text-gray-900">Address:</label>
                                    <div className="flex-1 border-b border-gray-400 pb-1">{visionTest.patient.address}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex">
                                    <label className="w-24 font-semibold text-gray-900">Patient ID:</label>
                                    <div className="flex-1 border-b border-gray-400 pb-1">{visionTest.patient.patient_id}</div>
                                </div>
                                <div className="flex">
                                    <label className="w-24 font-semibold text-gray-900">Patient Type:</label>
                                    <div className="flex-1 border-b border-gray-400 pb-1">Regular</div>
                                </div>
                                <div className="flex">
                                    <label className="w-24 font-semibold text-gray-900">Guardian:</label>
                                    <div className="flex-1 border-b border-gray-400 pb-1"></div>
                                </div>
                                <div className="flex">
                                    <label className="w-24 font-semibold text-gray-900">Mobile:</label>
                                    <div className="flex-1 border-b border-gray-400 pb-1">{visionTest.patient.phone}</div>
                                </div>
                            </div>
                        </div>

                        {/* Complains */}
                        <div className="mb-6">
                            <label className="mb-2 block font-semibold text-gray-900">Complains:</label>
                            <div className="min-h-16 border border-gray-400 bg-gray-50 p-3">{visionTest.complains || ''}</div>
                        </div>

                        {/* Eye Examination Table */}
                        <div className="mb-6">
                            <table className="w-full border-collapse border border-gray-400">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-400 p-2 text-left font-semibold"></th>
                                        <th className="border border-gray-400 p-2 text-center font-semibold">Right Eye</th>
                                        <th className="border border-gray-400 p-2 text-center font-semibold">Left Eye</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Diagnosis</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_diagnosis || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_diagnosis || ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Lids</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_lids || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_lids || ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Conjunctiva</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_conjunctiva || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_conjunctiva || ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Cornea</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_cornea || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_cornea || ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Anterior Chamber</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_anterior_chamber || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_anterior_chamber || ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Iris</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_iris || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_iris || ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Pupil</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_pupil || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_pupil || ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Lens</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_lens || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_lens || ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Ocular movements</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_ocular_movements || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_ocular_movements || ''}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Vision Test Table */}
                        <div className="mb-6">
                            <table className="w-full border-collapse border border-gray-400">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-400 p-2 text-left font-semibold"></th>
                                        <th className="border border-gray-400 p-2 text-center font-semibold">Right Eye</th>
                                        <th className="border border-gray-400 p-2 text-center font-semibold">Left Eye</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Vision Without Glass</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_vision_without_glass || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_vision_without_glass || ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Vision With Glass/pinhole</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_vision_with_glass || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_vision_with_glass || ''}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">IOP</td>
                                        <td className="border border-gray-400 p-2">
                                            {visionTest.right_eye_iop ? `${visionTest.right_eye_iop} mmHg` : ''}
                                        </td>
                                        <td className="border border-gray-400 p-2">
                                            {visionTest.left_eye_iop ? `${visionTest.left_eye_iop} mmHg` : ''}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 bg-gray-50 p-2 font-semibold">Ducts</td>
                                        <td className="border border-gray-400 p-2">{visionTest.right_eye_ducts || ''}</td>
                                        <td className="border border-gray-400 p-2">{visionTest.left_eye_ducts || ''}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Lab Results Table */}
                        <div className="mb-6">
                            <table className="w-full border-collapse border border-gray-400">
                                <tbody>
                                    <tr>
                                        <td className="w-1/3 border border-gray-400 bg-gray-50 p-2 font-semibold">B.P</td>
                                        <td className="w-1/3 border border-gray-400 bg-gray-50 p-2 font-semibold">Urine Sugar</td>
                                        <td className="w-1/3 border border-gray-400 bg-gray-50 p-2 font-semibold">Blood Sugar</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-400 p-3">{visionTest.blood_pressure || ''}</td>
                                        <td className="border border-gray-400 p-3">{visionTest.urine_sugar || ''}</td>
                                        <td className="border border-gray-400 p-3">{visionTest.blood_sugar || ''}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Fundus Examination */}
                        <div className="mb-6">
                            <table className="w-full border-collapse border border-gray-400">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-400 p-2 text-left font-semibold">Fundus:</th>
                                        <th className="border border-gray-400 p-2 text-center font-semibold">Right Eye</th>
                                        <th className="border border-gray-400 p-2 text-center font-semibold">Left Eye</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-400 p-2"></td>
                                        <td className="border border-gray-400 p-3">{visionTest.right_eye_fundus || ''}</td>
                                        <td className="border border-gray-400 p-3">{visionTest.left_eye_fundus || ''}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Detailed History */}
                        <div className="mb-6">
                            <label className="mb-2 block font-semibold text-gray-900">Detailed History: (Immediate Past and Treatment History)</label>
                            <div className="min-h-20 border border-gray-400 bg-gray-50 p-3">{visionTest.detailed_history || ''}</div>
                        </div>

                        {/* Drug Used */}
                        <div className="mb-6">
                            <label className="mb-2 block font-semibold text-gray-900">Drug Used:</label>
                            <div className="mb-4 grid grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <CheckboxField label="ONE EYED" checked={visionTest.is_one_eyed} />
                                    <CheckboxField label="DIABETIC" checked={visionTest.is_diabetic} />
                                </div>
                                <div className="space-y-2">
                                    <CheckboxField label="CARDIAC" checked={visionTest.is_cardiac} />
                                    <CheckboxField label="ASTHMATIC" checked={visionTest.is_asthmatic} />
                                </div>
                                <div className="space-y-2">
                                    <CheckboxField label="HYPERTENSIVE" checked={visionTest.is_hypertensive} />
                                    <CheckboxField label="THYROID" checked={visionTest.is_thyroid} />
                                </div>
                            </div>

                            <div className="mb-4 flex items-center gap-2">
                                <span className="font-semibold text-gray-900">OTHERS:</span>
                                <div className="flex-1 border-b border-gray-400 pb-1">{visionTest.other_conditions || ''}</div>
                            </div>
                        </div>

                        {/* Current Medications */}
                        <div className="mb-8">
                            <label className="mb-2 block font-semibold text-gray-900">Current Medications:</label>
                            <div className="min-h-16 border border-gray-400 bg-gray-50 p-3">{visionTest.drugs_used || ''}</div>
                        </div>

                        {/* Signature Section */}
                        <div className="grid grid-cols-2 gap-8 border-t border-gray-300 pt-8">
                            <div className="text-center">
                                <div className="mb-2 h-16 border-b border-gray-400"></div>
                                <p className="font-semibold text-gray-900">Patient's Signature</p>
                            </div>
                            <div className="text-center">
                                <div className="mb-4 text-right">
                                    <p className="font-semibold text-gray-900">Refractionist</p>
                                    <p className="text-sm text-gray-600">Vision Test Examiner</p>
                                    <p className="text-sm text-gray-600">Date: {format(new Date(visionTest.test_date), 'dd/MM/yyyy')}</p>
                                </div>
                                <div className="mb-2 h-16 border-b border-gray-400"></div>
                                <p className="font-semibold text-gray-900">Examiner's Signature & Seal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Show;
