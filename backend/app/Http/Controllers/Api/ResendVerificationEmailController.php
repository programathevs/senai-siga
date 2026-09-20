<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResendVerificationEmailController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Informe um e-mail válido.',
        ]);

        $user = User::where('email', $request->input('email'))->first();

        // Resposta genérica para evitar enumeração de usuários
        if (! $user) {
            return response()->json([
                'message' => 'Se o e-mail estiver cadastrado, um novo link de confirmação será enviado.',
            ], Response::HTTP_OK);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Este e-mail já foi verificado anteriormente.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Reenvia a notificação nativa com o link assinado
        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Link de verificação reenviado com sucesso!',
        ], Response::HTTP_OK);
    }
}
