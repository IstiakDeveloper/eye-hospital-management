import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    BookOpen,
    Calendar,
    CheckCircle,
    Clock,
    ClockIcon,
    Download,
    FileText,
    Glasses,
    Info,
    Pill,
    PlusCircle,
    RotateCcw,
    Save,
    Sparkles,
    Stethoscope,
    Target,
    X,
    Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

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

export default function PrescriptionCreate({ patient, medicines, latestVisionTest, latestVisit, appointment, doctor }: PrescriptionCreateProps) {
    // State Management
    const [medicineItems, setMedicineItems] = useState<MedicineItem[]>([
        {
            id: `med-${Date.now()}`,
            medicine_id: '',
            dosage: '',
            frequency: '',
            duration: '',
            instructions: '',
            quantity: '',
        },
    ]);

    const [glassesItems, setGlassesItems] = useState<GlassesItem[]>([]);
    const [includesGlasses, setIncludesGlasses] = useState(false);
    const [selectedMedicineType, setSelectedMedicineType] = useState<string>('');
    const [showMedicineHelp, setShowMedicineHelp] = useState(false);
    const [showGlassesHelp, setShowGlassesHelp] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloadingBlank, setIsDownloadingBlank] = useState(false);
    const [medicineSearch, setMedicineSearch] = useState('');
    const [expandedMedicineId, setExpandedMedicineId] = useState<string | null>(null);
    const [showAddMedicineForm, setShowAddMedicineForm] = useState(false);
    const [draftDosagePreset, setDraftDosagePreset] = useState<'1-0-1' | '1-1-1' | '0-1-0' | '0-0-1' | '2-0-2' | '__custom__'>('1-0-1');
    const [draftDurationPreset, setDraftDurationPreset] = useState<
        '3 days' | '5 days' | '7 days' | '10 days' | '14 days' | '21 days' | '30 days' | '1 month' | '2 months' | '3 months' | '__custom__'
    >('7 days');
    const [draftMedicine, setDraftMedicine] = useState<MedicineItem>({
        id: 'draft',
        medicine_id: '',
        dosage: '1-0-1',
        frequency: 'Daily',
        duration: '7 days',
        instructions: 'After meal',
        quantity: '',
    });

    // Group medicines by type for easier selection
    const medicinesByType = medicines.reduce(
        (acc, medicine) => {
            const type = medicine.type || 'General';
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(medicine);
            return acc;
        },
        {} as Record<string, Medicine[]>,
    );

    const medicineTypes = Object.keys(medicinesByType).sort();

    const filteredMedicines = medicines
        .filter((m) => !selectedMedicineType || m.type === selectedMedicineType)
        .filter((m) => {
            if (!medicineSearch.trim()) return true;
            const q = medicineSearch.trim().toLowerCase();
            return (
                m.name.toLowerCase().includes(q) ||
                (m.generic_name ? m.generic_name.toLowerCase().includes(q) : false) ||
                (m.manufacturer ? m.manufacturer.toLowerCase().includes(q) : false)
            );
        });

    const getMedicineLabel = (medicineId: string): string => {
        const id = parseInt(medicineId);
        const med = medicines.find((m) => m.id === id);
        if (!med) return 'Select medicine';
        const parts = [med.name];
        if (med.generic_name) parts.push(`(${med.generic_name})`);
        return parts.join(' ');
    };

    const openAddMedicineForm = () => {
        setShowAddMedicineForm(true);
        setDraftDosagePreset('1-0-1');
        setDraftDurationPreset('7 days');
        setDraftMedicine({
            id: 'draft',
            medicine_id: '',
            dosage: '1-0-1',
            frequency: 'Daily',
            duration: '7 days',
            instructions: 'After meal',
            quantity: '',
        });
        setMedicineSearch('');
    };

    const addDraftMedicine = () => {
        if (!draftMedicine.medicine_id) {
            alert('Please select a medicine');
            return;
        }
        if (!draftMedicine.dosage) {
            alert('Please enter dosage');
            return;
        }
        const exists = medicineItems.some((i) => i.medicine_id === draftMedicine.medicine_id);
        if (exists) {
            alert('This medicine is already added');
            return;
        }

        const newItem: MedicineItem = {
            ...draftMedicine,
            id: `med-${Date.now()}`,
        };
        setMedicineItems([...medicineItems, newItem]);
        setExpandedMedicineId(null);
        setShowAddMedicineForm(false);
        setDraftMedicine({
            id: 'draft',
            medicine_id: '',
            dosage: '1-0-1',
            frequency: 'Daily',
            duration: '7 days',
            instructions: 'After meal',
            quantity: '',
        });
        setDraftDosagePreset('1-0-1');
        setDraftDurationPreset('7 days');
        setMedicineSearch('');
    };

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
                setMedicineItems(
                    parsed.medicines.map((med: any, index: number) => ({
                        id: `med-${Date.now()}-${index}`,
                        medicine_id: med.medicine_id?.toString() || '',
                        dosage: med.dosage || '',
                        frequency: med.frequency || '',
                        duration: med.duration || '',
                        instructions: med.instructions || '',
                        quantity: med.quantity?.toString() || '',
                    })),
                );
            }

            if (parsed.glasses && parsed.glasses.length > 0) {
                setGlassesItems(
                    parsed.glasses.map((glass: any, index: number) => ({
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
                    })),
                );
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
                quantity: '',
            },
        ]);
    };

    const removeMedicineItem = (id: string) => {
        if (medicineItems.length === 1) {
            return;
        }
        setMedicineItems(medicineItems.filter((item) => item.id !== id));
        if (expandedMedicineId === id) {
            setExpandedMedicineId(null);
        }
    };

    const updateMedicineItem = (id: string, field: keyof MedicineItem, value: string) => {
        setMedicineItems(medicineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const clearAllMedicines = () => {
        setMedicineItems([
            {
                id: `med-${Date.now()}`,
                medicine_id: '',
                dosage: '',
                frequency: '',
                duration: '',
                instructions: '',
                quantity: '',
            },
        ]);
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
            },
        ]);
        setIncludesGlasses(true);
    };

    const removeGlassesItem = (id: string) => {
        const newItems = glassesItems.filter((item) => item.id !== id);
        setGlassesItems(newItems);
        if (newItems.length === 0) {
            setIncludesGlasses(false);
        }
    };

    const updateGlassesItem = (id: string, field: keyof GlassesItem, value: string) => {
        setGlassesItems(glassesItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
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
        const validMedicines = medicineItems.filter((item) => item.medicine_id && item.dosage);
        const invalidMedicines = medicineItems.filter((item) => (item.medicine_id && !item.dosage) || (!item.medicine_id && item.dosage));

        if (invalidMedicines.length > 0) {
            alert('Please complete all medicine entries or remove incomplete ones');
            setIsSubmitting(false);
            return;
        }

        // Validate glasses if any are added
        if (glassesItems.length > 0) {
            const isValidGlasses = glassesItems.every(
                (item) =>
                    item.prescription_type && (item.right_eye_sphere || item.left_eye_sphere || item.right_eye_cylinder || item.left_eye_cylinder),
            );
            if (!isValidGlasses) {
                alert('Please specify prescription type and at least one eye prescription value for all glasses');
                setIsSubmitting(false);
                return;
            }
        }

        // Format medicines data
        const formattedMedicines = validMedicines.map((item) => ({
            medicine_id: parseInt(item.medicine_id),
            dosage: item.dosage,
            frequency: item.frequency || null,
            duration: item.duration || null,
            instructions: item.instructions || null,
            quantity: item.quantity ? parseInt(item.quantity) : null,
        }));

        // Format glasses data (medical data only)
        const formattedGlasses = glassesItems
            .filter((item) => item.prescription_type)
            .map((item) => ({
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
            glasses: formattedGlasses,
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
            },
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
            case 'male':
                return '👨';
            case 'female':
                return '👩';
            default:
                return '👤';
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
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
        const incompleteMedicines = medicineItems.filter((item) => (item.medicine_id && !item.dosage) || (!item.medicine_id && item.dosage));

        if (incompleteMedicines.length > 0) {
            alert('Please complete all medicine entries or remove incomplete ones');
            return false;
        }

        return true;
    };

    return (
        <AdminLayout title="Create Prescription">
            <Head title="Create Prescription" />

            <div className="min-h-screen bg-gray-50 p-4 md:p-6">
                <div className="mx-auto max-w-7xl space-y-4 pb-28">
                    {/* Header Section */}
                    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={goBack} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-base font-bold text-gray-900">Create Prescription</h1>
                                <p className="mt-0.5 line-clamp-1 text-sm text-gray-600">
                                    {patient.name} • {patient.patient_id} {latestVisit?.visit_id ? `• Visit: ${latestVisit.visit_id}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                                <Stethoscope className="h-4 w-4 text-gray-500" />
                                Dr. {doctor.name}
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                                <Clock className="h-4 w-4 text-gray-500" />
                                {new Date().toLocaleDateString('en-BD')}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadBlankPrescription}
                                disabled={isDownloadingBlank}
                                className="h-8 gap-2 border-gray-200 px-3 text-xs"
                            >
                                {isDownloadingBlank ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-700" />
                                        <span>Downloading</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        <span>Blank</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-6 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowMedicineHelp(!showMedicineHelp)}
                            className="flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200"
                        >
                            <BookOpen className="h-4 w-4" />
                            Medicine Guide
                        </button>
                        {includesGlasses && (
                            <button
                                type="button"
                                onClick={() => setShowGlassesHelp(!showGlassesHelp)}
                                className="flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200"
                            >
                                <Glasses className="h-4 w-4" />
                                Glasses Guide
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={clearAllMedicines}
                            className="flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Clear Medicines
                        </button>
                        {includesGlasses && (
                            <button
                                type="button"
                                onClick={clearAllGlasses}
                                className="flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Clear Glasses
                            </button>
                        )}
                    </div>

                    {/* Help Sections */}
                    {showMedicineHelp && (
                        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <h4 className="mb-3 flex items-center gap-2 font-medium text-amber-900">
                                <BookOpen className="h-4 w-4" />
                                Medicine Prescription Guide
                            </h4>
                            <div className="grid grid-cols-1 gap-4 text-sm text-amber-700 md:grid-cols-2">
                                <div>
                                    <strong>Dosage Format:</strong>
                                    <ul className="mt-1 list-inside list-disc space-y-1">
                                        <li>1-0-1 (Morning-Afternoon-Night)</li>
                                        <li>0-1-0 (Only afternoon)</li>
                                        <li>1-1-1 (Three times daily)</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong>Common Instructions:</strong>
                                    <ul className="mt-1 list-inside list-disc space-y-1">
                                        <li>After meal, Before meal</li>
                                        <li>With water, Before sleep</li>
                                        <li>Don't crush, Take with milk</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {showGlassesHelp && (
                        <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-4">
                            <h4 className="mb-3 flex items-center gap-2 font-medium text-purple-900">
                                <Glasses className="h-4 w-4" />
                                Optical Prescription Guide
                            </h4>
                            <div className="grid grid-cols-1 gap-4 text-sm text-purple-700 md:grid-cols-2">
                                <div>
                                    <strong>Prescription Values:</strong>
                                    <ul className="mt-1 list-inside list-disc space-y-1">
                                        <li>SPH: Sphere (+ for farsighted, - for nearsighted)</li>
                                        <li>CYL: Cylinder (astigmatism correction)</li>
                                        <li>AXIS: Direction of astigmatism (0-180°)</li>
                                        <li>ADD: Additional power for reading</li>
                                    </ul>
                                </div>
                                <div>
                                    <strong>Prescription Types:</strong>
                                    <ul className="mt-1 list-inside list-disc space-y-1">
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
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                        {/* Patient Information Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white">
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
                                        <span className="text-right text-xs font-medium">{patient.address}</span>
                                    </div>
                                )}
                                {patient.medical_history && (
                                    <div className="mt-3 rounded-lg bg-red-50 p-3">
                                        <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                                            <AlertTriangle className="h-3 w-3" />
                                            Medical History:
                                        </span>
                                        <p className="mt-1 text-xs text-red-700">{patient.medical_history}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Current Visit Card */}
                        {latestVisit && (
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    <Activity className="h-4 w-4 text-green-600" />
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
                                        <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                                            {latestVisit.overall_status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    {latestVisit.chief_complaint && (
                                        <div className="mt-3 rounded-lg bg-yellow-50 p-3">
                                            <span className="text-xs font-medium text-yellow-600">Chief Complaint:</span>
                                            <p className="mt-1 text-xs text-yellow-700">{latestVisit.chief_complaint}</p>
                                        </div>
                                    )}
                                    {latestVisit.visit_notes && (
                                        <div className="mt-3 rounded-lg bg-blue-50 p-3">
                                            <span className="text-xs font-medium text-blue-600">Visit Notes:</span>
                                            <p className="mt-1 text-xs text-blue-700">{latestVisit.visit_notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Appointment Card */}
                        {appointment && (
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    <Calendar className="h-4 w-4 text-emerald-600" />
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
                                        <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">
                                            #{appointment.serial_number}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                            {appointment.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {/* Left Column - Prescription Details */}
                            <div className="space-y-6">
                                {/* Diagnosis and Treatment */}
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <h3 className="mb-6 flex items-center gap-2 font-semibold text-gray-900">
                                        <FileText className="h-5 w-5 text-indigo-600" />
                                        Medical Diagnosis and Treatment Plan
                                    </h3>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Primary Diagnosis *</label>
                                            <input
                                                type="text"
                                                value={data.diagnosis}
                                                onChange={(e) => setData('diagnosis', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                placeholder="Enter detailed medical diagnosis..."
                                                required
                                            />
                                            {errors.diagnosis && <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Medical Advice & Recommendations</label>
                                            <textarea
                                                value={data.advice}
                                                onChange={(e) => setData('advice', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                rows={4}
                                                placeholder="Enter lifestyle recommendations, precautions, dietary advice, follow-up instructions..."
                                            />
                                            {errors.advice && <p className="mt-1 text-sm text-red-600">{errors.advice}</p>}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">Clinical Notes</label>
                                            <textarea
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                rows={3}
                                                placeholder="Any additional clinical observations, examination findings, or doctor notes..."
                                            />
                                            {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Follow-up Date</label>
                                                <input
                                                    type="date"
                                                    value={data.followup_date}
                                                    onChange={(e) => setData('followup_date', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                                {errors.followup_date && <p className="mt-1 text-sm text-red-600">{errors.followup_date}</p>}
                                            </div>

                                            <div className="flex items-end">
                                                <label className="flex cursor-pointer items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={includesGlasses}
                                                        onChange={(e) => setIncludesGlasses(e.target.checked)}
                                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                        <Glasses className="h-4 w-4 text-blue-600" />
                                                        Include Optical Prescription
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        {includesGlasses && (
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">Optical Prescription Notes</label>
                                                <textarea
                                                    value={data.glasses_notes}
                                                    onChange={(e) => setData('glasses_notes', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                                                    rows={2}
                                                    placeholder="Special notes about optical prescription, visual requirements, etc..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Glasses Prescription Section */}
                                {includesGlasses && (
                                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                        <div className="mb-6 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h3 className="flex items-center gap-2 font-semibold text-gray-900">
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
                                                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-purple-700 hover:to-blue-700"
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                                Add Optical Prescription
                                            </button>
                                        </div>

                                        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                            <p className="flex items-center gap-2 text-sm text-blue-700">
                                                <Info className="h-4 w-4" />
                                                <strong>Doctor's Focus:</strong> You only provide the medical prescription values. Patient can take
                                                this prescription to any optical shop to choose frames and lenses.
                                            </p>
                                        </div>

                                        <div className="space-y-8">
                                            {glassesItems.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    className="group relative rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6 transition-all duration-300 hover:border-purple-300"
                                                >
                                                    {glassesItems.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeGlassesItem(item.id)}
                                                            className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors duration-200 hover:bg-red-600"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    <div className="space-y-6">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-sm font-bold text-white">
                                                                    {index + 1}
                                                                </div>
                                                                <h4 className="font-semibold text-gray-900">Optical Prescription #{index + 1}</h4>
                                                            </div>
                                                            {latestVisionTest && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => fillFromVisionTest(item.id)}
                                                                    className="flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-200"
                                                                >
                                                                    <Sparkles className="h-3 w-3" />
                                                                    Auto-fill from Vision Test
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Prescription Type */}
                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-gray-700">
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
                                                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                                            {/* Right Eye */}
                                                            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                                                <h5 className="mb-3 flex items-center font-medium text-red-700">
                                                                    <Target className="mr-2 h-4 w-4" />
                                                                    Right Eye (OD)
                                                                </h5>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                                            SPH (Sphere)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="-20"
                                                                            max="20"
                                                                            value={item.right_eye_sphere}
                                                                            onChange={(e) =>
                                                                                updateGlassesItem(item.id, 'right_eye_sphere', e.target.value)
                                                                            }
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-red-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                                            CYL (Cylinder)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="-10"
                                                                            max="10"
                                                                            value={item.right_eye_cylinder}
                                                                            onChange={(e) =>
                                                                                updateGlassesItem(item.id, 'right_eye_cylinder', e.target.value)
                                                                            }
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-red-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                                            AXIS (°)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="180"
                                                                            value={item.right_eye_axis}
                                                                            onChange={(e) =>
                                                                                updateGlassesItem(item.id, 'right_eye_axis', e.target.value)
                                                                            }
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-red-400 focus:outline-none"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                                            ADD (Near)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="0"
                                                                            max="5"
                                                                            value={item.right_eye_add}
                                                                            onChange={(e) =>
                                                                                updateGlassesItem(item.id, 'right_eye_add', e.target.value)
                                                                            }
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-red-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Left Eye */}
                                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                                                <h5 className="mb-3 flex items-center font-medium text-blue-700">
                                                                    <Target className="mr-2 h-4 w-4" />
                                                                    Left Eye (OS)
                                                                </h5>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                                            SPH (Sphere)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="-20"
                                                                            max="20"
                                                                            value={item.left_eye_sphere}
                                                                            onChange={(e) =>
                                                                                updateGlassesItem(item.id, 'left_eye_sphere', e.target.value)
                                                                            }
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                                            CYL (Cylinder)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="-10"
                                                                            max="10"
                                                                            value={item.left_eye_cylinder}
                                                                            onChange={(e) =>
                                                                                updateGlassesItem(item.id, 'left_eye_cylinder', e.target.value)
                                                                            }
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                                            AXIS (°)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="180"
                                                                            value={item.left_eye_axis}
                                                                            onChange={(e) =>
                                                                                updateGlassesItem(item.id, 'left_eye_axis', e.target.value)
                                                                            }
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                                                            ADD (Near)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            step="0.25"
                                                                            min="0"
                                                                            max="5"
                                                                            value={item.left_eye_add}
                                                                            onChange={(e) =>
                                                                                updateGlassesItem(item.id, 'left_eye_add', e.target.value)
                                                                            }
                                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Additional Measurements */}
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <div>
                                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                                    📏 Pupillary Distance (PD)
                                                                </label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        step="0.5"
                                                                        min="45"
                                                                        max="85"
                                                                        value={item.pupillary_distance}
                                                                        onChange={(e) =>
                                                                            updateGlassesItem(item.id, 'pupillary_distance', e.target.value)
                                                                        }
                                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                                        placeholder="63.0"
                                                                    />
                                                                    <span className="absolute top-2 right-3 text-xs text-gray-500">mm</span>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="mb-2 block text-sm font-medium text-gray-700">
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
                                                                    <span className="absolute top-2 right-3 text-xs text-gray-500">mm</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Special Instructions */}
                                                        <div>
                                                            <label className="mb-2 block text-sm font-medium text-gray-700">
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
                                                <div className="py-12 text-center">
                                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
                                                        <Glasses className="h-10 w-10 text-purple-400" />
                                                    </div>
                                                    <h3 className="mb-2 text-lg font-semibold text-gray-900">No optical prescription added</h3>
                                                    <p className="mb-6 text-gray-500">Add medical optical prescription for visual correction</p>
                                                    <button
                                                        type="button"
                                                        onClick={addGlassesItem}
                                                        className="mx-auto flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-purple-700 hover:to-blue-700"
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
                                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
                                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                                            <ClockIcon className="h-5 w-5 text-gray-600" />
                                            Patient Medical History
                                        </h3>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {/* Recent Visits */}
                                            {patient.recent_visits.length > 0 && (
                                                <div>
                                                    <h4 className="mb-3 flex items-center gap-2 font-medium text-gray-800">
                                                        <Activity className="h-4 w-4 text-green-600" />
                                                        Recent Visits
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {patient.recent_visits.slice(0, 3).map((visit) => (
                                                            <div key={visit.id} className="rounded-lg border-l-4 border-green-300 bg-gray-50 p-3">
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">{visit.visit_id}</p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {visit.created_at} • Dr. {visit.doctor_name}
                                                                        </p>
                                                                    </div>
                                                                    <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">
                                                                        {visit.overall_status.replace('_', ' ')}
                                                                    </span>
                                                                </div>
                                                                {visit.chief_complaint && (
                                                                    <p className="mt-1 text-xs text-gray-600 italic">"{visit.chief_complaint}"</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recent Prescriptions */}
                                            {patient.recent_prescriptions.length > 0 && (
                                                <div>
                                                    <h4 className="mb-3 flex items-center gap-2 font-medium text-gray-800">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                        Recent Prescriptions
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {patient.recent_prescriptions.slice(0, 3).map((prescription) => (
                                                            <div
                                                                key={prescription.id}
                                                                className="rounded-lg border-l-4 border-blue-300 bg-gray-50 p-3"
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">Rx #{prescription.id}</p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {prescription.created_at} • Dr. {prescription.doctor_name}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        {prescription.medicines_count > 0 && (
                                                                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                                                                                <Pill className="h-3 w-3" />
                                                                                {prescription.medicines_count}
                                                                            </span>
                                                                        )}
                                                                        {prescription.has_glasses && (
                                                                            <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
                                                                                <Glasses className="h-3 w-3" />
                                                                                {prescription.glasses_count}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {prescription.diagnosis && (
                                                                    <p className="mt-1 text-xs text-gray-600 italic">"{prescription.diagnosis}"</p>
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
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                                <Pill className="h-4 w-4 text-amber-600" />
                                                Prescribed Medicines
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowMedicineHelp(!showMedicineHelp)}
                                                className="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                            >
                                                <Info className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={openAddMedicineForm}
                                                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                                Add
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearAllMedicines}
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Clear
                                            </button>
                                        </div>
                                    </div>

                                    {/* Add medicine form */}
                                    {showAddMedicineForm && (
                                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="text-sm font-semibold text-gray-900">Add medicine</div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAddMedicineForm(false);
                                                        setMedicineSearch('');
                                                    }}
                                                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                >
                                                    Close
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-xs font-semibold text-gray-700">Type</label>
                                                    <select
                                                        value={selectedMedicineType}
                                                        onChange={(e) => setSelectedMedicineType(e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                    >
                                                        <option value="">All types</option>
                                                        {medicineTypes.map((type) => (
                                                            <option key={type} value={type}>
                                                                {type}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-xs font-semibold text-gray-700">Search</label>
                                                    <input
                                                        value={medicineSearch}
                                                        onChange={(e) => setMedicineSearch(e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                        placeholder="Type name / generic / company…"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
                                                <div className="rounded-lg border border-gray-200 bg-white md:col-span-2">
                                                    <div className="border-b border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">
                                                        Select medicine
                                                    </div>
                                                    <div className="max-h-56 overflow-auto">
                                                        {filteredMedicines.slice(0, 30).map((m) => (
                                                            <button
                                                                key={m.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    setDraftMedicine((prev) => ({
                                                                        ...prev,
                                                                        medicine_id: String(m.id),
                                                                    }))
                                                                }
                                                                className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-amber-50 ${
                                                                    draftMedicine.medicine_id === String(m.id) ? 'bg-amber-50' : ''
                                                                }`}
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="truncate font-semibold text-gray-900">{m.name}</div>
                                                                    <div className="mt-0.5 truncate text-xs text-gray-600">
                                                                        {m.generic_name ? `${m.generic_name} • ` : ''}
                                                                        {m.manufacturer ?? '—'} • Stock: {m.available_quantity ?? 0}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                        {filteredMedicines.length === 0 && (
                                                            <div className="px-3 py-3 text-sm text-gray-600">No match found.</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2 md:col-span-3">
                                                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                                                        <span className="font-semibold">Selected:</span>{' '}
                                                        {draftMedicine.medicine_id ? getMedicineLabel(draftMedicine.medicine_id) : '—'}
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                        <div>
                                                            <label className="mb-1 block text-xs font-semibold text-gray-700">Dosage</label>
                                                            <select
                                                                value={draftDosagePreset}
                                                                onChange={(e) => {
                                                                    const v = e.target.value as typeof draftDosagePreset;
                                                                    setDraftDosagePreset(v);
                                                                    if (v !== '__custom__') {
                                                                        setDraftMedicine((p) => ({ ...p, dosage: v }));
                                                                    } else {
                                                                        setDraftMedicine((p) => ({ ...p, dosage: '' }));
                                                                    }
                                                                }}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                                                            >
                                                                <option value="1-0-1">1-0-1</option>
                                                                <option value="1-1-1">1-1-1</option>
                                                                <option value="0-1-0">0-1-0</option>
                                                                <option value="0-0-1">0-0-1</option>
                                                                <option value="2-0-2">2-0-2</option>
                                                                <option value="__custom__">Custom…</option>
                                                            </select>
                                                            {draftDosagePreset === '__custom__' && (
                                                                <input
                                                                    value={draftMedicine.dosage}
                                                                    onChange={(e) => setDraftMedicine((p) => ({ ...p, dosage: e.target.value }))}
                                                                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                                                                    placeholder="Type custom dosage (e.g. 1-0-1)"
                                                                />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-xs font-semibold text-gray-700">Duration</label>
                                                            <select
                                                                value={draftDurationPreset}
                                                                onChange={(e) => {
                                                                    const v = e.target.value as typeof draftDurationPreset;
                                                                    setDraftDurationPreset(v);
                                                                    if (v !== '__custom__') {
                                                                        setDraftMedicine((p) => ({ ...p, duration: v }));
                                                                    } else {
                                                                        setDraftMedicine((p) => ({ ...p, duration: '' }));
                                                                    }
                                                                }}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                                                            >
                                                                <option value="3 days">3 days</option>
                                                                <option value="5 days">5 days</option>
                                                                <option value="7 days">7 days</option>
                                                                <option value="10 days">10 days</option>
                                                                <option value="14 days">14 days</option>
                                                                <option value="21 days">21 days</option>
                                                                <option value="30 days">30 days</option>
                                                                <option value="1 month">1 month</option>
                                                                <option value="2 months">2 months</option>
                                                                <option value="3 months">3 months</option>
                                                                <option value="__custom__">Custom…</option>
                                                            </select>
                                                            {draftDurationPreset === '__custom__' && (
                                                                <input
                                                                    value={draftMedicine.duration}
                                                                    onChange={(e) => setDraftMedicine((p) => ({ ...p, duration: e.target.value }))}
                                                                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                                                                    placeholder="Type custom duration (e.g. 45 days)"
                                                                />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-xs font-semibold text-gray-700">Frequency</label>
                                                            <select
                                                                value={draftMedicine.frequency}
                                                                onChange={(e) => setDraftMedicine((p) => ({ ...p, frequency: e.target.value }))}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                                                            >
                                                                <option value="Daily">Daily</option>
                                                                <option value="Twice daily">Twice daily</option>
                                                                <option value="Three times daily">Three times daily</option>
                                                                <option value="As needed">As needed</option>
                                                                <option value="">—</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-xs font-semibold text-gray-700">Instruction</label>
                                                            <select
                                                                value={draftMedicine.instructions}
                                                                onChange={(e) => setDraftMedicine((p) => ({ ...p, instructions: e.target.value }))}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                                                            >
                                                                <option value="After meal">After meal</option>
                                                                <option value="Before meal">Before meal</option>
                                                                <option value="With meal">With meal</option>
                                                                <option value="Empty stomach">Empty stomach</option>
                                                                <option value="Before sleep">Before sleep</option>
                                                                <option value="With water">With water</option>
                                                                <option value="">—</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="mb-1 block text-xs font-semibold text-gray-700">Quantity (optional)</label>
                                                        <input
                                                            type="number"
                                                            value={draftMedicine.quantity}
                                                            onChange={(e) => setDraftMedicine((p) => ({ ...p, quantity: e.target.value }))}
                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                                                            placeholder="30"
                                                            min="1"
                                                        />
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={addDraftMedicine}
                                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                                                    >
                                                        <PlusCircle className="h-4 w-4" />
                                                        Add medicine
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Saved list (bullet style) */}
                                    <div className="mt-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="text-xs font-semibold text-gray-700">
                                                Saved ({medicineItems.filter((i) => i.medicine_id).length})
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const first = medicineItems.find((i) => i.medicine_id);
                                                    setExpandedMedicineId(first ? first.id : null);
                                                }}
                                                className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                                            >
                                                Edit
                                            </button>
                                        </div>

                                        <ul className="space-y-2">
                                            {medicineItems
                                                .filter((i) => i.medicine_id)
                                                .map((item) => {
                                                    const isOpen = expandedMedicineId === item.id;
                                                    return (
                                                        <li key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                        • {getMedicineLabel(item.medicine_id)}
                                                                    </div>
                                                                    <div className="mt-1 text-xs text-gray-600">
                                                                        {item.dosage || '—'} {item.frequency ? `• ${item.frequency}` : ''}{' '}
                                                                        {item.duration ? `• ${item.duration}` : ''}{' '}
                                                                        {item.instructions ? `• ${item.instructions}` : ''}
                                                                    </div>
                                                                </div>
                                                                <div className="flex shrink-0 items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setExpandedMedicineId(isOpen ? null : item.id)}
                                                                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                                    >
                                                                        {isOpen ? 'Hide' : 'Edit'}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeMedicineItem(item.id)}
                                                                        className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {isOpen && (
                                                                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                                                            Dosage
                                                                        </label>
                                                                        <select
                                                                            value={item.dosage}
                                                                            onChange={(e) => updateMedicineItem(item.id, 'dosage', e.target.value)}
                                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                                        >
                                                                            <option value="1-0-1">1-0-1</option>
                                                                            <option value="1-1-1">1-1-1</option>
                                                                            <option value="0-1-0">0-1-0</option>
                                                                            <option value="0-0-1">0-0-1</option>
                                                                            <option value="">Custom…</option>
                                                                        </select>
                                                                        {item.dosage === '' && (
                                                                            <input
                                                                                value={item.dosage}
                                                                                onChange={(e) =>
                                                                                    updateMedicineItem(item.id, 'dosage', e.target.value)
                                                                                }
                                                                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                                                placeholder="e.g. 1-0-1"
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                                                            Duration
                                                                        </label>
                                                                        <select
                                                                            value={item.duration}
                                                                            onChange={(e) => updateMedicineItem(item.id, 'duration', e.target.value)}
                                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                                        >
                                                                            <option value="3 days">3 days</option>
                                                                            <option value="7 days">7 days</option>
                                                                            <option value="14 days">14 days</option>
                                                                            <option value="1 month">1 month</option>
                                                                            <option value="3 months">3 months</option>
                                                                            <option value="Until finish">Until finish</option>
                                                                            <option value="">Custom…</option>
                                                                        </select>
                                                                        {item.duration === '' && (
                                                                            <input
                                                                                value={item.duration}
                                                                                onChange={(e) =>
                                                                                    updateMedicineItem(item.id, 'duration', e.target.value)
                                                                                }
                                                                                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                                                placeholder="e.g. 10 days"
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                                                            Frequency
                                                                        </label>
                                                                        <select
                                                                            value={item.frequency}
                                                                            onChange={(e) => updateMedicineItem(item.id, 'frequency', e.target.value)}
                                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                                        >
                                                                            <option value="Daily">Daily</option>
                                                                            <option value="Twice daily">Twice daily</option>
                                                                            <option value="Three times daily">Three times daily</option>
                                                                            <option value="As needed">As needed</option>
                                                                            <option value="Every other day">Every other day</option>
                                                                            <option value="Weekly">Weekly</option>
                                                                            <option value="">—</option>
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                                                            Instruction
                                                                        </label>
                                                                        <select
                                                                            value={item.instructions}
                                                                            onChange={(e) =>
                                                                                updateMedicineItem(item.id, 'instructions', e.target.value)
                                                                            }
                                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                                        >
                                                                            <option value="After meal">After meal</option>
                                                                            <option value="Before meal">Before meal</option>
                                                                            <option value="With meal">With meal</option>
                                                                            <option value="Empty stomach">Empty stomach</option>
                                                                            <option value="Before sleep">Before sleep</option>
                                                                            <option value="With water">With water</option>
                                                                            <option value="With milk">With milk</option>
                                                                            <option value="Don't crush">Don't crush</option>
                                                                            <option value="">—</option>
                                                                        </select>
                                                                    </div>

                                                                    <div className="md:col-span-2">
                                                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                                                            Quantity (optional)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            value={item.quantity}
                                                                            onChange={(e) => updateMedicineItem(item.id, 'quantity', e.target.value)}
                                                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                                                                            placeholder="e.g. 30"
                                                                            min="1"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                        </ul>

                                        {medicineItems.filter((i) => i.medicine_id).length === 0 && (
                                            <div className="mt-3 rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
                                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                                                    <Pill className="h-5 w-5 text-amber-600" />
                                                </div>
                                                <div className="text-sm font-semibold text-gray-900">No medicines added</div>
                                                <div className="mt-1 text-xs text-gray-600">
                                                    Search above and click <span className="font-semibold">Add</span>.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Summary Card */}
                                <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 shadow-lg">
                                    <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                                        <CheckCircle className="h-5 w-5 text-indigo-600" />
                                        Prescription Summary
                                    </h3>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Patient:</span>
                                            <span className="font-medium">{patient.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Doctor:</span>
                                            <span className="font-medium">Dr. {doctor.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Medicines:</span>
                                            <span className="font-medium">{medicineItems.filter((item) => item.medicine_id).length} items</span>
                                        </div>
                                        {includesGlasses && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Optical Prescription:</span>
                                                <span className="font-medium">{glassesItems.length} prescription(s)</span>
                                            </div>
                                        )}
                                        {data.followup_date && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Follow-up:</span>
                                                <span className="font-medium">{new Date(data.followup_date).toLocaleDateString('en-BD')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="mt-4 border-t border-indigo-200 pt-4">
                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-indigo-600">
                                                    {medicineItems.filter((item) => item.medicine_id && item.dosage).length}
                                                </div>
                                                <div className="text-gray-600">Complete Medicines</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-purple-600">{glassesItems.length}</div>
                                                <div className="text-gray-600">Optical Prescriptions</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky bottom actions */}
                        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur">
                            <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <AlertCircle className="h-4 w-4 text-blue-500" />
                                        <span className="line-clamp-1">Review before saving.</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={goBack}
                                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            <X className="h-4 w-4" />
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing || isSubmitting || !data.diagnosis}
                                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processing || isSubmitting ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    Save
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Error Messages */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <ul className="list-inside list-disc space-y-1">
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
                    <div className="mt-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-green-50 p-4">
                        <h4 className="mb-2 flex items-center gap-2 font-medium text-blue-900">
                            <Zap className="h-4 w-4" />
                            Quick Tips for Doctors
                        </h4>
                        <div className="grid grid-cols-1 gap-4 text-sm text-blue-700 md:grid-cols-2">
                            <div>
                                <strong>Medicine Prescription:</strong>
                                <ul className="mt-1 list-inside list-disc space-y-1">
                                    <li>Use standard dosage format (1-0-1)</li>
                                    <li>Always specify duration clearly</li>
                                    <li>Include special instructions for patient safety</li>
                                </ul>
                            </div>
                            <div>
                                <strong>Optical Prescription:</strong>
                                <ul className="mt-1 list-inside list-disc space-y-1">
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
