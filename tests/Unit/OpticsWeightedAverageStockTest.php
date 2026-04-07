<?php

use App\Support\OpticsWeightedAverageStock;

it('values inventory at weighted average after two purchases at different costs', function () {
    $movements = collect([
        (object) ['id' => 1, 'movement_type' => 'purchase', 'quantity' => 10, 'unit_price' => 100, 'total_amount' => 1000],
        (object) ['id' => 2, 'movement_type' => 'purchase', 'quantity' => 10, 'unit_price' => 200, 'total_amount' => 2000],
    ]);

    $state = OpticsWeightedAverageStock::applyMovements($movements);

    expect($state['quantity'])->toBe(20.0)
        ->and($state['value'])->toBe(3000.0);
});

it('reduces stock at average cost on sale and ignores sale total_amount as revenue', function () {
    $movements = collect([
        (object) ['id' => 1, 'movement_type' => 'purchase', 'quantity' => 10, 'unit_price' => 100, 'total_amount' => 1000],
        (object) ['id' => 2, 'movement_type' => 'sale', 'quantity' => -3, 'unit_price' => 500, 'total_amount' => 1500],
    ]);

    $state = OpticsWeightedAverageStock::applyMovements($movements);

    expect($state['quantity'])->toBe(7.0)
        ->and($state['value'])->toBe(700.0);
});

it('applies weighted average across two layers then sells half', function () {
    $movements = collect([
        (object) ['id' => 1, 'movement_type' => 'purchase', 'quantity' => 10, 'unit_price' => 100, 'total_amount' => 1000],
        (object) ['id' => 2, 'movement_type' => 'purchase', 'quantity' => 10, 'unit_price' => 200, 'total_amount' => 2000],
        (object) ['id' => 3, 'movement_type' => 'sale', 'quantity' => -10, 'unit_price' => 999, 'total_amount' => 9990],
    ]);

    $state = OpticsWeightedAverageStock::applyMovements($movements);

    expect($state['quantity'])->toBe(10.0)
        ->and($state['value'])->toBe(1500.0);
});

it('reduces closing qty and value when optics sold qty exceeds sale movements', function () {
    $adj = OpticsWeightedAverageStock::adjustForSaleBookVsMovementDelta(10.0, 1500.0, 12, 10, 100.0);

    expect($adj['quantity'])->toBe(8.0)
        ->and($adj['value'])->toBe(1200.0);
});

it('increases closing qty and value when sale movements exceed optics sold qty', function () {
    $adj = OpticsWeightedAverageStock::adjustForSaleBookVsMovementDelta(8.0, 1200.0, 10, 12, 100.0);

    expect($adj['quantity'])->toBe(10.0)
        ->and($adj['value'])->toBe(1500.0);
});
