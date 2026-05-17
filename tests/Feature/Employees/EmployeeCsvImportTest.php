<?php

use App\Models\Employee;
use App\Models\EmployeeAttendanceSetting;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

/**
 * @return array{user: User}
 */
function csvImportActor(): array
{
    $role = Role::query()->create([
        'name' => 'Emp Import '.uniqid('', true),
        'description' => 'test',
    ]);

    foreach (['employees.view', 'employees.create'] as $name) {
        $permission = Permission::query()->firstOrCreate(
            ['name' => $name],
            [
                'display_name' => $name,
                'category' => 'employees',
                'description' => null,
            ]
        );
        $role->permissions()->syncWithoutDetaching([$permission->id]);
    }

    $user = User::factory()->create(['role_id' => $role->id]);

    return ['user' => $user];
}

function employeeCsvContent(string $body): UploadedFile
{
    return UploadedFile::fake()->createWithContent(
        'employees.csv',
        $body,
        'text/csv',
    );
}

test('guest cannot download import template or import csv', function () {
    $this->get(route('employees.import.template'))->assertRedirect(route('login'));
    $this->post(route('employees.import'), ['file' => employeeCsvContent('')])->assertRedirect(route('login'));
});

test('user without create permission cannot import employees', function () {
    $role = Role::query()->create(['name' => 'View only', 'description' => 'test']);
    $permission = Permission::query()->firstOrCreate(
        ['name' => 'employees.view'],
        ['display_name' => 'View', 'category' => 'employees', 'description' => null],
    );
    $role->permissions()->sync([$permission->id]);
    $user = User::factory()->create(['role_id' => $role->id]);

    $csv = "employee_code,name\nEMP900,Test User\n";

    $this->actingAs($user)
        ->post(route('employees.import'), ['file' => employeeCsvContent($csv)])
        ->assertForbidden();
});

test('example csv template downloads with headers and sample rows', function () {
    ['user' => $actor] = csvImportActor();

    $response = $this->actingAs($actor)->get(route('employees.import.template'));

    $response->assertSuccessful();
    $response->assertHeader('content-disposition');
    expect($response->headers->get('content-type'))->toContain('text/csv');

    $content = $response->streamedContent();
    expect($content)->toContain('employee_code')
        ->and($content)->toContain('EMP001')
        ->and($content)->toContain('Rahim Uddin');
});

test('valid csv imports employees with attendance settings', function () {
    ['user' => $actor] = csvImportActor();

    $csv = implode("\n", [
        'employee_code,name,phone,department,designation,date_of_join,is_active,zkteco_user_id,expected_check_in,expected_check_out,grace_minutes,weekend_days',
        'IMP001,Import One,01711111111,Nursing,Nurse,2024-03-01,yes,501,09:00,18:00,15,"5,6"',
        'IMP002,Import Two,,Admin,Clerk,,yes,502,08:30,17:30,5,5;6',
    ]);

    $this->actingAs($actor)
        ->post(route('employees.import'), ['file' => employeeCsvContent($csv)])
        ->assertRedirect(route('employees.index'))
        ->assertSessionHas('success');

    expect(Employee::query()->where('employee_code', 'IMP001')->exists())->toBeTrue()
        ->and(Employee::query()->where('employee_code', 'IMP002')->exists())->toBeTrue();

    $setting = EmployeeAttendanceSetting::query()
        ->whereHas('employee', fn ($q) => $q->where('employee_code', 'IMP001'))
        ->first();

    expect($setting)->not->toBeNull()
        ->and($setting->grace_minutes)->toBe(15)
        ->and($setting->weekend_days)->toBe([5, 6]);
});

test('import skips duplicate employee codes and reports errors', function () {
    ['user' => $actor] = csvImportActor();

    Employee::query()->create([
        'employee_code' => 'DUP001',
        'name' => 'Existing',
        'is_active' => true,
    ]);

    $csv = implode("\n", [
        'employee_code,name',
        'DUP001,Duplicate Name',
        'NEW001,Fresh Hire',
    ]);

    $this->actingAs($actor)
        ->post(route('employees.import'), ['file' => employeeCsvContent($csv)])
        ->assertRedirect(route('employees.index'))
        ->assertSessionHas('success')
        ->assertSessionHas('import_errors');

    expect(Employee::query()->where('employee_code', 'NEW001')->exists())->toBeTrue()
        ->and(Employee::query()->where('employee_code', 'DUP001')->count())->toBe(1);
});

test('import rejects csv without required columns', function () {
    ['user' => $actor] = csvImportActor();

    $csv = "phone,email\n01700,a@b.com\n";

    $this->actingAs($actor)
        ->post(route('employees.import'), ['file' => employeeCsvContent($csv)])
        ->assertRedirect(route('employees.index'))
        ->assertSessionHas('error')
        ->assertSessionHas('import_errors');

    expect(Employee::query()->count())->toBe(0);
});

test('import accepts weekend day names in csv', function () {
    ['user' => $actor] = csvImportActor();

    $csv = implode("\n", [
        'employee_code,name,weekend_days',
        'NAM001,Name Weekend,"Fri,Sat"',
        'NAM002,Another Weekend,Friday;Saturday',
    ]);

    $this->actingAs($actor)
        ->post(route('employees.import'), ['file' => employeeCsvContent($csv)])
        ->assertRedirect(route('employees.index'))
        ->assertSessionHas('success');

    $setting = EmployeeAttendanceSetting::query()
        ->whereHas('employee', fn ($q) => $q->where('employee_code', 'NAM001'))
        ->first();

    expect($setting?->weekend_days)->toBe([5, 6]);
});

test('import validation requires a csv file', function () {
    ['user' => $actor] = csvImportActor();

    $this->actingAs($actor)
        ->post(route('employees.import'), [])
        ->assertSessionHasErrors('file');
});
