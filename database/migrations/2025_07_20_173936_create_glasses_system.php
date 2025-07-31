<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Glasses table
        Schema::create('glasses', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique(); // Product code for inventory tracking
            $table->string('brand'); // Ray-Ban, Oakley, etc.
            $table->string('model'); // Frame model name
            $table->enum('type', ['frame', 'sunglasses', 'reading_glasses', 'progressive', 'bifocal']);
            $table->enum('frame_type', ['full_rim', 'half_rim', 'rimless']);
            $table->enum('material', ['plastic', 'metal', 'titanium', 'acetate', 'wood']);
            $table->string('color')->nullable();
            $table->enum('gender', ['men', 'women', 'unisex', 'kids']);
            $table->string('size')->nullable(); // Small, Medium, Large or specific measurements
            $table->decimal('lens_width', 5, 2)->nullable(); // in mm
            $table->decimal('bridge_width', 5, 2)->nullable(); // in mm
            $table->decimal('temple_length', 5, 2)->nullable(); // in mm
            $table->string('shape')->nullable(); // Round, Square, Oval, etc.
            $table->decimal('purchase_price', 10, 2)->default(0); // Cost price
            $table->decimal('selling_price', 10, 2)->default(0); // Selling price
            $table->integer('stock_quantity')->default(0);
            $table->integer('minimum_stock_level')->default(5); // Low stock alert
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Lens types table
        Schema::create('lens_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Single Vision, Progressive, Bifocal, etc.
            $table->string('type'); // clear, tinted, photochromic, polarized
            $table->string('material'); // CR-39, Polycarbonate, High-index, etc.
            $table->string('coating')->nullable(); // Anti-reflective, Blue light, UV protection
            $table->decimal('price', 10, 2)->default(0);
            $table->integer('stock_quantity')->default(0);
            $table->integer('minimum_stock_level')->default(10);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Complete glasses with lenses (ready to wear)
        Schema::create('complete_glasses', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->foreignId('frame_id')->constrained('glasses')->onDelete('cascade');
            $table->foreignId('lens_type_id')->constrained('lens_types')->onDelete('cascade');

            // Pre-made prescription values (for reading glasses etc)
            $table->decimal('sphere_power', 5, 2)->nullable(); // +1.00, +2.50 etc for reading glasses
            $table->decimal('cylinder_power', 5, 2)->nullable();
            $table->integer('axis')->nullable();

            $table->decimal('total_cost', 10, 2)->default(0); // Frame + Lens cost
            $table->decimal('selling_price', 10, 2)->default(0);
            $table->integer('stock_quantity')->default(0);
            $table->integer('minimum_stock_level')->default(3);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Stock movements for inventory tracking
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('item_type'); // 'glasses', 'lens_types', 'complete_glasses'
            $table->unsignedBigInteger('item_id');
            $table->enum('movement_type', ['purchase', 'sale', 'adjustment', 'return', 'damage']);
            $table->integer('quantity'); // Positive for in, negative for out
            $table->integer('previous_stock');
            $table->integer('new_stock');
            $table->decimal('unit_price', 10, 2)->nullable();
            $table->decimal('total_amount', 10, 2)->nullable();
            $table->string('reference_type')->nullable(); // 'prescription', 'sale', etc
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('user_id')->nullable(); // Who made the movement
            $table->timestamps();

            $table->index(['item_type', 'item_id']);
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        // Add glasses prescription to prescriptions table
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->boolean('includes_glasses')->default(false);
            $table->text('glasses_notes')->nullable();
        });

        // Prescription glasses table (similar to prescription_medicines)
        Schema::create('prescription_glasses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->onDelete('cascade');
            $table->foreignId('glasses_id')->nullable()->constrained('glasses')->nullOnDelete();
            $table->foreignId('lens_type_id')->nullable()->constrained('lens_types')->nullOnDelete();

            // Right Eye Prescription
            $table->decimal('right_eye_sphere', 5, 2)->nullable(); // SPH
            $table->decimal('right_eye_cylinder', 5, 2)->nullable(); // CYL
            $table->integer('right_eye_axis')->nullable(); // AXIS (0-180)
            $table->decimal('right_eye_add', 4, 2)->nullable(); // ADD for progressive/bifocal

            // Left Eye Prescription
            $table->decimal('left_eye_sphere', 5, 2)->nullable(); // SPH
            $table->decimal('left_eye_cylinder', 5, 2)->nullable(); // CYL
            $table->integer('left_eye_axis')->nullable(); // AXIS (0-180)
            $table->decimal('left_eye_add', 4, 2)->nullable(); // ADD for progressive/bifocal

            // Additional measurements
            $table->decimal('pupillary_distance', 4, 1)->nullable(); // PD in mm
            $table->decimal('segment_height', 4, 1)->nullable(); // For bifocal/progressive
            $table->decimal('optical_center_height', 4, 1)->nullable();

            // Prescription details
            $table->enum('prescription_type', ['distance', 'reading', 'progressive', 'bifocal', 'computer']);
            $table->text('special_instructions')->nullable();
            $table->decimal('frame_price', 10, 2)->default(0);
            $table->decimal('lens_price', 10, 2)->default(0);
            $table->decimal('total_price', 10, 2)->default(0);
            $table->enum('status', ['pending', 'ordered', 'ready', 'delivered'])->default('pending');
            $table->date('expected_delivery')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('prescription_glasses');
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn(['includes_glasses', 'glasses_notes']);
        });
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('complete_glasses');
        Schema::dropIfExists('lens_types');
        Schema::dropIfExists('glasses');
    }
};
