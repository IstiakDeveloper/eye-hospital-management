import AdminLayout from '@/layouts/admin-layout';
import { formatDhakaDate } from '@/utils/dhaka-time';
import { Head, router } from '@inertiajs/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useMemo, useState } from 'react';

interface Patient {
    id: number;
    patient_id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    gender: string | null;
    date_of_birth: string | null;
    created_at: string;
    registered_by: {
        name: string;
    } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface Props {
    patients: PaginatedData<Patient>;
    filters: {
        start_date?: string;
        end_date?: string;
        gender?: string;
        per_page?: number;
    };
}

const PatientsReport: React.FC<Props> = ({ patients, filters }) => {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [gender, setGender] = useState(filters.gender || '');
    const [perPage, setPerPage] = useState(String(filters.per_page || patients.per_page || 50));

    const hospitalHeader = useMemo(
        () => ({
            name: 'Naogaon Islamia Eye Hospital & Phaco Center',
            contact: 'Mobile: 01307-885566',
        }),
        [],
    );

    const handleFilter = () => {
        router.get(route('reports.patients'), {
            start_date: startDate,
            end_date: endDate,
            gender: gender,
            per_page: perPage,
        });
    };

    const formatDate = (dateString: string) => {
        return formatDhakaDate(dateString);
    };

    const formatGender = (g: string | null) => {
        if (!g) return 'N/A';
        if (g === 'male') return 'Male';
        if (g === 'female') return 'Female';
        if (g === 'other') return 'Other';
        return g;
    };

    const calculateAge = (birthDate: string | null) => {
        if (!birthDate) return 'N/A';
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            return age - 1;
        }
        return age;
    };

    const pdfColumns = useMemo(() => ['SL', 'Date', 'Patient ID', 'Name', 'Address', 'Mobile', 'Email', 'Gender', 'Age', 'Registered By'], []);

    const pdfRows = useMemo(() => {
        return patients.data.map((p, idx) => [
            String((patients.from ?? 0) + idx),
            formatDate(p.created_at),
            p.patient_id,
            p.name || 'N/A',
            p.address || 'N/A',
            p.phone || 'N/A',
            p.email || 'N/A',
            formatGender(p.gender),
            String(calculateAge(p.date_of_birth)),
            p.registered_by?.name || 'N/A',
        ]);
    }, [patients]);

    const buildPdf = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(hospitalHeader.name, centerX, 30, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(hospitalHeader.contact, centerX, 46, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Patient Report', centerX, 68, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        const filterParts: string[] = [];
        if (startDate) filterParts.push(`From: ${startDate}`);
        if (endDate) filterParts.push(`To: ${endDate}`);
        if (gender) filterParts.push(`Gender: ${formatGender(gender)}`);
        filterParts.push(`Total: ${patients.total}`);
        doc.text(filterParts.join('   |   '), centerX, 84, { align: 'center' });

        autoTable(doc, {
            head: [pdfColumns],
            body: pdfRows,
            startY: 98,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 7,
                cellPadding: 2,
                overflow: 'linebreak',
                cellWidth: 'wrap',
                lineWidth: 0.6,
                lineColor: [0, 0, 0],
                textColor: [0, 0, 0],
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                lineWidth: 0.8,
                lineColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 7,
            },
            alternateRowStyles: { fillColor: [255, 255, 255] },
            margin: { left: 20, right: 20 },
            tableWidth: 'auto',
            columnStyles: {
                0: { cellWidth: 18 }, // SL
                8: { cellWidth: 28 }, // Age
            },
        });

        return doc;
    };

    const handleDownloadPdf = () => {
        const doc = buildPdf();
        doc.save(`patient-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const handlePrintPdf = () => {
        const doc = buildPdf();
        const url = doc.output('bloburl');
        const w = window.open(url, '_blank');
        if (!w) return;
        const t = window.setInterval(() => {
            try {
                if (w.document?.readyState === 'complete') {
                    window.clearInterval(t);
                    w.focus();
                    w.print();
                }
            } catch {
                // ignore
            }
        }, 250);
    };

    return (
        <AdminLayout>
            <Head title="Patient Report" />

            <div className="p-6">
                <div className="max-w-8xl mx-auto">
                    {/* Header */}
                    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="text-center">
                                    <h1 className="text-xl font-bold text-gray-900">{hospitalHeader.name}</h1>
                                    <p className="text-xs text-gray-600">{hospitalHeader.contact}</p>
                                </div>
                                <div className="mt-3">
                                    <h2 className="text-lg font-semibold text-gray-900">Patient Report</h2>
                                    <p className="text-sm text-gray-600">Total Patients: {patients.total}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handlePrintPdf}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                >
                                    Print PDF
                                </button>
                                <button
                                    onClick={handleDownloadPdf}
                                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                                >
                                    Download PDF
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Per Page</label>
                                <select
                                    value={perPage}
                                    onChange={(e) => setPerPage(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="200">200</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleFilter}
                                    className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                                >
                                    🔍 Filter
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-full table-fixed divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            SL
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Date
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Patient ID
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Name
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Address
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Mobile
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Email
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Gender
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Age
                                        </th>
                                        <th className="px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Registered By
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {patients.data.map((patient, index) => (
                                        <tr key={patient.id} className="transition-colors duration-150 hover:bg-gray-50">
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                {(patients.from ?? 0) + index}
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                {formatDate(patient.created_at)}
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                                                {patient.patient_id}
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                                                {patient.name}
                                            </td>
                                            <td className="border-r border-gray-200 px-2 py-2 text-sm text-gray-900">
                                                <span className="block truncate" title={patient.address || ''}>
                                                    {patient.address || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                {patient.phone || 'N/A'}
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                {patient.email || 'N/A'}
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                        patient.gender === 'male'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : patient.gender === 'female'
                                                              ? 'bg-pink-100 text-pink-800'
                                                              : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {formatGender(patient.gender)}
                                                </span>
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                {calculateAge(patient.date_of_birth)}
                                            </td>
                                            <td className="truncate px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                {patient.registered_by?.name || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {patients.data.length === 0 && (
                            <div className="py-12 text-center">
                                <div className="mb-4 text-6xl text-gray-400">📋</div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No patients found</h3>
                                <p className="text-gray-500">No patients found according to the selected filters.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {patients.last_page > 1 && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs text-gray-700">
                                Showing {patients.from ?? 0} to {patients.to ?? 0} of {patients.total}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {patients.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                className="cursor-not-allowed px-2 py-1 text-xs text-gray-400"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => router.get(link.url!, {}, { preserveState: true, preserveScroll: true })}
                                            className={`rounded px-2 py-1 text-xs font-medium ${
                                                link.active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default PatientsReport;
