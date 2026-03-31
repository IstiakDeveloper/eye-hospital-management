<?php

declare(strict_types=1);

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows a doctor to skip vision test for a paid visit', function () {
    $this->withoutMiddleware();

    $user = User::factory()->create();
    $doctor = Doctor::factory()->create();
    $patient = Patient::factory()->create();

    $visit = PatientVisit::factory()->create([
        'patient_id' => $patient->id,
        'selected_doctor_id' => $doctor->id,
        'payment_status' => 'paid',
        'overall_status' => 'vision_test',
        'vision_test_status' => 'pending',
    ]);

    // Simulate doctor user context (controller checks selected_doctor_id via auth()->user()->doctor)
    $user->setRelation('doctor', $doctor);
    $this->actingAs($user);

    $response = $this->post(route('doctor.visits.vision-test.skip', $visit));

    $response->assertRedirect();
    $visit->refresh();

    expect($visit->vision_test_status)->toBe('skipped')
        ->and($visit->overall_status)->toBe('prescription')
        ->and($visit->vision_test_completed_at)->not()->toBeNull();
});
