<?php

use App\Models\MedicalTest;
use App\Models\Patient;
use App\Models\PatientMedicalTest;
use App\Models\PatientTestGroup;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $role = Role::query()->create([
        'name' => 'receipt-test-role-'.uniqid(),
        'description' => 'Test role',
    ]);
    $this->user = User::factory()->create(['role_id' => $role->id]);
    $this->actingAs($this->user);
    $this->withoutMiddleware(\App\Http\Middleware\PermissionMiddleware::class);
});

it('renders the receipt page with every ordered test in props', function () {
    $patient = Patient::query()->create([
        'patient_id' => '0999',
        'name' => 'Receipt Patient',
        'phone' => '01999999901',
    ]);

    $group = PatientTestGroup::query()->create([
        'group_number' => 'MTG-TEST-0001',
        'patient_id' => $patient->id,
        'visit_id' => null,
        'total_original_price' => 500,
        'total_discount' => 0,
        'final_amount' => 500,
        'paid_amount' => 500,
        'due_amount' => 0,
        'payment_status' => 'paid',
        'test_date' => now()->toDateString(),
        'created_by' => $this->user->id,
    ]);

    $names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];

    foreach ($names as $i => $name) {
        $medicalTest = MedicalTest::query()->create([
            'name' => $name,
            'code' => 'RT'.str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
            'price' => 100,
            'category' => 'Lab',
        ]);

        PatientMedicalTest::query()->create([
            'test_number' => 'PMT-RT-'.$i.'-'.uniqid(),
            'patient_id' => $patient->id,
            'visit_id' => null,
            'test_group_id' => $group->id,
            'medical_test_id' => $medicalTest->id,
            'original_price' => 100,
            'discount_amount' => 0,
            'final_price' => 100,
            'paid_amount' => 100,
            'due_amount' => 0,
            'payment_status' => 'paid',
            'test_status' => 'pending',
            'test_date' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);
    }

    $response = $this->get(route('medical-tests.receipt', $group));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('MedicalTests/Receipt')
        ->has('testGroup.tests', 5)
    );

    foreach ($names as $name) {
        $response->assertSee($name, false);
    }
});
