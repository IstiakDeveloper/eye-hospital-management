<?php

namespace App\Services\HospitalAccount;

use App\Models\FixedAssetPurchase;
use App\Models\FixedAssetVendor;
use App\Models\FixedAssetVendorPayment;
use Illuminate\Support\Collection;

class FixedAssetVendorDueLedgerService
{
    /**
     * @return array{
     *     ledgerData: array<int, array<string, mixed>>,
     *     totals: array<string, float>,
     *     show_vendor_column: bool
     * }
     */
    public function build(?int $vendorId, ?string $startDate, ?string $endDate): array
    {
        $hasDateFilter = filled($startDate) && filled($endDate);

        $vendors = FixedAssetVendor::query()
            ->when($vendorId, fn ($query) => $query->where('id', $vendorId))
            ->orderBy('name')
            ->get();

        $ledgerData = [];

        foreach ($vendors as $vendor) {
            $vendorLines = $this->buildVendorLines($vendor, $startDate, $endDate, $hasDateFilter);

            if ($vendorLines !== []) {
                $ledgerData = array_merge($ledgerData, $vendorLines);
            }
        }

        $transactionLines = collect($ledgerData)->where('type', '!=', 'opening');

        $closingBalance = $this->sumClosingBalancesByVendor($ledgerData);

        return [
            'ledgerData' => $ledgerData,
            'totals' => [
                'opening_balance' => (float) collect($ledgerData)
                    ->where('type', 'opening')
                    ->sum('balance'),
                'total_purchase_due' => (float) $transactionLines->sum('purchase_due'),
                'total_payment' => (float) $transactionLines->sum('payment'),
                'closing_balance' => $closingBalance,
            ],
            'show_vendor_column' => ! $vendorId,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildVendorLines(
        FixedAssetVendor $vendor,
        ?string $startDate,
        ?string $endDate,
        bool $hasDateFilter
    ): array {
        $lines = [];
        $runningBalance = 0.0;

        if ($hasDateFilter) {
            $prePurchaseDue = (float) FixedAssetPurchase::query()
                ->where('vendor_id', $vendor->id)
                ->where('purchase_date', '<', $startDate)
                ->sum('due_amount');

            $prePayments = (float) FixedAssetVendorPayment::query()
                ->where('vendor_id', $vendor->id)
                ->where('payment_date', '<', $startDate)
                ->sum('amount');

            $runningBalance = $prePurchaseDue - $prePayments;

            $lines[] = $this->makeLine(
                id: 'opening-'.$vendor->id,
                date: $startDate,
                vendor: $vendor,
                reference: '-',
                description: 'Opening Balance',
                type: 'opening',
                purchaseDue: 0.0,
                payment: 0.0,
                balance: $runningBalance,
            );

            $purchases = FixedAssetPurchase::query()
                ->with('fixedAsset:id,name,asset_number')
                ->where('vendor_id', $vendor->id)
                ->whereBetween('purchase_date', [$startDate, $endDate])
                ->where('due_amount', '>', 0)
                ->get();

            $payments = FixedAssetVendorPayment::query()
                ->where('vendor_id', $vendor->id)
                ->whereBetween('payment_date', [$startDate, $endDate])
                ->get();
        } else {
            $purchases = FixedAssetPurchase::query()
                ->with('fixedAsset:id,name,asset_number')
                ->where('vendor_id', $vendor->id)
                ->where('due_amount', '>', 0)
                ->get();

            $payments = FixedAssetVendorPayment::query()
                ->where('vendor_id', $vendor->id)
                ->get();
        }

        $events = $this->mergePurchaseAndPaymentEvents($purchases, $payments);

        foreach ($events as $event) {
            if ($event['type'] === 'purchase') {
                /** @var FixedAssetPurchase $purchase */
                $purchase = $event['model'];
                $due = (float) $purchase->due_amount;
                $runningBalance += $due;

                $assetLabel = $purchase->fixedAsset?->name ?? 'Fixed Asset';
                $description = $purchase->fixedAsset?->asset_number
                    ? "{$assetLabel} ({$purchase->fixedAsset->asset_number})"
                    : $assetLabel;

                if ($purchase->description) {
                    $description .= ' — '.$purchase->description;
                }

                $lines[] = $this->makeLine(
                    id: 'purchase-'.$purchase->id,
                    date: $purchase->purchase_date->format('Y-m-d'),
                    vendor: $vendor,
                    reference: $purchase->purchase_number,
                    description: $description,
                    type: 'purchase',
                    purchaseDue: $due,
                    payment: 0.0,
                    balance: $runningBalance,
                );

                continue;
            }

            /** @var FixedAssetVendorPayment $payment */
            $payment = $event['model'];
            $amount = (float) $payment->amount;
            $runningBalance -= $amount;

            $lines[] = $this->makeLine(
                id: 'payment-'.$payment->id,
                date: $payment->payment_date->format('Y-m-d'),
                vendor: $vendor,
                reference: $payment->payment_no,
                description: $payment->description ?: 'Vendor Payment',
                type: 'payment',
                purchaseDue: 0.0,
                payment: $amount,
                balance: $runningBalance,
            );
        }

        if (! $hasDateFilter && $lines === []) {
            return [];
        }

        if ($hasDateFilter && count($lines) === 1 && $runningBalance === 0.0) {
            return [];
        }

        return $lines;
    }

    /**
     * @param  Collection<int, FixedAssetPurchase>  $purchases
     * @param  Collection<int, FixedAssetVendorPayment>  $payments
     * @return Collection<int, array<string, mixed>>
     */
    private function mergePurchaseAndPaymentEvents(Collection $purchases, Collection $payments): Collection
    {
        $events = collect();

        foreach ($purchases as $purchase) {
            $events->push([
                'date' => $purchase->purchase_date->format('Y-m-d'),
                'sort_order' => 0,
                'id' => $purchase->id,
                'type' => 'purchase',
                'model' => $purchase,
            ]);
        }

        foreach ($payments as $payment) {
            $events->push([
                'date' => $payment->payment_date->format('Y-m-d'),
                'sort_order' => 1,
                'id' => $payment->id,
                'type' => 'payment',
                'model' => $payment,
            ]);
        }

        return $events->sortBy([
            ['date', 'asc'],
            ['sort_order', 'asc'],
            ['id', 'asc'],
        ])->values();
    }

    /**
     * @param  array<int, array<string, mixed>>  $ledgerData
     */
    private function sumClosingBalancesByVendor(array $ledgerData): float
    {
        $lastBalancePerVendor = [];

        foreach ($ledgerData as $line) {
            $lastBalancePerVendor[$line['vendor_id']] = (float) $line['balance'];
        }

        return (float) array_sum($lastBalancePerVendor);
    }

    /**
     * @return array<string, mixed>
     */
    private function makeLine(
        string $id,
        string $date,
        FixedAssetVendor $vendor,
        string $reference,
        string $description,
        string $type,
        float $purchaseDue,
        float $payment,
        float $balance,
    ): array {
        return [
            'id' => $id,
            'date' => $date,
            'vendor_id' => $vendor->id,
            'vendor_name' => $vendor->name,
            'reference' => $reference,
            'description' => $description,
            'type' => $type,
            'purchase_due' => $purchaseDue,
            'payment' => $payment,
            'balance' => $balance,
        ];
    }
}
