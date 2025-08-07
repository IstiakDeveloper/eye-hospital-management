import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    User, Calendar, FileText, PlusCircle, X, Save,
    AlertCircle, Eye, Stethoscope, Clock, Phone,
    Activity, Target, Pill, Heart, CheckCircle,
    AlertTriangle, MapPin, Filter, ArrowLeft,
    UserCheck, Clipboard, Thermometer, Droplets,
    ClockIcon, Glasses, Palette, DollarSign,
    Package, Layers, Settings, Sparkles, Info,
    CreditCard, Truck, Calendar as CalendarIcon,
    Copy, Trash2, RotateCcw, BookOpen, Zap,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Complete Type definitions
interface Patient {
    id: number;
    patient_id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    date_of_birth?: string;
    gender?: string;
    medical_history?: string;
    age?: number;
    recent_visits: Visit[];
    recent_prescriptions: RecentPrescription[];
}

interface Visit {
    id: number;
    visit_id: string;
    chief_complaint?: string;
    visit_notes?: string;
    overall_status: string;
    created_at: string;
    doctor_name: string;
}

interface RecentPrescription {
    id: number;
    diagnosis?: string;
    created_at: string;
    doctor_name: string;
    medicines_count: number;
    has_glasses: boolean;
    glasses_count: number;
}

interface VisionTest {
    id: number;
    test_date: string;
    formatted_date: string;
    right_eye_vision?: string;
    left_eye_vision?: string;
    right_eye_sphere?: number;
    left_eye_sphere?: number;
    right_eye_cylinder?: number;
    left_eye_cylinder?: number;
    right_eye_axis?: number;
    left_eye_axis?: number;
    pupillary_distance?: number;
    additional_notes?: string;
    performed_by: string;
}

interface Medicine {
    id: number;
    name: string;
    generic_name?: string;
    type: string;
    manufacturer?: string;
    available_quantity?: number;
}

interface Appointment {
    id: number;
    appointment_date: string;
    appointment_time: string;
    serial_number: string;
    status: string;
    formatted_date: string;
}

interface Doctor {
    id: number;
    name: string;
    specialization: string;
    consultation_fee?: number;
}

interface LatestVisit {
    id: number;
    visit_id: string;
    chief_complaint?: string;
    visit_notes?: string;
    overall_status: string;
    formatted_date: string;
}

interface PrescriptionCreateProps {
    patient: Patient;
    medicines: Medicine[];
    latestVisionTest?: VisionTest;
    latestVisit?: LatestVisit;
    appointment?: Appointment;
    doctor: Doctor;
}

interface MedicineItem {
    id: string;
    medicine_id: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: string;
}

interface GlassesItem {
    id: string;
    prescription_type: string;
    right_eye_sphere: string;
    right_eye_cylinder: string;
    right_eye_axis: string;
    right_eye_add: string;
    left_eye_sphere: string;
    left_eye_cylinder: string;
    left_eye_axis: string;
    left_eye_add: string;
    pupillary_distance: string;
    segment_height: string;
    special_instructions: string;
}

