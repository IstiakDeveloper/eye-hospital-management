<?php

namespace App\Support;

final class OpticsSaleDueCalculator
{
    /**
     * @param  float  $paymentsSum  Sum of all optics_sale_payments.amount for the sale
     * @param  float  $advanceInTableSum  Sum of payment rows where notes indicate advance
     */
    public static function outstandingDue(
        float $totalAmount,
        float $advancePaymentField,
        float $paymentsSum,
        float $advanceInTableSum,
    ): float {
        $advanceOnce = max($advancePaymentField, $advanceInTableSum);
        $otherPayments = max(0, $paymentsSum - $advanceInTableSum);
        $totalPaid = $advanceOnce + $otherPayments;

        return max(0, round($totalAmount - $totalPaid, 2));
    }
}
