<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\EmployeeAttendanceSetting;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employee_code' => (string) fake()->unique()->numberBetween(10000, 99999),
            'name' => fake()->name(),
            'phone' => fake()->optional()->phoneNumber(),
            'email' => fake()->optional()->safeEmail(),
            'department' => fake()->optional()->randomElement(['Admin', 'Nursing', 'Accounts', 'OT']),
            'designation' => fake()->optional()->jobTitle(),
            'date_of_join' => fake()->optional()->date(),
            'is_active' => true,
            'zkteco_user_id' => null,
            'user_id' => null,
        ];
    }

    public function withAttendanceSchedule(
        string $checkIn = '09:00:00',
        string $checkOut = '18:00:00',
        int $graceMinutes = 10,
        array $weekendDays = [5, 6],
    ): static {
        return $this->afterCreating(function (Employee $employee) use ($checkIn, $checkOut, $graceMinutes, $weekendDays): void {
            EmployeeAttendanceSetting::query()->create([
                'employee_id' => $employee->id,
                'expected_check_in' => $checkIn,
                'expected_check_out' => $checkOut,
                'grace_minutes' => $graceMinutes,
                'weekend_days' => $weekendDays,
            ]);
        });
    }

    public function linkedToUser(?User $user = null): static
    {
        return $this->state(function () use ($user): array {
            $user ??= User::factory()->create();

            return ['user_id' => $user->id];
        });
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
