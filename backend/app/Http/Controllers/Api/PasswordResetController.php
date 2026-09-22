<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Symfony\Component\HttpFoundation\Response;

class PasswordResetController extends Controller
{
    /**
     * 1. Solicita o envio do e-mail de recuperação
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'O campo e-mail é obrigatório.',
            'email.email' => 'Informe um endereço de e-mail válido.',
        ]);

        // O broker do Laravel busca o usuário, gera o token seguro e chama sendPasswordResetNotification()
        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Enviamos o link de recuperação para o seu e-mail.',
            ], Response::HTTP_OK);
        }

        // Se o e-mail não existir, informamos o erro de validação
        return response()->json([
            'message' => 'Não encontramos nenhum usuário com este endereço de e-mail.',
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    /**
     * 2. Valida o token recebido no link e salva a nova senha
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ], [
            'token.required' => 'O token de recuperação é obrigatório.',
            'email.required' => 'O e-mail é obrigatório.',
            'password.required' => 'A nova senha é obrigatória.',
            'password.confirmed' => 'A confirmação de senha não confere.',
            'password.min' => 'A senha deve ter pelo menos 8 caracteres.',
        ]);

        // Valida o token com a hash gravada na tabela password_reset_tokens
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'deve_trocar_senha' => false, // Caso ainda estivesse pendente, agora foi trocada!
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
            ], Response::HTTP_OK);
        }

        return response()->json([
            'message' => 'Este link de recuperação é inválido ou já expirou.',
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
    }
}
