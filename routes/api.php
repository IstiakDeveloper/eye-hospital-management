<?php

use App\Http\Controllers\Api\ZktecoAgentController;
use App\Http\Controllers\Api\ZktecoCommandController;
use App\Http\Controllers\Api\ZktecoEmployeeController;
use App\Http\Controllers\Api\ZktecoSyncController;
use Illuminate\Support\Facades\Route;

Route::middleware('zkteco.api')->prefix('zkteco')->name('zkteco.')->group(function () {
    Route::match(['get', 'post'], 'agent/run', [ZktecoAgentController::class, 'run'])->name('agent.run');
    Route::post('sync', ZktecoSyncController::class)->name('sync');
    Route::get('employees', [ZktecoEmployeeController::class, 'index'])->name('employees.index');
    Route::get('employees/{employee}', [ZktecoEmployeeController::class, 'show'])->name('employees.show');
    Route::get('commands', [ZktecoCommandController::class, 'index'])->name('commands.index');
    Route::post('commands/{command}/complete', [ZktecoCommandController::class, 'complete'])->name('commands.complete');
});
