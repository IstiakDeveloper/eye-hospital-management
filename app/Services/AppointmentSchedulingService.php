<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use Carbon\Carbon;

class AppointmentSchedulingService
{
    /**
     * Auto-create appointment after vision test completion
     */
    public function createPostVisionTestAppointment(Patient $patient)
    {
        // Check if patient has a selected doctor
        if (!$patient->selected_doctor_id) {
            return null;
        }

        // Check if appointment already exists
        $existingAppointment = Appointment::where('patient_id', $patient->id)
            ->where('doctor_id', $patient->selected_doctor_id)
            ->where('status', 'pending')
            ->first();

        if ($existingAppointment) {
            return $existingAppointment; // Return existing appointment
        }

        // Load the doctor
        $doctor = Doctor::with('user')->find($patient->selected_doctor_id);

        if (!$doctor || !$doctor->is_available) {
            return null;
        }

        // Get the next available appointment time
        $appointmentDateTime = $this->getNextAvailableSlot($doctor->id);

        if (!$appointmentDateTime) {
            return null;
        }

        // Create appointment directly
        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $appointmentDateTime['date'],
            'appointment_time' => $appointmentDateTime['time'],
            'status' => 'pending',
            'notes' => 'Auto-scheduled after vision test completion on ' . now()->format('Y-m-d H:i'),
            'created_by' => auth()->id(),
        ]);

        return $appointment;
    }

    /**
     * Get next available appointment slot for a doctor
     */
    public function getNextAvailableSlot($doctorId, $startDate = null)
    {
        $startDate = $startDate ? Carbon::parse($startDate) : Carbon::now();

        // Working days and time slots
        $workingDays = [1, 2, 3, 4, 5]; // Monday to Friday
        $timeSlots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
        ];

        // Check for next 14 days
        for ($i = 0; $i < 14; $i++) {
            $checkDate = $startDate->copy()->addDays($i);

            // Skip weekends
            if (!in_array($checkDate->dayOfWeek, $workingDays)) {
                continue;
            }

            // Get available slots for this date
            $availableSlots = $this->getAvailableSlotsForDate($doctorId, $checkDate, $timeSlots);

            if (!empty($availableSlots)) {
                $bestSlot = $this->getBestTimeSlot($availableSlots, $checkDate);

                return [
                    'date' => $checkDate->format('Y-m-d'),
                    'time' => $bestSlot,
                    'formatted_date' => $checkDate->format('l, F j, Y'),
                    'formatted_time' => Carbon::parse($bestSlot)->format('g:i A'),
                ];
            }
        }

        return null;
    }

    /**
     * Get available time slots for a specific date
     */
    private function getAvailableSlotsForDate($doctorId, $checkDate, $timeSlots)
    {
        $availableSlots = [];

        foreach ($timeSlots as $time) {
            // If checking today, skip past time slots
            if ($checkDate->isToday()) {
                $currentTime = Carbon::now()->format('H:i');
                $slotTime = Carbon::parse($time)->format('H:i');

                // Add buffer time - at least 30 minutes from now
                $bufferTime = Carbon::now()->addMinutes(30)->format('H:i');

                if ($slotTime <= $bufferTime) {
                    continue;
                }
            }

            if ($this->isSlotAvailable($doctorId, $checkDate->format('Y-m-d'), $time)) {
                $availableSlots[] = $time;
            }
        }

        return $availableSlots;
    }

    /**
     * Get the best time slot based on current time and preferences
     */
    private function getBestTimeSlot($availableSlots, $checkDate)
    {
        if (empty($availableSlots)) {
            return null;
        }

        // If today, return the earliest available slot
        if ($checkDate->isToday()) {
            return $availableSlots[0];
        }

        // For future dates, prefer morning slots (9-12) or early afternoon (2-4)
        $preferredSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];

        foreach ($preferredSlots as $preferred) {
            if (in_array($preferred, $availableSlots)) {
                return $preferred;
            }
        }

        // If no preferred slot, return the first available
        return $availableSlots[0];
    }

    /**
     * Check if a specific time slot is available
     */
    public function isSlotAvailable($doctorId, $date, $time)
    {
        return !Appointment::where('doctor_id', $doctorId)
            ->where('appointment_date', $date)
            ->where('appointment_time', $time)
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();
    }
}
