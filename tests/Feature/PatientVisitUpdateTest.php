<?php

declare(strict_types=1);

use App\Models\Patient;
use App\Models\Doctor;
use App\Models\PatientVisit;
use App\Models\PatientPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can update a patient visit with all fields and payment', function () {
    $user = \App\Models\User::factory()->create();
    $patient = Patient::factory()->create();
    $doctor1 = Doctor::factory()->create();
    $doctor2 = Doctor::factory()->create();
    $visit = PatientVisit::factory()->create([
        'patient_id' => $patient->id,
        'selected_doctor_id' => $doctor1->id,
        'chief_complaint' => 'Old complaint',
        'discount_type' => null,
        'discount_value' => 0,
        'total_paid' => 0,
        'total_due' => 100,
    ]);

    $this->actingAs($user);
    $response = $this->put(route('visits.update', $visit), [
        'chief_complaint' => 'Updated complaint',
        'selected_doctor_id' => $doctor2->id,
        'discount_type' => 'percentage',
        'discount_value' => 10,
        'payment_amount' => 200,
    ]);

    $response->assertRedirect(route('visits.show', $visit->id));
    $visit->refresh();
    expect($visit->chief_complaint)->toBe('Updated complaint')
        ->and($visit->selected_doctor_id)->toBe($doctor2->id)
        ->and($visit->discount_type)->toBe('percentage')
        ->and($visit->discount_value)->toBe(10.0)
        ->and($visit->payments()->sum('amount'))->toBe(200.0)
        ->and($visit->payment_status)->toBe('paid');
});
