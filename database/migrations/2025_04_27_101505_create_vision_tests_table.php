<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vision_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('visit_id')->nullable()->constrained('patient_visits')->onDelete('cascade');

            // Patient complains/symptoms
            $table->text('complains')->nullable();

            // Physical examination for both eyes
            $table->text('right_eye_diagnosis')->nullable();
            $table->text('left_eye_diagnosis')->nullable();
            $table->text('right_eye_lids')->nullable();
            $table->text('left_eye_lids')->nullable();
            $table->text('right_eye_conjunctiva')->nullable();
            $table->text('left_eye_conjunctiva')->nullable();
            $table->text('right_eye_cornea')->nullable();
            $table->text('left_eye_cornea')->nullable();
            $table->text('right_eye_anterior_chamber')->nullable();
            $table->text('left_eye_anterior_chamber')->nullable();
            $table->text('right_eye_iris')->nullable();
            $table->text('left_eye_iris')->nullable();
            $table->text('right_eye_pupil')->nullable();
            $table->text('left_eye_pupil')->nullable();
            $table->text('right_eye_lens')->nullable();
            $table->text('left_eye_lens')->nullable();
            $table->text('right_eye_ocular_movements')->nullable();
            $table->text('left_eye_ocular_movements')->nullable();

            // Vision testing
            $table->string('right_eye_vision_without_glass')->nullable();
            $table->string('left_eye_vision_without_glass')->nullable();
            $table->string('right_eye_vision_with_glass')->nullable();
            $table->string('left_eye_vision_with_glass')->nullable();

            // IOP (Intraocular Pressure)
            $table->string('right_eye_iop')->nullable();
            $table->string('left_eye_iop')->nullable();

            // Ducts examination
            $table->text('right_eye_ducts')->nullable();
            $table->text('left_eye_ducts')->nullable();

            // Blood pressure and sugar tests
            $table->string('blood_pressure')->nullable();
            $table->string('urine_sugar')->nullable();
            $table->string('blood_sugar')->nullable();

            // Fundus examination
            $table->text('right_eye_fundus')->nullable();
            $table->text('left_eye_fundus')->nullable();

            // Detailed history
            $table->text('detailed_history')->nullable();

            // Medical conditions checkboxes
            $table->boolean('is_one_eyed')->default(false);
            $table->boolean('is_diabetic')->default(false);
            $table->boolean('is_cardiac')->default(false);
            $table->boolean('is_asthmatic')->default(false);
            $table->boolean('is_hypertensive')->default(false);
            $table->boolean('is_thyroid')->default(false);
            $table->text('other_conditions')->nullable();

            // Drugs used
            $table->text('drugs_used')->nullable();

            // Test metadata
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('test_date');
            $table->timestamps();

            // Indexes
            $table->index(['patient_id', 'test_date']);
            $table->index('visit_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vision_tests');
    }
};
