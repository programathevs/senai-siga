<?php

use Illuminate\Http\Request;
use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\VerifyEmailController;
use App\Http\Controllers\Api\ResendVerificationEmailController;
use Illuminate\Support\Facades\Route;

// Cadastro de usuário
Route::post('/register', RegisterController::class)->name('auth.register');

Route::get('/email/verify/{id}/{hash}', [VerifyEmailController::class, '__invoke'])
    ->middleware(['signed'])
    ->name('verification.verify');

Route::post('/email/verification-notification', [ResendVerificationEmailController::class, '__invoke'])
    ->name('verification.send');