export default function PrescriptionCreate({
    patient,
    medicines,
    latestVisionTest,
    latestVisit,
    appointment,
    doctor
}: PrescriptionCreateProps) {
    // State Management
    const [medicineItems, setMedicineItems] = useState<MedicineItem[]>([
        {
            id: `med-${Date.now()}`,
            medicine_id: '',
            dosage: '',
            frequency: '',
            duration: '',
            instructions: '',
            quantity: ''
        }
    ]);

    const [glassesItems, setGlassesItems] = useState<GlassesItem[]>([]);
    const [includesGlasses, setIncludesGlasses] = useState(false);
    const [selectedMedicineType, setSelectedMedicineType] = useState<string>('');
    const [showMedicineHelp, setShowMedicineHelp] = useState(false);
    const [showGlassesHelp, setShowGlassesHelp] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloadingBlank, setIsDownloadingBlank] = useState(false);


    // Group medicines by type for easier selection
    const medicinesByType = medicines.reduce((acc, medicine) => {
        const type = medicine.type || 'General';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(medicine);
        return acc;
    }, {} as Record<string, Medicine[]>);

    const medicineTypes = Object.keys(medicinesByType).sort();

    const { data, setData, post, processing, errors } = useForm({
        patient_id: patient.id,
        doctor_id: doctor.id,
        appointment_id: appointment?.id || '',
        visit_id: latestVisit?.id || '',
        diagnosis: '',
        advice: '',
        notes: '',
        followup_date: '',
        includes_glasses: false,
        glasses_notes: '',
        medicines: [] as any[],
        glasses: [] as any[],
    });

    // Load duplicate data if available
    useEffect(() => {
        const duplicateData = sessionStorage.getItem('duplicate_prescription');
        if (duplicateData) {
            const parsed = JSON.parse(duplicateData);
            setData({
                ...data,
                diagnosis: parsed.diagnosis || '',
                advice: parsed.advice || '',
                glasses_notes: parsed.glasses_notes || '',
            });

            if (parsed.medicines && parsed.medicines.length > 0) {
                setMedicineItems(parsed.medicines.map((med: any, index: number) => ({
                    id: `med-${Date.now()}-${index}`,
                    medicine_id: med.medicine_id?.toString() || '',
                    dosage: med.dosage || '',
                    frequency: med.frequency || '',
                    duration: med.duration || '',
                    instructions: med.instructions || '',
                    quantity: med.quantity?.toString() || '',
                })));
            }

            if (parsed.glasses && parsed.glasses.length > 0) {
                setGlassesItems(parsed.glasses.map((glass: any, index: number) => ({
                    id: `glass-${Date.now()}-${index}`,
                    prescription_type: glass.prescription_type || 'distance',
                    right_eye_sphere: glass.right_eye_sphere?.toString() || '',
                    right_eye_cylinder: glass.right_eye_cylinder?.toString() || '',
                    right_eye_axis: glass.right_eye_axis?.toString() || '',
                    right_eye_add: glass.right_eye_add?.toString() || '',
                    left_eye_sphere: glass.left_eye_sphere?.toString() || '',
                    left_eye_cylinder: glass.left_eye_cylinder?.toString() || '',
                    left_eye_axis: glass.left_eye_axis?.toString() || '',
                    left_eye_add: glass.left_eye_add?.toString() || '',
                    pupillary_distance: glass.pupillary_distance?.toString() || '',
                    segment_height: glass.segment_height?.toString() || '',
                    special_instructions: glass.special_instructions || '',
                })));
                setIncludesGlasses(true);
            }

            // Clear the session storage
            sessionStorage.removeItem('duplicate_prescription');
        }
    }, []);

    const handleDownloadBlankPrescription = async () => {
        setIsDownloadingBlank(true);
        try {
            // Use window.open for direct download
            window.open(route('prescriptions.download-blank', patient.id), '_blank');
            setIsDownloadingBlank(false);
        } catch (error) {
            setIsDownloadingBlank(false);
            alert('Failed to download blank prescription. Please try again.');
        }
    };

    // Medicine Management Functions
    const addMedicineItem = () => {
        setMedicineItems([
            ...medicineItems,
            {
                id: `med-${Date.now()}`,
                medicine_id: '',
                dosage: '',
                frequency: '',
                duration: '',
                instructions: '',
                quantity: ''
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

    const clearAllMedicines = () => {
        setMedicineItems([{
            id: `med-${Date.now()}`,
            medicine_id: '',
            dosage: '',
            frequency: '',
            duration: '',
            instructions: '',
            quantity: ''
        }]);
    };

    // Glasses Management Functions
    const addGlassesItem = () => {
        setGlassesItems([
            ...glassesItems,
            {
                id: `glass-${Date.now()}`,
                prescription_type: 'distance',
                right_eye_sphere: '',
                right_eye_cylinder: '',
                right_eye_axis: '',
                right_eye_add: '',
                left_eye_sphere: '',
                left_eye_cylinder: '',
                left_eye_axis: '',
                left_eye_add: '',
                pupillary_distance: latestVisionTest?.pupillary_distance?.toString() || '',
                segment_height: '',
                special_instructions: '',
            }
        ]);
        setIncludesGlasses(true);
    };

    const removeGlassesItem = (id: string) => {
        const newItems = glassesItems.filter(item => item.id !== id);
        setGlassesItems(newItems);
        if (newItems.length === 0) {
            setIncludesGlasses(false);
        }
    };

    const updateGlassesItem = (id: string, field: keyof GlassesItem, value: string) => {
        setGlassesItems(
            glassesItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const clearAllGlasses = () => {
        setGlassesItems([]);
        setIncludesGlasses(false);
    };

    // Pre-fill prescription data from vision test
    const fillFromVisionTest = (glassesId: string) => {
        if (!latestVisionTest) return;

        updateGlassesItem(glassesId, 'right_eye_sphere', latestVisionTest.right_eye_sphere?.toString() || '');
        updateGlassesItem(glassesId, 'left_eye_sphere', latestVisionTest.left_eye_sphere?.toString() || '');
        updateGlassesItem(glassesId, 'right_eye_cylinder', latestVisionTest.right_eye_cylinder?.toString() || '');
        updateGlassesItem(glassesId, 'left_eye_cylinder', latestVisionTest.left_eye_cylinder?.toString() || '');
        updateGlassesItem(glassesId, 'right_eye_axis', latestVisionTest.right_eye_axis?.toString() || '');
        updateGlassesItem(glassesId, 'left_eye_axis', latestVisionTest.left_eye_axis?.toString() || '');
        updateGlassesItem(glassesId, 'pupillary_distance', latestVisionTest.pupillary_distance?.toString() || '');
    };

    // Form Submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validate medicines if any are added
        const validMedicines = medicineItems.filter(item => item.medicine_id && item.dosage);
        const invalidMedicines = medicineItems.filter(item =>
            (item.medicine_id && !item.dosage) || (!item.medicine_id && item.dosage)
        );

        if (invalidMedicines.length > 0) {
            alert('Please complete all medicine entries or remove incomplete ones');
            setIsSubmitting(false);
            return;
        }

        // Validate glasses if any are added
        if (glassesItems.length > 0) {
            const isValidGlasses = glassesItems.every(item =>
                item.prescription_type && (
                    item.right_eye_sphere || item.left_eye_sphere ||
                    item.right_eye_cylinder || item.left_eye_cylinder
                )
            );
            if (!isValidGlasses) {
                alert('Please specify prescription type and at least one eye prescription value for all glasses');
                setIsSubmitting(false);
                return;
            }
        }

        // Format medicines data
        const formattedMedicines = validMedicines.map(item => ({
            medicine_id: parseInt(item.medicine_id),
            dosage: item.dosage,
            frequency: item.frequency || null,
            duration: item.duration || null,
            instructions: item.instructions || null,
            quantity: item.quantity ? parseInt(item.quantity) : null,
        }));

        // Format glasses data (medical data only)
        const formattedGlasses = glassesItems
            .filter(item => item.prescription_type)
            .map(item => ({
                prescription_type: item.prescription_type,
                right_eye_sphere: item.right_eye_sphere ? parseFloat(item.right_eye_sphere) : null,
                right_eye_cylinder: item.right_eye_cylinder ? parseFloat(item.right_eye_cylinder) : null,
                right_eye_axis: item.right_eye_axis ? parseInt(item.right_eye_axis) : null,
                right_eye_add: item.right_eye_add ? parseFloat(item.right_eye_add) : null,
                left_eye_sphere: item.left_eye_sphere ? parseFloat(item.left_eye_sphere) : null,
                left_eye_cylinder: item.left_eye_cylinder ? parseFloat(item.left_eye_cylinder) : null,
                left_eye_axis: item.left_eye_axis ? parseInt(item.left_eye_axis) : null,
                left_eye_add: item.left_eye_add ? parseFloat(item.left_eye_add) : null,
                pupillary_distance: item.pupillary_distance ? parseFloat(item.pupillary_distance) : null,
                segment_height: item.segment_height ? parseFloat(item.segment_height) : null,
                special_instructions: item.special_instructions || null,
            }));

        // Create complete form data
        const submitData = {
            patient_id: patient.id,
            doctor_id: doctor.id,
            appointment_id: appointment?.id || null,
            visit_id: latestVisit?.id || null,
            diagnosis: data.diagnosis,
            advice: data.advice,
            notes: data.notes,
            followup_date: data.followup_date || null,
            includes_glasses: includesGlasses,
            glasses_notes: data.glasses_notes,
            medicines: formattedMedicines,
            glasses: formattedGlasses
        };

        console.log('Submitting prescription:', submitData);

        router.post(route('prescriptions.store', patient.id), submitData, {
            onSuccess: () => {
                console.log('Prescription created successfully');
                setIsSubmitting(false);
            },
            onError: (errors) => {
                console.error('Prescription creation failed:', errors);
                setIsSubmitting(false);
            }
        });
    };

    // Utility Functions
    const goBack = () => {
        router.visit(route('doctor.view-patient', patient.id));
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

    const getGenderIcon = (gender?: string) => {
        switch (gender?.toLowerCase()) {
            case 'male': return '👨';
            case 'female': return '👩';
            default: return '👤';
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateAge = (dateOfBirth: string): number => {
        return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    };

    const validateForm = (): boolean => {
        if (!data.diagnosis.trim()) {
            alert('Please enter a diagnosis');
            return false;
        }

        // Check medicines
        const incompleteMedicines = medicineItems.filter(item =>
            (item.medicine_id && !item.dosage) || (!item.medicine_id && item.dosage)
        );

        if (incompleteMedicines.length > 0) {
            alert('Please complete all medicine entries or remove incomplete ones');
            return false;
        }

        return true;
    };

    return (
        <AdminLayout title="Create Prescription">
            <Head title="Create Prescription" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header Section */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={goBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900">Create Medical Prescription</h1>
                            <p className="text-gray-600 mt-1">Write a comprehensive medical prescription for {patient.name}</p>
                        </div>
                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadBlankPrescription}
                                disabled={isDownloadingBlank}
                                className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-indigo-100"
                            >
                                {isDownloadingBlank ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                        <span>Downloading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        <span>Download Blank Prescription</span>
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                                <Stethoscope className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                    Dr. {doctor.name}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg">
                                <Clock className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-900">
                                    {new Date().toLocaleDateString('en-BD')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => setShowMedicineHelp(!showMedicineHelp)}
                            className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors flex items-center gap-2"
                        >
                            <BookOpen className="h-4 w-4" />
                            Medicine Guide
                        </button>
                        {includesGlasses && (
                            <button
                                type="button"
                                onClick={() => setShowGlassesHelp(!showGlassesHelp)}
                                className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-2"
                            >
                                <Glasses className="h-4 w-4" />
                                Glasses Guide
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={clearAllMedicines}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Clear Medicines
                        </button>
                        {includesGlasses && (
                            <button
                                type="button"
                                onClick={clearAllGlasses}
                                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Clear Glasses
                            </button>
                        )}
                    </div>

                    {/* Help Sections */}
                    {showMedicineHelp && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                            <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Medicine Prescription Guide
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-700">
                                <div>
                                    <strong>Dosage Format:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>1-0-1 (Morning-Afternoon-Night)</li>
                                        <li>0-1-0 (Only afternoon)</li>
                                        <li>1-1-1 (Three times daily)</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong>Common Instructions:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>After meal, Before meal</li>
                                        <li>With water, Before sleep</li>
                                        <li>Don't crush, Take with milk</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {showGlassesHelp && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
                            <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                                <Glasses className="h-4 w-4" />
                                Optical Prescription Guide
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
                                <div>
                                    <strong>Prescription Values:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>SPH: Sphere (+ for farsighted, - for nearsighted)</li>
                                        <li>CYL: Cylinder (astigmatism correction)</li>
                                        <li>AXIS: Direction of astigmatism (0-180°)</li>
                                        <li>ADD: Additional power for reading</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong>Prescription Types:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>Distance: For far vision</li>
                                        <li>Reading: For near vision only</li>
                                        <li>Progressive: Distance + Reading</li>
                                        <li>Computer: For digital screens</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Patient & Context Info Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Patient Information Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                    {getGenderIcon(patient.gender)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{patient.name}</h3>
                                    <p className="text-sm text-gray-500">ID: {patient.patient_id}</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Age:</span>
                                    <span className="font-medium">
                                        {patient.age || (patient.date_of_birth ? calculateAge(patient.date_of_birth) : 'N/A')} years
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Gender:</span>
                                    <span className="font-medium capitalize">{patient.gender || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="font-medium">{patient.phone}</span>
                                </div>
                                {patient.address && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Address:</span>
                                        <span className="font-medium text-right text-xs">{patient.address}</span>
                                    </div>
                                )}
                                {patient.medical_history && (
                                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                        <span className="text-red-600 text-xs font-medium flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            Medical History:
                                        </span>
                                        <p className="text-red-700 text-xs mt-1">{patient.medical_history}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Current Visit Card */}
                        {latestVisit && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-green-600" />
                                    Current Visit
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Visit ID:</span>
                                        <span className="font-medium">{latestVisit.visit_id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Date:</span>
                                        <span className="font-medium">{latestVisit.formatted_date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                            {latestVisit.overall_status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    {latestVisit.chief_complaint && (
                                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                            <span className="text-yellow-600 text-xs font-medium">Chief Complaint:</span>
                                            <p className="text-yellow-700 text-xs mt-1">{latestVisit.chief_complaint}</p>
                                        </div>
                                    )}
                                    {latestVisit.visit_notes && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                            <span className="text-blue-600 text-xs font-medium">Visit Notes:</span>
                                            <p className="text-blue-700 text-xs mt-1">{latestVisit.visit_notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Appointment Card */}
                        {appointment && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-emerald-600" />
                                    Today's Appointment
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Date:</span>
                                        <span className="font-medium">{appointment.formatted_date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Time:</span>
                                        <span className="font-medium">{appointment.appointment_time}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Serial:</span>
                                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold">
                                            #{appointment.serial_number}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                            {appointment.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>


                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                            {/* Left Column - Prescription Details */}
                            <div className="xl:col-span-2 space-y-6">

                                {/* Diagnosis and Treatment */}
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-indigo-600" />
                                        Medical Diagnosis and Treatment Plan
                                    </h3>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Primary Diagnosis *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.diagnosis}
                                                onChange={(e) => setData('diagnosis', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                                placeholder="Enter detailed medical diagnosis..."
                                                required
                                            />
                                            {errors.diagnosis && (
                                                <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Medical Advice & Recommendations
                                            </label>
                                            <textarea
                                                value={data.advice}
                                                onChange={(e) => setData('advice', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                                rows={4}
                                                placeholder="Enter lifestyle recommendations, precautions, dietary advice, follow-up instructions..."
                                            />
                                            {errors.advice && (
                                                <p className="mt-1 text-sm text-red-600">{errors.advice}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Clinical Notes
                                            </label>
                                            <textarea
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                                rows={3}
                                                placeholder="Any additional clinical observations, examination findings, or doctor notes..."
                                            />
                                            {errors.notes && (
                                                <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Follow-up Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={data.followup_date}
                                                    onChange={(e) => setData('followup_date', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                                {errors.followup_date && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.followup_date}</p>
                                                )}
                                            </div>

                                            <div className="flex items-end">
                                                <label className="flex items-center space-x-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={includesGlasses}
                                                        onChange={(e) => setIncludesGlasses(e.target.checked)}
                                                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                        <Glasses className="h-4 w-4 text-blue-600" />
                                                        Include Optical Prescription
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        {includesGlasses && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Optical Prescription Notes
                                                </label>
                                                <textarea
                                                    value={data.glasses_notes}
                                                    onChange={(e) => setData('glasses_notes', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                                    rows={2}
                                                    placeholder="Special notes about optical prescription, visual requirements, etc..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Glasses Prescription Section */}
                                {includesGlasses && (
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                    <Glasses className="h-5 w-5 text-purple-600" />
                                                    Optical Prescription (Medical Values Only)
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowGlassesHelp(!showGlassesHelp)}
                                                    className="p-1 text-gray-400 hover:text-gray-600"
                                                >
                                                    <Info className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addGlassesItem}
                                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                                Add Optical Prescription
                                            </button>
                                        </div>

                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm text-blue-700 flex items-center gap-2">
                                                <Info className="h-4 w-4" />
                                                <strong>Doctor's Focus:</strong> You only provide the medical prescription values.
                                                Patient can take this prescription to any optical shop to choose frames and lenses.
                                            </p>
                                        </div>

                                        <div className="space-y-8">
                                            {glassesItems.map((item, index) => (
                                                <div key={item.id} className="group p-6 border-2 border-purple-200 rounded-xl hover:border-purple-300 transition-all duration-300 relative bg-gradient-to-r from-purple-50 to-blue-50">
                                                    {glassesItems.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeGlassesItem(item.id)}
                                                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-lg"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                                    {index + 1}
                                                                </div>
                                                                <h4 className="font-semibold text-gray-900">Optical Prescription #{index + 1}</h4>
                                                            </div>
                                                            {latestVisionTest && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => fillFromVisionTest(item.id)}
                                                                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                                                                >
                                                                    <Sparkles className="h-3 w-3" />
                                                                    Auto-fill from Vision Test
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Prescription Type */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Prescription Type *
                                                            </label>
                                                            <select
                                                                value={item.prescription_type}
                                                                onChange={(e) => updateGlassesItem(item.id, 'prescription_type', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                                required
                                                            >
                                                                <option value="distance">Distance Vision</option>
                                                                <option value="reading">Reading Only</option>
                                                                <option value="progressive">Progressive (Distance + Reading)</option>
                                                                <option value="bifocal">Bifocal</option>
                                                                <option value="computer">Computer/Office Work</option>
                                                            </select>
                                                        </div>

                                                        {/* Eye Prescription Values */}
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                            {/* Right Eye */}
                                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                                <h5 className="font-medium text-red-700 mb-3 flex items-center">
                                                                    <Target className="h-4 w-4 mr-2" />
                                                                    Right Eye (OD)
                                                                </h5>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                            SPH (Sphere)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="-20"
                                                                            max="20"
                                                                            value={item.right_eye_sphere}
                                                                            onChange={(e) => updateGlassesItem(item.id, 'right_eye_sphere', e.target.value)}
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-red-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                            CYL (Cylinder)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="-10"
                                                                            max="10"
                                                                            value={item.right_eye_cylinder}
                                                                            onChange={(e) => updateGlassesItem(item.id, 'right_eye_cylinder', e.target.value)}
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-red-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                            AXIS (°)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="180"
                                                                            value={item.right_eye_axis}
                                                                            onChange={(e) => updateGlassesItem(item.id, 'right_eye_axis', e.target.value)}
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-red-400 focus:outline-none"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                            ADD (Near)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="0"
                                                                            max="5"
                                                                            value={item.right_eye_add}
                                                                            onChange={(e) => updateGlassesItem(item.id, 'right_eye_add', e.target.value)}
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-red-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Left Eye */}
                                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                                <h5 className="font-medium text-blue-700 mb-3 flex items-center">
                                                                    <Target className="h-4 w-4 mr-2" />
                                                                    Left Eye (OS)
                                                                </h5>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                            SPH (Sphere)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="-20"
                                                                            max="20"
                                                                            value={item.left_eye_sphere}
                                                                            onChange={(e) => updateGlassesItem(item.id, 'left_eye_sphere', e.target.value)}
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                            CYL (Cylinder)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="-10"
                                                                            max="10"
                                                                            value={item.left_eye_cylinder}
                                                                            onChange={(e) => updateGlassesItem(item.id, 'left_eye_cylinder', e.target.value)}
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                            AXIS (°)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="180"
                                                                            value={item.left_eye_axis}
                                                                            onChange={(e) => updateGlassesItem(item.id, 'left_eye_axis', e.target.value)}
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                            ADD (Near)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="0"
                                                                            max="5"
                                                                            value={item.left_eye_add}
                                                                            onChange={(e) => updateGlassesItem(item.id, 'left_eye_add', e.target.value)}
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Additional Measurements */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    📏 Pupillary Distance (PD)
                                                                </label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        step="0.5"
                                                                        min="45"
                                                                        max="85"
                                                                        value={item.pupillary_distance}
                                                                        onChange={(e) => updateGlassesItem(item.id, 'pupillary_distance', e.target.value)}
                                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                                        placeholder="63.0"
                                                                    />
                                                                    <span className="absolute right-3 top-2 text-xs text-gray-500">mm</span>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    📐 Segment Height
                                                                </label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        step="0.5"
                                                                        min="10"
                                                                        max="30"
                                                                        value={item.segment_height}
                                                                        onChange={(e) => updateGlassesItem(item.id, 'segment_height', e.target.value)}
                                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                                        placeholder="18.0"
                                                                    />
                                                                    <span className="absolute right-3 top-2 text-xs text-gray-500">mm</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Special Instructions */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                🔧 Medical Instructions for Optical Lab
                                                            </label>
                                                            <textarea
                                                                value={item.special_instructions}
                                                                onChange={(e) => updateGlassesItem(item.id, 'special_instructions', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                                rows={2}
                                                                placeholder="Anti-glare coating recommended, photochromic for light sensitivity, prismatic correction if needed..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {glassesItems.length === 0 && (
                                                <div className="text-center py-12">
                                                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Glasses className="h-10 w-10 text-purple-400" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No optical prescription added</h3>
                                                    <p className="text-gray-500 mb-6">Add medical optical prescription for visual correction</p>
                                                    <button
                                                        type="button"
                                                        onClick={addGlassesItem}
                                                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg"
                                                    >
                                                        <PlusCircle className="h-5 w-5" />
                                                        Add Optical Prescription
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Recent History */}
                                {(patient.recent_visits.length > 0 || patient.recent_prescriptions.length > 0) && (
                                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <ClockIcon className="h-5 w-5 text-gray-600" />
                                            Patient Medical History
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Recent Visits */}
                                            {patient.recent_visits.length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                                        <Activity className="h-4 w-4 text-green-600" />
                                                        Recent Visits
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {patient.recent_visits.slice(0, 3).map((visit) => (
                                                            <div key={visit.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-300">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">{visit.visit_id}</p>
                                                                        <p className="text-xs text-gray-500">{visit.created_at} • Dr. {visit.doctor_name}</p>
                                                                    </div>
                                                                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                                                                        {visit.overall_status.replace('_', ' ')}
                                                                    </span>
                                                                </div>
                                                                {visit.chief_complaint && (
                                                                    <p className="text-xs text-gray-600 mt-1 italic">"{visit.chief_complaint}"</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recent Prescriptions */}
                                            {patient.recent_prescriptions.length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                        Recent Prescriptions
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {patient.recent_prescriptions.slice(0, 3).map((prescription) => (
                                                            <div key={prescription.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-300">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">Rx #{prescription.id}</p>
                                                                        <p className="text-xs text-gray-500">{prescription.created_at} • Dr. {prescription.doctor_name}</p>
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        {prescription.medicines_count > 0 && (
                                                                            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                                                <Pill className="h-3 w-3" />
                                                                                {prescription.medicines_count}
                                                                            </span>
                                                                        )}
                                                                        {prescription.has_glasses && (
                                                                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                                                <Glasses className="h-3 w-3" />
                                                                                {prescription.glasses_count}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {prescription.diagnosis && (
                                                                    <p className="text-xs text-gray-600 mt-1 italic">"{prescription.diagnosis}"</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Medicines */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <Pill className="h-5 w-5 text-amber-600" />
                                                Prescribed Medicines
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowMedicineHelp(!showMedicineHelp)}
                                                className="p-1 text-gray-400 hover:text-gray-600"
                                            >
                                                <Info className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addMedicineItem}
                                            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg text-sm font-medium hover:from-amber-700 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
                                        >
                                            <PlusCircle className="h-4 w-4" />
                                            Add Medicine
                                        </button>
                                    </div>

                                    {/* Medicine Type Filter */}
                                    {medicineTypes.length > 0 && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Filter by Medicine Type
                                            </label>
                                            <select
                                                value={selectedMedicineType}
                                                onChange={(e) => setSelectedMedicineType(e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            >
                                                <option value="">All medicine types</option>
                                                {medicineTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {medicineItems.map((item, index) => (
                                            <div key={item.id} className="group p-5 border-2 border-gray-200 rounded-xl hover:border-amber-300 transition-all duration-300 relative bg-gradient-to-r from-amber-50 to-orange-50">
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

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Medicine Name *
                                                        </label>
                                                        <select
                                                            value={item.medicine_id}
                                                            onChange={(e) => updateMedicineItem(item.id, 'medicine_id', e.target.value)}
                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                            required
                                                        >
                                                            <option value="">Select medicine</option>
                                                            {medicines
                                                                .filter(medicine => !selectedMedicineType || medicine.type === selectedMedicineType)
                                                                .map(medicine => (
                                                                    <option key={medicine.id} value={medicine.id}>
                                                                        {medicine.name}
                                                                        {medicine.generic_name && ` (${medicine.generic_name})`}
                                                                        {medicine.manufacturer && ` - ${medicine.manufacturer}`}
                                                                        {` (${medicine.available_quantity ?? 0})`}
                                                                    </option>

                                                                ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Dosage Pattern *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={item.dosage}
                                                            onChange={(e) => updateMedicineItem(item.id, 'dosage', e.target.value)}
                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                            placeholder="e.g., 1-0-1 (Morning-Afternoon-Night)"
                                                            required
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Format: Morning-Afternoon-Night (e.g., 1-0-1 means 1 in morning, 0 in afternoon, 1 at night)
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Frequency
                                                            </label>
                                                            <select
                                                                value={item.frequency}
                                                                onChange={(e) => updateMedicineItem(item.id, 'frequency', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                            >
                                                                <option value="">Select frequency</option>
                                                                <option value="Daily">Daily</option>
                                                                <option value="Twice daily">Twice daily</option>
                                                                <option value="Three times daily">Three times daily</option>
                                                                <option value="As needed">As needed</option>
                                                                <option value="Every other day">Every other day</option>
                                                                <option value="Weekly">Weekly</option>
                                                            </select>
                                                        </div>


                                                    </div>

                                                    <div className="grid grid-cols-1">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Duration
                                                            </label>

                                                            {/* Parse current duration for display */}
                                                            {(() => {
                                                                const parseDuration = (duration) => {
                                                                    if (!duration) return { number: '', unit: '' };
                                                                    if (duration === 'Until finish') return { number: '', unit: 'until_finish' };

                                                                    // Handle temporary unit selection
                                                                    if (duration.startsWith('__UNIT_SELECTED__')) {
                                                                        return { number: '', unit: duration.replace('__UNIT_SELECTED__', '') };
                                                                    }

                                                                    const match = duration.match(/^(\d+)\s*(days?|months?)$/i);
                                                                    if (match) {
                                                                        return {
                                                                            number: match[1],
                                                                            unit: match[2].toLowerCase().replace(/s$/, '')
                                                                        };
                                                                    }
                                                                    return { number: '', unit: '' };
                                                                };

                                                                const current = parseDuration(item.duration);

                                                                const handleUnitChange = (unit) => {
                                                                    if (unit === 'until_finish') {
                                                                        updateMedicineItem(item.id, 'duration', 'Until finish');
                                                                    } else if (unit === '') {
                                                                        updateMedicineItem(item.id, 'duration', '');
                                                                    } else {
                                                                        // Unit selected কিন্তু number নেই, তাহলে শুধু unit store করি
                                                                        if (current.number && unit) {
                                                                            const plural = parseInt(current.number) > 1 ? 's' : '';
                                                                            const durationText = `${current.number} ${unit}${plural}`;
                                                                            updateMedicineItem(item.id, 'duration', durationText);
                                                                        } else {
                                                                            // Unit selected কিন্তু number নেই - temporary state
                                                                            updateMedicineItem(item.id, 'duration', `__UNIT_SELECTED__${unit}`);
                                                                        }
                                                                    }
                                                                };

                                                                const handleNumberChange = (number) => {
                                                                    if (!number) {
                                                                        if (current.unit && current.unit !== 'until_finish') {
                                                                            // Number clear হলে শুধু unit keep করি
                                                                            updateMedicineItem(item.id, 'duration', `__UNIT_SELECTED__${current.unit}`);
                                                                        }
                                                                    } else if (current.unit && current.unit !== 'until_finish') {
                                                                        const plural = parseInt(number) > 1 ? 's' : '';
                                                                        const durationText = `${number} ${current.unit}${plural}`;
                                                                        updateMedicineItem(item.id, 'duration', durationText);
                                                                    }
                                                                };

                                                                return (
                                                                    <>
                                                                        {/* Main input section */}
                                                                        <div className="flex gap-2 mb-2">
                                                                            {/* Unit selector - First */}
                                                                            <div className="flex-1">
                                                                                <select
                                                                                    value={current.unit}
                                                                                    onChange={(e) => handleUnitChange(e.target.value)}
                                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                                                >
                                                                                    <option value="">Select Unit</option>
                                                                                    <option value="day">Day(s)</option>
                                                                                    <option value="month">Month(s)</option>
                                                                                    <option value="until_finish">Until finish</option>
                                                                                </select>
                                                                            </div>

                                                                            {/* Number input - Second */}
                                                                            <div className="flex-1">
                                                                                <input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    max="365"
                                                                                    placeholder="Enter number"
                                                                                    value={current.number}
                                                                                    onChange={(e) => handleNumberChange(e.target.value)}
                                                                                    disabled={current.unit === 'until_finish' || current.unit === ''}
                                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Show helper text */}
                                                                        {!current.unit && (
                                                                            <div className="mb-2 text-xs text-gray-500 italic">
                                                                                First select a unit (Day/Month), then enter the number
                                                                            </div>
                                                                        )}

                                                                        {current.unit && current.unit !== 'until_finish' && !current.number && (
                                                                            <div className="mb-2 text-xs text-amber-600 italic">
                                                                                Now enter the number of {current.unit}s
                                                                            </div>
                                                                        )}

                                                                        {/* Quick select buttons */}
                                                                        <div className="flex flex-wrap gap-1 mb-2">
                                                                            <span className="text-xs text-gray-500 mr-1">Quick:</span>
                                                                            {[
                                                                                { text: '3d', number: '3', unit: 'day' },
                                                                                { text: '7d', number: '7', unit: 'day' },
                                                                                { text: '2w', number: '14', unit: 'day' },
                                                                                { text: '1m', number: '1', unit: 'month' },
                                                                                { text: '3m', number: '3', unit: 'month' }
                                                                            ].map((quick) => (
                                                                                <button
                                                                                    key={quick.text}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const plural = parseInt(quick.number) > 1 ? 's' : '';
                                                                                        const durationText = `${quick.number} ${quick.unit}${plural}`;
                                                                                        updateMedicineItem(item.id, 'duration', durationText);
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                                                                                >
                                                                                    {quick.text}
                                                                                </button>
                                                                            ))}
                                                                        </div>

                                                                        {/* Show current duration */}
                                                                        {item.duration && !item.duration.startsWith('__UNIT_SELECTED__') && (
                                                                            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                                                                Duration: <span className="font-medium">{item.duration}</span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Instructions
                                                            </label>
                                                            <select
                                                                value={item.instructions}
                                                                onChange={(e) => updateMedicineItem(item.id, 'instructions', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                            >
                                                                <option value="">Select instruction</option>
                                                                <option value="After meal">After meal</option>
                                                                <option value="Before meal">Before meal</option>
                                                                <option value="With meal">With meal</option>
                                                                <option value="Empty stomach">Empty stomach</option>
                                                                <option value="Before sleep">Before sleep</option>
                                                                <option value="With water">With water</option>
                                                                <option value="With milk">With milk</option>
                                                                <option value="Don't crush">Don't crush</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Quantity
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateMedicineItem(item.id, 'quantity', e.target.value)}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                                placeholder="30"
                                                                min="1"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {medicineItems.length === 0 && (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Pill className="h-8 w-8 text-amber-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No medicines added</h3>
                                                <p className="text-gray-500 mb-4">Add medicines to complete the prescription</p>
                                                <button
                                                    type="button"
                                                    onClick={addMedicineItem}
                                                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg"
                                                >
                                                    <PlusCircle className="h-4 w-4" />
                                                    Add First Medicine
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Summary Card */}
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-lg border border-indigo-200 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-indigo-600" />
                                        Prescription Summary
                                    </h3>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Patient:</span>
                                            <span className="font-medium">{patient.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Doctor:</span>
                                            <span className="font-medium">Dr. {doctor.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Medicines:</span>
                                            <span className="font-medium">
                                                {medicineItems.filter(item => item.medicine_id).length} items
                                            </span>
                                        </div>
                                        {includesGlasses && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Optical Prescription:</span>
                                                <span className="font-medium">
                                                    {glassesItems.length} prescription(s)
                                                </span>
                                            </div>
                                        )}
                                        {data.followup_date && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Follow-up:</span>
                                                <span className="font-medium">
                                                    {new Date(data.followup_date).toLocaleDateString('en-BD')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="mt-4 pt-4 border-t border-indigo-200">
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div className="text-center">
                                                <div className="font-bold text-lg text-indigo-600">
                                                    {medicineItems.filter(item => item.medicine_id && item.dosage).length}
                                                </div>
                                                <div className="text-gray-600">Complete Medicines</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-bold text-lg text-purple-600">
                                                    {glassesItems.length}
                                                </div>
                                                <div className="text-gray-600">Optical Prescriptions</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <AlertCircle className="h-4 w-4 text-blue-500" />
                                    <span>Please review all medical information carefully before saving the prescription</span>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={goBack}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing || isSubmitting || !data.diagnosis}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        {processing || isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Creating Prescription...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Medical Prescription
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Error Messages */}
                    {Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            {Object.entries(errors).map(([field, message]) => (
                                                <li key={field}>
                                                    <strong>{field.replace('_', ' ')}:</strong> {message}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Tips */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4 mt-6">
                        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Quick Tips for Doctors
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                            <div>
                                <strong>Medicine Prescription:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>Use standard dosage format (1-0-1)</li>
                                    <li>Always specify duration clearly</li>
                                    <li>Include special instructions for patient safety</li>
                                </ul>
                            </div>
                            <div>
                                <strong>Optical Prescription:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>Focus on medical values only</li>
                                    <li>Use vision test data for accuracy</li>
                                    <li>Patient will choose frames separately</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
