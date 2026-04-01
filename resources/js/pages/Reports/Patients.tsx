import AdminLayout from '@/layouts/admin-layout';
import { formatDhakaDate } from '@/utils/dhaka-time';
import { Head, router } from '@inertiajs/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useMemo, useState } from 'react';

interface PatientBrief {
    id: number;
    patient_id: string;
    name: string;
    address: string | null;
    phone: string | null;
    gender: string | null;
    date_of_birth: string | null;
    registered_by?: { name: string } | null;
}

interface VisitRow {
    id: number;
    visit_id: string;
    created_at: string;
    is_followup: boolean;
    chief_complaint: string | null;
    final_amount: number | string | null;
    total_paid: number | string | null;
    patient: PatientBrief;
    selected_doctor: { id?: number; user?: { name: string } | null } | null;
    created_by?: { name: string } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedVisits {
    data: VisitRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface VisitSummary {
    total_visits: number;
    new_visits: number;
    followup_visits: number;
    total_fee: number;
    total_paid: number;
}

interface Props {
    visits: PaginatedVisits;
    summary: VisitSummary;
    filters: {
        start_date?: string;
        end_date?: string;
        gender?: string;
        per_page?: number;
    };
}

const PatientsReport: React.FC<Props> = ({ visits, summary, filters }) => {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [gender, setGender] = useState(filters.gender || '');
    const [perPage, setPerPage] = useState(String(filters.per_page || visits.per_page || 50));

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

    const formatGender = (g: string | null) => {
        if (!g) return 'N/A';
        if (g === 'male') return 'Male';
        if (g === 'female') return 'Female';
        if (g === 'other') return 'Other';
        return g;
    };

    const visitTypeLabel = (isFollowup: boolean) => (isFollowup ? 'Follow up' : 'New');

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

    const formatCurrency = (amount: number | string | null | undefined) => {
        const n = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (n === null || n === undefined || Number.isNaN(n)) {
            return '৳0';
        }
        return (
            '৳' +
            n.toLocaleString('en-BD', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            })
        );
    };

    const formatCurrencyPdf = (amount: number | string | null | undefined) => {
        const n = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (n === null || n === undefined || Number.isNaN(n)) {
            return 'BDT 0';
        }
        // jsPDF default fonts don't render ৳ reliably; use ASCII for PDF output.
        return (
            'BDT ' +
            n.toLocaleString('en-BD', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            })
        );
    };

    const pdfColumns = useMemo(() => ['SL', 'Date', 'Patient ID', 'Name', 'Mobile', 'Type', 'Fee', 'Doctor', 'Received by'], []);

    const pdfRows = useMemo(() => {
        return visits.data.map((v, idx) => [
            String((visits.from ?? 0) + idx),
            formatDhakaDate(v.created_at),
            v.patient.patient_id,
            v.patient.name || 'N/A',
            v.patient.phone || 'N/A',
            visitTypeLabel(v.is_followup),
            formatCurrencyPdf(v.final_amount),
            v.selected_doctor?.user?.name || '—',
            v.created_by?.name || 'N/A',
        ]);
    }, [visits.data, visits.from]);

    const buildPdf = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        const marginX = 20;
        const contentWidth = pageWidth - marginX * 2;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(hospitalHeader.name, centerX, 30, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(hospitalHeader.contact, centerX, 46, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Patient visits report (OPD)', centerX, 68, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        const filterParts: string[] = [];
        if (startDate) filterParts.push(`From: ${startDate}`);
        if (endDate) filterParts.push(`To: ${endDate}`);
        if (gender) filterParts.push(`Gender: ${formatGender(gender)}`);
        filterParts.push(`Visits: ${summary.total_visits} (New: ${summary.new_visits}, Follow up: ${summary.followup_visits})`);
        filterParts.push(`Total fee: ${formatCurrencyPdf(summary.total_fee)}`);
        const summaryText = filterParts.join(' | ');
        const summaryLines = doc.splitTextToSize(summaryText, contentWidth) as string[];
        const summaryStartY = 84;
        const lineHeight = 12;
        summaryLines.forEach((line, i) => {
            doc.text(String(line), centerX, summaryStartY + i * lineHeight, { align: 'center' });
        });
        const tableStartY = summaryStartY + summaryLines.length * lineHeight + 10;

        // Scale column widths to fully occupy the portrait page width.
        const baseColWidths = [18, 52, 50, 96, 58, 42, 46, 80, 70];
        const baseTotal = baseColWidths.reduce((a, b) => a + b, 0);
        const scale = contentWidth / baseTotal;
        const colWidths = baseColWidths.map((w) => Math.floor(w * scale));
        const diff = Math.floor(contentWidth - colWidths.reduce((a, b) => a + b, 0));
        colWidths[3] += diff; // add rounding diff to Name column

        autoTable(doc, {
            head: [pdfColumns],
            body: pdfRows,
            startY: tableStartY,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 6,
                cellPadding: 1.5,
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
                fontSize: 6,
            },
            alternateRowStyles: { fillColor: [255, 255, 255] },
            margin: { left: marginX, right: marginX },
            tableWidth: contentWidth,
            columnStyles: {
                0: { cellWidth: colWidths[0] }, // SL
                1: { cellWidth: colWidths[1] }, // Date
                2: { cellWidth: colWidths[2] }, // Patient ID
                3: { cellWidth: colWidths[3] }, // Name
                4: { cellWidth: colWidths[4] }, // Mobile
                5: { cellWidth: colWidths[5] }, // Type
                6: { cellWidth: colWidths[6] }, // Fee
                7: { cellWidth: colWidths[7] }, // Doctor
                8: { cellWidth: colWidths[8] }, // Received by
            },
        });

        return doc;
    };

