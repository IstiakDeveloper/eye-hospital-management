// resources/js/Pages/VisionTests/Create.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';
import { calculateAge } from '@/lib/utils';
import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, Calendar, Clock, Download, Save, User, X } from 'lucide-react';
import React from 'react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
    email: string | null;
}

interface Visit {
    id: number;
    visit_id: string;
    chief_complaint: string | null;
    payment_status: string;
    vision_test_status: string;
    overall_status: string;
    payment_completed_at: string | null;
}

interface LatestTest {
    id: number;
    complains: string | null;
    right_eye_diagnosis: string | null;
    left_eye_diagnosis: string | null;
    right_eye_lids: string | null;
    left_eye_lids: string | null;
    right_eye_conjunctiva: string | null;
    left_eye_conjunctiva: string | null;
    right_eye_cornea: string | null;
    left_eye_cornea: string | null;
    right_eye_anterior_chamber: string | null;
    left_eye_anterior_chamber: string | null;
    right_eye_iris: string | null;
    left_eye_iris: string | null;
    right_eye_pupil: string | null;
    left_eye_pupil: string | null;
    right_eye_lens: string | null;
    left_eye_lens: string | null;
    right_eye_ocular_movements: string | null;
    left_eye_ocular_movements: string | null;
    right_eye_vision_without_glass: string | null;
    left_eye_vision_without_glass: string | null;
    right_eye_vision_with_glass: string | null;
    left_eye_vision_with_glass: string | null;
    right_eye_iop: string | null;
    left_eye_iop: string | null;
    right_eye_ducts: string | null;
    left_eye_ducts: string | null;
    blood_pressure: string | null;
    urine_sugar: string | null;
    blood_sugar: string | null;
    right_eye_fundus: string | null;
    left_eye_fundus: string | null;
    detailed_history: string | null;
    is_one_eyed: boolean;
    is_diabetic: boolean;
    is_cardiac: boolean;
    is_asthmatic: boolean;
    is_hypertensive: boolean;
    is_thyroid: boolean;
    other_conditions: string | null;
    drugs_used: string | null;
    test_date: string;
}

interface VisionTestCreateProps {
    patient: Patient;
    visit: Visit;
    latestTest: LatestTest | null;
}

