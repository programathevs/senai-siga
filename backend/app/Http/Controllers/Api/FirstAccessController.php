<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Symfony\Component\HttpFoundation\Response;

class FirstAccessController extends Controller
{
    /**
     * Atualiza a senha provisória do usuário no primeiro acesso
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ], [
            'password.required' => 'A nova senha é obrigatória.',
            'password.confirmed' => 'A confirmação de senha não confere.',
            'password.min' => 'A senha deve ter pelo menos 8 caracteres.',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        // Atualiza a senha e desativa a flag de troca obrigatória
        $user->update([
            'password' => Hash::make($request->string('password')),
            'deve_trocar_senha' => false,
        ]);

        return response()->json([
            'message' => 'Senha alterada com sucesso! Seu acesso foi liberado.',
            'user' => new UserResource($user),
        ], Response::HTTP_OK);
    }
}
