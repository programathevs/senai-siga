<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TurmaRequest;
use App\Models\Aluno;
use App\Models\Turma;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TurmaController extends Controller
{
    /**
     * Lista as turmas com filtros e contagem de alunos.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Turma::with('curso.unidadesCurriculares')->withCount('alunos');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nome', 'like', "%{$search}%")
                  ->orWhere('ano_letivo', 'like', "%{$search}%")
                  ->orWhereHas('curso', function ($cq) use ($search) {
                      $cq->where('nome', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('curso_id')) {
            $query->where('curso_id', $request->input('curso_id'));
        }

        if ($request->filled('turno')) {
            $query->where('turno', $request->input('turno'));
        }

        $turmas = $query->orderBy('ano_letivo', 'desc')
            ->orderBy('nome', 'asc')
            ->get();

        return response()->json([
            'data' => $turmas,
        ]);
    }

    /**
     * Cadastra uma nova turma.
     */
    public function store(TurmaRequest $request): JsonResponse
    {
        $turma = Turma::create($request->validated());

        return response()->json([
            'message' => 'Turma cadastrada com sucesso.',
            'data' => $turma->load('curso.unidadesCurriculares')->loadCount('alunos'),
        ], 201);
    }

    /**
     * Exibe os detalhes de uma turma e seus alunos enturmados.
     */
    public function show(Turma $turma): JsonResponse
    {
        $turma->load([
            'curso.unidadesCurriculares',
            'alunos' => function ($q) {
                $q->orderBy('nome', 'asc');
            },
        ])->loadCount('alunos');

        return response()->json([
            'data' => $turma,
        ]);
    }

    /**
     * Atualiza os dados de uma turma.
     */
    public function update(TurmaRequest $request, Turma $turma): JsonResponse
    {
        $turma->update($request->validated());

        return response()->json([
            'message' => 'Turma atualizada com sucesso.',
            'data' => $turma->load('curso.unidadesCurriculares')->loadCount('alunos'),
        ]);
    }

    /**
     * Remove uma turma (desvincula alunos previamente para preservar seus cadastros).
     */
    public function destroy(Turma $turma): JsonResponse
    {
        // Desvincula alunos sem apagá-los do sistema
        $turma->alunos()->update(['turma_id' => null]);

        $turma->delete();

        return response()->json([
            'message' => 'Turma removida com sucesso.',
        ]);
    }

    /**
     * Vincula (enturma) uma lista de alunos à turma especificada.
     */
    public function enturmar(Request $request, Turma $turma): JsonResponse
    {
        $request->validate([
            'aluno_ids' => ['required', 'array'],
            'aluno_ids.*' => ['exists:alunos,id'],
        ], [
            'aluno_ids.required' => 'Selecione ao menos um aluno para enturmar.',
            'aluno_ids.array' => 'A lista de alunos deve ser um array.',
        ]);

        Aluno::whereIn('id', $request->input('aluno_ids'))
            ->update(['turma_id' => $turma->id]);

        return response()->json([
            'message' => 'Alunos enturmados com sucesso.',
            'data' => $turma->load('curso', 'alunos')->loadCount('alunos'),
        ]);
    }

    /**
     * Desvincula (desenturma) um aluno da turma.
     */
    public function desenturmar(Request $request, Turma $turma): JsonResponse
    {
        $request->validate([
            'aluno_id' => ['required', 'exists:alunos,id'],
        ]);

        Aluno::where('id', $request->input('aluno_id'))
            ->where('turma_id', $turma->id)
            ->update(['turma_id' => null]);

        return response()->json([
            'message' => 'Aluno desvinculado da turma com sucesso.',
            'data' => $turma->load('curso', 'alunos')->loadCount('alunos'),
        ]);
    }
}