export default function VisionTestCreate({ patient, visit, latestTest }: VisionTestCreateProps) {
    const [isDownloading, setIsDownloading] = React.useState(false);

    const { data, setData, post, processing, errors } = useForm({
        // Physical Examination
        right_eye_diagnosis: latestTest?.right_eye_diagnosis || '',
        left_eye_diagnosis: latestTest?.left_eye_diagnosis || '',
        right_eye_lids: latestTest?.right_eye_lids || '',
        left_eye_lids: latestTest?.left_eye_lids || '',
        right_eye_conjunctiva: latestTest?.right_eye_conjunctiva || '',
        left_eye_conjunctiva: latestTest?.left_eye_conjunctiva || '',
        right_eye_cornea: latestTest?.right_eye_cornea || '',
        left_eye_cornea: latestTest?.left_eye_cornea || '',
        right_eye_anterior_chamber: latestTest?.right_eye_anterior_chamber || '',
        left_eye_anterior_chamber: latestTest?.left_eye_anterior_chamber || '',
        right_eye_iris: latestTest?.right_eye_iris || '',
        left_eye_iris: latestTest?.left_eye_iris || '',
        right_eye_pupil: latestTest?.right_eye_pupil || '',
        left_eye_pupil: latestTest?.left_eye_pupil || '',
        right_eye_lens: latestTest?.right_eye_lens || '',
        left_eye_lens: latestTest?.left_eye_lens || '',
        right_eye_ocular_movements: latestTest?.right_eye_ocular_movements || '',
        left_eye_ocular_movements: latestTest?.left_eye_ocular_movements || '',

        // Vision Testing
        right_eye_vision_without_glass: latestTest?.right_eye_vision_without_glass || '',
        left_eye_vision_without_glass: latestTest?.left_eye_vision_without_glass || '',
        right_eye_vision_with_glass: latestTest?.right_eye_vision_with_glass || '',
        left_eye_vision_with_glass: latestTest?.left_eye_vision_with_glass || '',
        right_eye_iop: latestTest?.right_eye_iop || '',
        left_eye_iop: latestTest?.left_eye_iop || '',
        right_eye_ducts: latestTest?.right_eye_ducts || '',
        left_eye_ducts: latestTest?.left_eye_ducts || '',

        // Vitals and Tests
        blood_pressure: latestTest?.blood_pressure || '',
        urine_sugar: latestTest?.urine_sugar || '',
        blood_sugar: latestTest?.blood_sugar || '',
        right_eye_fundus: latestTest?.right_eye_fundus || '',
        left_eye_fundus: latestTest?.left_eye_fundus || '',

        // History and Medical Conditions
        detailed_history: latestTest?.detailed_history || '',
        is_one_eyed: latestTest?.is_one_eyed || false,
        is_diabetic: latestTest?.is_diabetic || false,
        is_cardiac: latestTest?.is_cardiac || false,
        is_asthmatic: latestTest?.is_asthmatic || false,
        is_hypertensive: latestTest?.is_hypertensive || false,
        is_thyroid: latestTest?.is_thyroid || false,
        other_conditions: latestTest?.other_conditions || '',
        drugs_used: latestTest?.drugs_used || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isDoctorPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/doctor/');
        const storeRouteName = isDoctorPath ? 'doctor.vision-tests.store' : 'visiontests.store';
        post(route(storeRouteName, patient.id));
    };

    const commonVisionValues = ['6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', 'CF', 'HM', 'PL', 'NPL'];
    const commonIOPValues = ['10', '12', '14', '16', '18', '20', '22'];
    const commonBPValues = ['120/80', '130/85', '140/90', '150/95'];

    const handleDownloadBlankReport = async () => {
        setIsDownloading(true);
        try {
            // Use window.open for direct download
            window.open(route('visiontests.download-blank', patient.id), '_blank');
            setIsDownloading(false);
        } catch (error) {
            setIsDownloading(false);
            alert('Failed to download blank report. Please try again.');
        }
    };
    const QuickSelectButton = ({ value, onClick, current }: { value: string; onClick: () => void; current: string }) => (
        <button
            type="button"
            onClick={onClick}
            className={`h-7 rounded-md border px-2 text-xs leading-none transition-colors focus-visible:ring-0 focus-visible:outline-none active:scale-100 ${
                current === value ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
        >
            {value}
        </button>
    );

    return (
        <AdminLayout title="Vision Test">
            <Head title="Record Vision Test" />

            <div className="mx-auto max-w-5xl space-y-4">
                {/* Patient header (compact) */}
                <Card className="border-gray-200">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-semibold text-gray-900">{patient.name}</h2>
                                        <Badge variant="outline">ID: {patient.patient_id}</Badge>
                                        <Badge variant="outline">Visit: {visit.visit_id}</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                        {patient.date_of_birth && (
                                            <span className="inline-flex items-center gap-1">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                Age: {calculateAge(patient.date_of_birth)}
                                            </span>
                                        )}
                                        {patient.gender && (
                                            <span className="inline-flex items-center gap-1">
                                                <User className="h-4 w-4 text-gray-400" />
                                                {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                                            </span>
                                        )}
                                        {latestTest && (
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                Last: {new Date(latestTest.test_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadBlankReport}
                                disabled={isDownloading}
                                className="flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                {isDownloading ? 'Downloading…' : 'Blank Print'}
                            </Button>
                        </div>

                        {/* Complaints readonly */}
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-900">
                                <AlertCircle className="h-4 w-4" />
                                Patient Complaints & Symptoms (from registration)
                            </div>
                            <div className="text-sm text-gray-800">
                                {visit.chief_complaint ? (
                                    <p className="whitespace-pre-wrap">{visit.chief_complaint}</p>
                                ) : (
                                    <p className="text-gray-600">No complaints were entered during registration.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* One-page form */}
                <Card className="border-gray-200">
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg">Vision Test Form (One Page)</CardTitle>
                        <CardDescription className="text-sm">Minimal professional layout.</CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 p-4">
                            {/* Diagnosis */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Right Eye Diagnosis (OD)</label>
                                    <Input
                                        value={data.right_eye_diagnosis}
                                        onChange={(e) => setData('right_eye_diagnosis', e.target.value)}
                                        error={errors.right_eye_diagnosis}
                                        placeholder="Normal / Cataract / …"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Left Eye Diagnosis (OS)</label>
                                    <Input
                                        value={data.left_eye_diagnosis}
                                        onChange={(e) => setData('left_eye_diagnosis', e.target.value)}
                                        error={errors.left_eye_diagnosis}
                                        placeholder="Normal / Cataract / …"
                                    />
                                </div>
                            </div>

                            {/* Examination */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Card className="border-gray-200">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm font-semibold text-gray-900">Right Eye (OD)</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 gap-3 p-4 pt-0">
                                        {[
                                            { key: 'right_eye_lids', label: 'Lids' },
                                            { key: 'right_eye_conjunctiva', label: 'Conjunctiva' },
                                            { key: 'right_eye_cornea', label: 'Cornea' },
                                            { key: 'right_eye_anterior_chamber', label: 'Anterior Chamber' },
                                            { key: 'right_eye_iris', label: 'Iris' },
                                            { key: 'right_eye_pupil', label: 'Pupil' },
                                            { key: 'right_eye_lens', label: 'Lens' },
                                            { key: 'right_eye_ocular_movements', label: 'Ocular Movements' },
                                        ].map(({ key, label }) => (
                                            <div key={key}>
                                                <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
                                                <Input
                                                    value={data[key as keyof typeof data] as string}
                                                    onChange={(e) => setData(key as keyof typeof data, e.target.value)}
                                                    error={errors[key as keyof typeof errors]}
                                                    placeholder="NAD / Normal / …"
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card className="border-gray-200">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm font-semibold text-gray-900">Left Eye (OS)</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 gap-3 p-4 pt-0">
                                        {[
                                            { key: 'left_eye_lids', label: 'Lids' },
                                            { key: 'left_eye_conjunctiva', label: 'Conjunctiva' },
                                            { key: 'left_eye_cornea', label: 'Cornea' },
                                            { key: 'left_eye_anterior_chamber', label: 'Anterior Chamber' },
                                            { key: 'left_eye_iris', label: 'Iris' },
                                            { key: 'left_eye_pupil', label: 'Pupil' },
                                            { key: 'left_eye_lens', label: 'Lens' },
                                            { key: 'left_eye_ocular_movements', label: 'Ocular Movements' },
                                        ].map(({ key, label }) => (
                                            <div key={key}>
                                                <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
                                                <Input
                                                    value={data[key as keyof typeof data] as string}
                                                    onChange={(e) => setData(key as keyof typeof data, e.target.value)}
                                                    error={errors[key as keyof typeof errors]}
                                                    placeholder="NAD / Normal / …"
                                                />
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Vision */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Card className="border-gray-200">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm font-semibold text-gray-900">Vision (OD)</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 p-4 pt-0">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Without Glass</label>
                                            <Input
                                                value={data.right_eye_vision_without_glass}
                                                onChange={(e) => setData('right_eye_vision_without_glass', e.target.value)}
                                                error={errors.right_eye_vision_without_glass}
                                                placeholder="6/6"
                                                className="mb-2"
                                            />
                                            <div className="flex flex-wrap gap-1">
                                                {commonVisionValues.map((value) => (
                                                    <QuickSelectButton
                                                        key={value}
                                                        value={value}
                                                        current={data.right_eye_vision_without_glass}
                                                        onClick={() => setData('right_eye_vision_without_glass', value)}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">With Glass/Pinhole</label>
                                            <Input
                                                value={data.right_eye_vision_with_glass}
                                                onChange={(e) => setData('right_eye_vision_with_glass', e.target.value)}
                                                error={errors.right_eye_vision_with_glass}
                                                placeholder="6/6"
                                                className="mb-2"
                                            />
                                            <div className="flex flex-wrap gap-1">
                                                {commonVisionValues.map((value) => (
                                                    <QuickSelectButton
                                                        key={value}
                                                        value={value}
                                                        current={data.right_eye_vision_with_glass}
                                                        onClick={() => setData('right_eye_vision_with_glass', value)}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">IOP</label>
                                            <Input
                                                value={data.right_eye_iop}
                                                onChange={(e) => setData('right_eye_iop', e.target.value)}
                                                error={errors.right_eye_iop}
                                                placeholder="14 mmHg"
                                                className="mb-2"
                                            />
                                            <div className="flex flex-wrap gap-1">
                                                {commonIOPValues.map((value) => (
                                                    <QuickSelectButton
                                                        key={value}
                                                        value={`${value} mmHg`}
                                                        current={data.right_eye_iop}
                                                        onClick={() => setData('right_eye_iop', `${value} mmHg`)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-gray-200">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm font-semibold text-gray-900">Vision (OS)</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 p-4 pt-0">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Without Glass</label>
                                            <Input
                                                value={data.left_eye_vision_without_glass}
                                                onChange={(e) => setData('left_eye_vision_without_glass', e.target.value)}
                                                error={errors.left_eye_vision_without_glass}
                                                placeholder="6/6"
                                                className="mb-2"
                                            />
                                            <div className="flex flex-wrap gap-1">
                                                {commonVisionValues.map((value) => (
                                                    <QuickSelectButton
                                                        key={value}
                                                        value={value}
                                                        current={data.left_eye_vision_without_glass}
                                                        onClick={() => setData('left_eye_vision_without_glass', value)}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">With Glass/Pinhole</label>
                                            <Input
                                                value={data.left_eye_vision_with_glass}
                                                onChange={(e) => setData('left_eye_vision_with_glass', e.target.value)}
                                                error={errors.left_eye_vision_with_glass}
                                                placeholder="6/6"
                                                className="mb-2"
                                            />
                                            <div className="flex flex-wrap gap-1">
                                                {commonVisionValues.map((value) => (
                                                    <QuickSelectButton
                                                        key={value}
                                                        value={value}
                                                        current={data.left_eye_vision_with_glass}
                                                        onClick={() => setData('left_eye_vision_with_glass', value)}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">IOP</label>
                                            <Input
                                                value={data.left_eye_iop}
                                                onChange={(e) => setData('left_eye_iop', e.target.value)}
                                                error={errors.left_eye_iop}
                                                placeholder="14 mmHg"
                                                className="mb-2"
                                            />
                                            <div className="flex flex-wrap gap-1">
                                                {commonIOPValues.map((value) => (
                                                    <QuickSelectButton
                                                        key={value}
                                                        value={`${value} mmHg`}
                                                        current={data.left_eye_iop}
                                                        onClick={() => setData('left_eye_iop', `${value} mmHg`)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Ducts + Vitals */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Card className="border-gray-200">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm font-semibold text-gray-900">Ducts</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 gap-3 p-4 pt-0">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Right Eye Ducts</label>
                                            <Input
                                                value={data.right_eye_ducts}
                                                onChange={(e) => setData('right_eye_ducts', e.target.value)}
                                                error={errors.right_eye_ducts}
                                                placeholder="…"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Left Eye Ducts</label>
                                            <Input
                                                value={data.left_eye_ducts}
                                                onChange={(e) => setData('left_eye_ducts', e.target.value)}
                                                error={errors.left_eye_ducts}
                                                placeholder="…"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-gray-200">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm font-semibold text-gray-900">Vitals & Tests</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 gap-3 p-4 pt-0">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Blood Pressure</label>
                                            <Input
                                                value={data.blood_pressure}
                                                onChange={(e) => setData('blood_pressure', e.target.value)}
                                                error={errors.blood_pressure}
                                                placeholder="120/80"
                                                className="mb-2"
                                            />
                                            <div className="flex flex-wrap gap-1">
                                                {commonBPValues.map((value) => (
                                                    <QuickSelectButton
                                                        key={value}
                                                        value={value}
                                                        current={data.blood_pressure}
                                                        onClick={() => setData('blood_pressure', value)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Urine Sugar</label>
                                            <Input
                                                value={data.urine_sugar}
                                                onChange={(e) => setData('urine_sugar', e.target.value)}
                                                error={errors.urine_sugar}
                                                placeholder="Negative"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Blood Sugar</label>
                                            <Input
                                                value={data.blood_sugar}
                                                onChange={(e) => setData('blood_sugar', e.target.value)}
                                                error={errors.blood_sugar}
                                                placeholder="120 mg/dl"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Fundus + History + Conditions + Drugs */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Card className="border-gray-200">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm font-semibold text-gray-900">Fundus</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 gap-3 p-4 pt-0">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Right Fundus</label>
                                            <textarea
                                                value={data.right_eye_fundus}
                                                onChange={(e) => setData('right_eye_fundus', e.target.value)}
                                                rows={3}
                                                className={`block w-full resize-none rounded-lg border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                                                    errors.right_eye_fundus ? 'border-red-500 focus:ring-red-500' : ''
                                                }`}
                                                placeholder="…"
                                            />
                                            {errors.right_eye_fundus && <p className="mt-1 text-xs text-red-600">{errors.right_eye_fundus}</p>}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Left Fundus</label>
                                            <textarea
                                                value={data.left_eye_fundus}
                                                onChange={(e) => setData('left_eye_fundus', e.target.value)}
                                                rows={3}
                                                className={`block w-full resize-none rounded-lg border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                                                    errors.left_eye_fundus ? 'border-red-500 focus:ring-red-500' : ''
                                                }`}
                                                placeholder="…"
                                            />
                                            {errors.left_eye_fundus && <p className="mt-1 text-xs text-red-600">{errors.left_eye_fundus}</p>}
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 gap-4">
                                    <Card className="border-gray-200">
                                        <CardHeader className="py-3">
                                            <CardTitle className="text-sm font-semibold text-gray-900">Detailed History</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <textarea
                                                value={data.detailed_history}
                                                onChange={(e) => setData('detailed_history', e.target.value)}
                                                rows={5}
                                                className={`block w-full resize-none rounded-lg border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                                                    errors.detailed_history ? 'border-red-500 focus:ring-red-500' : ''
                                                }`}
                                                placeholder="Immediate past + treatment history…"
                                            />
                                            {errors.detailed_history && <p className="mt-1 text-xs text-red-600">{errors.detailed_history}</p>}
                                        </CardContent>
                                    </Card>

                                    <Card className="border-gray-200">
                                        <CardHeader className="py-3">
                                            <CardTitle className="text-sm font-semibold text-gray-900">Medical Conditions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                {[
                                                    { key: 'is_one_eyed', label: 'One Eyed' },
                                                    { key: 'is_diabetic', label: 'Diabetic' },
                                                    { key: 'is_cardiac', label: 'Cardiac' },
                                                    { key: 'is_asthmatic', label: 'Asthmatic' },
                                                    { key: 'is_hypertensive', label: 'Hypertensive' },
                                                    { key: 'is_thyroid', label: 'Thyroid' },
                                                ].map(({ key, label }) => (
                                                    <div key={key} className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={key}
                                                            checked={data[key as keyof typeof data] as boolean}
                                                            onCheckedChange={(checked) => setData(key as keyof typeof data, checked as boolean)}
                                                        />
                                                        <label htmlFor={key} className="text-sm font-medium text-gray-700">
                                                            {label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4">
                                                <label className="mb-1 block text-xs font-medium text-gray-600">Other Conditions</label>
                                                <Input
                                                    value={data.other_conditions}
                                                    onChange={(e) => setData('other_conditions', e.target.value)}
                                                    error={errors.other_conditions}
                                                    placeholder="…"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-gray-200">
                                        <CardHeader className="py-3">
                                            <CardTitle className="text-sm font-semibold text-gray-900">Drugs Used</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <textarea
                                                value={data.drugs_used}
                                                onChange={(e) => setData('drugs_used', e.target.value)}
                                                rows={3}
                                                className={`block w-full resize-none rounded-lg border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                                                    errors.drugs_used ? 'border-red-500 focus:ring-red-500' : ''
                                                }`}
                                                placeholder="Current medications…"
                                            />
                                            {errors.drugs_used && <p className="mt-1 text-xs text-red-600">{errors.drugs_used}</p>}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex items-center justify-between gap-3 border-t bg-gray-50 p-4">
                            <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>

                            <Button type="submit" disabled={processing} className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                {processing ? 'Saving…' : 'Save Vision Test'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AdminLayout>
    );
}
