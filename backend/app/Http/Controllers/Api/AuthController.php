<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $startLogin = microtime(true);
        $this->logMeTerminal("console.time('login-process')");
        $this->logMeTerminal(sprintf(
            "[login-process] [Linha %d] Início do processamento de login para email: %s",
            __LINE__,
            $request->input('email')
        ));

        // 1. Validação e autenticação via guard web (Bcrypt hash compare no MySQL)
        $tAttemptStart = microtime(true);
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (! Auth::attempt($credentials, $remember)) {
            $elapsedAttempt = round((microtime(true) - $tAttemptStart) * 1000, 2);
            $totalFail = round((microtime(true) - $startLogin) * 1000, 2);
            $this->logMeTerminal(sprintf(
                "[login-process] [Linha %d] Falha de autenticação (Auth::attempt: %sms)",
                __LINE__,
                $elapsedAttempt
            ));
            $this->logMeTerminal(sprintf("console.timeEnd('login-process'): %sms", $totalFail));

            throw ValidationException::withMessages([
                'email' => ['As credenciais fornecidas estão incorretas.'],
            ]);
        }

        $elapsedAttempt = round((microtime(true) - $tAttemptStart) * 1000, 2);
        $this->logMeTerminal(sprintf(
            "[login-process] [Linha %d] Auth::attempt concluído com sucesso em %sms",
            __LINE__,
            $elapsedAttempt
        ));

        // 2. Regeneração do ID da sessão para prevenir Session Fixation
        $tSessionStart = microtime(true);
        $request->session()->regenerate();
        $elapsedSession = round((microtime(true) - $tSessionStart) * 1000, 2);
        $this->logMeTerminal(sprintf(
            "[login-process] [Linha %d] Sessão regenerada em %sms",
            __LINE__,
            $elapsedSession
        ));

        // 3. Registro de auditoria
        $tAuditStart = microtime(true);
        $user = Auth::user();
        AuditService::registrar(
            'login',
            'User',
            $user->id,
            "Autenticação bem-sucedida de {$user->name} ({$user->email})",
            null,
            ['role' => $user->role?->value ?? (string) $user->role]
        );
        $elapsedAudit = round((microtime(true) - $tAuditStart) * 1000, 2);
        $this->logMeTerminal(sprintf(
            "[login-process] [Linha %d] Auditoria registrada em %sms",
            __LINE__,
            $elapsedAudit
        ));

        // 4. Preparação da resposta
        $response = (new UserResource($user))
            ->response()
            ->setStatusCode(Response::HTTP_OK);

        $totalElapsed = round((microtime(true) - $startLogin) * 1000, 2);
        $this->logMeTerminal(sprintf(
            "[login-process] [Linha %d] Login processado com sucesso para %s (ID: %s)",
            __LINE__,
            $user->email,
            $user->id
        ));
        $this->logMeTerminal(sprintf("console.timeEnd('login-process'): %sms", $totalElapsed));

        return $response;
    }

    public function logout(Request $request): JsonResponse
    {
        // Encerra o guard de autenticação
        Auth::guard('web')->logout();

        // Invalida a sessão do usuário
        $request->session()->invalidate();

        // Gera um novo token CSRF para a próxima sessão anônima
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ], Response::HTTP_OK);
    }

    public function me(Request $request): UserResource
    {
        $startTime = microtime(true);
        $this->logMeTerminal("console.time('me-controller')");
        $this->logMeTerminal(sprintf(
            "[me-route] [Linha %d] AuthController::me iniciado - obtendo usuário autenticado.",
            __LINE__
        ));

        // 1. Recuperação do usuário autenticado a partir do guard resolvido
        $this->logMeTerminal("console.time('me-user-fetch')");
        $tFetchStart = microtime(true);
        $user = $request->user();
        $tFetchMs = round((microtime(true) - $tFetchStart) * 1000, 2);
        $this->logMeTerminal(sprintf("console.timeEnd('me-user-fetch'): %sms (Linha: %d)", $tFetchMs, __LINE__));

        // 2. Serialização do Resource
        $this->logMeTerminal("console.time('me-resource-serialize')");
        $tResourceStart = microtime(true);
        $resource = new UserResource($user);
        $tResourceMs = round((microtime(true) - $tResourceStart) * 1000, 2);
        $this->logMeTerminal(sprintf("console.timeEnd('me-resource-serialize'): %sms (Linha: %d)", $tResourceMs, __LINE__));

        $elapsedMs = round((microtime(true) - $startTime) * 1000, 2);
        $this->logMeTerminal(sprintf(
            "[me-route] [Linha %d] AuthController::me concluído em %sms - Usuário: %s (ID: %s)",
            __LINE__,
            $elapsedMs,
            $user?->email ?? 'Nenhum',
            $user?->id ?? 'N/A'
        ));
        $this->logMeTerminal(sprintf("console.timeEnd('me-controller'): %sms (Linha: %d)", $elapsedMs, __LINE__));

        return $resource;
    }

    /**
     * Auxiliar de log no terminal para identificação de gargalos na rota /me.
     */
    protected function logMeTerminal(string $message): void
    {
        if (defined('STDOUT') && is_resource(STDOUT)) {
            fwrite(STDOUT, $message . PHP_EOL);
        } else {
            @file_put_contents('php://stdout', $message . PHP_EOL, FILE_APPEND);
        }
        error_log($message);
        \Illuminate\Support\Facades\Log::info($message);
    }
}

