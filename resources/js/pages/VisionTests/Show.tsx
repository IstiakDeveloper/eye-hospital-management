import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { formatDate, formatDateTime, calculateAge } from '@/lib/utils';
import {
    User,
    Eye,
    Calendar,
    Clock,
    FileText,
    Edit,
    Printer,
    ArrowLeft,
    Target,
    Activity,
    TrendingUp,
    Zap,
    Award,
    CheckCircle,
    AlertTriangle,
    Download,
    Share2,
    BarChart3,
    PieChart,
    Sparkles,
    Shield,
    Heart,
    Stethoscope,
    Phone,
    Mail,
    MapPin,
    Timer
} from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
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
        id: number;
        name: string;
    };
    patient: Patient;
}

interface VisionTestShowProps {
    visionTest: VisionTest;
    previousTest?: VisionTest | null;
}

export default function VisionTestShow({ visionTest, previousTest }: VisionTestShowProps) {
    const [activeTab, setActiveTab] = useState('results');

    const getVisionScore = (vision: string | null) => {
        if (!vision) return { score: 'N/A', color: 'text-gray-500', badge: 'bg-gray-100 text-gray-800' };

        const score = vision.split('/');
        if (score.length === 2) {
            const percentage = (parseInt(score[0]) / parseInt(score[1])) * 100;
            if (percentage >= 100) return { score: 'Excellent', color: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800' };
            if (percentage >= 80) return { score: 'Good', color: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' };
            if (percentage >= 60) return { score: 'Fair', color: 'text-amber-600', badge: 'bg-amber-100 text-amber-800' };
            return { score: 'Poor', color: 'text-red-600', badge: 'bg-red-100 text-red-800' };
        }
        return { score: vision, color: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' };
    };

    const getPressureStatus = (pressure: string | null) => {
        if (!pressure) return { status: 'N/A', color: 'text-gray-500', badge: 'bg-gray-100 text-gray-800' };

        const value = parseInt(pressure.replace(/\D/g, ''));
        if (value >= 10 && value <= 21) return { status: 'Normal', color: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800' };
        if (value > 21) return { status: 'High', color: 'text-red-600', badge: 'bg-red-100 text-red-800' };
        if (value < 10) return { status: 'Low', color: 'text-amber-600', badge: 'bg-amber-100 text-amber-800' };
        return { status: pressure, color: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' };
    };

    const getRefractionData = (eye: 'right' | 'left') => {
        const sphere = eye === 'right' ? visionTest.right_eye_sphere : visionTest.left_eye_sphere;
        const cylinder = eye === 'right' ? visionTest.right_eye_cylinder : visionTest.left_eye_cylinder;
        const axis = eye === 'right' ? visionTest.right_eye_axis : visionTest.left_eye_axis;

        return { sphere, cylinder, axis };
    };

    const formatRefraction = (sphere: number | null, cylinder: number | null, axis: number | null) => {
        if (sphere === null && cylinder === null && axis === null) return 'N/A';

        const sphStr = sphere !== null ? (sphere >= 0 ? `+${sphere}` : `${sphere}`) : '0.00';
        const cylStr = cylinder !== null ? (cylinder >= 0 ? `+${cylinder}` : `${cylinder}`) : '';
        const axisStr = axis !== null ? `× ${axis}°` : '';

        return `${sphStr} ${cylStr} ${axisStr}`.trim();
    };

    const getOverallHealthScore = () => {
        const rightVision = getVisionScore(visionTest.right_eye_vision);
        const leftVision = getVisionScore(visionTest.left_eye_vision);
        const rightPressure = getPressureStatus(visionTest.right_eye_pressure);
        const leftPressure = getPressureStatus(visionTest.left_eye_pressure);

        const scores = [rightVision.score, leftVision.score, rightPressure.status, leftPressure.status];
        const excellentCount = scores.filter(s => s === 'Excellent' || s === 'Normal').length;
        const goodCount = scores.filter(s => s === 'Good').length;

        if (excellentCount >= 3) return { score: 95, status: 'Excellent', color: 'text-emerald-600' };
        if (excellentCount + goodCount >= 3) return { score: 85, status: 'Good', color: 'text-blue-600' };
        if (excellentCount + goodCount >= 2) return { score: 70, status: 'Fair', color: 'text-amber-600' };
        return { score: 50, status: 'Needs Attention', color: 'text-red-600' };
    };

    const healthScore = getOverallHealthScore();

    const handleDownload = () => {
        // Create download link
        const url = route('visiontests.print', visionTest.id)
        window.open(url, '_blank', 'noopener,noreferrer')
    };

    return (
        <AdminLayout title={`Vision Test Results - ${visionTest.patient.name}`}>
            <Head title={`Vision Test - ${visionTest.patient.name}`} />

            {/* Navigation */}
            <div className="mb-6">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" asChild className="hover:bg-gray-50">
                        <Link href={route('patients.show', visionTest.patient.id)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Patient
                        </Link>
                    </Button>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Link href={route('patients.index')} className="hover:text-blue-600">Patients</Link>
                        <span>/</span>
                        <Link href={route('patients.show', visionTest.patient.id)} className="hover:text-blue-600">
                            {visionTest.patient.name}
                        </Link>
                        <span>/</span>
                        <span className="text-gray-700 font-medium">Vision Test</span>
                    </div>
                </div>
            </div>

            {/* Hero Header */}
            <div className="mb-8">
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 rounded-2xl shadow-2xl text-white p-8">
                    {/* Overlay Gradient Layer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 z-0"></div>

                    {/* Radial Pattern Layer */}
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            opacity: 0.4, // Increased opacity for better visibility
                            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(156,146,172,0.25) 1px, transparent 0)`,
                            backgroundSize: '20px 20px'
                        }}
                    ></div>

                    <div className="relative p-8">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                            <div className="flex items-start space-x-6">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/20 shadow-xl">
                                        <Eye className="h-10 w-10 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="h-3 w-3 text-white" />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <h1 className="text-3xl lg:text-4xl font-bold text-white">Vision Test Results</h1>
                                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                                            Comprehensive Analysis
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 text-blue-100 mb-4">
                                        <span className="flex items-center space-x-2">
                                            <User className="h-4 w-4" />
                                            <span className="font-medium">{visionTest.patient.name}</span>
                                        </span>
                                        <span className="flex items-center space-x-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>{formatDate(visionTest.test_date)}</span>
                                        </span>
                                        <span className="flex items-center space-x-2">
                                            <Stethoscope className="h-4 w-4" />
                                            <span>By {visionTest.performed_by.name}</span>
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                                            <div className="flex items-center space-x-2">
                                                <Award className="h-4 w-4 text-yellow-300" />
                                                <span className="text-sm font-medium text-white">Health Score: {healthScore.score}%</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                                            <div className="flex items-center space-x-2">
                                                <Activity className="h-4 w-4 text-green-300" />
                                                <span className="text-sm font-medium text-white">Status: {healthScore.status}</span>
                                            </div>
                                        </div>
                                        {previousTest && (
                                            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                                                <div className="flex items-center space-x-2">
                                                    <BarChart3 className="h-4 w-4 text-purple-300" />
                                                    <span className="text-sm font-medium text-white">Compare Available</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 lg:flex-col lg:w-auto">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-white text-blue-900 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                                    onClick={handleDownload}
                                >

                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Report

                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-blue-900 transition-all duration-300"
                                >
                                    <Link href={route('visiontests.edit', visionTest.id)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Results
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-blue-900 transition-all duration-300"
                                >
                                    <Link href={route('visiontests.create', visionTest.patient.id)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        New Test
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-blue-900 transition-all duration-300"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-50 rounded-xl h-14 p-1">
                        <TabsTrigger
                            value="results"
                            className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:scale-105"
                        >
                            <Eye className="h-4 w-4" />
                            <span className="font-medium">Test Results</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="refraction"
                            className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:scale-105"
                        >
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-medium">Refraction</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="analysis"
                            className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:scale-105"
                        >
                            <BarChart3 className="h-4 w-4" />
                            <span className="font-medium">Analysis</span>
                            {previousTest && <Badge variant="secondary" className="ml-1 text-xs">Compare</Badge>}
                        </TabsTrigger>
                        <TabsTrigger
                            value="patient"
                            className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:scale-105"
                        >
                            <User className="h-4 w-4" />
                            <span className="font-medium">Patient Info</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Test Results Tab */}
                <TabsContent value="results" className="space-y-8">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Main Results */}
                        <div className="xl:col-span-8 space-y-6">
                            {/* Vision Acuity */}
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 rounded-t-xl">
                                    <CardTitle className="text-xl flex items-center space-x-3">
                                        <div className="p-2 bg-blue-500 rounded-lg">
                                            <Eye className="h-5 w-5 text-white" />
                                        </div>
                                        <span>Vision Acuity Assessment</span>
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        Comprehensive visual sharpness measurement for both eyes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Right Eye */}
                                        <div className="space-y-6">
                                            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-xl font-bold text-red-700 flex items-center">
                                                        <Target className="h-5 w-5 mr-2" />
                                                        Right Eye (OD)
                                                    </h3>
                                                    <Badge className={getVisionScore(visionTest.right_eye_vision).badge}>
                                                        {getVisionScore(visionTest.right_eye_vision).score}
                                                    </Badge>
                                                </div>

                                                <div className="text-center mb-6">
                                                    <div className="text-5xl font-bold text-red-800 mb-2">
                                                        {visionTest.right_eye_vision || 'N/A'}
                                                    </div>
                                                    <p className="text-red-600 font-medium">Visual Acuity</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-xl border border-red-200">
                                                        <div className="text-center">
                                                            <div className="text-lg font-bold text-gray-900">
                                                                {visionTest.right_eye_power !== null ? visionTest.right_eye_power : 'N/A'}
                                                            </div>
                                                            <p className="text-sm text-gray-600">Power</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-red-200">
                                                        <div className="text-center">
                                                            <div className="text-lg font-bold text-gray-900">
                                                                {visionTest.right_eye_pressure || 'N/A'}
                                                            </div>
                                                            <p className="text-sm text-gray-600">Pressure</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Left Eye */}
                                        <div className="space-y-6">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-xl font-bold text-blue-700 flex items-center">
                                                        <Target className="h-5 w-5 mr-2" />
                                                        Left Eye (OS)
                                                    </h3>
                                                    <Badge className={getVisionScore(visionTest.left_eye_vision).badge}>
                                                        {getVisionScore(visionTest.left_eye_vision).score}
                                                    </Badge>
                                                </div>

                                                <div className="text-center mb-6">
                                                    <div className="text-5xl font-bold text-blue-800 mb-2">
                                                        {visionTest.left_eye_vision || 'N/A'}
                                                    </div>
                                                    <p className="text-blue-600 font-medium">Visual Acuity</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-xl border border-blue-200">
                                                        <div className="text-center">
                                                            <div className="text-lg font-bold text-gray-900">
                                                                {visionTest.left_eye_power !== null ? visionTest.left_eye_power : 'N/A'}
                                                            </div>
                                                            <p className="text-sm text-gray-600">Power</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl border border-blue-200">
                                                        <div className="text-center">
                                                            <div className="text-lg font-bold text-gray-900">
                                                                {visionTest.left_eye_pressure || 'N/A'}
                                                            </div>
                                                            <p className="text-sm text-gray-600">Pressure</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Intraocular Pressure */}
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 rounded-t-xl">
                                    <CardTitle className="text-xl flex items-center space-x-3">
                                        <div className="p-2 bg-green-500 rounded-lg">
                                            <Activity className="h-5 w-5 text-white" />
                                        </div>
                                        <span>Intraocular Pressure (IOP)</span>
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        Eye pressure measurement - Normal range: 10-21 mmHg
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-lg font-bold text-red-700">Right Eye (OD)</h4>
                                                    <Badge className={getPressureStatus(visionTest.right_eye_pressure).badge}>
                                                        {getPressureStatus(visionTest.right_eye_pressure).status}
                                                    </Badge>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-4xl font-bold text-red-800 mb-2">
                                                        {visionTest.right_eye_pressure || 'N/A'}
                                                    </div>
                                                    <p className="text-red-600 font-medium">Pressure Reading</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-lg font-bold text-blue-700">Left Eye (OS)</h4>
                                                    <Badge className={getPressureStatus(visionTest.left_eye_pressure).badge}>
                                                        {getPressureStatus(visionTest.left_eye_pressure).status}
                                                    </Badge>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-4xl font-bold text-blue-800 mb-2">
                                                        {visionTest.left_eye_pressure || 'N/A'}
                                                    </div>
                                                    <p className="text-blue-600 font-medium">Pressure Reading</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Notes */}
                            {visionTest.additional_notes && (
                                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 rounded-t-xl">
                                        <CardTitle className="text-xl flex items-center space-x-3">
                                            <div className="p-2 bg-amber-500 rounded-lg">
                                                <FileText className="h-5 w-5 text-white" />
                                            </div>
                                            <span>Additional Notes & Observations</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="bg-white rounded-xl border border-amber-200 p-6">
                                            <p className="text-gray-900 leading-relaxed text-lg whitespace-pre-line">
                                                {visionTest.additional_notes}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="xl:col-span-4 space-y-6">
                            {/* Health Score Card */}
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 rounded-t-xl">
                                    <CardTitle className="flex items-center space-x-3">
                                        <div className="p-2 bg-purple-500 rounded-lg">
                                            <Award className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-lg font-bold text-gray-900">Health Score</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="text-center mb-6">
                                        <div className={`text-5xl font-bold ${healthScore.color} mb-2`}>
                                            {healthScore.score}%
                                        </div>
                                        <p className="text-lg font-semibold text-gray-700">{healthScore.status}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                            <span className="text-sm font-medium text-red-700">Right Eye Vision</span>
                                            <Badge className={getVisionScore(visionTest.right_eye_vision).badge}>
                                                {getVisionScore(visionTest.right_eye_vision).score}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                            <span className="text-sm font-medium text-blue-700">Left Eye Vision</span>
                                            <Badge className={getVisionScore(visionTest.left_eye_vision).badge}>
                                                {getVisionScore(visionTest.left_eye_vision).score}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                            <span className="text-sm font-medium text-green-700">Right Eye Pressure</span>
                                            <Badge className={getPressureStatus(visionTest.right_eye_pressure).badge}>
                                                {getPressureStatus(visionTest.right_eye_pressure).status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                            <span className="text-sm font-medium text-emerald-700">Left Eye Pressure</span>
                                            <Badge className={getPressureStatus(visionTest.left_eye_pressure).badge}>
                                                {getPressureStatus(visionTest.left_eye_pressure).status}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Test Information */}
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 rounded-t-xl">
                                    <CardTitle className="flex items-center space-x-3">
                                        <div className="p-2 bg-indigo-500 rounded-lg">
                                            <Clock className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-lg font-bold text-gray-900">Test Information</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="h-4 w-4 text-indigo-600" />
                                            <span className="text-sm font-medium text-indigo-700">Test Date</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{formatDate(visionTest.test_date)}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <Stethoscope className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-700">Performed By</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{visionTest.performed_by.name}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <Shield className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm font-medium text-purple-700">Test ID</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">#{visionTest.id}</span>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <div className="flex space-x-2">
                                            <Button size="sm" variant="outline" className="flex-1" asChild>
                                                <Link href={route('visiontests.edit', visionTest.id)}>
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Link>
                                            </Button>
                                            <Button size="sm" variant="outline" className="flex-1" asChild>
                                                <Link href={route('visiontests.print', visionTest.id)}>
                                                    <Printer className="h-3 w-3 mr-1" />
                                                    Print
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100 rounded-t-xl">
                                    <CardTitle className="flex items-center space-x-3">
                                        <div className="p-2 bg-teal-500 rounded-lg">
                                            <Zap className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-lg font-bold text-gray-900">Quick Actions</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-3">
                                    <Button className="w-full justify-start" variant="outline" asChild>
                                        <Link href={route('visiontests.create', visionTest.patient.id)}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Schedule Next Test
                                        </Link>
                                    </Button>

                                    <Button className="w-full justify-start" variant="outline" asChild>
                                        <Link href={route('appointments.create.patient', visionTest.patient.id)}>
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Book Appointment
                                        </Link>
                                    </Button>

                                    <Button className="w-full justify-start" variant="outline" asChild>
                                        <Link href={route('prescriptions.create.patient', visionTest.patient.id)}>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Create Prescription
                                        </Link>
                                    </Button>

                                    <Button className="w-full justify-start" variant="outline">
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share Results
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Refraction Tab */}
                <TabsContent value="refraction" className="space-y-6">
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 rounded-t-xl">
                            <CardTitle className="text-xl flex items-center space-x-3">
                                <div className="p-2 bg-orange-500 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <span>Refraction Analysis</span>
                            </CardTitle>
                            <CardDescription className="text-base">
                                Detailed prescription measurements for corrective lenses
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Right Eye Refraction */}
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6">
                                        <h3 className="text-xl font-bold text-red-700 mb-6 flex items-center">
                                            <Target className="h-5 w-5 mr-2" />
                                            Right Eye (OD) Refraction
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-white p-4 rounded-xl border border-red-200 text-center">
                                                    <div className="text-2xl font-bold text-gray-900 mb-1">
                                                        {visionTest.right_eye_sphere !== null ?
                                                            (visionTest.right_eye_sphere >= 0 ? `+${visionTest.right_eye_sphere}` : visionTest.right_eye_sphere)
                                                            : 'N/A'
                                                        }
                                                    </div>
                                                    <p className="text-sm text-red-600 font-medium">Sphere (SPH)</p>
                                                </div>

                                                <div className="bg-white p-4 rounded-xl border border-red-200 text-center">
                                                    <div className="text-2xl font-bold text-gray-900 mb-1">
                                                        {visionTest.right_eye_cylinder !== null ?
                                                            (visionTest.right_eye_cylinder >= 0 ? `+${visionTest.right_eye_cylinder}` : visionTest.right_eye_cylinder)
                                                            : 'N/A'
                                                        }
                                                    </div>
                                                    <p className="text-sm text-red-600 font-medium">Cylinder (CYL)</p>
                                                </div>

                                                <div className="bg-white p-4 rounded-xl border border-red-200 text-center">
                                                    <div className="text-2xl font-bold text-gray-900 mb-1">
                                                        {visionTest.right_eye_axis !== null ? `${visionTest.right_eye_axis}°` : 'N/A'}
                                                    </div>
                                                    <p className="text-sm text-red-600 font-medium">Axis</p>
                                                </div>
                                            </div>

                                            <div className="bg-red-100 p-4 rounded-xl border border-red-300">
                                                <p className="text-sm font-medium text-red-700 mb-2">Full Prescription:</p>
                                                <p className="text-lg font-bold text-red-800 font-mono">
                                                    {formatRefraction(
                                                        visionTest.right_eye_sphere,
                                                        visionTest.right_eye_cylinder,
                                                        visionTest.right_eye_axis
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Left Eye Refraction */}
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                                        <h3 className="text-xl font-bold text-blue-700 mb-6 flex items-center">
                                            <Target className="h-5 w-5 mr-2" />
                                            Left Eye (OS) Refraction
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-white p-4 rounded-xl border border-blue-200 text-center">
                                                    <div className="text-2xl font-bold text-gray-900 mb-1">
                                                        {visionTest.left_eye_sphere !== null ?
                                                            (visionTest.left_eye_sphere >= 0 ? `+${visionTest.left_eye_sphere}` : visionTest.left_eye_sphere)
                                                            : 'N/A'
                                                        }
                                                    </div>
                                                    <p className="text-sm text-blue-600 font-medium">Sphere (SPH)</p>
                                                </div>

                                                <div className="bg-white p-4 rounded-xl border border-blue-200 text-center">
                                                    <div className="text-2xl font-bold text-gray-900 mb-1">
                                                        {visionTest.left_eye_cylinder !== null ?
                                                            (visionTest.left_eye_cylinder >= 0 ? `+${visionTest.left_eye_cylinder}` : visionTest.left_eye_cylinder)
                                                            : 'N/A'
                                                        }
                                                    </div>
                                                    <p className="text-sm text-blue-600 font-medium">Cylinder (CYL)</p>
                                                </div>

                                                <div className="bg-white p-4 rounded-xl border border-blue-200 text-center">
                                                    <div className="text-2xl font-bold text-gray-900 mb-1">
                                                        {visionTest.left_eye_axis !== null ? `${visionTest.left_eye_axis}°` : 'N/A'}
                                                    </div>
                                                    <p className="text-sm text-blue-600 font-medium">Axis</p>
                                                </div>
                                            </div>

                                            <div className="bg-blue-100 p-4 rounded-xl border border-blue-300">
                                                <p className="text-sm font-medium text-blue-700 mb-2">Full Prescription:</p>
                                                <p className="text-lg font-bold text-blue-800 font-mono">
                                                    {formatRefraction(
                                                        visionTest.left_eye_sphere,
                                                        visionTest.left_eye_cylinder,
                                                        visionTest.left_eye_axis
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prescription Summary */}
                            <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                    <FileText className="h-5 w-5 mr-2" />
                                    Complete Prescription Summary
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-4 rounded-lg border border-gray-300">
                                        <p className="text-sm font-medium text-gray-600 mb-2">Right Eye (OD):</p>
                                        <p className="text-xl font-bold text-gray-900 font-mono">
                                            {formatRefraction(
                                                visionTest.right_eye_sphere,
                                                visionTest.right_eye_cylinder,
                                                visionTest.right_eye_axis
                                            )}
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-gray-300">
                                        <p className="text-sm font-medium text-gray-600 mb-2">Left Eye (OS):</p>
                                        <p className="text-xl font-bold text-gray-900 font-mono">
                                            {formatRefraction(
                                                visionTest.left_eye_sphere,
                                                visionTest.left_eye_cylinder,
                                                visionTest.left_eye_axis
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Vision Analysis */}
                        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 rounded-t-xl">
                                <CardTitle className="flex items-center space-x-3">
                                    <div className="p-2 bg-emerald-500 rounded-lg">
                                        <Eye className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">Vision Analysis</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="text-center mb-6">
                                        <div className="text-3xl font-bold text-emerald-600 mb-2">
                                            {((getVisionScore(visionTest.right_eye_vision).score !== 'N/A' ? 1 : 0) +
                                                (getVisionScore(visionTest.left_eye_vision).score !== 'N/A' ? 1 : 0)) * 50}%
                                        </div>
                                        <p className="text-emerald-700 font-medium">Overall Vision Quality</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                            <span className="text-sm font-medium text-red-700">Right Eye</span>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900">{visionTest.right_eye_vision || 'N/A'}</div>
                                                <div className="text-xs text-red-600">{getVisionScore(visionTest.right_eye_vision).score}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                            <span className="text-sm font-medium text-blue-700">Left Eye</span>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900">{visionTest.left_eye_vision || 'N/A'}</div>
                                                <div className="text-xs text-blue-600">{getVisionScore(visionTest.left_eye_vision).score}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pressure Analysis */}
                        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 rounded-t-xl">
                                <CardTitle className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                        <Activity className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">Pressure Analysis</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="text-center mb-6">
                                        <div className="text-3xl font-bold text-blue-600 mb-2">
                                            {((getPressureStatus(visionTest.right_eye_pressure).status === 'Normal' ? 1 : 0) +
                                                (getPressureStatus(visionTest.left_eye_pressure).status === 'Normal' ? 1 : 0)) * 50}%
                                        </div>
                                        <p className="text-blue-700 font-medium">Pressure Health</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                            <span className="text-sm font-medium text-red-700">Right Eye</span>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900">{visionTest.right_eye_pressure || 'N/A'}</div>
                                                <div className="text-xs text-red-600">{getPressureStatus(visionTest.right_eye_pressure).status}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                            <span className="text-sm font-medium text-blue-700">Left Eye</span>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900">{visionTest.left_eye_pressure || 'N/A'}</div>
                                                <div className="text-xs text-blue-600">{getPressureStatus(visionTest.left_eye_pressure).status}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <div className="text-xs text-gray-500 text-center">
                                            Normal Range: 10-21 mmHg
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Comparison with Previous Test */}
                        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 rounded-t-xl">
                                <CardTitle className="flex items-center space-x-3">
                                    <div className="p-2 bg-purple-500 rounded-lg">
                                        <BarChart3 className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">Progress Tracking</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {previousTest ? (
                                    <div className="space-y-4">
                                        <div className="text-center mb-6">
                                            <div className="text-sm text-gray-600 mb-1">Previous Test</div>
                                            <div className="text-lg font-medium text-gray-900">
                                                {formatDate(previousTest.test_date)}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-700">Right Eye Vision</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Previous: {previousTest.right_eye_vision || 'N/A'}</span>
                                                    <span>Current: {visionTest.right_eye_vision || 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-700">Left Eye Vision</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Previous: {previousTest.left_eye_vision || 'N/A'}</span>
                                                    <span>Current: {visionTest.left_eye_vision || 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-700">Eye Pressure</span>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span>Right: {previousTest.right_eye_pressure || 'N/A'}</span>
                                                        <span>→ {visionTest.right_eye_pressure || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Left: {previousTest.left_eye_pressure || 'N/A'}</span>
                                                        <span>→ {visionTest.left_eye_pressure || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <BarChart3 className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">First Test</h4>
                                        <p className="text-sm text-gray-500">No previous test available for comparison</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recommendations */}
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 rounded-t-xl">
                            <CardTitle className="text-xl flex items-center space-x-3">
                                <div className="p-2 bg-amber-500 rounded-lg">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <span>Recommendations & Next Steps</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Generate recommendations based on test results */}
                                {(getVisionScore(visionTest.right_eye_vision).score === 'Poor' ||
                                    getVisionScore(visionTest.left_eye_vision).score === 'Poor') && (
                                        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                                <h4 className="font-bold text-red-800">Vision Correction Needed</h4>
                                            </div>
                                            <p className="text-red-700 text-sm">
                                                Consider prescription glasses or contact lenses to improve visual acuity.
                                            </p>
                                        </div>
                                    )}

                                {(getPressureStatus(visionTest.right_eye_pressure).status === 'High' ||
                                    getPressureStatus(visionTest.left_eye_pressure).status === 'High') && (
                                        <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <Activity className="h-5 w-5 text-orange-600" />
                                                <h4 className="font-bold text-orange-800">High Eye Pressure</h4>
                                            </div>
                                            <p className="text-orange-700 text-sm">
                                                Monitor closely and consider glaucoma screening. Follow-up recommended.
                                            </p>
                                        </div>
                                    )}

                                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <Calendar className="h-5 w-5 text-blue-600" />
                                        <h4 className="font-bold text-blue-800">Regular Check-ups</h4>
                                    </div>
                                    <p className="text-blue-700 text-sm">
                                        Schedule annual vision tests to monitor eye health and catch issues early.
                                    </p>
                                </div>

                                <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <Heart className="h-5 w-5 text-green-600" />
                                        <h4 className="font-bold text-green-800">Eye Health Tips</h4>
                                    </div>
                                    <p className="text-green-700 text-sm">
                                        Maintain healthy diet, protect from UV rays, and take regular screen breaks.
                                    </p>
                                </div>

                                <div className="p-6 bg-purple-50 border border-purple-200 rounded-xl">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                        <h4 className="font-bold text-purple-800">Documentation</h4>
                                    </div>
                                    <p className="text-purple-700 text-sm">
                                        Keep detailed records for insurance and track changes over time.
                                    </p>
                                </div>

                                <div className="p-6 bg-teal-50 border border-teal-200 rounded-xl">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <Shield className="h-5 w-5 text-teal-600" />
                                        <h4 className="font-bold text-teal-800">Follow-up Care</h4>
                                    </div>
                                    <p className="text-teal-700 text-sm">
                                        Book follow-up appointment in 6-12 months or as recommended by your doctor.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Patient Info Tab */}
                <TabsContent value="patient" className="space-y-6">
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100 rounded-t-xl">
                            <CardTitle className="text-xl flex items-center space-x-3">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                                <span>Patient Information</span>
                                <Badge className="bg-blue-100 text-blue-700">Complete Profile</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="group p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-start space-x-4">
                                            <div className="p-3 bg-blue-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <User className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-blue-600 mb-1">Full Name</p>
                                                <p className="text-xl font-bold text-gray-900">{visionTest.patient.name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-start space-x-4">
                                            <div className="p-3 bg-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <Shield className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-emerald-600 mb-1">Patient ID</p>
                                                <p className="text-xl font-bold text-gray-900">{visionTest.patient.patient_id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-start space-x-4">
                                            <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <Phone className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-purple-600 mb-1">Phone Number</p>
                                                <p className="text-xl font-bold text-gray-900">{visionTest.patient.phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="group p-4 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-start space-x-4">
                                            <div className="p-3 bg-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <Calendar className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-orange-600 mb-1">Date of Birth</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {visionTest.patient.date_of_birth
                                                        ? `${formatDate(visionTest.patient.date_of_birth)} (${calculateAge(visionTest.patient.date_of_birth)} years)`
                                                        : 'Not provided'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group p-4 rounded-xl bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-start space-x-4">
                                            <div className="p-3 bg-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <Heart className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-pink-600 mb-1">Gender</p>
                                                <p className="text-xl font-bold text-gray-900">
                                                    {visionTest.patient.gender
                                                        ? visionTest.patient.gender.charAt(0).toUpperCase() + visionTest.patient.gender.slice(1)
                                                        : 'Not specified'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="group p-4 rounded-xl bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-start space-x-4">
                                            <div className="p-3 bg-teal-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <Mail className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-teal-600 mb-1">Email Address</p>
                                                <p className="text-xl font-bold text-gray-900">{visionTest.patient.email || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {visionTest.patient.address && (
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <div className="group p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-start space-x-4">
                                            <div className="p-3 bg-indigo-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <MapPin className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-indigo-600 mb-2">Address</p>
                                                <p className="text-lg font-semibold text-gray-900">{visionTest.patient.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="flex flex-wrap gap-3">
                                    <Button asChild variant="outline" className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-300">
                                        <Link href={route('patients.show', visionTest.patient.id)}>
                                            <User className="h-4 w-4 mr-2" />
                                            View Full Profile
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="hover:bg-green-50 hover:border-green-300 transition-all duration-300">
                                        <Link href={route('appointments.create.patient', visionTest.patient.id)}>
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Book Appointment
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="hover:bg-purple-50 hover:border-purple-300 transition-all duration-300">
                                        <Link href={route('prescriptions.create.patient', visionTest.patient.id)}>
                                            <FileText className="h-4 w-4 mr-2" />
                                            Create Prescription
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Footer Actions */}
            <div className="mt-12 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Need to take action?</h3>
                        <p className="text-gray-600">
                            Schedule follow-up care or create treatment plans based on these results.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300">
                            <Link href={route('visiontests.create', visionTest.patient.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Schedule Next Test
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-300">
                            <Link href={route('visiontests.print', visionTest.id)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Report
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-300">
                            <Link href={route('patients.show', visionTest.patient.id)}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Patient
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
