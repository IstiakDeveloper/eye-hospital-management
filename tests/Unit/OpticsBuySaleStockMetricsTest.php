<?php

use App\Support\OpticsBuySaleStockMetrics;

it('returns zero cash and due when there are no sales rows', function () {
    $result = OpticsBuySaleStockMetrics::allocatedDueAndPeriodCash(
        collect(),
        collect(),
        '2026-03-01',
        '2026-03-31',
    );

    expect($result['cash'])->toBe(0.0);
    expect($result['due'])->toBe(0.0);
});
