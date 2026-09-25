<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Trata uma requisição de entrada verificando se o usuário autenticado possui o papel (role) necessário.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Não autenticado.',
            ], 401);
        }

        if (! $user->hasRole($roles)) {
            return response()->json([
                'message' => 'Acesso negado: o seu perfil de usuário não possui permissão para executar esta ação.',
            ], 403);
        }

        return $next($request);
    }
}
