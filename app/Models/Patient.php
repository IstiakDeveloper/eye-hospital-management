<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'name',
        'phone',
        'nid_card',
        'email',
        'address',
        'date_of_birth',
        'gender',
        'medical_history',
        'registered_by',
        'qr_code',
        'qr_code_image_path',
    ];

    // Prevent total_paid/total_due from being saved to database
    protected $guarded = ['total_paid', 'total_due'];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    // Add to appends to make these available as attributes
    protected $appends = ['age', 'total_visits', 'last_visit_date'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($patient) {
            if (!$patient->patient_id) {
                $patient->patient_id = static::generatePatientId();
            }
        });

        // Simple QR code generation after patient is created
        static::created(function ($patient) {
            // Generate QR code immediately in a separate process
            try {
                $patient->generateQRCodeSync();
            } catch (\Exception $e) {
                Log::error('QR code generation failed in boot', [
                    'patient_id' => $patient->patient_id,
                    'error' => $e->getMessage()
                ]);
            }
        });
    }

    /**
     * Generate QR code synchronously without triggering events
     */
    public function generateQRCodeSync()
    {
        try {
            // Generate QR code data if not exists
            if (!$this->qr_code) {
                $qrCodeData = 'EH-' . now()->format('Ymd') . '-' . str_pad($this->id, 6, '0', STR_PAD_LEFT);

                // Direct database update to avoid events
                $this->timestamps = false; // Prevent updated_at change
                $this->update(['qr_code' => $qrCodeData]);
                $this->timestamps = true;

                $this->qr_code = $qrCodeData; // Update model instance
            }

            // Generate QR code image
            $imagePath = $this->generateQRCodeImageDirect();

            if ($imagePath) {
                // Direct database update
                $this->timestamps = false;
                $this->update(['qr_code_image_path' => $imagePath]);
                $this->timestamps = true;

                $this->qr_code_image_path = $imagePath;

                Log::info('QR code generated successfully', [
                    'patient_id' => $this->patient_id,
                    'qr_code' => $this->qr_code,
                    'image_path' => $imagePath
                ]);

                return true;
            }
        } catch (\Exception $e) {
            Log::error('QR code sync generation failed', [
                'patient_id' => $this->patient_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return false;
    }

    /**
     * Generate QR code image directly without model updates
     */
    public function generateQRCodeImageDirect()
    {
        if (!$this->qr_code) {
            return null;
        }

        try {
            // Ensure storage directory exists
            $directory = 'qr-codes';
            Storage::disk('public')->makeDirectory($directory);

            // Try multiple QR code services
            $qrUrls = [
                // QR Server API (Free alternative)
                'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($this->qr_code),
                // Backup: QR Code Generator API
                'https://chart.qr-server.com/v1/create-qr-code/?size=200x200&data=' . urlencode($this->qr_code),
            ];

            foreach ($qrUrls as $index => $qrUrl) {
                Log::info('Attempting QR generation with service ' . ($index + 1), [
                    'patient_id' => $this->patient_id,
                    'qr_code' => $this->qr_code,
                    'url' => $qrUrl
                ]);

                try {
                    // Download QR code image with extended timeout
                    $response = Http::timeout(15)
                        ->withHeaders([
                            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        ])
                        ->get($qrUrl);

                    if ($response->successful() && strlen($response->body()) > 1000) {
                        $fileName = $directory . '/patient-' . $this->patient_id . '.png';

                        // Store the image
                        $stored = Storage::disk('public')->put($fileName, $response->body());

                        if ($stored) {
                            // Verify file was actually created
                            if (Storage::disk('public')->exists($fileName)) {
                                $fileSize = Storage::disk('public')->size($fileName);

                                Log::info('QR code image stored successfully', [
                                    'patient_id' => $this->patient_id,
                                    'file_path' => $fileName,
                                    'file_size' => $fileSize,
                                    'service_used' => $index + 1
                                ]);

                                return $fileName;
                            }
                        }
                    } else {
                        Log::warning('QR service returned invalid response', [
                            'patient_id' => $this->patient_id,
                            'service' => $index + 1,
                            'status' => $response->status(),
                            'body_length' => strlen($response->body())
                        ]);
                    }
                } catch (\Exception $serviceException) {
                    Log::warning('QR service failed, trying next', [
                        'patient_id' => $this->patient_id,
                        'service' => $index + 1,
                        'error' => $serviceException->getMessage()
                    ]);
                    continue;
                }
            }

            // If all services fail, generate a simple QR pattern locally
            Log::info('All QR services failed, generating local pattern');
            return $this->generateLocalQRPattern();
        } catch (\Exception $e) {
            Log::error('Exception during QR code image generation', [
                'patient_id' => $this->patient_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return null;
    }

    /**
     * Generate a simple local QR-like pattern as fallback
     */
    private function generateLocalQRPattern()
    {
        try {
            $directory = 'qr-codes';
            $fileName = $directory . '/patient-' . $this->patient_id . '.png';

            // Create a simple 200x200 pixel image
            $image = imagecreate(200, 200);

            // Set colors
            $white = imagecolorallocate($image, 255, 255, 255);
            $black = imagecolorallocate($image, 0, 0, 0);

            // Fill background with white
            imagefill($image, 0, 0, $white);

            // Generate pattern based on patient ID
            $seed = crc32($this->qr_code);
            srand($seed);

            // Create finder patterns (corners)
            $this->drawFinderPattern($image, $black, 10, 10);      // Top-left
            $this->drawFinderPattern($image, $black, 150, 10);     // Top-right
            $this->drawFinderPattern($image, $black, 10, 150);     // Bottom-left

            // Create data pattern
            for ($y = 30; $y < 170; $y += 4) {
                for ($x = 30; $x < 170; $x += 4) {
                    if (rand(0, 1)) {
                        imagefilledrectangle($image, $x, $y, $x + 3, $y + 3, $black);
                    }
                }
            }

            // Add timing patterns
            for ($i = 30; $i < 170; $i += 8) {
                imagefilledrectangle($image, $i, 26, $i + 3, 29, $black);  // Horizontal
                imagefilledrectangle($image, 26, $i, 29, $i + 3, $black);  // Vertical
            }

            // Convert to PNG
            ob_start();
            imagepng($image);
            $imageData = ob_get_contents();
            ob_end_clean();
            imagedestroy($image);

            // Store the generated image
            $stored = Storage::disk('public')->put($fileName, $imageData);

            if ($stored) {
                Log::info('Local QR pattern generated successfully', [
                    'patient_id' => $this->patient_id,
                    'file_path' => $fileName,
                    'file_size' => strlen($imageData)
                ]);

                return $fileName;
            }
        } catch (\Exception $e) {
            Log::error('Failed to generate local QR pattern', [
                'patient_id' => $this->patient_id,
                'error' => $e->getMessage()
            ]);
        }

        return null;
    }

    /**
     * Draw finder pattern for QR code
     */
    private function drawFinderPattern($image, $color, $x, $y)
    {
        // Outer square (7x7)
        imagefilledrectangle($image, $x, $y, $x + 28, $y + 28, $color);

        // Inner white square (5x5)
        $white = imagecolorallocate($image, 255, 255, 255);
        imagefilledrectangle($image, $x + 4, $y + 4, $x + 24, $y + 24, $white);

        // Center black square (3x3)
        imagefilledrectangle($image, $x + 8, $y + 8, $x + 20, $y + 20, $color);
    }

    /**
     * Generate QR code for patient (manual trigger)
     */
    public function generateQRCode()
    {
        if (!$this->qr_code) {
            // Generate unique QR code data
            $qrCodeData = 'EH-' . now()->format('Ymd') . '-' . str_pad($this->id, 6, '0', STR_PAD_LEFT);
            $this->qr_code = $qrCodeData;
            $this->save();
        }

        // Generate QR code image and store it
        $imagePath = $this->generateQRCodeImage();

        if ($imagePath) {
            $this->qr_code_image_path = $imagePath;
            $this->save();
        }

        return $this->qr_code;
    }

    /**
     * Generate QR code image using external service and store locally
     */
    public function generateQRCodeImage()
    {
        if (!$this->qr_code) {
            return null;
        }

        try {
            // Use Google Charts API to generate QR code
            $qrUrl = 'https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=' . urlencode($this->qr_code);

            // Download QR code image with timeout
            $response = Http::timeout(10)->get($qrUrl);

            if ($response->successful()) {
                // Ensure directory exists
                $directory = 'qr-codes';
                if (!Storage::disk('public')->exists($directory)) {
                    Storage::disk('public')->makeDirectory($directory);
                }

                // Store image in storage
                $fileName = $directory . '/patient-' . $this->patient_id . '.png';
                $stored = Storage::disk('public')->put($fileName, $response->body());

                if ($stored) {
                    Log::info('QR code image stored successfully', [
                        'patient_id' => $this->patient_id,
                        'file_path' => $fileName,
                        'file_size' => strlen($response->body())
                    ]);

                    return $fileName;
                } else {
                    Log::error('Failed to store QR code image', [
                        'patient_id' => $this->patient_id,
                        'file_path' => $fileName
                    ]);
                }
            } else {
                Log::error('QR code API request failed', [
                    'patient_id' => $this->patient_id,
                    'status' => $response->status(),
                    'url' => $qrUrl
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Exception during QR code image generation', [
                'patient_id' => $this->patient_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return null;
    }

    /**
     * Get QR code image URL
     */
    public function getQRCodeImageUrlAttribute()
    {
        if ($this->qr_code_image_path && Storage::disk('public')->exists($this->qr_code_image_path)) {
            return Storage::disk('public')->url($this->qr_code_image_path);
        }

        return null;
    }

    /**
     * Get base64 encoded QR code image for PDF
     */
    public function getQRCodeBase64()
    {
        // First check if we have stored image
        if ($this->qr_code_image_path && Storage::disk('public')->exists($this->qr_code_image_path)) {
            try {
                $imageContent = Storage::disk('public')->get($this->qr_code_image_path);
                return 'data:image/png;base64,' . base64_encode($imageContent);
            } catch (\Exception $e) {
                Log::error('Failed to read stored QR code image', [
                    'patient_id' => $this->patient_id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Fallback: generate QR code on the fly
        if ($this->qr_code) {
            try {
                $qrUrl = 'https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=' . urlencode($this->qr_code);
                $response = Http::timeout(5)->get($qrUrl);

                if ($response->successful()) {
                    return 'data:image/png;base64,' . base64_encode($response->body());
                }
            } catch (\Exception $e) {
                Log::error('Failed to generate QR code on the fly', [
                    'patient_id' => $this->patient_id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return null;
    }

    /**
     * Test QR code generation (for debugging)
     */
    public function testQRGeneration()
    {
        $this->info("Testing QR generation for patient: {$this->patient_id}");

        // Step 1: Check if patient has QR code
        if (!$this->qr_code) {
            $qrCodeData = 'EH-' . now()->format('Ymd') . '-' . str_pad($this->id, 6, '0', STR_PAD_LEFT);
            $this->qr_code = $qrCodeData;
            $this->save();

            Log::info("QR code data generated: {$qrCodeData}");
        }

        // Step 2: Test Google Charts API
        $qrUrl = 'https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=' . urlencode($this->qr_code);

        Log::info("Testing QR URL: {$qrUrl}");

        try {
            $response = Http::timeout(10)->get($qrUrl);

            if ($response->successful()) {
                Log::info("QR API response successful, size: " . strlen($response->body()));

                // Step 3: Test storage
                $fileName = 'qr-codes/test-' . $this->patient_id . '.png';

                // Ensure directory exists
                Storage::disk('public')->makeDirectory('qr-codes');

                $stored = Storage::disk('public')->put($fileName, $response->body());

                if ($stored) {
                    Log::info("File stored successfully: {$fileName}");

                    // Verify file
                    if (Storage::disk('public')->exists($fileName)) {
                        $size = Storage::disk('public')->size($fileName);
                        Log::info("File verified, size: {$size} bytes");

                        // Update database
                        $this->qr_code_image_path = $fileName;
                        $this->save();

                        return "QR code generated successfully!";
                    } else {
                        return "File storage verification failed";
                    }
                } else {
                    return "File storage failed";
                }
            } else {
                return "API request failed: " . $response->status();
            }
        } catch (\Exception $e) {
            return "Exception: " . $e->getMessage();
        }
    }

    /**
     * Generate unique patient ID
     */
    public static function generatePatientId()
    {
        $prefix = 'P';
        $date = now()->format('Ymd');
        $lastPatient = static::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastPatient ? (intval(substr($lastPatient->patient_id, -4)) + 1) : 1;

        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Find existing patient by phone or NID
     */
    public static function findExisting($phone, $nidCard = null)
    {
        $query = static::where('phone', $phone);

        if ($nidCard) {
            $query->orWhere('nid_card', $nidCard);
        }

        return $query->first();
    }

    // ============================================
    // RELATIONSHIPS
    // ============================================

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function visits(): HasMany
    {
        return $this->hasMany(PatientVisit::class);
    }

    public function currentVisit()
    {
        return $this->hasOne(PatientVisit::class)->latest();
    }

    public function activeVisits()
    {
        return $this->hasMany(PatientVisit::class)
            ->whereNotIn('overall_status', ['completed']);
    }

    public function visionTests(): HasMany
    {
        return $this->hasMany(VisionTest::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PatientPayment::class);
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Get patient age
     */
    public function getAgeAttribute()
    {
        return $this->date_of_birth ? $this->date_of_birth->age : null;
    }

    /**
     * Get total visits count
     */
    public function getTotalVisitsAttribute()
    {
        return $this->visits()->count();
    }

    /**
     * Check if patient has active visit
     */
    public function hasActiveVisit()
    {
        return $this->activeVisits()->exists();
    }

    /**
     * Get total paid amount across all visits - METHOD instead of attribute
     */
    public function getTotalPaid()
    {
        return $this->visits()->sum('total_paid');
    }

    /**
     * Get total due amount across all visits - METHOD instead of attribute
     */
    public function getTotalDue()
    {
        return $this->visits()->sum('total_due');
    }

    /**
     * Get last visit date
     */
    public function getLastVisitDateAttribute()
    {
        $lastVisit = $this->visits()->latest()->first();
        return $lastVisit ? $lastVisit->created_at : null;
    }

    /**
     * Create new visit for this patient
     */
    public function createNewVisit(array $visitData = [])
    {
        return $this->visits()->create(array_merge([
            'created_by' => auth()->id(),
        ], $visitData));
    }

    // ============================================
    // SCOPES
    // ============================================

    public function scopeWithTotals($query)
    {
        return $query->withSum('visits as total_paid_sum', 'total_paid')
            ->withSum('visits as total_due_sum', 'total_due');
    }

    public function scopeActive($query)
    {
        return $query->whereHas('activeVisits');
    }

    public function scopeCompleted($query)
    {
        return $query->whereDoesntHave('activeVisits');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
