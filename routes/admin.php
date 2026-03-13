<?php

use App\Http\Controllers\RequestorLIstController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RequestTypeController;



$app_name = $app_name ?? env('APP_NAME', 'app');
// dd($app_name);
Route::prefix($app_name)

    ->group(function () {

        // request type
        Route::get('/requestType', [RequestTypeController::class, 'index'])->name('requestType.form');
        Route::post('/requestTypes', [RequestTypeController::class, 'store'])->name('request-types.store');
        Route::put('/requestTypes/{id}', [RequestTypeController::class, 'update'])->name('request-types.update');
        Route::delete('/requestTypes/{id}', [RequestTypeController::class, 'destroy'])->name('request-types.destroy');

        Route::get('/requestor', [RequestorLIstController::class, 'index'])->name('requestor.form');
        Route::post('/requestor', [RequestorLIstController::class, 'store'])->name('requestor.store');
        Route::delete('/requestor/{id}', [RequestorLIstController::class, 'destroy'])->name('requestor.destroy');
    });
