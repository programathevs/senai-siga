<?php

use Illuminate\Http\Request;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\VerifyEmailController;
use App\Http\Controllers\Api\ResendVerificationEmailController;
use Illuminate\Support\Facades\Route;

// Cadastro de usuário
Route::post('/register', RegisterController::class)->name('auth.register');

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1')->name('auth.login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
});

Route::get('/email/verify/{id}/{hash}', [VerifyEmailController::class, '__invoke'])
    ->middleware(['signed'])
    ->name('verification.verify');

Route::post('/email/verification-notification', [ResendVerificationEmailController::class, '__invoke'])
    ->name('verification.send');
