// resources/js/Pages/VisionTests/Create.tsx
import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateAge } from '@/lib/utils';
import {
    Save,
    X,
    FileText,
    Eye,
    AlertCircle,
    User,
    Activity,
    Settings,
    TrendingUp,
    Calendar,
    Clock,
    Zap,
    ChevronRight,
    ChevronLeft,
    Check,
    Stethoscope,
    Heart,
    Pill,
    Download
} from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
    email: string | null;
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
    latestTest: LatestTest | null;
}

const STEPS = [
    { id: 'complaints', title: 'Complaints', icon: FileText },
    { id: 'examination', title: 'Examination', icon: Eye },
    { id: 'vision', title: 'Vision Tests', icon: Activity },
    { id: 'vitals', title: 'Vitals & Tests', icon: Stethoscope },
    { id: 'history', title: 'History & Drugs', icon: Heart }
];

export default function VisionTestCreate({ patient, latestTest }: VisionTestCreateProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const [isDownloading, setIsDownloading] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        // Complaints
        complains: latestTest?.complains || '',

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
        post(route('visiontests.store', patient.id));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = (e: React.MouseEvent) => {
        e.preventDefault();
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const isStepCompleted = (stepIndex: number) => {
        switch (stepIndex) {
            case 0: // Complaints
                return data.complains;
            case 1: // Examination
                return data.right_eye_diagnosis || data.left_eye_diagnosis || data.right_eye_lids || data.left_eye_lids;
            case 2: // Vision Tests
                return data.right_eye_vision_without_glass || data.left_eye_vision_without_glass;
            case 3: // Vitals
                return data.blood_pressure || data.blood_sugar || data.right_eye_fundus || data.left_eye_fundus;
            case 4: // History
                return false; // History step should not auto-complete
            default:
                return false;
        }
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
            className={`px-2 py-1 text-xs rounded-md border transition-all ${current === value
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
        >
            {value}
        </button>
    );

    const StepIndicator = () => (
        <div className="mb-8">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep || isStepCompleted(index);

                    return (
                        <div key={step.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                  ${isActive
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : isCompleted
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'bg-gray-100 border-gray-300 text-gray-400'
                                    }
                `}>
                                    {isCompleted && !isActive ? (
                                        <Check className="h-6 w-6" />
                                    ) : (
                                        <Icon className="h-6 w-6" />
                                    )}
                                </div>
                                <span className={`mt-2 text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                    }`}>
                                    {step.title}
                                </span>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={`
                  flex-1 h-0.5 mx-4 transition-all
                  ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                `} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderStepContent = () => {
        const currentStepId = STEPS[currentStep].id;

        switch (currentStepId) {
            case 'complaints':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center space-x-2">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <span>Patient Complaints & Symptoms</span>
                            </CardTitle>
                            <CardDescription>
                                Record the patient's chief complaints and presenting symptoms
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                value={data.complains}
                                onChange={(e) => setData('complains', e.target.value)}
                                rows={8}
                                className={`
                  block w-full rounded-lg border border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                  resize-none p-4
                  ${errors.complains ? 'border-red-500 focus:ring-red-500' : ''}
                `}
                                placeholder="Enter patient's chief complaints, symptoms, and reason for visit..."
                            />
                            {errors.complains && (
                                <p className="mt-2 text-sm text-red-600">{errors.complains}</p>
                            )}
                        </CardContent>
                    </Card>
                );

            case 'examination':
                return (
                    <div className="space-y-8">
                        {/* Diagnosis */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg text-red-700 flex items-center space-x-2">
                                        <Eye className="h-5 w-5" />
                                        <span>Right Eye Diagnosis</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        value={data.right_eye_diagnosis}
                                        onChange={(e) => setData('right_eye_diagnosis', e.target.value)}
                                        error={errors.right_eye_diagnosis}
                                        placeholder="Enter diagnosis findings..."
                                    />
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg text-blue-700 flex items-center space-x-2">
                                        <Eye className="h-5 w-5" />
                                        <span>Left Eye Diagnosis</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        value={data.left_eye_diagnosis}
                                        onChange={(e) => setData('left_eye_diagnosis', e.target.value)}
                                        error={errors.left_eye_diagnosis}
                                        placeholder="Enter diagnosis findings..."
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Physical Examination Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-red-700 flex items-center space-x-2">
                                    <Eye className="h-5 w-5" />
                                    <span>Right Eye (OD)</span>
                                </h3>

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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {label}
                                        </label>
                                        <Input
                                            value={data[key as keyof typeof data] as string}
                                            onChange={(e) => setData(key as keyof typeof data, e.target.value)}
                                            error={errors[key as keyof typeof errors]}
                                            placeholder={`Enter ${label.toLowerCase()} findings...`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-blue-700 flex items-center space-x-2">
                                    <Eye className="h-5 w-5" />
                                    <span>Left Eye (OS)</span>
                                </h3>

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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {label}
                                        </label>
                                        <Input
                                            value={data[key as keyof typeof data] as string}
                                            onChange={(e) => setData(key as keyof typeof data, e.target.value)}
                                            error={errors[key as keyof typeof errors]}
                                            placeholder={`Enter ${label.toLowerCase()} findings...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'vision':
                return (
                    <div className="space-y-8">
                        {/* Vision Testing */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg text-red-700 flex items-center space-x-2">
                                        <Eye className="h-5 w-5" />
                                        <span>Right Eye Vision Tests</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Vision Without Glass
                                        </label>
                                        <Input
                                            value={data.right_eye_vision_without_glass}
                                            onChange={(e) => setData('right_eye_vision_without_glass', e.target.value)}
                                            error={errors.right_eye_vision_without_glass}
                                            placeholder="e.g., 6/6"
                                            className="mb-2"
                                        />
                                        <div className="flex flex-wrap gap-1">
                                            {commonVisionValues.map(value => (
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Vision With Glass/Pinhole
                                        </label>
                                        <Input
                                            value={data.right_eye_vision_with_glass}
                                            onChange={(e) => setData('right_eye_vision_with_glass', e.target.value)}
                                            error={errors.right_eye_vision_with_glass}
                                            placeholder="e.g., 6/6"
                                            className="mb-2"
                                        />
                                        <div className="flex flex-wrap gap-1">
                                            {commonVisionValues.map(value => (
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            IOP (Intraocular Pressure)
                                        </label>
                                        <Input
                                            value={data.right_eye_iop}
                                            onChange={(e) => setData('right_eye_iop', e.target.value)}
                                            error={errors.right_eye_iop}
                                            placeholder="e.g., 14 mmHg"
                                            className="mb-2"
                                        />
                                        <div className="flex flex-wrap gap-1">
                                            {commonIOPValues.map(value => (
                                                <QuickSelectButton
                                                    key={value}
                                                    value={`${value} mmHg`}
                                                    current={data.right_eye_iop}
                                                    onClick={() => setData('right_eye_iop', `${value} mmHg`)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ducts
                                        </label>
                                        <Input
                                            value={data.right_eye_ducts}
                                            onChange={(e) => setData('right_eye_ducts', e.target.value)}
                                            error={errors.right_eye_ducts}
                                            placeholder="Enter duct examination findings..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg text-blue-700 flex items-center space-x-2">
                                        <Eye className="h-5 w-5" />
                                        <span>Left Eye Vision Tests</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Vision Without Glass
                                        </label>
                                        <Input
                                            value={data.left_eye_vision_without_glass}
                                            onChange={(e) => setData('left_eye_vision_without_glass', e.target.value)}
                                            error={errors.left_eye_vision_without_glass}
                                            placeholder="e.g., 6/6"
                                            className="mb-2"
                                        />
                                        <div className="flex flex-wrap gap-1">
                                            {commonVisionValues.map(value => (
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Vision With Glass/Pinhole
                                        </label>
                                        <Input
                                            value={data.left_eye_vision_with_glass}
                                            onChange={(e) => setData('left_eye_vision_with_glass', e.target.value)}
                                            error={errors.left_eye_vision_with_glass}
                                            placeholder="e.g., 6/6"
                                            className="mb-2"
                                        />
                                        <div className="flex flex-wrap gap-1">
                                            {commonVisionValues.map(value => (
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            IOP (Intraocular Pressure)
                                        </label>
                                        <Input
                                            value={data.left_eye_iop}
                                            onChange={(e) => setData('left_eye_iop', e.target.value)}
                                            error={errors.left_eye_iop}
                                            placeholder="e.g., 14 mmHg"
                                            className="mb-2"
                                        />
                                        <div className="flex flex-wrap gap-1">
                                            {commonIOPValues.map(value => (
                                                <QuickSelectButton
                                                    key={value}
                                                    value={`${value} mmHg`}
                                                    current={data.left_eye_iop}
                                                    onClick={() => setData('left_eye_iop', `${value} mmHg`)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ducts
                                        </label>
                                        <Input
                                            value={data.left_eye_ducts}
                                            onChange={(e) => setData('left_eye_ducts', e.target.value)}
                                            error={errors.left_eye_ducts}
                                            placeholder="Enter duct examination findings..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case 'vitals':
                return (
                    <div className="space-y-8">
                        {/* Vital Signs */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center space-x-2">
                                    <Stethoscope className="h-5 w-5 text-gray-500" />
                                    <span>Vital Signs & Blood Tests</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Blood Pressure (B.P)
                                    </label>
                                    <Input
                                        value={data.blood_pressure}
                                        onChange={(e) => setData('blood_pressure', e.target.value)}
                                        error={errors.blood_pressure}
                                        placeholder="e.g., 120/80"
                                        className="mb-2"
                                    />
                                    <div className="flex flex-wrap gap-1">
                                        {commonBPValues.map(value => (
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Urine Sugar
                                    </label>
                                    <Input
                                        value={data.urine_sugar}
                                        onChange={(e) => setData('urine_sugar', e.target.value)}
                                        error={errors.urine_sugar}
                                        placeholder="e.g., Negative"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Blood Sugar
                                    </label>
                                    <Input
                                        value={data.blood_sugar}
                                        onChange={(e) => setData('blood_sugar', e.target.value)}
                                        error={errors.blood_sugar}
                                        placeholder="e.g., 120 mg/dl"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Fundus Examination */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                                <CardHeader>
                                    <CardTitle className="text-lg text-red-700 flex items-center space-x-2">
                                        <Eye className="h-5 w-5" />
                                        <span>Right Eye Fundus</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        value={data.right_eye_fundus}
                                        onChange={(e) => setData('right_eye_fundus', e.target.value)}
                                        rows={4}
                                        className={`
                      block w-full rounded-lg border border-gray-300 shadow-sm
                      focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                      resize-none p-3
                      ${errors.right_eye_fundus ? 'border-red-500 focus:ring-red-500' : ''}
                    `}
                                        placeholder="Enter fundus examination findings..."
                                    />
                                    {errors.right_eye_fundus && (
                                        <p className="mt-2 text-sm text-red-600">{errors.right_eye_fundus}</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                                <CardHeader>
                                    <CardTitle className="text-lg text-blue-700 flex items-center space-x-2">
                                        <Eye className="h-5 w-5" />
                                        <span>Left Eye Fundus</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        value={data.left_eye_fundus}
                                        onChange={(e) => setData('left_eye_fundus', e.target.value)}
                                        rows={4}
                                        className={`
                      block w-full rounded-lg border border-gray-300 shadow-sm
                      focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                      resize-none p-3
                      ${errors.left_eye_fundus ? 'border-red-500 focus:ring-red-500' : ''}
                    `}
                                        placeholder="Enter fundus examination findings..."
                                    />
                                    {errors.left_eye_fundus && (
                                        <p className="mt-2 text-sm text-red-600">{errors.left_eye_fundus}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case 'history':
                return (
                    <div className="space-y-8">
                        {/* Detailed History */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center space-x-2">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    <span>Detailed History (Immediate Past and Treatment History)</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    value={data.detailed_history}
                                    onChange={(e) => setData('detailed_history', e.target.value)}
                                    rows={6}
                                    className={`
                    block w-full rounded-lg border border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                    resize-none p-4
                    ${errors.detailed_history ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                                    placeholder="Enter detailed medical history, past treatments, surgeries, medications, etc..."
                                />
                                {errors.detailed_history && (
                                    <p className="mt-2 text-sm text-red-600">{errors.detailed_history}</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Medical Conditions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center space-x-2">
                                    <Heart className="h-5 w-5 text-gray-500" />
                                    <span>Medical Conditions</span>
                                </CardTitle>
                                <CardDescription>
                                    Select all applicable medical conditions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_one_eyed"
                                            checked={data.is_one_eyed}
                                            onCheckedChange={(checked) => setData('is_one_eyed', checked as boolean)}
                                        />
                                        <label
                                            htmlFor="is_one_eyed"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            One Eyed
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_diabetic"
                                            checked={data.is_diabetic}
                                            onCheckedChange={(checked) => setData('is_diabetic', checked as boolean)}
                                        />
                                        <label
                                            htmlFor="is_diabetic"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Diabetic
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_cardiac"
                                            checked={data.is_cardiac}
                                            onCheckedChange={(checked) => setData('is_cardiac', checked as boolean)}
                                        />
                                        <label
                                            htmlFor="is_cardiac"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Cardiac
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_asthmatic"
                                            checked={data.is_asthmatic}
                                            onCheckedChange={(checked) => setData('is_asthmatic', checked as boolean)}
                                        />
                                        <label
                                            htmlFor="is_asthmatic"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Asthmatic
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_hypertensive"
                                            checked={data.is_hypertensive}
                                            onCheckedChange={(checked) => setData('is_hypertensive', checked as boolean)}
                                        />
                                        <label
                                            htmlFor="is_hypertensive"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Hypertensive
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_thyroid"
                                            checked={data.is_thyroid}
                                            onCheckedChange={(checked) => setData('is_thyroid', checked as boolean)}
                                        />
                                        <label
                                            htmlFor="is_thyroid"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Thyroid
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Other Conditions
                                    </label>
                                    <Input
                                        value={data.other_conditions}
                                        onChange={(e) => setData('other_conditions', e.target.value)}
                                        error={errors.other_conditions}
                                        placeholder="Specify any other medical conditions..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Drugs Used */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center space-x-2">
                                    <Pill className="h-5 w-5 text-gray-500" />
                                    <span>Drugs Used</span>
                                </CardTitle>
                                <CardDescription>
                                    List all medications and drugs currently being used by the patient
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <textarea
                                    value={data.drugs_used}
                                    onChange={(e) => setData('drugs_used', e.target.value)}
                                    rows={4}
                                    className={`
                    block w-full rounded-lg border border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                    resize-none p-4
                    ${errors.drugs_used ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                                    placeholder="List all current medications, dosages, and frequency..."
                                />
                                {errors.drugs_used && (
                                    <p className="mt-2 text-sm text-red-600">{errors.drugs_used}</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <AdminLayout title="Record Vision Test">
            <Head title="Record Vision Test" />

            {/* Patient Info Header */}
            <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                <User className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
                                <Badge variant="outline" className="bg-white">ID: {patient.patient_id}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                {patient.date_of_birth && (
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Age: {calculateAge(patient.date_of_birth)} years</span>
                                    </div>
                                )}
                                {patient.gender && (
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Gender: {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</span>
                                    </div>
                                )}
                                {patient.phone && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600">📞 {patient.phone}</span>
                                    </div>
                                )}
                                {latestTest && (
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Last Test: {new Date(latestTest.test_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadBlankReport}
                                disabled={isDownloading}
                                className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100"
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                        <span>Downloading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        <span>Download Demo Report</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {latestTest && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                            <div className="flex items-center space-x-2 text-sm text-blue-700">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">Previous test results are pre-filled for your reference</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Step Indicator */}
            <StepIndicator />

            {/* Main Form */}
            <Card className="max-w-6xl mx-auto shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                    <CardTitle className="text-2xl flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Eye className="h-5 w-5 text-white" />
                        </div>
                        <span>Vision Test Recording - Step {currentStep + 1} of {STEPS.length}</span>
                    </CardTitle>
                    <CardDescription className="text-base">
                        {STEPS[currentStep].title} Assessment
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="p-8">
                        {renderStepContent()}
                    </CardContent>

                    <CardFooter className="bg-gray-50 border-t px-8 py-6">
                        <div className="flex justify-between items-center w-full">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex items-center space-x-2"
                                onClick={() => window.history.back()}
                            >
                                <X className="h-4 w-4" />
                                <span>Cancel</span>
                            </Button>

                            <div className="flex items-center space-x-4">
                                {currentStep > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePrevious}
                                        className="flex items-center space-x-2"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span>Previous</span>
                                    </Button>
                                )}

                                {currentStep < STEPS.length - 1 ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
                                    >
                                        <span>Next</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                <span>Save Vision Test</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardFooter>
                </form>
            </Card>

            {/* Quick Tips */}
            <div className="mt-8 max-w-6xl mx-auto">
                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-3">
                            <Zap className="h-5 w-5 text-amber-500 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-amber-800 mb-2">Quick Tips - {STEPS[currentStep].title}</h3>
                                <div className="text-sm text-amber-700 space-y-1">
                                    {currentStep === 0 && (
                                        <>
                                            <p>• Record the patient's main complaints and symptoms clearly</p>
                                            <p>• Include duration, severity, and any triggering factors</p>
                                            <p>• Note if this is a follow-up visit or new complaint</p>
                                        </>
                                    )}
                                    {currentStep === 1 && (
                                        <>
                                            <p>• Examine each part of the eye systematically</p>
                                            <p>• Record normal findings as "Normal" or "NAD" (No Abnormality Detected)</p>
                                            <p>• Be specific about any abnormalities found</p>
                                        </>
                                    )}
                                    {currentStep === 2 && (
                                        <>
                                            <p>• Use the quick-select buttons for common vision values</p>
                                            <p>• 6/6 vision is considered normal/perfect vision</p>
                                            <p>• Normal IOP range: 10-21 mmHg</p>
                                        </>
                                    )}
                                    {currentStep === 3 && (
                                        <>
                                            <p>• Record vital signs accurately</p>
                                            <p>• Document fundus findings in detail</p>
                                            <p>• Note any abnormalities in blood/urine tests</p>
                                        </>
                                    )}
                                    {currentStep === 4 && (
                                        <>
                                            <p>• Include relevant medical history and family history</p>
                                            <p>• Check all applicable medical conditions</p>
                                            <p>• List current medications with dosages if known</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
