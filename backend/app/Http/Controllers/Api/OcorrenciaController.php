<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OcorrenciaRequest;
use App\Models\AqvRecebimento;
use App\Models\Ocorrencia;
use App\Models\OcorrenciaEdicao;
use App\Models\OcorrenciaUnidade;
use App\Models\UnidadeCurricular;
use App\Models\User;
use App\Notifications\OcorrenciaEncaminhadaAqvNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OcorrenciaController extends Controller
{
    /**
     * Lista todas as ocorrências / FIAPs com filtros combinados e estatísticas de topo.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Gestores visualizam inclusive FIAPs excluídas (Soft Delete)
        $query = $user && $user->hasRole('gestor')
            ? Ocorrencia::withTrashed()->with([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'instrutores.user',
                'edicoes.editadoPor',
            ])
            : Ocorrencia::with([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'instrutores.user',
                'edicoes.editadoPor',
            ]);

        // Filtro por busca textual (número sequencial, nome do aluno, matrícula ou CPF)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('numero_sequencial', 'like', "%{$search}%")
                  ->orWhereHas('aluno', function ($aq) use ($search) {
                      $aq->where('nome', 'like', "%{$search}%")
                         ->orWhere('matricula', 'like', "%{$search}%")
                         ->orWhere('cpf', 'like', "%{$search}%");
                  });
            });
        }

        // Filtro por Tipo de FIAP (falta, comportamento, desempenho)
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }

        // Filtro por Status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filtro por Aluno específico
        if ($request->filled('aluno_id')) {
            $query->where('aluno_id', $request->input('aluno_id'));
        }

        // Filtro por Turma
        if ($request->filled('turma_id')) {
            $turmaId = $request->input('turma_id');
            $query->whereHas('aluno', function ($aq) use ($turmaId) {
                $aq->where('turma_id', $turmaId);
            });
        }

        // Filtro por Curso
        if ($request->filled('curso_id')) {
            $cursoId = $request->input('curso_id');
            $query->whereHas('aluno.turma', function ($tq) use ($cursoId) {
                $tq->where('curso_id', $cursoId);
            });
        }

        // Filtro por período
        if ($request->filled('data_inicio')) {
            $query->whereDate('data_ocorrencia', '>=', $request->input('data_inicio'));
        }

        if ($request->filled('data_fim')) {
            $query->whereDate('data_ocorrencia', '<=', $request->input('data_fim'));
        }

        // Escopo de visibilidade: Instrutor visualiza apenas alunos das turmas que leciona ou ocorrências registradas por ele
        $turmaIds = [];
        $userId = $user?->id;
        if ($user && $user->hasRole('instrutor')) {
            $instrutor = $user->instrutor;
            $turmaIds = $instrutor ? $instrutor->turmas()->pluck('turmas.id')->toArray() : [];

            $query->where(function ($q) use ($turmaIds, $userId) {
                $q->whereHas('aluno', function ($aq) use ($turmaIds) {
                    $aq->whereIn('turma_id', $turmaIds);
                })->orWhere('registrado_por', $userId);
            });
        }

        // Estatísticas rápidas de KPIs para o cabeçalho
        $now = Carbon::now();
        $statsBaseQuery = Ocorrencia::query();
        if ($user && $user->hasRole('instrutor')) {
            $statsBaseQuery->where(function ($q) use ($turmaIds, $userId) {
                $q->whereHas('aluno', function ($aq) use ($turmaIds) {
                    $aq->whereIn('turma_id', $turmaIds);
                })->orWhere('registrado_por', $userId);
            });
        }

        $stats = [
            'total_mes' => (clone $statsBaseQuery)->whereMonth('data_ocorrencia', $now->month)
                ->whereYear('data_ocorrencia', $now->year)
                ->count(),
            'total_falta' => (clone $statsBaseQuery)->where('tipo', 'falta')->count(),
            'total_comportamento' => (clone $statsBaseQuery)->where('tipo', 'comportamento')->count(),
            'total_desempenho' => (clone $statsBaseQuery)->where('tipo', 'desempenho')->count(),
            'total_aqv' => (clone $statsBaseQuery)->where('status', 'enviado_aqv')->count(),
            'total_pendente' => (clone $statsBaseQuery)->where('status', 'pendente')->count(),
        ];

        $query->orderBy('data_ocorrencia', 'desc')
            ->orderBy('id', 'desc');

        if ($request->boolean('all')) {
            $ocorrencias = $query->get();
            return response()->json([
                'data' => $ocorrencias,
                'meta' => [
                    'total' => $ocorrencias->count(),
                    'all' => true,
                    'estatisticas' => $stats,
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
                'estatisticas' => $stats,
            ],
        ]);
    }

    /**
     * Registra uma nova ocorrência / FIAP com cálculo de faltas e geração sequencial.
     */
    public function store(OcorrenciaRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $ocorrencia = DB::transaction(function () use ($validated, $request) {
            $numeroSequencial = Ocorrencia::gerarProximoNumeroSequencial();

            $ocorrencia = Ocorrencia::create([
                'aluno_id' => $validated['aluno_id'],
                'registrado_por' => Auth::id(),
                'numero_sequencial' => $numeroSequencial,
                'versao' => 1,
                'tipo' => $validated['tipo'],
                'relato_dificuldades' => $validated['relato_dificuldades'] ?? null,
                'recomendacoes_professor' => $validated['recomendacoes_professor'] ?? null,
                'recomendacoes_gestao' => $validated['recomendacoes_gestao'] ?? null,
                'providencias_gestao' => $validated['providencias_gestao'] ?? null,
                'outras_observacoes' => $validated['outras_observacoes'] ?? null,
                'data_ocorrencia' => $validated['data_ocorrencia'],
                'status' => $validated['status'] ?? 'pendente',
            ]);

            // Processa as unidades curriculares da ocorrência (suporte a N UCs)
            $this->processarUnidades($ocorrencia, $validated);

            // Vincula os instrutores notificantes selecionados
            $instrutorIds = $validated['instrutor_ids'] ?? [];

            // Se o usuário logado for instrutor e não estiver na lista, adiciona automaticamente
            $user = Auth::user();
            if ($user && $user->instrutor && ! in_array($user->instrutor->id, $instrutorIds)) {
                $instrutorIds[] = $user->instrutor->id;
            }

            if (! empty($instrutorIds)) {
                $ocorrencia->instrutores()->sync(array_unique($instrutorIds));
            }

            return $ocorrencia->fresh();
        });

        return response()->json([
            'message' => "Ocorrência {$ocorrencia->numero_sequencial} registrada com sucesso.",
            'data' => $ocorrencia->load([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'instrutores.user',
            ]),
        ], 201);
    }

    /**
     * Exibe a ficha completa de uma ocorrência / FIAP.
     */
    public function show(Ocorrencia $ocorrencia): JsonResponse
    {
        return response()->json([
            'data' => $ocorrencia->load([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'instrutores.user',
                'edicoes.editadoPor',
                'aqvRecebimento.recebidoPor',
                'planosRecuperacao',
            ]),
        ]);
    }

    /**
     * Atualiza os dados de uma ocorrência com versionamento no histórico de auditoria.
     */
    public function update(OcorrenciaRequest $request, Ocorrencia $ocorrencia): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->hasRole('instrutor') && $ocorrencia->registrado_por !== $user->id) {
            return response()->json([
                'message' => 'Você só pode editar ocorrências que foram registradas por você.',
            ], 403);
        }

        $validated = $request->validated();

        $ocorrencia = DB::transaction(function () use ($validated, $ocorrencia) {
            $novaVersao = $ocorrencia->versao + 1;

            // Registra a alteração na tabela de auditoria de edições
            OcorrenciaEdicao::create([
                'ocorrencia_id' => $ocorrencia->id,
                'editado_por' => Auth::id(),
                'versao_anterior' => $ocorrencia->versao,
                'versao_nova' => $novaVersao,
                'motivo' => $validated['motivo_edicao'] ?? 'Atualização dos dados da ocorrência.',
            ]);

            $eraAssinado = $ocorrencia->status === 'assinado';

            $ocorrencia->update([
                'aluno_id' => $validated['aluno_id'],
                'versao' => $novaVersao,
                'tipo' => $validated['tipo'],
                'relato_dificuldades' => $validated['relato_dificuldades'] ?? null,
                'recomendacoes_professor' => $validated['recomendacoes_professor'] ?? null,
                'recomendacoes_gestao' => $validated['recomendacoes_gestao'] ?? null,
                'providencias_gestao' => $validated['providencias_gestao'] ?? null,
                'outras_observacoes' => $validated['outras_observacoes'] ?? null,
                'data_ocorrencia' => $validated['data_ocorrencia'],
                'status' => $eraAssinado ? 'pendente' : ($validated['status'] ?? $ocorrencia->status),
            ]);

            // Se era assinada, invalida a assinatura física anterior e reabre atendimento no AQV
            if ($eraAssinado && $ocorrencia->aqvRecebimento) {
                $ocorrencia->aqvRecebimento->update([
                    'status_atendimento' => 'pendente',
                    'confirmado_em' => null,
                ]);
            }

            // Processa as unidades curriculares da ocorrência (suporte a N UCs)
            $this->processarUnidades($ocorrencia, $validated);

            // Atualiza instrutores notificantes
            if (isset($validated['instrutor_ids'])) {
                $ocorrencia->instrutores()->sync($validated['instrutor_ids']);
            }

            return $ocorrencia->fresh();
        });

        return response()->json([
            'message' => 'Ocorrência atualizada com sucesso.',
            'data' => $ocorrencia->load([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'instrutores.user',
                'edicoes.editadoPor',
            ]),
        ]);
    }

    /**
     * Sincroniza e calcula os dados das Unidades Curriculares da ocorrência.
     */
    private function processarUnidades(Ocorrencia $ocorrencia, array $validated): void
    {
        $unidadesData = [];

        if (! empty($validated['unidades']) && is_array($validated['unidades'])) {
            $unidadesData = $validated['unidades'];
        } elseif (! empty($validated['unidade_curricular_id'])) {
            $unidadesData = [
                [
                    'unidade_curricular_id' => $validated['unidade_curricular_id'],
                    'quantidade_faltas' => (int) ($validated['quantidade_faltas'] ?? 0),
                    'total_aulas_dadas' => $validated['total_aulas_dadas'] ?? null,
                    'limite_percentual' => $validated['limite_percentual'] ?? 25.00,
                ],
            ];
        }

        if (empty($unidadesData)) {
            return;
        }

        // Limpa unidades antigas se estiver atualizando
        OcorrenciaUnidade::where('ocorrencia_id', $ocorrencia->id)->delete();

        $relatoPartes = [];

        foreach ($unidadesData as $item) {
            $ucId = $item['unidade_curricular_id'];
            $uc = UnidadeCurricular::find($ucId);
            $cargaHoraria = $uc ? (int) $uc->carga_horaria : 80;
            $totalAulas = (int) round($cargaHoraria / 0.75);
            $limitePercentual = (float) ($item['limite_percentual'] ?? 25.00);
            $limiteFaltasAulas = (int) round(($totalAulas * $limitePercentual) / 100);

            $qtdFaltas = (int) ($item['quantidade_faltas'] ?? 0);
            $percentualAtingido = $limiteFaltasAulas > 0
                ? round(($qtdFaltas / $limiteFaltasAulas) * 100, 1)
                : 0;

            OcorrenciaUnidade::create([
                'ocorrencia_id' => $ocorrencia->id,
                'unidade_curricular_id' => $ucId,
                'total_aulas_dadas' => $item['total_aulas_dadas'] ?? $qtdFaltas,
                'quantidade_faltas' => $qtdFaltas,
                'limite_percentual' => $limitePercentual,
                'limite_faltas_aulas' => $limiteFaltasAulas,
                'percentual_atingido' => $percentualAtingido,
            ]);

            if ($uc) {
                $siglaOuNome = $uc->sigla ? $uc->sigla : $uc->nome;
                $relatoPartes[] = "unidade curricular {$siglaOuNome} – {$cargaHoraria} h/a: possui até a data de hoje {$qtdFaltas} faltas, representando " . number_format($percentualAtingido, 1, '.', '') . "% do limite permitido ({$limiteFaltasAulas} aulas)";
            }
        }

        // Se for do tipo 'falta' e relato_dificuldades não tiver sido fornecido manualmente, constrói o relato padrão
        if ($ocorrencia->tipo === 'falta' && ! empty($relatoPartes) && empty($validated['relato_dificuldades'])) {
            $textoUnidades = '';
            $total = count($relatoPartes);
            if ($total === 1) {
                $textoUnidades = $relatoPartes[0];
            } else {
                $ultimaparte = array_pop($relatoPartes);
                $textoUnidades = implode('; ', $relatoPartes) . ' e ' . $ultimaparte;
            }

            $relatoGerado = "O aluno(a) está ciente que as ausências às aulas causam prejuízos para seu aproveitamento e o mesmo apresenta excesso de faltas nas: {$textoUnidades}.";

            $ocorrencia->update([
                'relato_dificuldades' => $relatoGerado,
            ]);
        }
    }

    /**
     * Remove o registro da ocorrência do sistema (Soft Delete).
     */
    public function destroy(Request $request, Ocorrencia $ocorrencia): JsonResponse
    {
        $user = $request->user();

        if ($user && ! $user->hasRole('gestor') && $ocorrencia->registrado_por !== $user->id) {
            return response()->json([
                'message' => 'Você só pode excluir ocorrências que foram registradas por você.',
            ], 403);
        }

        $ocorrencia->delete();

        return response()->json([
            'message' => 'Ocorrência removida com sucesso.',
        ]);
    }

    /**
     * Restaura uma ocorrência / FIAP excluída (Soft Delete).
     */
    public function restaurar(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (! $user->hasRole('gestor')) {
            return response()->json([
                'message' => 'Apenas a gestão pode restaurar ocorrências excluídas.',
            ], 403);
        }

        $ocorrencia = Ocorrencia::withTrashed()->findOrFail($id);
        $ocorrencia->restore();

        return response()->json([
            'message' => "Ocorrência {$ocorrencia->numero_sequencial} restaurada com sucesso.",
            'data' => $ocorrencia->load([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'instrutores.user',
            ]),
        ]);
    }

    /**
     * Encaminha formalmente a ocorrência para a equipe de Apoio e Qualidade de Vida (AQV).
     */
    public function encaminharAqv(Request $request, Ocorrencia $ocorrencia): JsonResponse
    {
        $user = $request->user();

        // Apenas GESTOR ou o PRÓPRIO criador da FIAP podem encaminhá-la para a AQV
        if (! $user->hasRole('gestor') && $ocorrencia->registrado_por !== $user->id) {
            return response()->json([
                'message' => 'Apenas a gestão ou o próprio instrutor que criou a FIAP podem encaminhá-la para a AQV.',
            ], 403);
        }

        if ($ocorrencia->has_plano_pendente) {
            return response()->json([
                'message' => 'Não é possível encaminhar para a AQV pois esta FIAP possui um Plano de Recuperação pendente.',
            ], 422);
        }

        $ocorrencia->update([
            'status' => 'enviado_aqv',
        ]);

        AqvRecebimento::updateOrCreate(
            ['ocorrencia_id' => $ocorrencia->id],
            [
                'enviado_em' => now(),
                'status_atendimento' => 'pendente',
            ]
        );

        // Notifica por e-mail os usuários da equipe AQV
        try {
            $aqvUsers = User::where('role', 'aqv')->get();
            foreach ($aqvUsers as $aqvUser) {
                $aqvUser->notify(new OcorrenciaEncaminhadaAqvNotification($ocorrencia));
            }
        } catch (\Throwable $e) {
            Log::error('Erro ao notificar equipe AQV: ' . $e->getMessage());
        }

        return response()->json([
            'message' => "Ocorrência {$ocorrencia->numero_sequencial} encaminhada para a equipe AQV com sucesso.",
            'data' => $ocorrencia->load(['aluno.turma.curso', 'aqvRecebimento']),
        ]);
    }
}
