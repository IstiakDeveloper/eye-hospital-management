<?php

namespace App\Events;

use App\Models\Appointment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Appointment $appointment)
    {
        //
    }

    public function broadcastOn(): Channel
    {
        return new Channel('appointments');
    }

    public function broadcastWith(): array
    {
        return [
            'appointment' => $this->appointment->load('patient.user', 'doctor.user'),
            'doctor_id' => $this->appointment->doctor_id,
            'type' => 'updated'
        ];
    }
}
