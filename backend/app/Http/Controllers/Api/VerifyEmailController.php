<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyEmailController extends Controller
{
    public function __invoke(Request $request, int|string $id, string $hash)
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $user = User::findOrFail($id);

        // Valida se o hash da URL corresponde ao hash sha1 do e-mail do usuário
        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Link de verificação inválido.',
                ], Response::HTTP_FORBIDDEN);
            }
            return redirect()->away("{$frontendUrl}/login?error=invalid_link");
        }

        if ($user->hasVerifiedEmail()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'E-mail já verificado anteriormente.',
                ], Response::HTTP_OK);
            }
            return redirect()->away("{$frontendUrl}/login?verified=already");
        }

        // Marca a data/hora atual na coluna email_verified_at
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'E-mail confirmado com sucesso!',
            ], Response::HTTP_OK);
        }

        return redirect()->away("{$frontendUrl}/login?verified=1");
    }
}
