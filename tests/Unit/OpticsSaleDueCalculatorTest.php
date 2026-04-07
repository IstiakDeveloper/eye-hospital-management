<?php

declare(strict_types=1);

use App\Support\OpticsSaleDueCalculator;

it('counts advance once when present in field and payment table', function () {
    $due = OpticsSaleDueCalculator::outstandingDue(
        totalAmount: 1450,
        advancePaymentField: 1000,
        paymentsSum: 1000,
        advanceInTableSum: 1000,
    );

    expect($due)->toBe(450.0);
});

it('applies non-advance payments after advance handling', function () {
    $due = OpticsSaleDueCalculator::outstandingDue(
        totalAmount: 1000,
        advancePaymentField: 0,
        paymentsSum: 250,
        advanceInTableSum: 0,
    );

    expect($due)->toBe(750.0);
});
