<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\UsuarioRequest;
use App\Models\Instrutor;
use App\Models\User;
use App\Notifications\NovoUsuarioNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class UsuarioController extends Controller
{
    /**
     * Lista todos os usuários do sistema com seus respectivos perfis e dados de contato.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('instrutor');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('instrutor', function ($iq) use ($search) {
                      $iq->where('telefone', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('role') && in_array($request->input('role'), ['gestor', 'instrutor', 'aqv'])) {
            $query->where('role', $request->input('role'));
        }

        $query->orderBy('name', 'asc');

        if ($request->boolean('all')) {
            $users = $query->get()->map(function ($u) {
                $u->telefone = $u->instrutor?->telefone;
                return $u;
            });

            return response()->json([
                'data' => $users,
                'meta' => [
                    'total' => $users->count(),
                    'all' => true,
                ],
            ]);
        }

        $perPage = (int) $request->input('per_page', 10);
        if (! in_array($perPage, [5, 10, 20, 30, 40, 50])) {
            $perPage = 10;
        }

        $paginated = $query->paginate($perPage);

        $items = collect($paginated->items())->map(function ($u) {
            $u->telefone = $u->instrutor?->telefone;
            return $u;
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'from' => $paginated->firstItem(),
                'to' => $paginated->lastItem(),
            ],
        ]);
    }

    /**
     * Cadastra um novo usuário com o perfil selecionado (Gestor, AQV ou Instrutor).
     */
    public function store(UsuarioRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = DB::transaction(function () use ($validated, $request) {
            $temporaryPassword = Str::password(10, symbols: false);

            $fotoPath = null;
            if ($request->hasFile('foto')) {
                $fotoPath = $request->file('foto')->store('avatars/users', 'public');
            }

            $user = User::create([
                'name' => $validated['nome'],
                'email' => $validated['email'],
                'password' => Hash::make($temporaryPassword),
                'role' => $validated['role'],
                'foto' => $fotoPath,
                'deve_trocar_senha' => true,
            ]);

            // Cria o registro em instrutores para armazenar telefone e vínculos profissionais
            $user->instrutor()->create([
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

            $roleValue = $user->role instanceof UserRole ? $user->role->value : (string) $user->role;
            $user->notify(new NovoUsuarioNotification($temporaryPassword, $verificationUrl, $roleValue));

            return $user->load('instrutor');
        });

        $user->telefone = $user->instrutor?->telefone;

        return response()->json([
            'message' => 'Usuário cadastrado com sucesso. Um e-mail com as credenciais de acesso foi enviado.',
            'data' => $user,
        ], 201);
    }

    /**
     * Exibe os dados de um usuário específico.
     */
    public function show(User $usuario): JsonResponse
    {
        $usuario->load('instrutor');
        $usuario->telefone = $usuario->instrutor?->telefone;

        return response()->json([
            'data' => $usuario,
        ]);
    }

    /**
     * Atualiza os dados de acesso e perfil do usuário.
     */
    public function update(UsuarioRequest $request, User $usuario): JsonResponse
    {
        $validated = $request->validated();

        // Impede que o usuário logado remova seu próprio papel de gestor
        if (auth()->id() === $usuario->id && $validated['role'] !== 'gestor') {
            return response()->json([
                'message' => 'Você não pode alterar seu próprio perfil de Gestor.',
            ], 422);
        }

        $usuario = DB::transaction(function () use ($usuario, $validated, $request) {
            $updateData = [
                'name' => $validated['nome'],
                'email' => $validated['email'],
                'role' => $validated['role'],
            ];

            if ($request->boolean('remover_foto')) {
                if ($usuario->foto && Storage::disk('public')->exists($usuario->foto)) {
                    Storage::disk('public')->delete($usuario->foto);
                }
                $updateData['foto'] = null;
            } elseif ($request->hasFile('foto')) {
                if ($usuario->foto && Storage::disk('public')->exists($usuario->foto)) {
                    Storage::disk('public')->delete($usuario->foto);
                }
                $updateData['foto'] = $request->file('foto')->store('avatars/users', 'public');
            }

            $usuario->update($updateData);

            $usuario->instrutor()->updateOrCreate(
                ['user_id' => $usuario->id],
                ['telefone' => $validated['telefone'] ?? null]
            );

            return $usuario->load('instrutor');
        });

        $usuario->telefone = $usuario->instrutor?->telefone;

        return response()->json([
            'message' => 'Usuário atualizado com sucesso.',
            'data' => $usuario,
        ]);
    }

    /**
     * Remove o usuário e seus dados associados.
     */
    public function destroy(User $usuario): JsonResponse
    {
        // Impede auto-exclusão
        if (auth()->id() === $usuario->id) {
            return response()->json([
                'message' => 'Não é permitido excluir sua própria conta enquanto estiver conectado.',
            ], 422);
        }

        // Impede a remoção do único gestor do sistema
        if ($usuario->isGestor() && User::where('role', UserRole::GESTOR)->count() <= 1) {
            return response()->json([
                'message' => 'Não é possível remover o único gestor ativo do sistema.',
            ], 422);
        }

        DB::transaction(function () use ($usuario) {
            if ($usuario->foto && Storage::disk('public')->exists($usuario->foto)) {
                Storage::disk('public')->delete($usuario->foto);
            }
            if ($usuario->instrutor) {
                $usuario->instrutor->turmas()->detach();
                $usuario->instrutor->delete();
            }
            $usuario->delete();
        });

        return response()->json([
            'message' => 'Usuário removido com sucesso.',
        ]);
    }
}
