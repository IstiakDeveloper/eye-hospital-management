<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\PatientVisit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FollowupPatientIncomeController extends Controller
{
    /**
     * Display Followup Patient Income Report
     * Shows income from followup patients (is_followup = true)
     */
    public function index(Request $request)
    {
        // Minimum date - data available from 15 November 2025
        $minDate = '2025-11-15';

        $fromDate = $request->from_date ?? now()->startOfMonth()->toDateString();
        $toDate = $request->to_date ?? now()->toDateString();
        $search = $request->search;

        // Ensure from_date is not before minimum date
        if ($fromDate < $minDate) {
            $fromDate = $minDate;
        }

        // Get followup patient visits with doctor info
        $query = PatientVisit::with(['patient', 'selectedDoctor.user'])
            ->where('is_followup', true)
            ->whereBetween('created_at', [$fromDate.' 00:00:00', $toDate.' 23:59:59']);

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('patient', function ($patientQuery) use ($search) {
                    $patientQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('patient_id', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                })
                    ->orWhereHas('selectedDoctor.user', function ($doctorQuery) use ($search) {
                        $doctorQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Order by date
        $visits = $query->orderBy('created_at', 'asc')->get();

        // Format report data
        $reportData = $visits->map(function ($visit, $index) {
            return [
                'id' => $visit->id,
                'sl' => $index + 1,
                'visit_date' => $visit->created_at->format('d/m/Y'),
                'visit_time' => $visit->created_at->format('h:i A'),
                'patient_name' => $visit->patient->name ?? 'N/A',
                'patient_id' => $visit->patient->patient_id ?? 'N/A',
                'patient_phone' => $visit->patient->phone ?? 'N/A',
                'doctor_name' => $visit->selectedDoctor->user->name ?? 'N/A',
                'followup_fee' => (float) $visit->doctor_fee,
                'discount_amount' => (float) $visit->discount_amount,
                'total_paid' => (float) $visit->total_paid,
                'total_due' => (float) $visit->total_due,
                'final_amount' => (float) $visit->final_amount,
            ];
        })->values()->toArray();

        // Calculate totals
        $totals = [
            'total_visits' => $visits->count(),
            'total_followup_fee' => $visits->sum('doctor_fee'),
            'total_discount' => $visits->sum('discount_amount'),
            'total_final_amount' => $visits->sum('final_amount'),
            'total_paid' => $visits->sum('total_paid'),
            'total_due' => $visits->sum('total_due'),
        ];

        return Inertia::render('HospitalCorner/Reports/FollowupPatientIncomeReport', [
            'reportData' => $reportData,
            'totals' => $totals,
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
            ],
        ]);
    }
}