    const handleDownloadPdf = () => {
        const doc = buildPdf();
        doc.save(`patient-visits-report-${new Date().toISOString().slice(0, 10)}.pdf`);
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
            <Head title="Patient visits report" />

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
                                    <h2 className="text-lg font-semibold text-gray-900">Patient visits report</h2>
                                    <p className="text-sm text-gray-600">
                                        OPD visits by visit date (default: today). Rows are one per visit, not registration only.
                                    </p>
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

                        {/* Summary */}
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                            <div className="rounded-lg border border-gray-100 bg-slate-50 px-3 py-2">
                                <p className="text-[11px] font-medium text-gray-500 uppercase">Total visits</p>
                                <p className="text-xl font-semibold text-gray-900">{summary.total_visits}</p>
                            </div>
                            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                                <p className="text-[11px] font-medium text-emerald-700 uppercase">New</p>
                                <p className="text-xl font-semibold text-emerald-900">{summary.new_visits}</p>
                            </div>
                            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                                <p className="text-[11px] font-medium text-amber-800 uppercase">Follow up</p>
                                <p className="text-xl font-semibold text-amber-900">{summary.followup_visits}</p>
                            </div>
                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                                <p className="text-[11px] font-medium text-blue-700 uppercase">Total fee</p>
                                <p className="text-xl font-semibold text-blue-900">{formatCurrency(summary.total_fee)}</p>
                            </div>
                            <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2">
                                <p className="text-[11px] font-medium text-violet-700 uppercase">Total paid</p>
                                <p className="text-xl font-semibold text-violet-900">{formatCurrency(summary.total_paid)}</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Start date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">End date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Gender (patient)</label>
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
                                <label className="mb-2 block text-sm font-medium text-gray-700">Per page</label>
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
                                    Apply filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] table-fixed divide-y divide-gray-200">
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
                                            Gender
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Age
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Type
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Fee
                                        </th>
                                        <th className="border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Doctor
                                        </th>
                                        <th className="px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-gray-600 uppercase">
                                            Received by
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {visits.data.map((v, index) => (
                                        <tr key={v.id} className="transition-colors duration-150 hover:bg-gray-50">
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                {(visits.from ?? 0) + index}
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                {formatDhakaDate(v.created_at)}
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                                                {v.patient.patient_id}
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                                                {v.patient.name}
                                            </td>
                                            <td className="border-r border-gray-200 px-2 py-2 text-sm text-gray-900">
                                                <span className="block truncate" title={v.patient.address || ''}>
                                                    {v.patient.address || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                {v.patient.phone || 'N/A'}
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                        v.patient.gender === 'male'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : v.patient.gender === 'female'
                                                              ? 'bg-pink-100 text-pink-800'
                                                              : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {formatGender(v.patient.gender)}
                                                </span>
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                {calculateAge(v.patient.date_of_birth)}
                                            </td>
                                            <td className="border-r border-gray-200 px-2 py-2 text-sm whitespace-nowrap">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                        v.is_followup ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                                                    }`}
                                                >
                                                    {visitTypeLabel(v.is_followup)}
                                                </span>
                                            </td>
                                            <td className="truncate border-r border-gray-200 px-2 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                                                {formatCurrency(v.final_amount)}
                                            </td>
                                            <td className="border-r border-gray-200 px-2 py-2 text-sm text-gray-900">
                                                <span className="block truncate" title={v.selected_doctor?.user?.name || ''}>
                                                    {v.selected_doctor?.user?.name || '—'}
                                                </span>
                                            </td>
                                            <td className="truncate px-2 py-2 text-sm whitespace-nowrap text-gray-900">
                                                {v.created_by?.name || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {visits.data.length === 0 && (
                            <div className="py-12 text-center">
                                <div className="mb-4 text-6xl text-gray-400">📋</div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900">No visits in this range</h3>
                                <p className="text-gray-500">Adjust the date range or filters to see OPD visits.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {visits.last_page > 1 && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs text-gray-700">
                                Showing {visits.from ?? 0} to {visits.to ?? 0} of {visits.total} visits
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {visits.links.map((link, idx) => {
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
