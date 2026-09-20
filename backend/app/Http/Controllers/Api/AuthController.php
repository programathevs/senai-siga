<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        // Tenta autenticar via guard web (sessão/cookies)
        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais fornecidas estão incorretas.'],
            ]);
        }

        // Regenera o ID da sessão para prevenir Session Fixation
        $request->session()->regenerate();

        return (new UserResource(Auth::user()))
            ->response()
            ->setStatusCode(Response::HTTP_OK);
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
        // Retorna o usuário logado autenticado pelos cookies
        return new UserResource($request->user());
    }
}
