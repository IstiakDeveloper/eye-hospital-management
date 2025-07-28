import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import AdminLayout from '@/layouts/admin-layout';
import {
    Eye,
    User,
    Calendar,
    FileText,
    Activity,
    Heart,
    Droplets,
    AlertCircle,
    Phone,
    MapPin,
    Clock,
    UserCheck,
    ArrowLeft,
    Printer,
    Edit
} from 'lucide-react';

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
        window.open(`/visiontests/${visionTest.id}/print`, '_blank');
    };

    const EyeExaminationSection = ({
        title,
        rightValue,
        leftValue,
        icon
    }: {
        title: string;
        rightValue: string;
        leftValue: string;
        icon: React.ReactNode;
    }) => (
        <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <h4 className="font-medium text-gray-900">{title}</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-600">Right Eye</label>
                    <p className="text-gray-900 mt-1">{rightValue || 'Not recorded'}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-600">Left Eye</label>
                    <p className="text-gray-900 mt-1">{leftValue || 'Not recorded'}</p>
                </div>
            </div>
        </div>
    );

    const MedicalConditionBadge = ({ condition, isTrue }: { condition: string; isTrue: boolean }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isTrue
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
            {condition}
            {isTrue && <AlertCircle className="w-3 h-3 ml-1" />}
        </span>
    );

    return (
        <AdminLayout>
            <Head title={`Vision Test Report - ${visionTest.patient.name}`} />

            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/visiontests"
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Vision Tests
                            </Link>
                            <div className="h-6 w-px bg-gray-300" />
                            <h1 className="text-2xl font-bold text-gray-900">Vision Test Report</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                Print Report
                            </button>

                            <Link
                                href={`/visiontests/${visionTest.id}/edit`}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Patient Information Header */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <User className="w-6 h-6 text-blue-600" />
                                <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                                    <p className="text-lg font-medium text-gray-900">{visionTest.patient.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Patient ID</label>
                                    <p className="text-lg font-medium text-gray-900">{visionTest.patient.patient_id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Phone</label>
                                        <p className="text-gray-900">{visionTest.patient.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Address</label>
                                        <p className="text-gray-900">{visionTest.patient.address || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Age</label>
                                    <p className="text-gray-900">{visionTest.patient.age} years</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Gender</label>
                                    <p className="text-gray-900 capitalize">{visionTest.patient.gender}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-l pl-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Clock className="w-6 h-6 text-green-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Test Information</h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Test Date</label>
                                    <p className="text-gray-900">{format(new Date(visionTest.test_date), 'PPP p')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-gray-500" />
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Performed By</label>
                                        <p className="text-gray-900">{visionTest.performed_by_user?.name || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chief Complaints */}
                {visionTest.complains && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-6 h-6 text-orange-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Chief Complaints</h3>
                        </div>
                        <p className="text-gray-900 leading-relaxed">{visionTest.complains}</p>
                    </div>
                )}

                {/* Medical Conditions */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Heart className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Medical Conditions</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        <MedicalConditionBadge condition="One Eyed" isTrue={visionTest.is_one_eyed} />
                        <MedicalConditionBadge condition="Diabetic" isTrue={visionTest.is_diabetic} />
                        <MedicalConditionBadge condition="Cardiac" isTrue={visionTest.is_cardiac} />
                        <MedicalConditionBadge condition="Asthmatic" isTrue={visionTest.is_asthmatic} />
                        <MedicalConditionBadge condition="Hypertensive" isTrue={visionTest.is_hypertensive} />
                        <MedicalConditionBadge condition="Thyroid" isTrue={visionTest.is_thyroid} />
                    </div>

                    {visionTest.other_conditions && (
                        <div className="mt-4">
                            <label className="text-sm font-medium text-gray-600">Other Conditions</label>
                            <p className="text-gray-900 mt-1">{visionTest.other_conditions}</p>
                        </div>
                    )}

                    {visionTest.drugs_used && (
                        <div className="mt-4">
                            <label className="text-sm font-medium text-gray-600">Current Medications</label>
                            <p className="text-gray-900 mt-1">{visionTest.drugs_used}</p>
                        </div>
                    )}
                </div>

                {/* Vital Signs */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Vital Signs & Lab Results</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm font-medium text-gray-600">Blood Pressure</label>
                            <p className="text-xl font-semibold text-gray-900 mt-1">
                                {visionTest.blood_pressure || 'Not recorded'}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm font-medium text-gray-600">Blood Sugar</label>
                            <p className="text-xl font-semibold text-gray-900 mt-1">
                                {visionTest.blood_sugar || 'Not recorded'}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm font-medium text-gray-600">Urine Sugar</label>
                            <p className="text-xl font-semibold text-gray-900 mt-1">
                                {visionTest.urine_sugar || 'Not recorded'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Vision Acuity */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Eye className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Vision Acuity</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EyeExaminationSection
                            title="Vision Without Glasses"
                            rightValue={visionTest.right_eye_vision_without_glass}
                            leftValue={visionTest.left_eye_vision_without_glass}
                            icon={<Eye className="w-5 h-5 text-blue-600" />}
                        />
                        <EyeExaminationSection
                            title="Vision With Glasses"
                            rightValue={visionTest.right_eye_vision_with_glass}
                            leftValue={visionTest.left_eye_vision_with_glass}
                            icon={<Eye className="w-5 h-5 text-green-600" />}
                        />
                    </div>
                </div>

                {/* Eye Examination */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Eye className="w-6 h-6 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Detailed Eye Examination</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <EyeExaminationSection
                            title="Eyelids"
                            rightValue={visionTest.right_eye_lids}
                            leftValue={visionTest.left_eye_lids}
                            icon={<Eye className="w-4 h-4 text-gray-600" />}
                        />
                        <EyeExaminationSection
                            title="Conjunctiva"
                            rightValue={visionTest.right_eye_conjunctiva}
                            leftValue={visionTest.left_eye_conjunctiva}
                            icon={<Eye className="w-4 h-4 text-gray-600" />}
                        />
                        <EyeExaminationSection
                            title="Cornea"
                            rightValue={visionTest.right_eye_cornea}
                            leftValue={visionTest.left_eye_cornea}
                            icon={<Eye className="w-4 h-4 text-gray-600" />}
                        />
                        <EyeExaminationSection
                            title="Anterior Chamber"
                            rightValue={visionTest.right_eye_anterior_chamber}
                            leftValue={visionTest.left_eye_anterior_chamber}
                            icon={<Eye className="w-4 h-4 text-gray-600" />}
                        />
                        <EyeExaminationSection
                            title="Iris"
                            rightValue={visionTest.right_eye_iris}
                            leftValue={visionTest.left_eye_iris}
                            icon={<Eye className="w-4 h-4 text-gray-600" />}
                        />
                        <EyeExaminationSection
                            title="Pupil"
                            rightValue={visionTest.right_eye_pupil}
                            leftValue={visionTest.left_eye_pupil}
                            icon={<Eye className="w-4 h-4 text-gray-600" />}
                        />
                        <EyeExaminationSection
                            title="Lens"
                            rightValue={visionTest.right_eye_lens}
                            leftValue={visionTest.left_eye_lens}
                            icon={<Eye className="w-4 h-4 text-gray-600" />}
                        />
                        <EyeExaminationSection
                            title="Ocular Movements"
                            rightValue={visionTest.right_eye_ocular_movements}
                            leftValue={visionTest.left_eye_ocular_movements}
                            icon={<Activity className="w-4 h-4 text-gray-600" />}
                        />
                        <EyeExaminationSection
                            title="Intraocular Pressure (IOP)"
                            rightValue={visionTest.right_eye_iop}
                            leftValue={visionTest.left_eye_iop}
                            icon={<Droplets className="w-4 h-4 text-blue-600" />}
                        />
                        <EyeExaminationSection
                            title="Lacrimal Ducts"
                            rightValue={visionTest.right_eye_ducts}
                            leftValue={visionTest.left_eye_ducts}
                            icon={<Droplets className="w-4 h-4 text-gray-600" />}
                        />
                    </div>
                </div>

                {/* Fundus Examination */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Eye className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Fundus Examination</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm font-medium text-gray-600 mb-2 block">Right Eye Fundus</label>
                            <p className="text-gray-900 leading-relaxed">
                                {visionTest.right_eye_fundus || 'Not examined'}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm font-medium text-gray-600 mb-2 block">Left Eye Fundus</label>
                            <p className="text-gray-900 leading-relaxed">
                                {visionTest.left_eye_fundus || 'Not examined'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Diagnosis */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Diagnosis</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <label className="text-sm font-medium text-green-800 mb-2 block">Right Eye Diagnosis</label>
                            <p className="text-green-900 font-medium">
                                {visionTest.right_eye_diagnosis || 'No diagnosis recorded'}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <label className="text-sm font-medium text-green-800 mb-2 block">Left Eye Diagnosis</label>
                            <p className="text-green-900 font-medium">
                                {visionTest.left_eye_diagnosis || 'No diagnosis recorded'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Detailed History */}
                {visionTest.detailed_history && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-6 h-6 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Detailed History</h3>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                                {visionTest.detailed_history}
                            </p>
                        </div>
                    </div>
                )}

                {/* Patient Visit History */}
                {patientVisits && patientVisits.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar className="w-6 h-6 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Recent Visit History</h3>
                        </div>

                        <div className="space-y-3">
                            {patientVisits.slice(0, 5).map((visit, index) => (
                                <div key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            Visit #{visit.id}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {format(new Date(visit.created_at), 'PPP')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            Dr. {visit.selectedDoctor?.user?.name || 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Show;
