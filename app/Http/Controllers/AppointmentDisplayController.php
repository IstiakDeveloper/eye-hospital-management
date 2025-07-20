<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Doctor;
use Inertia\Inertia;

class AppointmentDisplayController extends Controller
{
    public function index()
    {
        $doctors = $this->getDoctorsWithAppointments();

        return Inertia::render('AppointmentDisplay', [
            'doctors' => $doctors
        ]);
    }

    public function getData()
    {
        $doctors = $this->getDoctorsWithAppointments();

        return response()->json([
            'doctors' => $doctors
        ]);
    }

    private function getDoctorsWithAppointments()
    {
        return Doctor::with([
            'user',
            'recentAppointments' => function ($query) {
                $query->with('patient')
                    ->whereIn('status', ['pending', 'processing', 'cancelled']) // completed exclude
                    ->orderByRaw("FIELD(status, 'processing', 'pending', 'cancelled')")
                    ->orderBy('created_at', 'desc')
                    ->limit(8);
            }
        ])
            ->where('is_available', true)
            ->get();
    }
}
