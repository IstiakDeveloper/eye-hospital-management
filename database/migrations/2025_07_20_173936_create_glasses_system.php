<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
Schema::create('glasses', function (Blueprint $table) {
            $table->id();
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
            $table->decimal('price', 10, 2)->default(0);
            $table->integer('stock_quantity')->default(0);
            $table->string('supplier')->nullable();
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
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
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
            $table->decimal('total_price', 10, 2)->default(0);
            $table->enum('status', ['pending', 'ordered', 'ready', 'delivered'])->default('pending');
            $table->date('expected_delivery')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('glasses_system');
    }
};
