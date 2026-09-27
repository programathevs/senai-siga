<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\InstrutorRequest;
use App\Models\Instrutor;
use App\Models\User;
use App\Notifications\NovoInstrutorNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class InstrutorController extends Controller
{
    /**
     * Lista todos os instrutores com dados de usuário e busca textual.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Instrutor::with('user');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('telefone', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $instrutores = $query->join('users', 'instrutores.user_id', '=', 'users.id')
            ->orderBy('users.name', 'asc')
            ->select('instrutores.*')
            ->get();

        return response()->json([
            'data' => $instrutores,
        ]);
    }

    /**
     * Cadastra um novo instrutor (cria usuário + registro profissional e envia credenciais por e-mail).
     */
    public function store(InstrutorRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $instrutor = DB::transaction(function () use ($validated) {
            $temporaryPassword = Str::password(10, symbols: false);

            $user = User::create([
                'name' => $validated['nome'],
                'email' => $validated['email'],
                'password' => Hash::make($temporaryPassword),
                'role' => UserRole::INSTRUTOR,
                'deve_trocar_senha' => true,
            ]);

            $instrutor = $user->instrutor()->create([
                'telefone' => $validated['telefone'] ?? null,
            ]);

            $verificationUrl = URL::temporarySignedRoute(
                'verification.verify',
                Carbon::now()->addDays(7),
                [
                    'id' => $user->getKey(),
                    'hash' => sha1($user->getEmailForVerification()),
                ]
            );

            $user->notify(new NovoInstrutorNotification($temporaryPassword, $verificationUrl));

            return $instrutor->load('user');
        });

        return response()->json([
            'message' => 'Instrutor cadastrado com sucesso. Um e-mail com as credenciais de acesso foi enviado.',
            'data' => $instrutor,
        ], 201);
    }

    /**
     * Exibe os dados de um instrutor específico.
     */
    public function show(Instrutor $instrutor): JsonResponse
    {
        return response()->json([
            'data' => $instrutor->load('user'),
        ]);
    }

    /**
     * Atualiza os dados de acesso e profissionais do instrutor.
     */
    public function update(InstrutorRequest $request, Instrutor $instrutor): JsonResponse
    {
        $validated = $request->validated();

        $instrutor = DB::transaction(function () use ($instrutor, $validated) {
            $instrutor->user->update([
                'name' => $validated['nome'],
                'email' => $validated['email'],
            ]);

            $instrutor->update([
                'telefone' => $validated['telefone'] ?? null,
            ]);

            return $instrutor->load('user');
        });

        return response()->json([
            'message' => 'Instrutor atualizado com sucesso.',
            'data' => $instrutor,
        ]);
    }

    /**
     * Remove o instrutor e sua conta de acesso.
     */
    public function destroy(Instrutor $instrutor): JsonResponse
    {
        if ($instrutor->user) {
            $instrutor->user->delete();
        } else {
            $instrutor->delete();
        }

        return response()->json([
            'message' => 'Instrutor removido com sucesso.',
        ]);
    }
}
