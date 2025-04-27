<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Super Admin',
                'description' => 'Has access to all features of the system',
            ],
            [
                'name' => 'Doctor',
                'description' => 'Can manage patients, view test results, and create prescriptions',
            ],
            [
                'name' => 'Receptionist',
                'description' => 'Can register patients, record vision tests, and manage appointments',
            ],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}
