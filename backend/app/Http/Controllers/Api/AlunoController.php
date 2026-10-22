<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AlunoRequest;
use App\Models\Aluno;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AlunoController extends Controller
{
    /**
     * Lista todos os alunos com filtros de busca, turma e status.
     */
    public function index(Request $request): JsonResponse
    {
        // 1. Busca enxuta para rotas de seleção/opções (ex: GET /alunos?turma_id= ou ?options=true)
        $isOptionsLookup = $request->boolean('options') ||
            ($request->filled('turma_id') && ($request->boolean('all') || ! $request->has('page')));

        if ($isOptionsLookup) {
            $optionsQuery = Aluno::query();

            if ($request->filled('turma_id')) {
                $turmaId = $request->input('turma_id');
                if ($turmaId === 'sem_turma') {
                    $optionsQuery->whereNull('turma_id');
                } else {
                    $optionsQuery->where('turma_id', $turmaId);
                }
            }

            if ($request->filled('status')) {
                $optionsQuery->where('status', $request->input('status'));
            }

            if ($request->filled('search')) {
                $search = $request->input('search');
                $optionsQuery->where(function ($q) use ($search) {
                    $q->where('nome', 'like', "%{$search}%")
                      ->orWhere('matricula', 'like', "%{$search}%");
                });
            }

            $alunosOptions = $optionsQuery->orderBy('nome', 'asc')
                ->select(['id', 'nome', 'matricula as ra'])
                ->get()
                ->map(fn ($aluno) => [
                    'id' => $aluno->id,
                    'nome' => $aluno->nome,
                    'ra' => $aluno->ra ?? $aluno->matricula,
                ]);

            return response()->json([
                'data' => $alunosOptions,
                'meta' => [
                    'total' => $alunosOptions->count(),
                    'all' => true,
                ],
            ]);
        }

        $query = Aluno::with('turma.curso');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nome', 'like', "%{$search}%")
                  ->orWhere('matricula', 'like', "%{$search}%")
                  ->orWhere('cpf', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('turma_id')) {
            $turmaId = $request->input('turma_id');
            if ($turmaId === 'sem_turma') {
                $query->whereNull('turma_id');
            } else {
                $query->where('turma_id', $turmaId);
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $query->orderBy('nome', 'asc');

        if ($request->boolean('all')) {
            $alunos = $query->get();
            return response()->json([
                'data' => $alunos,
                'meta' => [
                    'total' => $alunos->count(),
                    'all' => true,
                ],
            ]);
        }

        $perPage = (int) $request->input('per_page', 10);
        if (! in_array($perPage, [5, 10, 20, 30, 40, 50])) {
            $perPage = 10;
        }

        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->items(),
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
     * Cadastra um novo aluno na base institucional.
     */
    public function store(AlunoRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('avatars/alunos', 'public');
        }

        $aluno = Aluno::create($data);

        return response()->json([
            'message' => 'Aluno cadastrado com sucesso.',
            'data' => $aluno->load('turma.curso'),
        ], 201);
    }

    /**
     * Exibe a ficha cadastral do aluno.
     */
    public function show(Aluno $aluno): JsonResponse
    {
        return response()->json([
            'data' => $aluno->load('turma.curso'),
        ]);
    }

    /**
     * Atualiza os dados de um aluno.
     */
    public function update(AlunoRequest $request, Aluno $aluno): JsonResponse
    {
        $data = $request->validated();

        if ($request->boolean('remover_foto')) {
            if ($aluno->foto && Storage::disk('public')->exists($aluno->foto)) {
                Storage::disk('public')->delete($aluno->foto);
            }
            $data['foto'] = null;
        } elseif ($request->hasFile('foto')) {
            if ($aluno->foto && Storage::disk('public')->exists($aluno->foto)) {
                Storage::disk('public')->delete($aluno->foto);
            }
            $data['foto'] = $request->file('foto')->store('avatars/alunos', 'public');
        }

        $aluno->update($data);

        return response()->json([
            'message' => 'Aluno atualizado com sucesso.',
            'data' => $aluno->load('turma.curso'),
        ]);
    }

    /**
     * Remove o registro do aluno do sistema.
     */
    public function destroy(Aluno $aluno): JsonResponse
    {
        if ($aluno->foto && Storage::disk('public')->exists($aluno->foto)) {
            Storage::disk('public')->delete($aluno->foto);
        }

        $aluno->delete();

        return response()->json([
            'message' => 'Aluno removido com sucesso.',
        ]);
    }

    /**
     * Retorna a ficha completa e histórico disciplinar do aluno.
     */
    public function historico(Aluno $aluno): JsonResponse
    {
        $aluno->load([
            'turma.curso',
            'ocorrencias' => function ($q) {
                $q->with(['unidades.unidadeCurricular', 'instrutores.user', 'registradoPor', 'aqvRecebimento'])
                  ->orderBy('data_ocorrencia', 'desc')
                  ->orderBy('id', 'desc');
            },
        ]);

        $ocorrencias = $aluno->ocorrencias;
        $totalFaltas = $ocorrencias->where('tipo', 'falta')->sum(function ($oc) {
            return $oc->unidades->sum('quantidade_faltas');
        });

        return response()->json([
            'data' => [
                'aluno' => $aluno,
                'estatisticas' => [
                    'total_ocorrencias' => $ocorrencias->count(),
                    'total_faltas' => $totalFaltas,
                    'planos_recuperacao_ativos' => $ocorrencias->where('status', 'enviado_aqv')->count(),
                ],
                'ocorrencias' => $ocorrencias,
            ],
        ]);
    }
}
