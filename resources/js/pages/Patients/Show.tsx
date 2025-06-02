import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { formatDate, formatTime, calculateAge } from '@/lib/utils';
import {
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Clock,
    FileText,
    Edit,
    Printer,
    Eye,
    Plus,
    ChevronRight,
    Activity,
    Stethoscope,
    Heart,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Download,
    Share2,
    MoreVertical,
    Star,
    Shield,
    Zap,
    Timer,
    Target,
    Users,
    PieChart,
    BarChart3,
    Award,
    Sparkles
} from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    date_of_birth: string | null;
    gender: string | null;
    medical_history: string | null;
    created_at: string;
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
}

interface Appointment {
    id: number;
    doctor: {
        id: number;
        user: {
            name: string;
        };
        specialization: string | null;
    };
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
    status: string;
}

interface Prescription {
    id: number;
    doctor: {
        id: number;
        user: {
            name: string;
        };
    };
    diagnosis: string | null;
    created_at: string;
    followup_date: string | null;
    prescription_medicines: {
        id: number;
        medicine: {
            id: number;
            name: string;
        };
        dosage: string;
        duration: string | null;
        instructions: string | null;
    }[];
}

interface PatientShowProps {
    patient: {
        id: number;
        patient_id: string;
        name: string;
        phone: string;
        email: string | null;
        address: string | null;
        date_of_birth: string | null;
        gender: string | null;
        medical_history: string | null;
        created_at: string;
        vision_tests: VisionTest[];
        appointments: Appointment[];
        prescriptions: Prescription[];
    };
}

