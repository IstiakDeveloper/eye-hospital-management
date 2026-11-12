<?php

use App\Models\AdvanceHouseRent;
use App\Models\AdvanceHouseRentDeduction;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function advanceRentUser(bool $superAdmin): User
{
    $role = Role::query()->create([
        'name' => $superAdmin ? 'Super Admin' : 'Hospital Accountant '.uniqid(),
        'description' => 'test',
    ]);

    if (! $superAdmin) {
        $permission = Permission::query()->firstOrCreate(
            ['name' => 'hospital-account.view'],
            [
                'display_name' => 'View Hospital Account',
                'category' => 'hospital',
            ],
        );
        $role->givePermissionTo($permission);
    }

    return User::factory()->create([
        'role_id' => $role->id,
    ]);
}

function advanceRentPayment(User $user, float $amount = 20000, string $floorType = '2_3_floor'): AdvanceHouseRent
{
    return AdvanceHouseRent::query()->create([
        'advance_amount' => $amount,
        'used_amount' => 0,
        'remaining_amount' => $amount,
        'status' => 'active',
        'description' => 'Advance house rent',
        'payment_date' => '2026-01-15',
        'floor_type' => $floorType,
        'created_by' => $user->id,
    ]);
}

/**
 * @return array{amount: float, month: int, year: int, notes: string, floor_type: string}
 */
function advanceRentDeductPayload(int $month = 11, int $year = 2026, string $floorType = '2_3_floor', float $amount = 5000): array
{
    return [
        'amount' => $amount,
        'month' => $month,
        'year' => $year,
        'notes' => 'Monthly rent',
        'floor_type' => $floorType,
    ];
}

it('lets a super admin record a second deduction in the same month and rejects a third', function () {
    $superAdmin = advanceRentUser(true);
    $advance = advanceRentPayment($superAdmin);

    $this->actingAs($superAdmin)
        ->post(route('hospital-account.advance-rent.deduct'), advanceRentDeductPayload())
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->actingAs($superAdmin)
        ->post(route('hospital-account.advance-rent.deduct'), advanceRentDeductPayload())
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(AdvanceHouseRentDeduction::query()->count())->toBe(2)
        ->and(AdvanceHouseRentDeduction::query()->pluck('advance_house_rent_id')->unique())->toHaveCount(1);

    $this->actingAs($superAdmin)
        ->from(route('hospital-account.advance-rent.index'))
        ->post(route('hospital-account.advance-rent.deduct'), advanceRentDeductPayload())
        ->assertRedirect(route('hospital-account.advance-rent.index'))
        ->assertSessionHasErrors('error');

    $advance->refresh();

    expect(AdvanceHouseRentDeduction::query()->count())->toBe(2)
        ->and((string) $advance->remaining_amount)->toBe('10000.00')
        ->and((string) $advance->used_amount)->toBe('10000.00')
        ->and($advance->status)->toBe('active');
});

it('rejects a second deduction in the same month for anyone who is not a super admin', function () {
    $staff = advanceRentUser(false);
    $this->actingAs($staff);
    $advance = advanceRentPayment($staff);
    $advance->deduct(5000, 11, 2026, 'first');

    $this->from(route('hospital-account.advance-rent.index'))
        ->post(route('hospital-account.advance-rent.deduct'), advanceRentDeductPayload())
        ->assertRedirect(route('hospital-account.advance-rent.index'))
        ->assertSessionHasErrors('error');

    expect(AdvanceHouseRentDeduction::query()->count())->toBe(1);
});

it('still allows the first deduction on another floor in the same month', function () {
    $staff = advanceRentUser(false);
    $this->actingAs($staff);
    advanceRentPayment($staff)->deduct(5000, 11, 2026, 'first');
    advanceRentPayment($staff, 20000, '4_floor');

    $this->post(route('hospital-account.advance-rent.deduct'), advanceRentDeductPayload(floorType: '4_floor'))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(AdvanceHouseRentDeduction::query()->count())->toBe(2);
});

