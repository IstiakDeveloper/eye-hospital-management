<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@eyehospital.com',
            'password' => Hash::make('password'),
            'role_id' => 1, // Super Admin
            'phone' => '01700000000',
            'is_active' => true,
        ]);

        $doctor = User::create([
            'name' => 'Dr. Example',
            'email' => 'doctor@eyehospital.com',
            'password' => Hash::make('password'),
            'role_id' => 2, // Doctor
            'phone' => '01700000001',
            'is_active' => true,
        ]);

        Doctor::create([
            'user_id' => $doctor->id,
            'specialization' => 'Ophthalmologist',
            'qualification' => 'MBBS, MS (Eye)',
            'bio' => 'Experienced ophthalmologist with specialization in cornea treatment',
            'consultation_fee' => 1000.00,
            'is_available' => true,
        ]);

        User::create([
            'name' => 'Receptionist',
            'email' => 'receptionist@eyehospital.com',
            'password' => Hash::make('password'),
            'role_id' => 3, // Receptionist
            'phone' => '01700000002',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Refractionist',
            'email' => 'refractionist@eyehospital.com',
            'password' => Hash::make('password'),
            'role_id' => 4, // Refractionist
            'phone' => '01700000003',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Medicine Seller',
            'email' => 'seller@eyehospital.com',
            'password' => Hash::make('password'),
            'role_id' => 5, // Medicine Seller
            'phone' => '01700000004',
            'is_active' => true,
        ]);

         User::create([
            'name' => 'Optics Seller',
            'email' => 'optics@eyehospital.com',
            'password' => Hash::make('password'),
            'role_id' => 6, // Optics Seller
            'phone' => '01700000005',
            'is_active' => true,
        ]);
    }
}
