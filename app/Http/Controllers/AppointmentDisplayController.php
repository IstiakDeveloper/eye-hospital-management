<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AppointmentDisplayController extends Controller
{
    public function index()
    {
        $doctors = $this->getDoctorsWithAppointments();

        return Inertia::render('AppointmentDisplay', [
            'doctors' => $doctors,
        ]);
    }

    public function getData()
    {
        $doctors = $this->getDoctorsWithAppointments();

        return response()->json([
            'doctors' => $doctors,
        ]);
    }

    private function getDoctorsWithAppointments()
    {
        return Cache::remember('appointment-display.doctors', now()->addSeconds(30), function () {
            return Doctor::with([
                'user',
                'recentAppointments' => function ($query) {
                    $statusOrder = DB::getDriverName() === 'sqlite'
                        ? "CASE status WHEN 'processing' THEN 0 WHEN 'pending' THEN 1 WHEN 'cancelled' THEN 2 ELSE 3 END"
                        : "FIELD(status, 'processing', 'pending', 'cancelled')";

                    $query->with('patient')
                        ->whereIn('status', ['pending', 'processing', 'cancelled'])
                        ->orderByRaw($statusOrder)
                        ->orderBy('created_at', 'desc')
                        ->limit(8);
                },
            ])
                ->where('is_available', true)
                ->get();
        });
    }
}
