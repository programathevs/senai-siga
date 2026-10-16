<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PlanoRecuperacaoRequest;
use App\Models\Ocorrencia;
use App\Models\PlanoFrequencia;
use App\Models\PlanoRecuperacao;
use App\Services\AuditService;
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
        $user = $request->user();

        $withRelations = [
            'ocorrencia.unidades.unidadeCurricular',
            'aluno.turma.curso',
            'unidades',
            'unidadeCurricular',
            'registradoPor:id,name,email',
            'frequencias',
        ];

        // Gestores visualizam inclusive Planos excluídos (Soft Delete) na listagem, igual às ocorrências
        $query = $user && $user->hasRole('gestor')
            ? PlanoRecuperacao::withTrashed()->with($withRelations)
            : PlanoRecuperacao::with($withRelations);

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
                if ($user && $user->hasRole('gestor')) {
                    $query->onlyTrashed();
                } else {
                    return response()->json(['data' => []]);
                }
            } else {
                $query->where('status_processo', $status)->whereNull('deleted_at');
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

        // Guarda defensiva: garante que a ocorrência vinculada não está na lixeira
        $ocorrencia = Ocorrencia::find($data['ocorrencia_id']);
        if (! $ocorrencia) {
            return response()->json([
                'message' => 'Não é possível criar um plano de recuperação para uma FIAP excluída. Restaure-a antes de elaborar o plano.',
            ], 422);
        }

        return DB::transaction(function () use ($data, $user, $ocorrencia) {
            $data['registrado_por'] = $user->id;
            $frequencias = $data['frequencias'] ?? [];
            unset($data['frequencias']);

            // Múltiplas Unidades Curriculares
            $unidadeIds = [];
            if (!empty($data['unidade_curricular_ids']) && is_array($data['unidade_curricular_ids'])) {
                $unidadeIds = array_values(array_unique(array_filter(array_map('intval', $data['unidade_curricular_ids']))));
            } elseif (!empty($data['unidades']) && is_array($data['unidades'])) {
                foreach ($data['unidades'] as $u) {
                    if (is_array($u) && !empty($u['unidade_curricular_id'])) {
                        $unidadeIds[] = (int) $u['unidade_curricular_id'];
                    } elseif (is_numeric($u)) {
                        $unidadeIds[] = (int) $u;
                    }
                }
                $unidadeIds = array_values(array_unique(array_filter($unidadeIds)));
            } elseif (!empty($data['unidade_curricular_id'])) {
                $unidadeIds = [(int) $data['unidade_curricular_id']];
            } elseif ($ocorrencia) {
                // Herda as unidades da ocorrência caso não fornecidas explicitamente
                if ($ocorrencia->tipo === 'falta') {
                    $unidadesFalta = $ocorrencia->unidades
                        ->filter(function ($u) {
                            if ($u->limite_faltas_aulas > 0) {
                                return $u->quantidade_faltas > $u->limite_faltas_aulas;
                            }
                            return $u->percentual_atingido > 100.0;
                        })
                        ->pluck('unidade_curricular_id')
                        ->toArray();
                    $unidadeIds = !empty($unidadesFalta) ? $unidadesFalta : $ocorrencia->unidades->pluck('unidade_curricular_id')->toArray();
                } else {
                    $unidadeIds = $ocorrencia->unidades()->pluck('unidade_curricular_id')->toArray();
                }
            }

            unset($data['unidade_curricular_ids'], $data['unidades']);

            // Retrocompatibilidade para coluna escalar existente
            if (!empty($unidadeIds)) {
                $data['unidade_curricular_id'] = $unidadeIds[0];
            }

            $plano = PlanoRecuperacao::create($data);

            if (!empty($unidadeIds)) {
                $plano->unidades()->sync($unidadeIds);
            }

            if (!empty($frequencias)) {
                foreach ($frequencias as $freq) {
                    $plano->frequencias()->create($freq);
                }
            }

            AuditService::registrar(
                'criacao_plano',
                'PlanoRecuperacao',
                $plano->id,
                "Criação de plano {$plano->tipo_programa} para o aluno {$plano->aluno?->nome}",
                null,
                $plano->toArray()
            );

            return response()->json([
                'message' => 'Plano de Recuperação registrado com sucesso.',
                'data' => $plano->load([
                    'ocorrencia.unidades.unidadeCurricular',
                    'aluno.turma.curso',
                    'unidades',
                    'unidadeCurricular',
                    'registradoPor',
                    'frequencias',
                ]),
            ], 201);
        });
    }

    /**
     * Exibe os detalhes de um Plano de Recuperação.
     */
    public function show(PlanoRecuperacao $plano): JsonResponse
    {
        return response()->json([
            'data' => $plano->load([
                'ocorrencia.unidades.unidadeCurricular',
                'aluno.turma.curso',
                'unidades',
                'unidadeCurricular',
                'registradoPor',
                'frequencias',
            ]),
        ]);
    }

    /**
     * Atualiza os dados de um Plano de Recuperação.
     */
    public function update(PlanoRecuperacaoRequest $request, PlanoRecuperacao $plano): JsonResponse
    {
        $data = $request->validated();
        $dadosAntigos = $plano->toArray();

        return DB::transaction(function () use ($data, $plano, $dadosAntigos) {
            $frequencias = $data['frequencias'] ?? null;
            unset($data['frequencias']);

            // Múltiplas Unidades Curriculares se informadas
            $unidadeIds = null;
            if (isset($data['unidade_curricular_ids']) && is_array($data['unidade_curricular_ids'])) {
                $unidadeIds = array_values(array_unique(array_filter(array_map('intval', $data['unidade_curricular_ids']))));
            } elseif (isset($data['unidades']) && is_array($data['unidades'])) {
                $unidadeIds = [];
                foreach ($data['unidades'] as $u) {
                    if (is_array($u) && !empty($u['unidade_curricular_id'])) {
                        $unidadeIds[] = (int) $u['unidade_curricular_id'];
                    } elseif (is_numeric($u)) {
                        $unidadeIds[] = (int) $u;
                    }
                }
                $unidadeIds = array_values(array_unique(array_filter($unidadeIds)));
            } elseif (isset($data['unidade_curricular_id'])) {
                $unidadeIds = $data['unidade_curricular_id'] ? [(int) $data['unidade_curricular_id']] : [];
            }

            unset($data['unidade_curricular_ids'], $data['unidades']);

            if ($unidadeIds !== null) {
                $plano->unidades()->sync($unidadeIds);
                $data['unidade_curricular_id'] = !empty($unidadeIds) ? $unidadeIds[0] : null;
            }

            $plano->update($data);

            if (is_array($frequencias)) {
                // Atualização completa de frequências
                $plano->frequencias()->delete();
                foreach ($frequencias as $freq) {
                    $plano->frequencias()->create($freq);
                }
            }

            AuditService::registrar(
                'atualizacao_plano',
                'PlanoRecuperacao',
                $plano->id,
                "Atualização de plano de recuperação #{$plano->id} ({$plano->tipo_programa}) - Status: {$plano->status_processo}",
                $dadosAntigos,
                $plano->toArray()
            );

            return response()->json([
                'message' => 'Plano de Recuperação atualizado com sucesso.',
                'data' => $plano->fresh([
                    'ocorrencia.unidades.unidadeCurricular',
                    'aluno.turma.curso',
                    'unidades',
                    'unidadeCurricular',
                    'registradoPor',
                    'frequencias',
                ]),
            ]);
        });
    }

    /**
     * Remove um Plano de Recuperação (Soft Delete).
     */
    public function destroy(Request $request, PlanoRecuperacao $plano): JsonResponse
    {
        $user = $request->user();

        if ($plano->status_processo === 'concluido' && (! $user || ! $user->hasRole('gestor'))) {
            return response()->json([
                'message' => 'Planos de Recuperação concluídos só podem ser excluídos pela equipe de gestão.',
            ], 403);
        }

        if ($user && ! $user->hasRole('gestor') && $plano->registrado_por !== $user->id) {
            return response()->json([
                'message' => 'Você só pode excluir Planos de Recuperação que foram registrados por você.',
            ], 403);
        }

        $plano->delete();

        AuditService::registrar(
            'exclusao_plano',
            'PlanoRecuperacao',
            $plano->id,
            "Exclusão do plano de recuperação #{$plano->id} ({$plano->tipo_programa})"
        );

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

        if ($plano->ocorrencia_id) {
            Ocorrencia::onlyTrashed()->where('id', $plano->ocorrencia_id)->restore();
        }

        AuditService::registrar(
            'restauracao_plano',
            'PlanoRecuperacao',
            $plano->id,
            "Restauração do plano de recuperação #{$plano->id} ({$plano->tipo_programa})"
        );

        return response()->json([
            'message' => 'Plano de Recuperação restaurado com sucesso.',
            'data' => $plano->load([
                'ocorrencia.unidades.unidadeCurricular',
                'aluno.turma.curso',
                'unidades',
                'unidadeCurricular',
                'registradoPor',
                'frequencias',
            ]),
        ]);
    }
}
