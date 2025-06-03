import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    User,
    Calendar,
    FileText,
    PlusCircle,
    X,
    Save,
    Trash2,
    AlertCircle,
    Eye,
    Stethoscope,
    Clock,
    Phone,
    Shield,
    Activity,
    Target,
    Pill,
    Heart,
    CheckCircle,
    AlertTriangle,
    Users,
    MapPin,
    Filter
} from 'lucide-react';
import { formatDate, calculateAge } from '@/lib/utils';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    date_of_birth: string | null;
    gender: string | null;
}

interface VisionTest {
    id: number;
    right_eye_vision: string | null;
    left_eye_vision: string | null;
    right_eye_power: number | null;
    left_eye_power: number | null;
    test_date: string;
}

interface Medicine {
    id: number;
    name: string;
    generic_name: string | null;
    type: string;
}

interface Appointment {
    id: number;
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
}

interface Doctor {
    id: number;
    user: {
        id: number;
        name: string;
    };
}

interface PrescriptionCreateProps {
    patient: Patient;
    medicines: Medicine[];
    latestVisionTest?: VisionTest;
    appointment?: Appointment;
    doctor: Doctor;
}

interface MedicineItem {
    id: string;
    medicine_id: string;
    dosage: string;
    duration: string;
    instructions: string;
}

