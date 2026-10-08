<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PlanoRecuperacaoRequest;
use App\Models\PlanoFrequencia;
use App\Models\PlanoRecuperacao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlanoRecuperacaoController extends Controller
{
    /**
     * Lista todos os planos de recuperação com suporte a filtros e busca.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PlanoRecuperacao::with([
            'ocorrencia',
            'aluno.turma.curso',
            'unidadeCurricular',
            'registradoPor:id,name,email',
            'frequencias',
        ]);

        // Filtro por termo de busca (Aluno ou Número da FIAP)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('aluno', function ($qa) use ($search) {
                    $qa->where('nome', 'like', "%{$search}%")
                       ->orWhere('matricula', 'like', "%{$search}%");
                })->orWhereHas('ocorrencia', function ($qo) use ($search) {
                    $qo->where('numero_sequencial', 'like', "%{$search}%");
                });
            });
        }

        // Filtro por Tipo de Programa
        if ($tipo = $request->input('tipo_programa')) {
            $query->where('tipo_programa', $tipo);
        }

        // Filtro por Conceito / Status
        if ($status = $request->input('status_processo') ?? $request->input('status')) {
            if ($status === 'excluidos') {
                if ($request->user() && $request->user()->hasRole('gestor')) {
                    $query->onlyTrashed();
                } else {
                    return response()->json(['data' => []]);
                }
            } else {
                $query->where('status_processo', $status);
            }
        }

        // Filtro por Aluno
        if ($alunoId = $request->input('aluno_id')) {
            $query->where('aluno_id', $alunoId);
        }

        // Filtro por Ocorrência FIAP
        if ($ocorrenciaId = $request->input('ocorrencia_id')) {
            $query->where('ocorrencia_id', $ocorrenciaId);
        }

        $planos = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $planos,
        ]);
    }

    /**
     * Cadastra um novo Plano de Recuperação.
     */
    public function store(PlanoRecuperacaoRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        return DB::transaction(function () use ($data, $user) {
            $data['registrado_por'] = $user->id;
            $frequencias = $data['frequencias'] ?? [];
            unset($data['frequencias']);

            $plano = PlanoRecuperacao::create($data);

            if (!empty($frequencias)) {
                foreach ($frequencias as $freq) {
                    $plano->frequencias()->create($freq);
                }
            }

            return response()->json([
                'message' => 'Plano de Recuperação registrado com sucesso.',
                'data' => $plano->load(['ocorrencia', 'aluno.turma.curso', 'unidadeCurricular', 'registradoPor', 'frequencias']),
            ], 201);
        });
    }

    /**
     * Exibe os detalhes de um Plano de Recuperação.
     */
    public function show(PlanoRecuperacao $plano): JsonResponse
    {
        return response()->json([
            'data' => $plano->load(['ocorrencia', 'aluno.turma.curso', 'unidadeCurricular', 'registradoPor', 'frequencias']),
        ]);
    }

    /**
     * Atualiza os dados de um Plano de Recuperação.
     */
    public function update(PlanoRecuperacaoRequest $request, PlanoRecuperacao $plano): JsonResponse
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data, $plano) {
            $frequencias = $data['frequencias'] ?? null;
            unset($data['frequencias']);

            $plano->update($data);

            if (is_array($frequencias)) {
                // Atualização completa de frequências
                $plano->frequencias()->delete();
                foreach ($frequencias as $freq) {
                    $plano->frequencias()->create($freq);
                }
            }

            return response()->json([
                'message' => 'Plano de Recuperação atualizado com sucesso.',
                'data' => $plano->fresh(['ocorrencia', 'aluno.turma.curso', 'unidadeCurricular', 'registradoPor', 'frequencias']),
            ]);
        });
    }

    /**
     * Remove um Plano de Recuperação (Soft Delete).
     */
    public function destroy(Request $request, PlanoRecuperacao $plano): JsonResponse
    {
        $user = $request->user();

        if ($user && !$user->hasRole('gestor') && $plano->registrado_por !== $user->id) {
            return response()->json([
                'message' => 'Você só pode excluir Planos de Recuperação que foram registrados por você.',
            ], 403);
        }

        $plano->delete();

        return response()->json([
            'message' => 'Plano de Recuperação removido com sucesso.',
        ]);
    }

    /**
     * Restaura um Plano de Recuperação excluído (Apenas Gestor).
     */
    public function restaurar(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if ($user && !$user->hasRole('gestor')) {
            return response()->json([
                'message' => 'Apenas a gestão pode restaurar Planos de Recuperação excluídos.',
            ], 403);
        }

        $plano = PlanoRecuperacao::withTrashed()->findOrFail($id);
        $plano->restore();

        return response()->json([
            'message' => 'Plano de Recuperação restaurado com sucesso.',
            'data' => $plano->load(['ocorrencia', 'aluno.turma.curso', 'unidadeCurricular', 'registradoPor', 'frequencias']),
        ]);
    }
}
