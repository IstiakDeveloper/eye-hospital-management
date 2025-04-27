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
        // Create Super Admin
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@eyehospital.com',
            'password' => Hash::make('password'),
            'role_id' => 1, // Super Admin
            'phone' => '01700000000',
            'is_active' => true,
        ]);

        // Create Doctor
        $doctor = User::create([
            'name' => 'Dr. Example',
            'email' => 'doctor@eyehospital.com',
            'password' => Hash::make('password'),
            'role_id' => 2, // Doctor
            'phone' => '01700000001',
            'is_active' => true,
        ]);

        // Create Doctor Profile
        Doctor::create([
            'user_id' => $doctor->id,
            'specialization' => 'Ophthalmologist',
            'qualification' => 'MBBS, MS (Eye)',
            'bio' => 'Experienced ophthalmologist with specialization in cornea treatment',
            'consultation_fee' => 1000.00,
            'is_available' => true,
        ]);

        // Create Receptionist
        User::create([
            'name' => 'Receptionist',
            'email' => 'receptionist@eyehospital.com',
            'password' => Hash::make('password'),
            'role_id' => 3, // Receptionist
            'phone' => '01700000002',
            'is_active' => true,
        ]);
    }
}