it('lets a super admin reduce a deduction and restore an exhausted advance', function () {
    $superAdmin = advanceRentUser(true);
    $this->actingAs($superAdmin);
    $advance = advanceRentPayment($superAdmin, 5000);
    $deduction = $advance->deduct(5000, 11, 2026, 'full');
    $number = $deduction->deduction_number;

    expect($advance->refresh()->status)->toBe('exhausted');

    $this->put(route('hospital-account.advance-rent.deductions.update', $deduction), [
        'amount' => 2000,
        'month' => 11,
        'year' => 2026,
        'notes' => 'Corrected rent',
    ])->assertRedirect()->assertSessionHas('success');

    $advance->refresh();
    $deduction->refresh();

    expect($advance->status)->toBe('active')
        ->and((string) $advance->remaining_amount)->toBe('3000.00')
        ->and((string) $advance->used_amount)->toBe('2000.00')
        ->and((string) $deduction->amount)->toBe('2000.00')
        ->and($deduction->notes)->toBe('Corrected rent')
        ->and($deduction->deduction_number)->toBe($number)
        ->and($deduction->advance_house_rent_id)->toBe($advance->id);
});

it('rejects a deduction edit that exceeds the remaining advance balance', function () {
    $superAdmin = advanceRentUser(true);
    $this->actingAs($superAdmin);
    $advance = advanceRentPayment($superAdmin, 10000);
    $deduction = $advance->deduct(5000, 11, 2026);

    $this->from(route('hospital-account.advance-rent.index'))
        ->put(route('hospital-account.advance-rent.deductions.update', $deduction), [
            'amount' => 20000,
            'month' => 11,
            'year' => 2026,
            'notes' => null,
        ])
        ->assertRedirect(route('hospital-account.advance-rent.index'))
        ->assertSessionHasErrors('amount');

    $advance->refresh();
    $deduction->refresh();

    expect((string) $deduction->amount)->toBe('5000.00')
        ->and((string) $advance->remaining_amount)->toBe('5000.00');
});

it('forbids anyone except a super admin from editing a deduction', function () {
    $staff = advanceRentUser(false);
    $this->actingAs($staff);
    $advance = advanceRentPayment($staff, 10000);
    $deduction = $advance->deduct(5000, 11, 2026);

    $this->put(route('hospital-account.advance-rent.deductions.update', $deduction), [
        'amount' => 2000,
        'month' => 11,
        'year' => 2026,
    ])->assertForbidden();

    expect((string) $deduction->refresh()->amount)->toBe('5000.00');
});

it('rejects moving a deduction into a month that already has two deductions', function () {
    $superAdmin = advanceRentUser(true);
    $this->actingAs($superAdmin);
    $advance = advanceRentPayment($superAdmin, 30000);
    $advance->deduct(5000, 11, 2026);
    $advance->deduct(5000, 11, 2026);
    $october = $advance->deduct(5000, 10, 2026);

    $this->from(route('hospital-account.advance-rent.index'))
        ->put(route('hospital-account.advance-rent.deductions.update', $october), [
            'amount' => 5000,
            'month' => 11,
            'year' => 2026,
            'notes' => null,
        ])
        ->assertRedirect(route('hospital-account.advance-rent.index'))
        ->assertSessionHasErrors('error');

    expect($october->refresh()->month)->toBe(10);
});

it('shares deduction management only with super admins', function () {
    $superAdmin = advanceRentUser(true);

    $this->actingAs($superAdmin)
        ->get(route('hospital-account.advance-rent.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('HospitalAccount/AdvanceRent/Dashboard')
            ->where('canManageDeductions', true));

    $staff = advanceRentUser(false);

    $this->actingAs($staff)
        ->get(route('hospital-account.advance-rent.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->where('canManageDeductions', false));
});
