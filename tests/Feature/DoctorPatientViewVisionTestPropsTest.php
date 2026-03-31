<?php

declare(strict_types=1);

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use App\Models\VisionTest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('passes latest vision test fields to doctor patient view', function () {
    $this->withoutMiddleware();

    $user = User::factory()->create();
    $doctor = Doctor::factory()->create();
    $patient = Patient::factory()->create();

    VisionTest::create([
        'patient_id' => $patient->id,
        'performed_by' => $user->id,
        'test_date' => now(),
        'complains' => 'Blurred vision',
        'right_eye_vision_without_glass' => '6/18',
        'left_eye_vision_without_glass' => '6/12',
        'right_eye_vision_with_glass' => '6/6',
        'left_eye_vision_with_glass' => '6/6',
        'right_eye_iop' => '14',
        'left_eye_iop' => '15',
        'blood_pressure' => '120/80',
        'blood_sugar' => '7.2',
        'is_diabetic' => true,
        'is_cardiac' => false,
        'is_hypertensive' => true,
    ]);

    // Simulate doctor user context (controller checks auth()->user()->doctor)
    $user->setRelation('doctor', $doctor);
    $this->actingAs($user);

    $response = $this->get(route('doctor.view-patient', $patient));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Doctor/PatientView')
        ->has('latestVisionTest', fn (Assert $prop) => $prop
            ->where('complains', 'Blurred vision')
            ->where('right_eye_vision_without_glass', '6/18')
            ->where('left_eye_vision_without_glass', '6/12')
            ->where('right_eye_vision_with_glass', '6/6')
            ->where('left_eye_vision_with_glass', '6/6')
            ->where('right_eye_iop', '14')
            ->where('left_eye_iop', '15')
            ->where('blood_pressure', '120/80')
            ->where('blood_sugar', '7.2')
            ->where('is_diabetic', true)
            ->where('is_hypertensive', true)
            ->has('performed_by.name')
        )
    );
});
