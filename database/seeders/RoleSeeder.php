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
                'description' => 'Can register patients, manage appointments, and handle payments',
            ],
            [
                'name' => 'Refractionist',
                'description' => 'Can conduct vision tests, manage test equipment, and generate test reports',
            ],
            [
                'name' => 'Medicine Seller',
                'description' => 'Can sell medicines, manage sales transactions, and view sales reports',
            ],
            [
                'name' => 'Optics Seller',
                'description' => 'Can sell glasses and lenses, manage optics sales transactions, and view optics sales reports',
            ],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}
