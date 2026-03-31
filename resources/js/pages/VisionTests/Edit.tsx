// resources/js/Pages/VisionTests/Edit.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { calculateAge, formatDate } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Edit3,
    Eye,
    FileText,
    History,
    RotateCcw,
    Save,
    Settings,
    TrendingUp,
    User,
    X,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
    email: string | null;
}

interface VisionTest {
    id: number;
    right_eye_vision: string | null;
    left_eye_vision: string | null;
    right_eye_power: number | null;
    left_eye_power: number | null;
    right_eye_pressure: string | null;
    left_eye_pressure: string | null;
    right_eye_sphere: number | null;
    left_eye_sphere: number | null;
    right_eye_cylinder: number | null;
    left_eye_cylinder: number | null;
    right_eye_axis: number | null;
    left_eye_axis: number | null;
    additional_notes: string | null;
    test_date: string;
    performed_by: {
        name: string;
    };
    patient: Patient;
}

interface VisionTestEditProps {
    visionTest: VisionTest;
    previousTest?: VisionTest | null;
}

export default function VisionTestEdit({ visionTest, previousTest }: VisionTestEditProps) {
    const [activeTab, setActiveTab] = useState('vision');
    const [hasChanges, setHasChanges] = useState(false);

    const { data, setData, put, processing, errors, reset, isDirty } = useForm({
        right_eye_vision: visionTest.right_eye_vision || '',
        left_eye_vision: visionTest.left_eye_vision || '',
        right_eye_power: visionTest.right_eye_power?.toString() || '',
        left_eye_power: visionTest.left_eye_power?.toString() || '',
        right_eye_pressure: visionTest.right_eye_pressure || '',
        left_eye_pressure: visionTest.left_eye_pressure || '',
        right_eye_sphere: visionTest.right_eye_sphere?.toString() || '',
        left_eye_sphere: visionTest.left_eye_sphere?.toString() || '',
        right_eye_cylinder: visionTest.right_eye_cylinder?.toString() || '',
        left_eye_cylinder: visionTest.left_eye_cylinder?.toString() || '',
        right_eye_axis: visionTest.right_eye_axis?.toString() || '',
        left_eye_axis: visionTest.left_eye_axis?.toString() || '',
        additional_notes: visionTest.additional_notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('visiontests.update', visionTest.id));
    };

    const handleReset = () => {
        reset();
        setHasChanges(false);
    };

    const handleDataChange = (key: string, value: string) => {
        setData(key as any, value);
        setHasChanges(true);
    };

    const commonVisionValues = ['6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60'];
    const commonPressureValues = ['10', '12', '14', '16', '18', '20', '22'];

    const QuickSelectButton = ({ value, onClick, current }: { value: string; onClick: () => void; current: string }) => (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md border px-2 py-1 text-xs transition-all ${
                current === value ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
        >
            {value}
        </button>
    );

    const getChangeIndicator = (currentValue: string, originalValue: string | null) => {
        if (currentValue !== (originalValue || '')) {
            return <div className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-amber-500"></div>;
        }
        return null;
    };

    return (
        <AdminLayout title={`Edit Vision Test - ${visionTest.patient.name}`}>
            <Head title={`Edit Vision Test - ${visionTest.patient.name}`} />

            {/* Navigation */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" asChild className="hover:bg-gray-50">
                            <Link href={route('visiontests.show', visionTest.id)}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Results
                            </Link>
                        </Button>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Link href={route('patients.index')} className="hover:text-blue-600">
                                Patients
                            </Link>
                            <span>/</span>
                            <Link href={route('patients.show', visionTest.patient.id)} className="hover:text-blue-600">
                                {visionTest.patient.name}
                            </Link>
                            <span>/</span>
                            <Link href={route('visiontests.show', visionTest.id)} className="hover:text-blue-600">
                                Vision Test
                            </Link>
                            <span>/</span>
                            <span className="font-medium text-gray-700">Edit</span>
                        </div>
                    </div>

                    {/* Save Indicator */}
                    {isDirty && (
                        <div className="flex items-center space-x-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500"></div>
                            <span className="text-sm font-medium text-amber-700">Unsaved changes</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Patient Info Header */}
            <div className="mb-8">
                <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                                <User className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="mb-2 flex items-center space-x-3">
                                <h2 className="text-xl font-semibold text-gray-900">{visionTest.patient.name}</h2>
                                <Badge variant="outline" className="bg-white">
                                    ID: {visionTest.patient.patient_id}
                                </Badge>
                                <Badge className="bg-blue-100 text-blue-800">Editing Test #{visionTest.id}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                                {visionTest.patient.date_of_birth && (
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Age: {calculateAge(visionTest.patient.date_of_birth)} years</span>
                                    </div>
                                )}
                                {visionTest.patient.gender && (
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">
                                            Gender: {visionTest.patient.gender.charAt(0).toUpperCase() + visionTest.patient.gender.slice(1)}
                                        </span>
                                    </div>
                                )}
                                {visionTest.patient.phone && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600">📞 {visionTest.patient.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Test Date: {formatDate(visionTest.test_date)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-blue-200 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm text-blue-700">
                                <Edit3 className="h-4 w-4" />
                                <span className="font-medium">Editing vision test results</span>
                            </div>
                            {previousTest && (
                                <div className="flex items-center space-x-2 text-sm text-blue-600">
                                    <History className="h-4 w-4" />
                                    <span>Previous test: {formatDate(previousTest.test_date)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Form */}
            <Card className="mx-auto max-w-6xl shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardTitle className="flex items-center space-x-3 text-2xl">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                            <Edit3 className="h-5 w-5 text-white" />
                        </div>
                        <span>Edit Vision Test Results</span>
                    </CardTitle>
                    <CardDescription className="text-base">Update the vision assessment data for this patient</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="p-8">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                            <TabsList className="grid h-14 w-full grid-cols-4 rounded-xl bg-gray-100 p-1">
                                <TabsTrigger
                                    value="vision"
                                    className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                    <Eye className="h-4 w-4" />
                                    <span>Vision</span>
                                    {(data.right_eye_vision !== (visionTest.right_eye_vision || '') ||
                                        data.left_eye_vision !== (visionTest.left_eye_vision || '')) && (
                                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="power"
                                    className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span>Power</span>
                                    {(data.right_eye_sphere !== (visionTest.right_eye_sphere?.toString() || '') ||
                                        data.left_eye_sphere !== (visionTest.left_eye_sphere?.toString() || '') ||
                                        data.right_eye_cylinder !== (visionTest.right_eye_cylinder?.toString() || '') ||
                                        data.left_eye_cylinder !== (visionTest.left_eye_cylinder?.toString() || '') ||
                                        data.right_eye_axis !== (visionTest.right_eye_axis?.toString() || '') ||
                                        data.left_eye_axis !== (visionTest.left_eye_axis?.toString() || '')) && (
                                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="pressure"
                                    className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                    <Activity className="h-4 w-4" />
                                    <span>Pressure</span>
                                    {(data.right_eye_pressure !== (visionTest.right_eye_pressure || '') ||
                                        data.left_eye_pressure !== (visionTest.left_eye_pressure || '')) && (
                                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="notes"
                                    className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                    <FileText className="h-4 w-4" />
                                    <span>Notes</span>
                                    {data.additional_notes !== (visionTest.additional_notes || '') && (
                                        <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            {/* Vision Tab */}
                            <TabsContent value="vision" className="space-y-8">
                                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                    {/* Right Eye */}
                                    <Card className="relative border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                                        {getChangeIndicator(data.right_eye_vision, visionTest.right_eye_vision)}
                                        <CardHeader className="pb-4">
                                            <CardTitle className="flex items-center space-x-2 text-lg text-red-700">
                                                <Eye className="h-5 w-5" />
                                                <span>Right Eye (OD)</span>
                                                {data.right_eye_vision !== (visionTest.right_eye_vision || '') && (
                                                    <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                                                        Modified
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Vision Acuity</label>
                                                <div className="relative">
                                                    <Input
                                                        value={data.right_eye_vision}
                                                        onChange={(e) => handleDataChange('right_eye_vision', e.target.value)}
                                                        error={errors.right_eye_vision}
                                                        placeholder="e.g., 6/6"
                                                        className="mb-2"
                                                    />
                                                    {data.right_eye_vision !== (visionTest.right_eye_vision || '') && (
                                                        <div className="absolute top-2 right-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {commonVisionValues.map((value) => (
                                                        <QuickSelectButton
                                                            key={value}
                                                            value={value}
                                                            current={data.right_eye_vision}
                                                            onClick={() => handleDataChange('right_eye_vision', value)}
                                                        />
                                                    ))}
                                                </div>
                                                {previousTest?.right_eye_vision && (
                                                    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
                                                        <p className="text-xs text-blue-600">
                                                            Previous: <span className="font-semibold">{previousTest.right_eye_vision}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Left Eye */}
                                    <Card className="relative border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                                        {getChangeIndicator(data.left_eye_vision, visionTest.left_eye_vision)}
                                        <CardHeader className="pb-4">
                                            <CardTitle className="flex items-center space-x-2 text-lg text-blue-700">
                                                <Eye className="h-5 w-5" />
                                                <span>Left Eye (OS)</span>
                                                {data.left_eye_vision !== (visionTest.left_eye_vision || '') && (
                                                    <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                                                        Modified
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Vision Acuity</label>
                                                <div className="relative">
                                                    <Input
                                                        value={data.left_eye_vision}
                                                        onChange={(e) => handleDataChange('left_eye_vision', e.target.value)}
                                                        error={errors.left_eye_vision}
                                                        placeholder="e.g., 6/6"
                                                        className="mb-2"
                                                    />
                                                    {data.left_eye_vision !== (visionTest.left_eye_vision || '') && (
                                                        <div className="absolute top-2 right-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {commonVisionValues.map((value) => (
                                                        <QuickSelectButton
                                                            key={value}
                                                            value={value}
                                                            current={data.left_eye_vision}
                                                            onClick={() => handleDataChange('left_eye_vision', value)}
                                                        />
                                                    ))}
                                                </div>
                                                {previousTest?.left_eye_vision && (
                                                    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
                                                        <p className="text-xs text-blue-600">
                                                            Previous: <span className="font-semibold">{previousTest.left_eye_vision}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Power Tab */}
                            <TabsContent value="power" className="space-y-8">
                                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                    {/* Right Eye Power */}
                                    <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2 text-lg text-red-700">
                                                <TrendingUp className="h-5 w-5" />
                                                <span>Right Eye (OD) - Refraction</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Sphere (SPH)</label>
                                                    <Input
                                                        type="number"
                                                        step="0.25"
                                                        value={data.right_eye_sphere}
                                                        onChange={(e) => handleDataChange('right_eye_sphere', e.target.value)}
                                                        error={errors.right_eye_sphere}
                                                        placeholder="e.g., -1.25"
                                                    />
                                                    {data.right_eye_sphere !== (visionTest.right_eye_sphere?.toString() || '') && (
                                                        <div className="absolute top-8 right-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Cylinder (CYL)</label>
                                                    <Input
                                                        type="number"
                                                        step="0.25"
                                                        value={data.right_eye_cylinder}
                                                        onChange={(e) => handleDataChange('right_eye_cylinder', e.target.value)}
                                                        error={errors.right_eye_cylinder}
                                                        placeholder="e.g., -0.75"
                                                    />
                                                    {data.right_eye_cylinder !== (visionTest.right_eye_cylinder?.toString() || '') && (
                                                        <div className="absolute top-8 right-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Axis (°)</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="180"
                                                    value={data.right_eye_axis}
                                                    onChange={(e) => handleDataChange('right_eye_axis', e.target.value)}
                                                    error={errors.right_eye_axis}
                                                    placeholder="e.g., 90"
                                                />
                                                {data.right_eye_axis !== (visionTest.right_eye_axis?.toString() || '') && (
                                                    <div className="absolute top-8 right-2">
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="border-t border-red-200 pt-2">
                                                <div className="relative">
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Legacy Power (Optional)</label>
                                                    <Input
                                                        type="number"
                                                        step="0.25"
                                                        value={data.right_eye_power}
                                                        onChange={(e) => handleDataChange('right_eye_power', e.target.value)}
                                                        error={errors.right_eye_power}
                                                        placeholder="e.g., -1.25"
                                                        className="bg-gray-50"
                                                    />
                                                    {data.right_eye_power !== (visionTest.right_eye_power?.toString() || '') && (
                                                        <div className="absolute top-8 right-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Previous Test Comparison */}
                                            {previousTest && (
                                                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                                    <h5 className="mb-2 text-xs font-semibold text-blue-800">Previous Test Values:</h5>
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        <div>SPH: {previousTest.right_eye_sphere || 'N/A'}</div>
                                                        <div>CYL: {previousTest.right_eye_cylinder || 'N/A'}</div>
                                                        <div>Axis: {previousTest.right_eye_axis || 'N/A'}°</div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Left Eye Power */}
                                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2 text-lg text-blue-700">
                                                <TrendingUp className="h-5 w-5" />
                                                <span>Left Eye (OS) - Refraction</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Sphere (SPH)</label>
                                                    <Input
                                                        type="number"
                                                        step="0.25"
                                                        value={data.left_eye_sphere}
                                                        onChange={(e) => handleDataChange('left_eye_sphere', e.target.value)}
                                                        error={errors.left_eye_sphere}
                                                        placeholder="e.g., -1.25"
                                                    />
                                                    {data.left_eye_sphere !== (visionTest.left_eye_sphere?.toString() || '') && (
                                                        <div className="absolute top-8 right-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Cylinder (CYL)</label>
                                                    <Input
                                                        type="number"
                                                        step="0.25"
                                                        value={data.left_eye_cylinder}
                                                        onChange={(e) => handleDataChange('left_eye_cylinder', e.target.value)}
                                                        error={errors.left_eye_cylinder}
                                                        placeholder="e.g., -0.75"
                                                    />
                                                    {data.left_eye_cylinder !== (visionTest.left_eye_cylinder?.toString() || '') && (
                                                        <div className="absolute top-8 right-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Axis (°)</label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="180"
                                                    value={data.left_eye_axis}
                                                    onChange={(e) => handleDataChange('left_eye_axis', e.target.value)}
                                                    error={errors.left_eye_axis}
                                                    placeholder="e.g., 90"
                                                />
                                                {data.left_eye_axis !== (visionTest.left_eye_axis?.toString() || '') && (
                                                    <div className="absolute top-8 right-2">
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="border-t border-blue-200 pt-2">
                                                <div className="relative">
                                                    <label className="mb-2 block text-sm font-medium text-gray-700">Legacy Power (Optional)</label>
                                                    <Input
                                                        type="number"
                                                        step="0.25"
                                                        value={data.left_eye_power}
                                                        onChange={(e) => handleDataChange('left_eye_power', e.target.value)}
                                                        error={errors.left_eye_power}
                                                        placeholder="e.g., -1.25"
                                                        className="bg-gray-50"
                                                    />
                                                    {data.left_eye_power !== (visionTest.left_eye_power?.toString() || '') && (
                                                        <div className="absolute top-8 right-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Previous Test Comparison */}
                                            {previousTest && (
                                                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                                    <h5 className="mb-2 text-xs font-semibold text-blue-800">Previous Test Values:</h5>
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        <div>SPH: {previousTest.left_eye_sphere || 'N/A'}</div>
                                                        <div>CYL: {previousTest.left_eye_cylinder || 'N/A'}</div>
                                                        <div>Axis: {previousTest.left_eye_axis || 'N/A'}°</div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Pressure Tab */}
                            <TabsContent value="pressure" className="space-y-8">
                                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                    <Card className="relative border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                                        {getChangeIndicator(data.right_eye_pressure, visionTest.right_eye_pressure)}
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2 text-lg text-red-700">
                                                <Activity className="h-5 w-5" />
                                                <span>Right Eye (OD) - IOP</span>
                                                {data.right_eye_pressure !== (visionTest.right_eye_pressure || '') && (
                                                    <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                                                        Modified
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Intraocular Pressure</label>
                                                <div className="relative">
                                                    <Input
                                                        value={data.right_eye_pressure}
                                                        onChange={(e) => handleDataChange('right_eye_pressure', e.target.value)}
                                                        error={errors.right_eye_pressure}
                                                        placeholder="e.g., 14 mmHg"
                                                        className="mb-2"
                                                    />
                                                    {data.right_eye_pressure !== (visionTest.right_eye_pressure || '') && (
                                                        <div className="absolute top-2 right-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {commonPressureValues.map((value) => (
                                                        <QuickSelectButton
                                                            key={value}
                                                            value={`${value} mmHg`}
                                                            current={data.right_eye_pressure}
                                                            onClick={() => handleDataChange('right_eye_pressure', `${value} mmHg`)}
                                                        />
                                                    ))}
                                                </div>
                                                {previousTest?.right_eye_pressure && (
                                                    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
                                                        <p className="text-xs text-blue-600">
                                                            Previous: <span className="font-semibold">{previousTest.right_eye_pressure}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="relative border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                                        {getChangeIndicator(data.left_eye_pressure, visionTest.left_eye_pressure)}
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2 text-lg text-blue-700">
                                                <Activity className="h-5 w-5" />
                                                <span>Left Eye (OS) - IOP</span>
                                                {data.left_eye_pressure !== (visionTest.left_eye_pressure || '') && (
                                                    <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                                                        Modified
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Intraocular Pressure</label>
                                                <div className="relative">
                                                    <Input
                                                        value={data.left_eye_pressure}
                                                        onChange={(e) => handleDataChange('left_eye_pressure', e.target.value)}
                                                        error={errors.left_eye_pressure}
                                                        placeholder="e.g., 14 mmHg"
                                                        className="mb-2"
                                                    />
                                                    {data.left_eye_pressure !== (visionTest.left_eye_pressure || '') && (
                                                        <div className="absolute top-2 right-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {commonPressureValues.map((value) => (
                                                        <QuickSelectButton
                                                            key={value}
                                                            value={`${value} mmHg`}
                                                            current={data.left_eye_pressure}
                                                            onClick={() => handleDataChange('left_eye_pressure', `${value} mmHg`)}
                                                        />
                                                    ))}
                                                </div>
                                                {previousTest?.left_eye_pressure && (
                                                    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
                                                        <p className="text-xs text-blue-600">
                                                            Previous: <span className="font-semibold">{previousTest.left_eye_pressure}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Notes Tab */}
                            <TabsContent value="notes" className="space-y-6">
                                <Card className="relative">
                                    {getChangeIndicator(data.additional_notes, visionTest.additional_notes)}
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2 text-lg">
                                            <FileText className="h-5 w-5 text-gray-500" />
                                            <span>Additional Notes & Observations</span>
                                            {data.additional_notes !== (visionTest.additional_notes || '') && (
                                                <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                                                    Modified
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>Update any additional findings, recommendations, or observations</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="relative">
                                            <textarea
                                                value={data.additional_notes}
                                                onChange={(e) => handleDataChange('additional_notes', e.target.value)}
                                                rows={8}
                                                className={`block w-full resize-none rounded-lg border border-gray-300 p-4 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.additional_notes ? 'border-red-500 focus:ring-red-500' : ''} `}
                                                placeholder="Enter any additional observations, recommendations, or notes about the vision test..."
                                            />
                                            {data.additional_notes !== (visionTest.additional_notes || '') && (
                                                <div className="absolute top-3 right-3">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                </div>
                                            )}
                                        </div>
                                        {errors.additional_notes && <p className="mt-2 text-sm text-red-600">{errors.additional_notes}</p>}

                                        {/* Previous Notes Comparison */}
                                        {previousTest?.additional_notes && (
                                            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                                <h5 className="mb-2 text-sm font-semibold text-blue-800">Previous Test Notes:</h5>
                                                <p className="text-sm whitespace-pre-line text-blue-700">{previousTest.additional_notes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </CardContent>

                    <CardFooter className="border-t bg-gray-50 px-8 py-6">
                        <div className="flex w-full items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button type="button" variant="outline" className="flex items-center space-x-2" onClick={() => window.history.back()}>
                                    <X className="h-4 w-4" />
                                    <span>Cancel</span>
                                </Button>

                                {isDirty && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex items-center space-x-2 border-amber-300 text-amber-600 hover:bg-amber-50"
                                        onClick={handleReset}
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        <span>Reset Changes</span>
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center space-x-4">
                                {/* Progress Indicator */}
                                <div className="hidden items-center space-x-2 text-sm text-gray-500 md:flex">
                                    <div
                                        className={`h-2 w-2 rounded-full ${
                                            data.right_eye_vision || data.left_eye_vision ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                    ></div>
                                    <span>Vision</span>
                                    <div
                                        className={`h-2 w-2 rounded-full ${
                                            data.right_eye_sphere || data.left_eye_sphere ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                    ></div>
                                    <span>Power</span>
                                    <div
                                        className={`h-2 w-2 rounded-full ${
                                            data.right_eye_pressure || data.left_eye_pressure ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                    ></div>
                                    <span>Pressure</span>
                                </div>

                                {/* Change Counter */}
                                {isDirty && (
                                    <div className="flex items-center space-x-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1">
                                        <Edit3 className="h-3 w-3 text-amber-600" />
                                        <span className="text-xs font-medium text-amber-700">
                                            {
                                                Object.keys(data).filter(
                                                    (key) =>
                                                        data[key as keyof typeof data] !== (visionTest[key as keyof VisionTest]?.toString() || ''),
                                                ).length
                                            }{' '}
                                            changes
                                        </span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={processing || !isDirty}
                                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 hover:from-blue-700 hover:to-indigo-700"
                                >
                                    {processing ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            <span>Update Test Results</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardFooter>
                </form>
            </Card>

            {/* Changes Summary */}
            {isDirty && (
                <div className="mx-auto mt-8 max-w-6xl">
                    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 text-amber-800">
                                <AlertCircle className="h-5 w-5" />
                                <span>Pending Changes Summary</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {/* Vision Changes */}
                                {(data.right_eye_vision !== (visionTest.right_eye_vision || '') ||
                                    data.left_eye_vision !== (visionTest.left_eye_vision || '')) && (
                                    <div className="rounded-lg border border-amber-200 bg-white p-4">
                                        <h4 className="mb-2 font-semibold text-amber-800">Vision Acuity</h4>
                                        {data.right_eye_vision !== (visionTest.right_eye_vision || '') && (
                                            <div className="text-sm">
                                                <span className="text-gray-600">Right Eye:</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-500">{visionTest.right_eye_vision || 'Empty'}</span>
                                                    <span>→</span>
                                                    <span className="font-semibold text-amber-700">{data.right_eye_vision || 'Empty'}</span>
                                                </div>
                                            </div>
                                        )}
                                        {data.left_eye_vision !== (visionTest.left_eye_vision || '') && (
                                            <div className="mt-2 text-sm">
                                                <span className="text-gray-600">Left Eye:</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-500">{visionTest.left_eye_vision || 'Empty'}</span>
                                                    <span>→</span>
                                                    <span className="font-semibold text-amber-700">{data.left_eye_vision || 'Empty'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Pressure Changes */}
                                {(data.right_eye_pressure !== (visionTest.right_eye_pressure || '') ||
                                    data.left_eye_pressure !== (visionTest.left_eye_pressure || '')) && (
                                    <div className="rounded-lg border border-amber-200 bg-white p-4">
                                        <h4 className="mb-2 font-semibold text-amber-800">Eye Pressure</h4>
                                        {data.right_eye_pressure !== (visionTest.right_eye_pressure || '') && (
                                            <div className="text-sm">
                                                <span className="text-gray-600">Right Eye:</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-500">{visionTest.right_eye_pressure || 'Empty'}</span>
                                                    <span>→</span>
                                                    <span className="font-semibold text-amber-700">{data.right_eye_pressure || 'Empty'}</span>
                                                </div>
                                            </div>
                                        )}
                                        {data.left_eye_pressure !== (visionTest.left_eye_pressure || '') && (
                                            <div className="mt-2 text-sm">
                                                <span className="text-gray-600">Left Eye:</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-500">{visionTest.left_eye_pressure || 'Empty'}</span>
                                                    <span>→</span>
                                                    <span className="font-semibold text-amber-700">{data.left_eye_pressure || 'Empty'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Notes Changes */}
                                {data.additional_notes !== (visionTest.additional_notes || '') && (
                                    <div className="rounded-lg border border-amber-200 bg-white p-4">
                                        <h4 className="mb-2 font-semibold text-amber-800">Additional Notes</h4>
                                        <div className="text-sm">
                                            <span className="text-gray-600">Notes have been modified</span>
                                            <div className="mt-1 font-medium text-amber-700">
                                                {data.additional_notes ? `${data.additional_notes.substring(0, 50)}...` : 'Notes cleared'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quick Tips */}
            <div className="mx-auto mt-8 max-w-6xl">
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-3">
                            <Zap className="mt-0.5 h-5 w-5 text-blue-500" />
                            <div>
                                <h3 className="mb-2 font-medium text-blue-800">Editing Tips</h3>
                                <div className="space-y-1 text-sm text-blue-700">
                                    <p>• Use quick-select buttons for common values</p>
                                    <p>• Changes are highlighted with indicators and badges</p>
                                    <p>• Previous test values are shown for comparison</p>
                                    <p>• Reset button will undo all unsaved changes</p>
                                    <p>• All fields are optional - leave blank if not measured</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