export default function PrescriptionCreate({
    patient,
    medicines,
    latestVisionTest,
    appointment,
    doctor
}: PrescriptionCreateProps) {
    const [medicineItems, setMedicineItems] = useState<MedicineItem[]>([
        {
            id: `med-${Date.now()}`,
            medicine_id: '',
            dosage: '',
            duration: '',
            instructions: ''
        }
    ]);

    const [selectedMedicineType, setSelectedMedicineType] = useState<string>('');

    // Group medicines by type for easier selection
    const medicinesByType = medicines.reduce((acc, medicine) => {
        if (!acc[medicine.type]) {
            acc[medicine.type] = [];
        }
        acc[medicine.type].push(medicine);
        return acc;
    }, {} as Record<string, Medicine[]>);

    const medicineTypes = Object.keys(medicinesByType).sort();

    const { data, setData, post, processing, errors } = useForm({
        patient_id: patient.id,
        doctor_id: doctor.id,
        appointment_id: appointment?.id || '',
        diagnosis: '',
        advice: '',
        notes: '',
        followup_date: '',
        medicines: [] as any[],
    });

    const addMedicineItem = () => {
        setMedicineItems([
            ...medicineItems,
            {
                id: `med-${Date.now()}`,
                medicine_id: '',
                dosage: '',
                duration: '',
                instructions: ''
            }
        ]);
    };

    const removeMedicineItem = (id: string) => {
        if (medicineItems.length === 1) {
            return;
        }
        setMedicineItems(medicineItems.filter(item => item.id !== id));
    };

    const updateMedicineItem = (id: string, field: keyof MedicineItem, value: string) => {
        setMedicineItems(
            medicineItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const isValid = medicineItems.every(item => item.medicine_id && item.dosage);

        if (!isValid) {
            alert('Please select medicine and specify dosage for all medications');
            return;
        }

        const formattedMedicines = medicineItems.map(item => ({
            medicine_id: item.medicine_id,
            dosage: item.dosage,
            duration: item.duration,
            instructions: item.instructions
        }));

        setData({ ...data, medicines: formattedMedicines });

        post(route('prescriptions.store', patient.id), {
            onSuccess: () => {
                // Will redirect to prescription show page
            }
        });
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

    const getGenderBadge = (gender: string | null) => {
        if (!gender) return null;

        const genderFormatted = gender.charAt(0).toUpperCase() + gender.slice(1);
        const colorClass = gender === 'male'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-pink-50 text-pink-700 border-pink-200';

        return (
            <Badge className={`${colorClass} font-medium`}>
                {genderFormatted}
            </Badge>
        );
    };

    return (
        <AdminLayout title="Create Prescription">
            <Head title="Create Prescription" />

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Prescription</h1>
                        <p className="text-gray-600">Write a detailed prescription for the patient</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {doctor && (
                            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
                                <Stethoscope className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                    Dr. {doctor.user?.name || doctor.name || 'Unknown Doctor'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Patient & Appointment Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Patient Information Card */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 rounded-t-xl">
                        <CardTitle className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Patient Information</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                {patient.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{patient.name}</h3>
                                    <p className="text-sm text-gray-500 flex items-center space-x-1">
                                        <Shield className="h-3 w-3" />
                                        <span>ID: {patient.patient_id}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {patient.date_of_birth && (
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Age</p>
                                                <p className="font-semibold text-gray-900">{calculateAge(patient.date_of_birth)} years</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="font-semibold text-gray-900">{patient.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    {getGenderBadge(patient.gender)}
                                    {patient.email && (
                                        <Badge variant="outline" className="text-xs">
                                            {patient.email}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Appointment Information Card */}
                {appointment && (
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200 rounded-t-xl">
                            <CardTitle className="flex items-center space-x-3">
                                <div className="p-2 bg-emerald-500 rounded-lg">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-gray-900">Appointment Details</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-emerald-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Date</p>
                                            <p className="font-semibold text-gray-900">{formatDate(appointment.appointment_date)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-emerald-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Time</p>
                                            <p className="font-semibold text-gray-900">{appointment.appointment_time}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                    <span className="text-sm font-medium text-emerald-700">Serial Number</span>
                                    <Badge className="bg-emerald-500 text-white font-bold">#{appointment.serial_number}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column - Vision Test & Prescription Details */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Latest Vision Test */}
                        {latestVisionTest && (
                            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 rounded-t-xl">
                                    <CardTitle className="flex items-center space-x-3">
                                        <div className="p-2 bg-purple-500 rounded-lg">
                                            <Eye className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-xl font-bold text-gray-900">Latest Vision Test</span>
                                    </CardTitle>
                                    <CardDescription className="flex items-center space-x-2 text-purple-600">
                                        <Clock className="h-4 w-4" />
                                        <span>Test conducted on {formatDate(latestVisionTest.test_date)}</span>
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5">
                                            <h4 className="font-bold text-red-700 mb-4 flex items-center">
                                                <Target className="h-4 w-4 mr-2" />
                                                Right Eye (OD)
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                                    <span className="text-sm text-gray-600">Vision:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-bold text-gray-900">{latestVisionTest.right_eye_vision || 'N/A'}</span>
                                                        <Badge variant="outline" className="text-xs">{getVisionScore(latestVisionTest.right_eye_vision)}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                                    <span className="text-sm text-gray-600">Power:</span>
                                                    <span className="font-bold text-gray-900">
                                                        {latestVisionTest.right_eye_power !== null ? latestVisionTest.right_eye_power : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                                            <h4 className="font-bold text-blue-700 mb-4 flex items-center">
                                                <Target className="h-4 w-4 mr-2" />
                                                Left Eye (OS)
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                                    <span className="text-sm text-gray-600">Vision:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-bold text-gray-900">{latestVisionTest.left_eye_vision || 'N/A'}</span>
                                                        <Badge variant="outline" className="text-xs">{getVisionScore(latestVisionTest.left_eye_vision)}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                                    <span className="text-sm text-gray-600">Power:</span>
                                                    <span className="font-bold text-gray-900">
                                                        {latestVisionTest.left_eye_power !== null ? latestVisionTest.left_eye_power : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Diagnosis and Treatment */}
                        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200 rounded-t-xl">
                                <CardTitle className="flex items-center space-x-3">
                                    <div className="p-2 bg-indigo-500 rounded-lg">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">Diagnosis and Treatment</span>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <Input
                                        label="Diagnosis"
                                        value={data.diagnosis}
                                        onChange={(e) => setData('diagnosis', e.target.value)}
                                        placeholder="Enter detailed diagnosis..."
                                        error={errors.diagnosis}
                                        leftIcon={<Target className="h-4 w-4" />}
                                        helperText="Provide a comprehensive diagnosis based on examination"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Advice / Recommendations
                                    </label>
                                    <textarea
                                        value={data.advice}
                                        onChange={(e) => setData('advice', e.target.value)}
                                        className="flex w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                                        rows={4}
                                        placeholder="Enter advice, lifestyle recommendations, or precautions..."
                                    />
                                    {errors.advice && (
                                        <div className="mt-2 flex items-start space-x-1">
                                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-red-600">{errors.advice}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="flex w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                                        rows={3}
                                        placeholder="Any additional notes or observations..."
                                    />
                                    {errors.notes && (
                                        <div className="mt-2 flex items-start space-x-1">
                                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-red-600">{errors.notes}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Input
                                        label="Follow-up Date"
                                        type="date"
                                        value={data.followup_date}
                                        onChange={(e) => setData('followup_date', e.target.value)}
                                        error={errors.followup_date}
                                        leftIcon={<Calendar className="h-4 w-4" />}
                                        helperText="Schedule next visit if required"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Medicines */}
                    <div className="space-y-6">
                        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200 rounded-t-xl">
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-amber-500 rounded-lg">
                                            <Pill className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-xl font-bold text-gray-900">Prescribed Medicines</span>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addMedicineItem}
                                        leftIcon={<PlusCircle className="h-4 w-4" />}
                                        className="bg-amber-600 hover:bg-amber-700"
                                    >
                                        Add Medicine
                                    </Button>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-6">
                                {/* Medicine Type Filter */}
                                <div className="mb-6">
                                    <Select
                                        label="Filter by Medicine Type"
                                        value={selectedMedicineType}
                                        onChange={(e) => setSelectedMedicineType(e.target.value)}
                                        options={[
                                            { value: '', label: 'All medicine types' },
                                            ...medicineTypes.map(type => ({ value: type, label: type }))
                                        ]}
                                        leftIcon={<Filter className="h-4 w-4" />}
                                    />
                                </div>

                                <div className="space-y-6">
                                    {medicineItems.map((item, index) => (
                                        <div key={item.id} className="group p-5 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-300 relative">
                                            {medicineItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedicineItem(item.id)}
                                                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}

                                            <div className="space-y-4">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <h4 className="font-semibold text-gray-900">Medicine #{index + 1}</h4>
                                                </div>

                                                <Select
                                                    label="Medicine Name"
                                                    value={item.medicine_id}
                                                    onChange={(e) => updateMedicineItem(item.id, 'medicine_id', e.target.value)}
                                                    options={[
                                                        { value: '', label: 'Select medicine' },
                                                        ...medicines
                                                            .filter(medicine => !selectedMedicineType || medicine.type === selectedMedicineType)
                                                            .map(medicine => ({
                                                                value: medicine.id.toString(),
                                                                label: `${medicine.name} ${medicine.generic_name ? `(${medicine.generic_name})` : ''}`,
                                                                group: medicine.type
                                                            }))
                                                    ]}
                                                    required
                                                    leftIcon={<Pill className="h-4 w-4" />}
                                                />

                                                <Input
                                                    label="Dosage"
                                                    value={item.dosage}
                                                    onChange={(e) => updateMedicineItem(item.id, 'dosage', e.target.value)}
                                                    placeholder="e.g., 1-0-1, 0-0-1, 1 tablet twice daily"
                                                    required
                                                    leftIcon={<Clock className="h-4 w-4" />}
                                                />

                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input
                                                        label="Duration"
                                                        value={item.duration}
                                                        onChange={(e) => updateMedicineItem(item.id, 'duration', e.target.value)}
                                                        placeholder="e.g., 7 days, 2 weeks"
                                                        leftIcon={<Calendar className="h-4 w-4" />}
                                                    />

                                                    <Input
                                                        label="Instructions"
                                                        value={item.instructions}
                                                        onChange={(e) => updateMedicineItem(item.id, 'instructions', e.target.value)}
                                                        placeholder="e.g., After meal, Before sleep"
                                                        leftIcon={<AlertTriangle className="h-4 w-4" />}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {medicineItems.length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Pill className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No medicines added yet</h3>
                                            <p className="text-gray-500 mb-4">Add medicines to complete the prescription</p>
                                            <Button
                                                type="button"
                                                onClick={addMedicineItem}
                                                leftIcon={<PlusCircle className="h-4 w-4" />}
                                            >
                                                Add First Medicine
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Action Buttons */}
                <Card className="mt-8 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <AlertCircle className="h-4 w-4" />
                                <span>Please review all information before saving the prescription</span>
                            </div>

                            <div className="flex space-x-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    leftIcon={<X className="h-4 w-4" />}
                                    href={route('patients.show', patient.id)}
                                    size="lg"
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    leftIcon={<Save className="h-4 w-4" />}
                                    isLoading={processing}
                                    loadingText="Saving Prescription..."
                                    size="lg"
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Save Prescription
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </AdminLayout>
    );
}
