<?php

namespace Database\Seeders;

use App\Models\MedicineExpenseCategory;
use App\Models\PaymentMethod;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        PaymentMethod::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Cash',
                'description' => 'Cash',
                'is_active' => true,
            ]
        );

        MedicineExpenseCategory::create([
            'id' => 1,
            'name' => 'Medicine Purchase',
            'is_active' => true
        ]);

        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            UserSeeder::class,
        ]);
    }
}
