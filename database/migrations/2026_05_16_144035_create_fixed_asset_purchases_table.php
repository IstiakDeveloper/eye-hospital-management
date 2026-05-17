<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fixed_asset_purchases', function (Blueprint $table) {
            $table->id();
            $table->string('purchase_number')->unique();
            $table->foreignId('fixed_asset_id')->constrained('fixed_assets')->cascadeOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('fixed_asset_vendors')->nullOnDelete();
            $table->text('description')->nullable();
            $table->unsignedInteger('quantity')->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('due_amount', 15, 2);
            $table->date('purchase_date');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['fixed_asset_id', 'purchase_date']);
            $table->index(['vendor_id', 'purchase_date']);
        });

        $assets = DB::table('fixed_assets')->get();

        foreach ($assets as $asset) {
            DB::table('fixed_asset_purchases')->insert([
                'purchase_number' => 'FAP-'.$asset->asset_number,
                'fixed_asset_id' => $asset->id,
                'vendor_id' => $asset->vendor_id,
                'description' => $asset->description,
                'quantity' => null,
                'total_amount' => $asset->total_amount,
                'paid_amount' => $asset->paid_amount,
                'due_amount' => $asset->due_amount,
                'purchase_date' => $asset->purchase_date,
                'created_by' => $asset->created_by,
                'created_at' => $asset->created_at,
                'updated_at' => $asset->updated_at,
            ]);
        }

        Schema::table('fixed_assets', function (Blueprint $table) {
            $table->dropForeign(['vendor_id']);
            $table->dropColumn(['vendor_id', 'purchase_date']);
        });
    }

    public function down(): void
    {
        Schema::table('fixed_assets', function (Blueprint $table) {
            $table->foreignId('vendor_id')->nullable()->after('asset_number')->constrained('fixed_asset_vendors')->nullOnDelete();
            $table->date('purchase_date')->nullable()->after('due_amount');
        });

        $purchases = DB::table('fixed_asset_purchases')
            ->select('fixed_asset_id')
            ->selectRaw('MIN(purchase_date) as first_purchase_date')
            ->selectRaw('(SELECT vendor_id FROM fixed_asset_purchases p2 WHERE p2.fixed_asset_id = fixed_asset_purchases.fixed_asset_id ORDER BY purchase_date ASC LIMIT 1) as first_vendor_id')
            ->groupBy('fixed_asset_id')
            ->get();

        foreach ($purchases as $row) {
            DB::table('fixed_assets')
                ->where('id', $row->fixed_asset_id)
                ->update([
                    'vendor_id' => $row->first_vendor_id,
                    'purchase_date' => $row->first_purchase_date,
                ]);
        }

        Schema::dropIfExists('fixed_asset_purchases');
    }
};
