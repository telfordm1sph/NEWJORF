<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\JorfController;
use App\Http\Controllers\UserController;

$app_name = $app_name ?? env('APP_NAME', 'app');
// dd($app_name);
Route::prefix($app_name)

    ->group(function () {
        //location
        Route::get('/locations', [UserController::class, 'getLocationList'])->name('locations.list');
        //Requestors and Approvers
        Route::get('/available-approvers-requestors', [UserController::class, 'getAvailableApproversAndRequestors'])->name('users.available-approvers-requestors');
        Route::get('/facilities-employees', [UserController::class, 'getFacilitiesEmployees'])
            ->name('jorf.facilities.employees');
        // jorf
        Route::get('/form', [JorfController::class, 'index'])->name('jorf.form');
        Route::post('/store', [JorfController::class, 'store'])->name('jorf.store');

        Route::get('/table', [JorfController::class, 'getJorfTable'])->name('jorf.table');

        Route::get('/{jorfId}/attachments', [JorfController::class, 'getAttachments'])
            ->name('jorf.attachments');

        Route::get('/logs/{jorfId}', [JorfController::class, 'logs'])
            ->name('jorf.logs');
        Route::get('/attachments/download/{id}', [JorfController::class, 'downloadAttachment'])
            ->name('jorf.attachments.download');

        Route::get('/{jorfId}/actions', [JorfController::class, 'getJorfActions'])->name('jorf.getActions');

        Route::post('/action', [JorfController::class, 'jorfAction'])->name('jorf.actions');

        Route::post('/update-alternate', [JorfController::class, 'updateAlternate'])->name('jorf.update.alternate');
    });
