<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureAuthenticatedEarlyReturn
{
    /**
     * Early Return para requisições não autenticadas na rota de validação de sessão (/api/me)
     * e rotas protegidas, evitando consultas desnecessárias ao banco de dados,
     * inicialização de sessões vazias no driver de banco e processamento de hashes.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Aplica validação de early return prioritariamente na rota /api/me
        if ($request->is('api/me')) {
            $startTime = microtime(true);
            $this->logConsoleTime("console.time('me-route')");

            // Se o usuário já estiver resolvido/autenticado (ex: actingAs em testes de integração)
            if ($request->user() || Auth::check() || Auth::guard('web')->check() || Auth::guard('sanctum')->check()) {
                $response = $next($request);
                $durationMs = round((microtime(true) - $startTime) * 1000, 2);
                $this->logConsoleTimeEnd("console.timeEnd('me-route'): {$durationMs}ms - Usuário autenticado.");
                return $response;
            }

            $token = $request->bearerToken();
            $authHeader = $request->header('Authorization');
            $sessionCookieName = config('session.cookie');

            $hasSessionCookie = ($sessionCookieName && $request->hasCookie($sessionCookieName))
                || $request->hasCookie('laravel-session')
                || $request->hasCookie('laravel_session');

            $hasRememberCookie = collect($request->cookies->all())
                ->keys()
                ->contains(fn ($key) => str_starts_with((string) $key, 'remember_web_'));

            // 1. Early Return para Token e Cookie Ausentes
            if (empty($token) && empty($authHeader) && ! $hasSessionCookie && ! $hasRememberCookie) {
                $durationMs = round((microtime(true) - $startTime) * 1000, 2);
                $this->logConsoleTimeEnd(
                    "console.timeEnd('me-route'): {$durationMs}ms - 401 Early Return: Token/Cookie de sessão ausente. Banco de dados NÃO consultado."
                );

                return response()->json([
                    'message' => 'Unauthenticated.',
                ], Response::HTTP_UNAUTHORIZED);
            }

            // 2. Early Return para Token Bearer com Formato Inválido
            // No Laravel Sanctum, os Personal Access Tokens têm formato estruturado "id|plainTextToken"
            if (! empty($token) && ! str_contains($token, '|')) {
                $durationMs = round((microtime(true) - $startTime) * 1000, 2);
                $this->logConsoleTimeEnd(
                    "console.timeEnd('me-route'): {$durationMs}ms - 401 Early Return: Token Bearer malformado. Banco de dados NÃO consultado."
                );

                return response()->json([
                    'message' => 'Unauthenticated.',
                ], Response::HTTP_UNAUTHORIZED);
            }

            // Se possui token ou cookie, prossegue para autenticação normal
            $response = $next($request);

            $durationMs = round((microtime(true) - $startTime) * 1000, 2);
            $this->logConsoleTimeEnd(
                "console.timeEnd('me-route'): {$durationMs}ms - Finalizado com status {$response->getStatusCode()}"
            );

            return $response;
        }

        return $next($request);
    }

    /**
     * Imprime no terminal (stderr/stdout do servidor) e no log do Laravel
     */
    protected function logConsoleTime(string $message): void
    {
        error_log("[me-route] {$message}");
        Log::info($message);
    }

    /**
     * Imprime o encerramento do temporizador no terminal e no log
     */
    protected function logConsoleTimeEnd(string $message): void
    {
        error_log("[me-route] {$message}");
        Log::info($message);
    }
}
