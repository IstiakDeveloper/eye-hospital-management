<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Glasses;
use App\Models\LensType;
use Illuminate\Support\Facades\DB;

class GlassesSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing data
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Glasses::truncate();
        LensType::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('🔄 Creating glasses inventory...');

        // GLASSES FRAMES DATA
        $glassesData = [
            // Ray-Ban Collection
            [
                'brand' => 'Ray-Ban', 'model' => 'Aviator Classic RB3025', 'type' => 'sunglasses',
                'frame_type' => 'full_rim', 'material' => 'metal', 'color' => 'Gold',
                'gender' => 'unisex', 'size' => 'Large', 'lens_width' => 58.00,
                'bridge_width' => 14.00, 'temple_length' => 135.00, 'shape' => 'Aviator',
                'price' => 150.00, 'stock_quantity' => 25, 'supplier' => 'Ray-Ban Official',
                'description' => 'Classic aviator sunglasses with gold frame', 'is_active' => true,
            ],
            [
                'brand' => 'Ray-Ban', 'model' => 'Wayfarer Original RB2140', 'type' => 'sunglasses',
                'frame_type' => 'full_rim', 'material' => 'acetate', 'color' => 'Black',
                'gender' => 'unisex', 'size' => 'Medium', 'lens_width' => 50.00,
                'bridge_width' => 22.00, 'temple_length' => 150.00, 'shape' => 'Square',
                'price' => 165.00, 'stock_quantity' => 30, 'supplier' => 'Ray-Ban Official',
                'description' => 'Iconic wayfarer style sunglasses', 'is_active' => true,
            ],
            [
                'brand' => 'Ray-Ban', 'model' => 'Round Metal RB3447', 'type' => 'frame',
                'frame_type' => 'full_rim', 'material' => 'metal', 'color' => 'Silver',
                'gender' => 'unisex', 'size' => 'Small', 'lens_width' => 47.00,
                'bridge_width' => 21.00, 'temple_length' => 140.00, 'shape' => 'Round',
                'price' => 120.00, 'stock_quantity' => 20, 'supplier' => 'Ray-Ban Official',
                'description' => 'Vintage round metal frames', 'is_active' => true,
            ],
            [
                'brand' => 'Ray-Ban', 'model' => 'Clubmaster RB3016', 'type' => 'sunglasses',
                'frame_type' => 'half_rim', 'material' => 'acetate', 'color' => 'Tortoise',
                'gender' => 'unisex', 'size' => 'Medium', 'lens_width' => 51.00,
                'bridge_width' => 21.00, 'temple_length' => 145.00, 'shape' => 'Browline',
                'price' => 180.00, 'stock_quantity' => 18, 'supplier' => 'Ray-Ban Official',
                'description' => 'Classic browline design', 'is_active' => true,
            ],

            // Oakley Collection
            [
                'brand' => 'Oakley', 'model' => 'Holbrook OO9102', 'type' => 'sunglasses',
                'frame_type' => 'full_rim', 'material' => 'plastic', 'color' => 'Matte Black',
                'gender' => 'men', 'size' => 'Large', 'lens_width' => 56.00,
                'bridge_width' => 18.00, 'temple_length' => 137.00, 'shape' => 'Square',
                'price' => 180.00, 'stock_quantity' => 15, 'supplier' => 'Oakley Sports',
                'description' => 'Sport-inspired square sunglasses', 'is_active' => true,
            ],
            [
                'brand' => 'Oakley', 'model' => 'Flak 2.0 XL OO9188', 'type' => 'sunglasses',
                'frame_type' => 'half_rim', 'material' => 'plastic', 'color' => 'Polished Black',
                'gender' => 'men', 'size' => 'Large', 'lens_width' => 59.00,
                'bridge_width' => 12.00, 'temple_length' => 133.00, 'shape' => 'Wrap',
                'price' => 200.00, 'stock_quantity' => 12, 'supplier' => 'Oakley Sports',
                'description' => 'High-performance sports sunglasses', 'is_active' => true,
            ],

            // Luxury Collection
            [
                'brand' => 'Gucci', 'model' => 'GG0061O', 'type' => 'frame',
                'frame_type' => 'full_rim', 'material' => 'acetate', 'color' => 'Havana',
                'gender' => 'women', 'size' => 'Medium', 'lens_width' => 56.00,
                'bridge_width' => 17.00, 'temple_length' => 140.00, 'shape' => 'Cat Eye',
                'price' => 280.00, 'stock_quantity' => 8, 'supplier' => 'Luxottica',
                'description' => 'Luxury cat-eye optical frames', 'is_active' => true,
            ],
            [
                'brand' => 'Gucci', 'model' => 'GG0027O', 'type' => 'frame',
                'frame_type' => 'full_rim', 'material' => 'acetate', 'color' => 'Black',
                'gender' => 'men', 'size' => 'Large', 'lens_width' => 58.00,
                'bridge_width' => 17.00, 'temple_length' => 145.00, 'shape' => 'Rectangle',
                'price' => 320.00, 'stock_quantity' => 6, 'supplier' => 'Luxottica',
                'description' => 'Designer rectangular frames', 'is_active' => true,
            ],
            [
                'brand' => 'Tom Ford', 'model' => 'FT5404', 'type' => 'frame',
                'frame_type' => 'full_rim', 'material' => 'acetate', 'color' => 'Dark Tortoise',
                'gender' => 'men', 'size' => 'Large', 'lens_width' => 58.00,
                'bridge_width' => 15.00, 'temple_length' => 145.00, 'shape' => 'Rectangle',
                'price' => 380.00, 'stock_quantity' => 5, 'supplier' => 'Marcolin',
                'description' => 'Luxury rectangular frames with T-logo', 'is_active' => true,
            ],

            // Mid-Range Collection
            [
                'brand' => 'Calvin Klein', 'model' => 'CK19562', 'type' => 'frame',
                'frame_type' => 'full_rim', 'material' => 'metal', 'color' => 'Silver',
                'gender' => 'unisex', 'size' => 'Medium', 'lens_width' => 55.00,
                'bridge_width' => 16.00, 'temple_length' => 140.00, 'shape' => 'Rectangle',
                'price' => 120.00, 'stock_quantity' => 20, 'supplier' => 'Marchon',
                'description' => 'Minimalist metal frames', 'is_active' => true,
            ],
            [
                'brand' => 'Tommy Hilfiger', 'model' => 'TH1394', 'type' => 'frame',
                'frame_type' => 'full_rim', 'material' => 'acetate', 'color' => 'Navy Blue',
                'gender' => 'men', 'size' => 'Large', 'lens_width' => 56.00,
                'bridge_width' => 17.00, 'temple_length' => 145.00, 'shape' => 'Rectangle',
                'price' => 110.00, 'stock_quantity' => 25, 'supplier' => 'Safilo',
                'description' => 'Classic navy acetate frames', 'is_active' => true,
            ],

            // Affordable Collection
            [
                'brand' => 'EyeMax', 'model' => 'Classic Reader CR-101', 'type' => 'reading_glasses',
                'frame_type' => 'full_rim', 'material' => 'plastic', 'color' => 'Brown',
                'gender' => 'unisex', 'size' => 'Medium', 'lens_width' => 52.00,
                'bridge_width' => 18.00, 'temple_length' => 135.00, 'shape' => 'Rectangle',
                'price' => 25.00, 'stock_quantity' => 50, 'supplier' => 'Local Supplier',
                'description' => 'Affordable reading glasses', 'is_active' => true,
            ],
            [
                'brand' => 'VisionCare', 'model' => 'Progressive Pro VP-200', 'type' => 'progressive',
                'frame_type' => 'full_rim', 'material' => 'titanium', 'color' => 'Gunmetal',
                'gender' => 'unisex', 'size' => 'Medium', 'lens_width' => 55.00,
                'bridge_width' => 16.00, 'temple_length' => 140.00, 'shape' => 'Oval',
                'price' => 85.00, 'stock_quantity' => 35, 'supplier' => 'VisionCare Ltd',
                'description' => 'Lightweight titanium progressive frames', 'is_active' => true,
            ],
            [
                'brand' => 'SafetyFirst', 'model' => 'Computer Shield CS-300', 'type' => 'frame',
                'frame_type' => 'full_rim', 'material' => 'plastic', 'color' => 'Blue',
                'gender' => 'unisex', 'size' => 'Medium', 'lens_width' => 54.00,
                'bridge_width' => 17.00, 'temple_length' => 138.00, 'shape' => 'Rectangle',
                'price' => 45.00, 'stock_quantity' => 40, 'supplier' => 'Tech Vision',
                'description' => 'Blue light blocking computer glasses', 'is_active' => true,
            ],

            // Kids Collection
            [
                'brand' => 'KidsVision', 'model' => 'Superhero SH-101', 'type' => 'frame',
                'frame_type' => 'full_rim', 'material' => 'plastic', 'color' => 'Red',
                'gender' => 'kids', 'size' => 'Small', 'lens_width' => 46.00,
                'bridge_width' => 16.00, 'temple_length' => 125.00, 'shape' => 'Rectangle',
                'price' => 35.00, 'stock_quantity' => 25, 'supplier' => 'Kids Optical',
                'description' => 'Durable kids frames with superhero design', 'is_active' => true,
            ],
            [
                'brand' => 'KidsVision', 'model' => 'Princess PR-201', 'type' => 'frame',
                'frame_type' => 'full_rim', 'material' => 'plastic', 'color' => 'Pink',
                'gender' => 'kids', 'size' => 'Small', 'lens_width' => 44.00,
                'bridge_width' => 15.00, 'temple_length' => 120.00, 'shape' => 'Cat Eye',
                'price' => 35.00, 'stock_quantity' => 20, 'supplier' => 'Kids Optical',
                'description' => 'Cute cat-eye frames for girls', 'is_active' => true,
            ],
        ];

        // Insert glasses
        foreach ($glassesData as $glass) {
            Glasses::create($glass);
        }

        $this->command->info('✅ Created ' . count($glassesData) . ' glasses frames');

        // LENS TYPES DATA
        $lensTypesData = [
            // Single Vision Lenses
            [
                'name' => 'Single Vision Basic', 'type' => 'clear', 'material' => 'CR-39',
                'coating' => null, 'price' => 35.00,
                'description' => 'Standard CR-39 plastic lenses', 'is_active' => true,
            ],
            [
                'name' => 'Single Vision', 'type' => 'clear', 'material' => 'CR-39',
                'coating' => 'Anti-reflective', 'price' => 50.00,
                'description' => 'Standard lenses with AR coating', 'is_active' => true,
            ],
            [
                'name' => 'Single Vision', 'type' => 'clear', 'material' => 'Polycarbonate',
                'coating' => 'Anti-reflective', 'price' => 75.00,
                'description' => 'Impact-resistant polycarbonate lenses', 'is_active' => true,
            ],
            [
                'name' => 'Single Vision', 'type' => 'clear', 'material' => 'High-index 1.60',
                'coating' => 'Anti-reflective', 'price' => 95.00,
                'description' => 'Thin high-index lenses', 'is_active' => true,
            ],
            [
                'name' => 'Single Vision', 'type' => 'clear', 'material' => 'High-index 1.67',
                'coating' => 'Anti-reflective', 'price' => 120.00,
                'description' => 'Ultra-thin high-index lenses', 'is_active' => true,
            ],

            // Progressive Lenses
            [
                'name' => 'Progressive Standard', 'type' => 'clear', 'material' => 'CR-39',
                'coating' => 'Anti-reflective', 'price' => 180.00,
                'description' => 'Standard progressive lenses', 'is_active' => true,
            ],
            [
                'name' => 'Progressive Comfort', 'type' => 'clear', 'material' => 'Polycarbonate',
                'coating' => 'Anti-reflective', 'price' => 220.00,
                'description' => 'Comfort progressive with reduced distortion', 'is_active' => true,
            ],
            [
                'name' => 'Progressive Premium', 'type' => 'clear', 'material' => 'High-index 1.67',
                'coating' => 'Anti-reflective', 'price' => 280.00,
                'description' => 'Premium progressive with advanced design', 'is_active' => true,
            ],
            [
                'name' => 'Progressive Digital', 'type' => 'clear', 'material' => 'High-index 1.67',
                'coating' => 'Anti-reflective + Blue Light', 'price' => 320.00,
                'description' => 'Digital progressive for computer use', 'is_active' => true,
            ],

            // Bifocal Lenses
            [
                'name' => 'Bifocal Traditional', 'type' => 'clear', 'material' => 'CR-39',
                'coating' => 'Anti-reflective', 'price' => 90.00,
                'description' => 'Traditional flat-top bifocal lenses', 'is_active' => true,
            ],
            [
                'name' => 'Bifocal Round', 'type' => 'clear', 'material' => 'Polycarbonate',
                'coating' => 'Anti-reflective', 'price' => 115.00,
                'description' => 'Round segment bifocal lenses', 'is_active' => true,
            ],

            // Photochromic Lenses
            [
                'name' => 'Single Vision', 'type' => 'photochromic', 'material' => 'CR-39',
                'coating' => 'Anti-reflective', 'price' => 120.00,
                'description' => 'Transition lenses that darken in sunlight', 'is_active' => true,
            ],
            [
                'name' => 'Single Vision', 'type' => 'photochromic', 'material' => 'Polycarbonate',
                'coating' => 'Anti-reflective', 'price' => 150.00,
                'description' => 'Fast transition polycarbonate lenses', 'is_active' => true,
            ],
            [
                'name' => 'Progressive', 'type' => 'photochromic', 'material' => 'High-index 1.67',
                'coating' => 'Anti-reflective', 'price' => 350.00,
                'description' => 'Premium progressive transition lenses', 'is_active' => true,
            ],

            // Tinted & Polarized Lenses
            [
                'name' => 'Single Vision', 'type' => 'tinted', 'material' => 'CR-39',
                'coating' => 'UV Protection', 'price' => 60.00,
                'description' => 'Standard tinted lenses for sunglasses', 'is_active' => true,
            ],
            [
                'name' => 'Single Vision', 'type' => 'polarized', 'material' => 'CR-39',
                'coating' => 'UV Protection', 'price' => 100.00,
                'description' => 'Polarized lenses for glare reduction', 'is_active' => true,
            ],
            [
                'name' => 'Single Vision', 'type' => 'polarized', 'material' => 'Polycarbonate',
                'coating' => 'UV Protection', 'price' => 130.00,
                'description' => 'Premium polarized polycarbonate lenses', 'is_active' => true,
            ],

            // Blue Light Protection
            [
                'name' => 'Single Vision', 'type' => 'clear', 'material' => 'CR-39',
                'coating' => 'Blue Light Filter', 'price' => 70.00,
                'description' => 'Blue light blocking for computer use', 'is_active' => true,
            ],
            [
                'name' => 'Single Vision', 'type' => 'clear', 'material' => 'Polycarbonate',
                'coating' => 'Blue Light Filter + AR', 'price' => 95.00,
                'description' => 'Blue light blocking with anti-reflective', 'is_active' => true,
            ],
            [
                'name' => 'Progressive', 'type' => 'clear', 'material' => 'Polycarbonate',
                'coating' => 'Blue Light Filter + AR', 'price' => 250.00,
                'description' => 'Progressive with blue light protection', 'is_active' => true,
            ],

            // Occupational Lenses
            [
                'name' => 'Occupational Progressive', 'type' => 'clear', 'material' => 'Polycarbonate',
                'coating' => 'Anti-reflective', 'price' => 200.00,
                'description' => 'Office progressive for intermediate vision', 'is_active' => true,
            ],
            [
                'name' => 'Computer Single Vision', 'type' => 'clear', 'material' => 'CR-39',
                'coating' => 'Blue Light Filter', 'price' => 80.00,
                'description' => 'Computer distance optimization', 'is_active' => true,
            ],
            [
                'name' => 'Reading Only', 'type' => 'clear', 'material' => 'CR-39',
                'coating' => 'Basic AR', 'price' => 40.00,
                'description' => 'Basic reading lenses', 'is_active' => true,
            ],

            // Sports & Safety
            [
                'name' => 'Sports', 'type' => 'clear', 'material' => 'Polycarbonate',
                'coating' => 'Impact Resistant', 'price' => 100.00,
                'description' => 'Impact-resistant sports lenses', 'is_active' => true,
            ],
            [
                'name' => 'Sports', 'type' => 'polarized', 'material' => 'Polycarbonate',
                'coating' => 'UV Protection + Impact Resistant', 'price' => 160.00,
                'description' => 'Polarized sports lenses', 'is_active' => true,
            ],
            [
                'name' => 'Safety Industrial', 'type' => 'clear', 'material' => 'Polycarbonate',
                'coating' => 'Impact Resistant + Anti-fog', 'price' => 85.00,
                'description' => 'Industrial safety lenses', 'is_active' => true,
            ],

            // Economy Options
            [
                'name' => 'Economy Single Vision', 'type' => 'clear', 'material' => 'CR-39',
                'coating' => null, 'price' => 25.00,
                'description' => 'Basic economy lenses', 'is_active' => true,
            ],
            [
                'name' => 'Economy Reading', 'type' => 'clear', 'material' => 'CR-39',
                'coating' => null, 'price' => 20.00,
                'description' => 'Basic reading lenses', 'is_active' => true,
            ],
        ];

        // Insert lens types
        foreach ($lensTypesData as $lensType) {
            LensType::create($lensType);
        }

        $this->command->info('✅ Created ' . count($lensTypesData) . ' lens types');
        $this->command->info('🚀 Glasses inventory seeding completed successfully!');
    }
}
