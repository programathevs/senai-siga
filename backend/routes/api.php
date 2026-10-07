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

    // --- LEITURA DE CURSOS, TURMAS, ALUNOS E INSTRUTORES (Gestor, Instrutor e AQV) ---
    Route::middleware('role:gestor,instrutor,aqv')->group(function () {
        Route::get('/cursos', [\App\Http\Controllers\Api\CursoController::class, 'index'])->name('cursos.index');
        Route::get('/cursos/{curso}', [\App\Http\Controllers\Api\CursoController::class, 'show'])->name('cursos.show');

        Route::get('/turmas', [\App\Http\Controllers\Api\TurmaController::class, 'index'])->name('turmas.index');
        Route::get('/turmas/{turma}', [\App\Http\Controllers\Api\TurmaController::class, 'show'])->name('turmas.show');

        Route::get('/alunos', [\App\Http\Controllers\Api\AlunoController::class, 'index'])->name('alunos.index');
        Route::get('/alunos/{aluno}', [\App\Http\Controllers\Api\AlunoController::class, 'show'])->name('alunos.show');
        Route::get('/alunos/{aluno}/historico', [\App\Http\Controllers\Api\AlunoController::class, 'historico'])->name('alunos.historico');

        Route::get('/instrutores', [\App\Http\Controllers\Api\InstrutorController::class, 'index'])->name('instrutores.index');
        Route::get('/instrutores/{instrutor}', [\App\Http\Controllers\Api\InstrutorController::class, 'show'])->name('instrutores.show');

        // --- DASHBOARD STATS ---
        Route::get('/dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'stats'])->name('dashboard.stats');

        // --- RELATÓRIOS PEDAGÓGICOS ---
        Route::get('/relatorios/ocorrencias', [\App\Http\Controllers\Api\RelatorioController::class, 'ocorrencias'])->name('relatorios.ocorrencias');
        Route::get('/relatorios/resumo-turmas', [\App\Http\Controllers\Api\RelatorioController::class, 'resumoTurmas'])->name('relatorios.resumo-turmas');
    });

    // --- MODIFICAÇÃO (Criar, Editar, Deletar): Apenas Gestor ---
    Route::middleware('role:gestor')->group(function () {
        Route::post('/cursos', [\App\Http\Controllers\Api\CursoController::class, 'store'])->name('cursos.store');
        Route::put('/cursos/{curso}', [\App\Http\Controllers\Api\CursoController::class, 'update'])->name('cursos.update');
        Route::delete('/cursos/{curso}', [\App\Http\Controllers\Api\CursoController::class, 'destroy'])->name('cursos.destroy');

        // --- CRUD DE INSTRUTORES (Escrita) ---
        Route::post('/instrutores', [\App\Http\Controllers\Api\InstrutorController::class, 'store'])->name('instrutores.store');
        Route::put('/instrutores/{instrutor}', [\App\Http\Controllers\Api\InstrutorController::class, 'update'])->name('instrutores.update');
        Route::delete('/instrutores/{instrutor}', [\App\Http\Controllers\Api\InstrutorController::class, 'destroy'])->name('instrutores.destroy');

        // --- GESTÃO DE TURMAS ---
        Route::post('/turmas', [\App\Http\Controllers\Api\TurmaController::class, 'store'])->name('turmas.store');
        Route::put('/turmas/{turma}', [\App\Http\Controllers\Api\TurmaController::class, 'update'])->name('turmas.update');
        Route::delete('/turmas/{turma}', [\App\Http\Controllers\Api\TurmaController::class, 'destroy'])->name('turmas.destroy');
        Route::post('/turmas/{turma}/enturmar', [\App\Http\Controllers\Api\TurmaController::class, 'enturmar'])->name('turmas.enturmar');
        Route::post('/turmas/{turma}/desenturmar', [\App\Http\Controllers\Api\TurmaController::class, 'desenturmar'])->name('turmas.desenturmar');

        // --- GESTÃO DE ALUNOS ---
        Route::post('/alunos', [\App\Http\Controllers\Api\AlunoController::class, 'store'])->name('alunos.store');
        Route::put('/alunos/{aluno}', [\App\Http\Controllers\Api\AlunoController::class, 'update'])->name('alunos.update');
        Route::delete('/alunos/{aluno}', [\App\Http\Controllers\Api\AlunoController::class, 'destroy'])->name('alunos.destroy');

        // --- RESTAURAÇÃO DE OCORRÊNCIAS / FIAPS (Apenas Gestor) ---
        Route::post('/ocorrencias/{id}/restaurar', [\App\Http\Controllers\Api\OcorrenciaController::class, 'restaurar'])->name('ocorrencias.restaurar');
    });

    // --- GESTÃO DE OCORRÊNCIAS / FIAPS ---
    // Leitura e Edição: Gestor, Instrutor e AQV
    Route::middleware('role:gestor,instrutor,aqv')->group(function () {
        Route::get('/ocorrencias', [\App\Http\Controllers\Api\OcorrenciaController::class, 'index'])->name('ocorrencias.index');
        Route::get('/ocorrencias/{ocorrencia}', [\App\Http\Controllers\Api\OcorrenciaController::class, 'show'])->name('ocorrencias.show');
        Route::put('/ocorrencias/{ocorrencia}', [\App\Http\Controllers\Api\OcorrenciaController::class, 'update'])->name('ocorrencias.update');

        // Planos de Recuperação (Leitura)
        Route::get('/planos-recuperacao', [\App\Http\Controllers\Api\PlanoRecuperacaoController::class, 'index'])->name('planos-recuperacao.index');
        Route::get('/planos-recuperacao/{plano}', [\App\Http\Controllers\Api\PlanoRecuperacaoController::class, 'show'])->name('planos-recuperacao.show');
    });

    // Modificação / Registro / Encaminhamento / Exclusão: Gestor e Instrutor (Docente registra e apaga a própria FIAP)
    Route::middleware('role:gestor,instrutor')->group(function () {
        Route::post('/ocorrencias', [\App\Http\Controllers\Api\OcorrenciaController::class, 'store'])->name('ocorrencias.store');
        Route::delete('/ocorrencias/{ocorrencia}', [\App\Http\Controllers\Api\OcorrenciaController::class, 'destroy'])->name('ocorrencias.destroy');
        Route::post('/ocorrencias/{ocorrencia}/encaminhar-aqv', [\App\Http\Controllers\Api\OcorrenciaController::class, 'encaminharAqv'])->name('ocorrencias.encaminhar-aqv');

        // Planos de Recuperação (Escrita)
        Route::post('/planos-recuperacao', [\App\Http\Controllers\Api\PlanoRecuperacaoController::class, 'store'])->name('planos-recuperacao.store');
        Route::put('/planos-recuperacao/{plano}', [\App\Http\Controllers\Api\PlanoRecuperacaoController::class, 'update'])->name('planos-recuperacao.update');
        Route::delete('/planos-recuperacao/{plano}', [\App\Http\Controllers\Api\PlanoRecuperacaoController::class, 'destroy'])->name('planos-recuperacao.destroy');
    });

    // --- MÓDULO AQV (Apoio e Qualidade de Vida / Coordenação Pedagógica) ---
    Route::middleware('role:gestor,aqv')->group(function () {
        Route::get('/aqv/encaminhamentos', [\App\Http\Controllers\Api\AqvController::class, 'index'])->name('aqv.encaminhamentos.index');
        Route::get('/aqv/stats', [\App\Http\Controllers\Api\AqvController::class, 'stats'])->name('aqv.stats');
        Route::post('/aqv/encaminhamentos/{ocorrencia}/atendimento', [\App\Http\Controllers\Api\AqvController::class, 'salvarAtendimento'])->name('aqv.encaminhamentos.atendimento');
        Route::post('/aqv/encaminhamentos/{ocorrencia}/confirmar-assinatura', [\App\Http\Controllers\Api\AqvController::class, 'confirmarAssinatura'])->name('aqv.encaminhamentos.confirmar-assinatura');
    });
});
