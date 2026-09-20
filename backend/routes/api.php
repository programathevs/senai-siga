<?php

use Illuminate\Http\Request;
use App\Http\Controllers\Api\RegisterController;
use Illuminate\Support\Facades\Route;

Route::post('/register', RegisterController::class)->name('auth.register');