export default function PatientShow({ patient }: PatientShowProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const visionTests = patient.vision_tests || [];
    const appointments = patient.appointments || [];
    const prescriptions = patient.prescriptions || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors duration-200">
                        <CheckCircle className="h-3 w-3 mr-1.5" />
                        Completed
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors duration-200">
                        <Timer className="h-3 w-3 mr-1.5" />
                        Pending
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors duration-200">
                        <AlertTriangle className="h-3 w-3 mr-1.5" />
                        Cancelled
                    </Badge>
                );
            default:
                return <Badge variant="outline" className="hover:bg-gray-50 transition-colors duration-200">{status}</Badge>;
        }
    };

    const getVisionScore = (vision: string | null) => {
        if (!vision) return 'N/A';
        const score = vision.split('/');
        if (score.length === 2) {
            const percentage = (parseInt(score[0]) / parseInt(score[1])) * 100;
            if (percentage >= 100) return 'Excellent';
            if (percentage >= 80) return 'Good';
            if (percentage >= 60) return 'Fair';
            return 'Poor';
        }
        return vision;
    };

    const hasRecentActivity = () => {
        const recentThreshold = new Date();
        recentThreshold.setDate(recentThreshold.getDate() - 30);

        return [...appointments, ...visionTests, ...prescriptions].some(item => {
            const itemDate = new Date(item.created_at || item.test_date || item.appointment_date);
            return itemDate > recentThreshold;
        });
    };

    const getHealthScoreColor = () => {
        const totalItems = visionTests.length + appointments.length + prescriptions.length;
        if (totalItems >= 10) return 'text-emerald-600';
        if (totalItems >= 5) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <AdminLayout title={`Patient: ${patient.name}`}>
            <Head title={`Patient: ${patient.name}`} />

            {/* Modern Hero Header */}
            <div className="mb-8">
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 rounded-2xl shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                    <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(156,146,172,0.15) 1px, transparent 0)`,
                        backgroundSize: '20px 20px'
                    }}></div>

                    <div className="relative p-8 lg:p-10">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                            <div className="flex items-start space-x-6">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/20 shadow-xl">
                                        <User className="h-10 w-10 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <Award className="h-3 w-3 text-white" />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <h1 className="text-3xl lg:text-4xl font-bold text-white">{patient.name}</h1>
                                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                                            VIP Patient
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 text-blue-100 mb-4">
                                        <span className="flex items-center space-x-2">
                                            <Shield className="h-4 w-4" />
                                            <span className="font-medium">ID: {patient.patient_id}</span>
                                        </span>
                                        {patient.date_of_birth && (
                                            <span className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>{calculateAge(patient.date_of_birth)} years old</span>
                                            </span>
                                        )}
                                        <span className="flex items-center space-x-2">
                                            <Activity className="h-4 w-4" />
                                            <span>{hasRecentActivity() ? 'Recently Active' : 'Inactive'}</span>
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                                            <div className="flex items-center space-x-2">
                                                <Eye className="h-4 w-4 text-blue-300" />
                                                <span className="text-sm font-medium text-white">{visionTests.length} Vision Tests</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-green-300" />
                                                <span className="text-sm font-medium text-white">{appointments.length} Appointments</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                                            <div className="flex items-center space-x-2">
                                                <FileText className="h-4 w-4 text-purple-300" />
                                                <span className="text-sm font-medium text-white">{prescriptions.length} Prescriptions</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 lg:flex-col lg:w-auto">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-white text-blue-900 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                                >
                                    <Link href={route('visiontests.create', patient.id)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Vision Test
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-blue-900 transition-all duration-300"
                                >
                                    <Link href={route('appointments.create.patient', patient.id)}>
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Book Appointment
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-blue-900 transition-all duration-300"
                                >
                                    <Link href={route('prescriptions.create.patient', patient.id)}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Prescribe
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-blue-900 transition-all duration-300"
                                >
                                    <Link href={route('patients.edit', patient.id)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Link>
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
                            value="overview"
                            className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:scale-105"
                        >
                            <Activity className="h-4 w-4" />
                            <span className="font-medium">Overview</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="vision_tests"
                            className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:scale-105"
                        >
                            <Eye className="h-4 w-4" />
                            <span className="font-medium">Vision Tests</span>
                            <Badge variant="secondary" className="ml-1 text-xs">{visionTests.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="appointments"
                            className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:scale-105"
                        >
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Appointments</span>
                            <Badge variant="secondary" className="ml-1 text-xs">{appointments.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="prescriptions"
                            className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:scale-105"
                        >
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">Prescriptions</span>
                            <Badge variant="secondary" className="ml-1 text-xs">{prescriptions.length}</Badge>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-8">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        <Card className="xl:col-span-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100 rounded-t-xl">
                                <CardTitle className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">Patient Information</span>
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
                                                    <p className="text-xl font-bold text-gray-900">{patient.name}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 hover:shadow-md transition-all duration-300">
                                            <div className="flex items-start space-x-4">
                                                <div className="p-3 bg-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    <Phone className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-emerald-600 mb-1">Phone Number</p>
                                                    <p className="text-xl font-bold text-gray-900">{patient.phone}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 hover:shadow-md transition-all duration-300">
                                            <div className="flex items-start space-x-4">
                                                <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    <Mail className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-purple-600 mb-1">Email Address</p>
                                                    <p className="text-xl font-bold text-gray-900">{patient.email || 'Not provided'}</p>
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
                                                        {patient.date_of_birth
                                                            ? `${formatDate(patient.date_of_birth)} (${calculateAge(patient.date_of_birth)} years)`
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
                                                        {patient.gender
                                                            ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
                                                            : 'Not specified'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group p-4 rounded-xl bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 hover:shadow-md transition-all duration-300">
                                            <div className="flex items-start space-x-4">
                                                <div className="p-3 bg-teal-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    <Calendar className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-teal-600 mb-1">Registration Date</p>
                                                    <p className="text-xl font-bold text-gray-900">{formatDate(patient.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {patient.address && (
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <div className="group p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 hover:shadow-md transition-all duration-300">
                                            <div className="flex items-start space-x-4">
                                                <div className="p-3 bg-indigo-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    <MapPin className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-indigo-600 mb-2">Address</p>
                                                    <p className="text-lg font-semibold text-gray-900">{patient.address}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {patient.medical_history && (
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <div className="group p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 hover:shadow-md transition-all duration-300">
                                            <div className="flex items-start space-x-4">
                                                <div className="p-3 bg-red-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                    <Stethoscope className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-red-600 mb-3">Medical History</p>
                                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
                                                        <p className="text-gray-900 whitespace-pre-line leading-relaxed">{patient.medical_history}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="xl:col-span-4 space-y-6">
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 rounded-t-xl">
                                    <CardTitle className="flex items-center space-x-3">
                                        <div className="p-2 bg-emerald-500 rounded-lg">
                                            <BarChart3 className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-lg font-bold text-gray-900">Health Dashboard</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="text-center mb-6">
                                            <div className={`text-4xl font-bold ${getHealthScoreColor()} mb-2`}>
                                                {((visionTests.length + appointments.length + prescriptions.length) * 10).toString().padStart(2, '0')}
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium">Health Score</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="group p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-300 cursor-pointer">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                                            <Eye className="h-4 w-4 text-white" />
                                                        </div>
                                                        <span className="font-semibold text-blue-900">Vision Tests</span>
                                                    </div>
                                                    <Badge className="bg-blue-500 text-white text-sm font-bold">{visionTests.length}</Badge>
                                                </div>
                                            </div>

                                            <div className="group p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-300 cursor-pointer">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-purple-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                                            <Calendar className="h-4 w-4 text-white" />
                                                        </div>
                                                        <span className="font-semibold text-purple-900">Appointments</span>
                                                    </div>
                                                    <Badge className="bg-purple-500 text-white text-sm font-bold">{appointments.length}</Badge>
                                                </div>
                                            </div>

                                            <div className="group p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-300 cursor-pointer">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-orange-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                                            <FileText className="h-4 w-4 text-white" />
                                                        </div>
                                                        <span className="font-semibold text-orange-900">Prescriptions</span>
                                                    </div>
                                                    <Badge className="bg-orange-500 text-white text-sm font-bold">{prescriptions.length}</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {visionTests.length > 0 && (
                                            <div className="pt-6 border-t border-gray-200">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                                    <p className="text-sm font-semibold text-gray-700">Latest Vision Test</p>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-3">{formatDate(visionTests[0].test_date)}</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-lg border border-red-200">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                            <span className="text-xs font-medium text-red-700">Right Eye</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900">{getVisionScore(visionTests[0].right_eye_vision)}</span>
                                                    </div>
                                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                            <span className="text-xs font-medium text-blue-700">Left Eye</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900">{getVisionScore(visionTests[0].left_eye_vision)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 rounded-t-xl">
                                    <CardTitle className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-500 rounded-lg">
                                            <Eye className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-lg font-bold text-gray-900">Latest Vision Test</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {visionTests?.length > 0 ? (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{formatDate(visionTests[0].test_date)}</span>
                                                </div>
                                                <Badge variant="outline" className="text-xs font-medium">
                                                    By {visionTests[0].performed_by?.name}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-300">
                                                    <h4 className="font-bold text-red-700 mb-4 flex items-center">
                                                        <Target className="h-4 w-4 mr-2" />
                                                        Right Eye (OD)
                                                    </h4>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                                            <span className="text-sm text-gray-600">Vision:</span>
                                                            <span className="font-bold text-gray-900">{visionTests[0].right_eye_vision || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                                            <span className="text-sm text-gray-600">Power:</span>
                                                            <span className="font-bold text-gray-900">
                                                                {visionTests[0].right_eye_power !== null ? visionTests[0].right_eye_power : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                                            <span className="text-sm text-gray-600">Pressure:</span>
                                                            <span className="font-bold text-gray-900">{visionTests[0].right_eye_pressure || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-300">
                                                    <h4 className="font-bold text-blue-700 mb-4 flex items-center">
                                                        <Target className="h-4 w-4 mr-2" />
                                                        Left Eye (OS)
                                                    </h4>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                                            <span className="text-sm text-gray-600">Vision:</span>
                                                            <span className="font-bold text-gray-900">{visionTests[0].left_eye_vision || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                                            <span className="text-sm text-gray-600">Power:</span>
                                                            <span className="font-bold text-gray-900">
                                                                {visionTests[0].left_eye_power !== null ? visionTests[0].left_eye_power : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                                            <span className="text-sm text-gray-600">Pressure:</span>
                                                            <span className="font-bold text-gray-900">{visionTests[0].left_eye_pressure || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {visionTests[0].additional_notes && (
                                                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                                        <FileText className="h-4 w-4 mr-1" />
                                                        Additional Notes:
                                                    </p>
                                                    <p className="text-sm text-gray-600 leading-relaxed">{visionTests[0].additional_notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Eye className="h-10 w-10 text-gray-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-3">No vision tests recorded</h3>
                                            <p className="text-gray-500 mb-6 leading-relaxed">Start tracking this patient's eye health</p>
                                            <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300">
                                                <Link href={route('visiontests.create', patient.id)}>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Record First Vision Test
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>

                                {visionTests?.length > 0 && (
                                    <CardFooter className="bg-gray-50 border-t rounded-b-xl p-4">
                                        <div className="flex space-x-3 w-full">
                                            <Button variant="outline" className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300" asChild>
                                                <Link href={route('visiontests.show', visionTests[0].id)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                </Link>
                                            </Button>
                                            <Button variant="outline" className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300" asChild>
                                                <Link href={route('visiontests.print', visionTests[0].id)}>
                                                    <Printer className="h-4 w-4 mr-2" />
                                                    Print Report
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardFooter>
                                )}
                            </Card>
                        </div>
                    </div>

                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 rounded-t-xl">
                            <CardTitle className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-500 rounded-lg">
                                    <Activity className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-gray-900">Recent Activity Timeline</span>
                                <Badge className="bg-indigo-100 text-indigo-700">Last 30 Days</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flow-root">
                                <ul className="divide-y divide-gray-100">
                                    {[...(appointments || []), ...(visionTests || []), ...(prescriptions || [])]
                                        .sort((a, b) => new Date(b.created_at || b.test_date || b.appointment_date).getTime() -
                                            new Date(a.created_at || a.test_date || a.appointment_date).getTime())
                                        .slice(0, 8)
                                        .map((item, index) => {
                                            if ('test_date' in item) {
                                                return (
                                                    <li key={`vision-${item.id}`} className="py-6 group hover:bg-blue-50 rounded-xl -mx-4 px-4 transition-all duration-300">
                                                        <div className="flex items-start space-x-5">
                                                            <div className="flex-shrink-0">
                                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                                    <Eye className="h-6 w-6 text-white" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="text-lg font-bold text-gray-900">Vision Test Completed</h4>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Badge className="bg-blue-100 text-blue-700">Latest</Badge>
                                                                        <p className="text-sm text-gray-500 font-medium">{formatDate(item.test_date)}</p>
                                                                    </div>
                                                                </div>
                                                                <p className="text-gray-600 mb-3 leading-relaxed">
                                                                    Performed by <span className="font-semibold">{item.performed_by?.name}</span> •
                                                                    Right Eye: <span className="font-semibold">{item.right_eye_vision || 'N/A'}</span> •
                                                                    Left Eye: <span className="font-semibold">{item.left_eye_vision || 'N/A'}</span>
                                                                </p>
                                                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-0 h-auto font-semibold transition-all duration-300" asChild>
                                                                    <Link href={route('visiontests.show', item.id)}>
                                                                        View Complete Results <ChevronRight className="ml-1 h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            } else if ('appointment_date' in item) {
                                                return (
                                                    <li key={`apt-${item.id}`} className="py-6 group hover:bg-green-50 rounded-xl -mx-4 px-4 transition-all duration-300">
                                                        <div className="flex items-start space-x-5">
                                                            <div className="flex-shrink-0">
                                                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                                    <Calendar className="h-6 w-6 text-white" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="text-lg font-bold text-gray-900">
                                                                        Appointment with Dr. {item.doctor.user.name}
                                                                    </h4>
                                                                    <div className="flex items-center space-x-3">
                                                                        {getStatusBadge(item.status)}
                                                                        <p className="text-sm text-gray-500 font-medium">{formatDate(item.appointment_date)}</p>
                                                                    </div>
                                                                </div>
                                                                <p className="text-gray-600 mb-3 leading-relaxed">
                                                                    <span className="font-semibold">{formatTime(item.appointment_time)}</span> •
                                                                    Serial: <span className="font-semibold">#{item.serial_number}</span>
                                                                    {item.doctor.specialization && ` • ${item.doctor.specialization}`}
                                                                </p>
                                                                <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-800 hover:bg-green-100 p-0 h-auto font-semibold transition-all duration-300" asChild>
                                                                    <Link href={route('appointments.show', item.id)}>
                                                                        View Appointment Details <ChevronRight className="ml-1 h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            } else {
                                                return (
                                                    <li key={`presc-${item.id}`} className="py-6 group hover:bg-purple-50 rounded-xl -mx-4 px-4 transition-all duration-300">
                                                        <div className="flex items-start space-x-5">
                                                            <div className="flex-shrink-0">
                                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                                    <FileText className="h-6 w-6 text-white" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="text-lg font-bold text-gray-900">
                                                                        Prescription by Dr. {item.doctor.user.name}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-500 font-medium">{formatDate(item.created_at)}</p>
                                                                </div>
                                                                <p className="text-gray-600 mb-3 leading-relaxed">
                                                                    {item.diagnosis ? `${item.diagnosis}` : 'Prescription issued'}
                                                                    {item.followup_date && ` • Follow-up: ${formatDate(item.followup_date)}`}
                                                                    • <span className="font-semibold">{item.prescription_medicines.length} medicines prescribed</span>
                                                                </p>
                                                                <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 p-0 h-auto font-semibold transition-all duration-300" asChild>
                                                                    <Link href={route('prescriptions.show', item.id)}>
                                                                        View Prescription Details <ChevronRight className="ml-1 h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            }
                                        })}
                                    {[...(appointments || []), ...(visionTests || []), ...(prescriptions || [])].length === 0 && (
                                        <li className="py-16 text-center">
                                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Activity className="h-12 w-12 text-gray-400" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No activity yet</h3>
                                            <p className="text-gray-500 text-lg leading-relaxed max-w-md mx-auto">Start by recording a vision test or booking an appointment to begin tracking this patient's health journey</p>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="vision_tests" className="space-y-6">
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 rounded-t-xl">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <CardTitle className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                        <Eye className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">Vision Test History</span>
                                    <Badge className="bg-blue-100 text-blue-700">{visionTests.length} Tests</Badge>
                                </CardTitle>
                                <div className="flex space-x-3">
                                    <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-300" asChild>
                                        <Link href={route('visiontests.create', patient.id)}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Export Data
                                        </Link>
                                    </Button>
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                                        <Link href={route('visiontests.create', patient.id)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Vision Test
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {visionTests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-blue-100">
                                                <TableHead className="font-bold text-gray-800 py-4">Test Date</TableHead>
                                                <TableHead className="font-bold text-gray-800">Vision Acuity (R/L)</TableHead>
                                                <TableHead className="font-bold text-gray-800">Power (R/L)</TableHead>
                                                <TableHead className="font-bold text-gray-800">Pressure (R/L)</TableHead>
                                                <TableHead className="font-bold text-gray-800">Performed By</TableHead>
                                                <TableHead className="text-right font-bold text-gray-800">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visionTests.map((test, index) => (
                                                <TableRow key={test.id} className="hover:bg-blue-50 transition-all duration-300 border-b border-gray-100 group">
                                                    <TableCell className="font-medium py-4">
                                                        <div className="flex items-center space-x-3">
                                                            {index === 0 && (
                                                                <Badge className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-xs font-bold animate-pulse">
                                                                    Latest
                                                                </Badge>
                                                            )}
                                                            <div>
                                                                <span className="text-gray-900 font-semibold">{formatDate(test.test_date)}</span>
                                                                <div className="text-xs text-gray-500">{index === 0 ? 'Most Recent' : `${index + 1} tests ago`}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
                                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                                <span className="text-sm font-semibold">{test.right_eye_vision || 'N/A'}</span>
                                                                <Badge variant="outline" className="text-xs">{getVisionScore(test.right_eye_vision)}</Badge>
                                                            </div>
                                                            <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                                <span className="text-sm font-semibold">{test.left_eye_vision || 'N/A'}</span>
                                                                <Badge variant="outline" className="text-xs">{getVisionScore(test.left_eye_vision)}</Badge>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-2">
                                                            <div className="text-sm bg-gray-50 p-2 rounded-lg">
                                                                <span className="font-semibold">{test.right_eye_power !== null ? test.right_eye_power : 'N/A'}</span>
                                                            </div>
                                                            <div className="text-sm bg-gray-50 p-2 rounded-lg">
                                                                <span className="font-semibold">{test.left_eye_power !== null ? test.left_eye_power : 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-2">
                                                            <div className="text-sm bg-gray-50 p-2 rounded-lg">
                                                                <span className="font-semibold">{test.right_eye_pressure || 'N/A'}</span>
                                                            </div>
                                                            <div className="text-sm bg-gray-50 p-2 rounded-lg">
                                                                <span className="font-semibold">{test.left_eye_pressure || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                                                <User className="h-4 w-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-semibold text-gray-900">{test.performed_by?.name || 'N/A'}</span>
                                                                <div className="text-xs text-gray-500">Optometrist</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            <Button size="sm" variant="ghost" className="hover:bg-blue-100 transition-all duration-300 group-hover:scale-110" asChild>
                                                                <Link href={route('visiontests.show', test.id)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="hover:bg-blue-100 transition-all duration-300 group-hover:scale-110" asChild>
                                                                <Link href={route('visiontests.edit', test.id)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="hover:bg-blue-100 transition-all duration-300 group-hover:scale-110" asChild>
                                                                <Link href={route('visiontests.print', test.id)}>
                                                                    <Printer className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                        <Eye className="h-16 w-16 text-blue-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No vision tests recorded</h3>
                                    <p className="text-gray-500 mb-8 text-lg leading-relaxed max-w-md mx-auto">Start tracking this patient's eye health with their first comprehensive vision test.</p>
                                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" asChild>
                                        <Link href={route('visiontests.create', patient.id)}>
                                            <Plus className="h-5 w-5 mr-2" />
                                            Record First Vision Test
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appointments" className="space-y-6">
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 rounded-t-xl">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <CardTitle className="flex items-center space-x-3">
                                    <div className="p-2 bg-green-500 rounded-lg">
                                        <Calendar className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">Appointment History</span>
                                    <Badge className="bg-green-100 text-green-700">{appointments.length} Appointments</Badge>
                                </CardTitle>
                                <div className="flex space-x-3">
                                    <Button size="sm" variant="outline" className="hover:bg-green-50 hover:border-green-300 transition-all duration-300" asChild>
                                        <Link href={route('appointments.index')}>
                                            <Share2 className="h-4 w-4 mr-2" />
                                            View All
                                        </Link>
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                                        <Link href={route('appointments.create.patient', patient.id)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Book New Appointment
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {appointments?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gradient-to-r from-gray-50 to-green-50 border-b-2 border-green-100">
                                                <TableHead className="font-bold text-gray-800 py-4">Date & Time</TableHead>
                                                <TableHead className="font-bold text-gray-800">Doctor</TableHead>
                                                <TableHead className="font-bold text-gray-800">Serial Number</TableHead>
                                                <TableHead className="font-bold text-gray-800">Status</TableHead>
                                                <TableHead className="text-right font-bold text-gray-800">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {appointments.map((appointment, index) => (
                                                <TableRow key={appointment.id} className="hover:bg-green-50 transition-all duration-300 border-b border-gray-100 group">
                                                    <TableCell className="font-medium py-4">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-2">
                                                                <Calendar className="h-4 w-4 text-green-600" />
                                                                <span className="font-bold text-gray-900">{formatDate(appointment.appointment_date)}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                                <Clock className="h-3 w-3" />
                                                                <span className="font-semibold">{formatTime(appointment.appointment_time)}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-xl">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                                                <Stethoscope className="h-5 w-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900">Dr. {appointment.doctor.user.name}</div>
                                                                {appointment.doctor.specialization && (
                                                                    <div className="text-sm text-green-600 font-medium">{appointment.doctor.specialization}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-mono font-bold text-lg px-3 py-1 bg-gray-50">
                                                            #{appointment.serial_number}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-start">
                                                            {getStatusBadge(appointment.status)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            <Button size="sm" variant="ghost" className="hover:bg-green-100 transition-all duration-300 group-hover:scale-110" asChild>
                                                                <Link href={route('appointments.show', appointment.id)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            {appointment.status === 'pending' && (
                                                                <Button size="sm" variant="ghost" className="hover:bg-green-100 transition-all duration-300 group-hover:scale-110" asChild>
                                                                    <Link href={route('prescriptions.create.patient', patient.id)}>
                                                                        <FileText className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                            <Button size="sm" variant="ghost" className="hover:bg-green-100 transition-all duration-300 group-hover:scale-110" asChild>
                                                                <Link href={route('appointments.print', appointment.id)}>
                                                                    <Printer className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                        <Calendar className="h-16 w-16 text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No appointments scheduled</h3>
                                    <p className="text-gray-500 mb-8 text-lg leading-relaxed max-w-md mx-auto">Book the patient's first appointment with a qualified doctor.</p>
                                    <Button size="lg" className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" asChild>
                                        <Link href={route('appointments.create.patient', patient.id)}>
                                            <Plus className="h-5 w-5 mr-2" />
                                            Schedule First Appointment
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="prescriptions" className="space-y-6">
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 rounded-t-xl">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                <CardTitle className="flex items-center space-x-3">
                                    <div className="p-2 bg-purple-500 rounded-lg">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">Prescription History</span>
                                    <Badge className="bg-purple-100 text-purple-700">{prescriptions.length} Prescriptions</Badge>
                                </CardTitle>
                                <div className="flex space-x-3">
                                    <Button size="sm" variant="outline" className="hover:bg-purple-50 hover:border-purple-300 transition-all duration-300" asChild>
                                        <Link href={route('patients.index')}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Export All
                                        </Link>
                                    </Button>
                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                                        <Link href={route('prescriptions.create.patient', patient.id)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Prescription
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8">
                            {prescriptions?.length > 0 ? (
                                <div className="space-y-8">
                                    {prescriptions.map((prescription, index) => (
                                        <Card key={prescription.id} className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 group">
                                            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 rounded-t-xl">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                            <Stethoscope className="h-6 w-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900">Dr. {prescription.doctor.user.name}</h3>
                                                            <div className="flex items-center space-x-4 mt-1">
                                                                <p className="text-sm text-gray-600 flex items-center">
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    {formatDate(prescription.created_at)}
                                                                </p>
                                                                {index === 0 && (
                                                                    <Badge className="bg-gradient-to-r from-green-400 to-green-600 text-white text-xs font-bold animate-pulse">
                                                                        Latest Prescription
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Button size="sm" variant="ghost" className="hover:bg-purple-100 transition-all duration-300" asChild>
                                                            <Link href={route('prescriptions.show', prescription.id)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="hover:bg-purple-100 transition-all duration-300" asChild>
                                                            <Link href={route('prescriptions.print', prescription.id)}>
                                                                <Printer className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="hover:bg-purple-100 transition-all duration-300">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="p-8">
                                                {prescription.diagnosis && (
                                                    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-shadow duration-300">
                                                        <h4 className="text-lg font-bold text-blue-800 mb-3 flex items-center">
                                                            <Target className="h-5 w-5 mr-2" />
                                                            Diagnosis
                                                        </h4>
                                                        <p className="text-blue-700 text-lg leading-relaxed">{prescription.diagnosis}</p>
                                                    </div>
                                                )}

                                                <div className="mb-8">
                                                    <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                                                        <Zap className="h-5 w-5 mr-2" />
                                                        Prescribed Medicines ({prescription.prescription_medicines.length})
                                                    </h4>
                                                    <div className="grid gap-4">
                                                        {prescription.prescription_medicines.map((pm, pmIndex) => (
                                                            <div key={pm.id} className="group p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                                                                <div className="flex items-start space-x-4">
                                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                                        <span className="text-white font-bold text-sm">{pmIndex + 1}</span>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h5 className="text-lg font-bold text-gray-900 mb-3">{pm.medicine.name}</h5>
                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                            <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                                                                                <Clock className="h-4 w-4 text-blue-500" />
                                                                                <div>
                                                                                    <span className="text-xs text-gray-500 block">Dosage</span>
                                                                                    <span className="font-semibold text-gray-900">{pm.dosage}</span>
                                                                                </div>
                                                                            </div>
                                                                            {pm.duration && (
                                                                                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                                                                                    <Timer className="h-4 w-4 text-green-500" />
                                                                                    <div>
                                                                                        <span className="text-xs text-gray-500 block">Duration</span>
                                                                                        <span className="font-semibold text-gray-900">{pm.duration}</span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {pm.instructions && (
                                                                                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                                                                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                                                    <div>
                                                                                        <span className="text-xs text-gray-500 block">Instructions</span>
                                                                                        <span className="font-semibold text-gray-900">{pm.instructions}</span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {prescription.followup_date && (
                                                    <div className="p-6 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200 hover:shadow-md transition-shadow duration-300">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                                                                <Calendar className="h-6 w-6 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="text-lg font-bold text-amber-800">Follow-up Required</p>
                                                                <p className="text-amber-700 font-semibold">{formatDate(prescription.followup_date)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                        <FileText className="h-16 w-16 text-purple-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No prescriptions yet</h3>
                                    <p className="text-gray-500 mb-8 text-lg leading-relaxed max-w-md mx-auto">Create the patient's first prescription to start their treatment journey.</p>
                                    <Button size="lg" className="bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1" asChild>
                                        <Link href={route('prescriptions.create.patient', patient.id)}>
                                            <Plus className="h-5 w-5 mr-2" />
                                            Create First Prescription
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AdminLayout>
    );
}
