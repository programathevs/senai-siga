<?php

use Illuminate\Http\Request;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\VerifyEmailController;
use App\Http\Controllers\Api\ResendVerificationEmailController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\FirstAccessController;
use Illuminate\Support\Facades\Route;

// Auth & Registro
Route::post('/register', RegisterController::class)->name('auth.register');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1')->name('auth.login');

Route::get('/email/verify/{id}/{hash}', [VerifyEmailController::class, '__invoke'])
    ->middleware(['signed'])
    ->name('verification.verify');

Route::post('/email/verification-notification', [ResendVerificationEmailController::class, '__invoke'])
    ->name('verification.send');

Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])->name('password.email');
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])->name('password.reset');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
    Route::post('/first-access/update-password', [FirstAccessController::class, 'updatePassword'])
        ->name('first-access.update-password');

    // --- CRUD DE CURSOS ---
    // Leitura: Admin, Instrutor e AQV
    Route::middleware('role:admin,instrutor,aqv')->group(function () {
        Route::get('/cursos', [\App\Http\Controllers\Api\CursoController::class, 'index'])->name('cursos.index');
        Route::get('/cursos/{curso}', [\App\Http\Controllers\Api\CursoController::class, 'show'])->name('cursos.show');
    });

    // Modificação (Criar, Editar, Deletar): Apenas Admin
    Route::middleware('role:admin')->group(function () {
        Route::post('/cursos', [\App\Http\Controllers\Api\CursoController::class, 'store'])->name('cursos.store');
        Route::put('/cursos/{curso}', [\App\Http\Controllers\Api\CursoController::class, 'update'])->name('cursos.update');
        Route::delete('/cursos/{curso}', [\App\Http\Controllers\Api\CursoController::class, 'destroy'])->name('cursos.destroy');
    });
});
