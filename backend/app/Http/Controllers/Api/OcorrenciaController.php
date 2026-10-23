<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OcorrenciaRequest;
use App\Models\EquipeEscolarRecebimento;
use App\Models\Ocorrencia;
use App\Models\OcorrenciaEdicao;
use App\Models\OcorrenciaUnidade;
use App\Models\PlanoRecuperacao;
use App\Models\UnidadeCurricular;
use App\Models\User;
use App\Notifications\OcorrenciaEncaminhadaEquipeEscolarNotification;
use App\Services\AuditService;
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
                'planosRecuperacao',
                'aqvRecebimento',
            ])
            : Ocorrencia::with([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'instrutores.user',
                'edicoes.editadoPor',
                'planosRecuperacao',
                'aqvRecebimento',
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
            $status = $request->input('status');
            if (in_array($status, ['enviado_aqv', 'enviado_equipe_escolar'])) {
                $query->whereIn('status', ['enviado_aqv', 'enviado_equipe_escolar']);
            } else {
                $query->where('status', $status);
            }
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

        $startOfMonth = $now->copy()->startOfMonth()->format('Y-m-d');
        $endOfMonth = $now->copy()->endOfMonth()->format('Y-m-d');

        $statsRaw = (clone $statsBaseQuery)
            ->selectRaw('
                COUNT(CASE WHEN data_ocorrencia BETWEEN ? AND ? THEN 1 END) as total_mes,
                COUNT(CASE WHEN tipo = "falta" THEN 1 END) as total_falta,
                COUNT(CASE WHEN tipo = "comportamento" THEN 1 END) as total_comportamento,
                COUNT(CASE WHEN tipo = "desempenho" THEN 1 END) as total_desempenho,
                COUNT(CASE WHEN status IN ("enviado_aqv", "enviado_equipe_escolar") THEN 1 END) as total_aqv,
                COUNT(CASE WHEN status = "pendente" THEN 1 END) as total_pendente
            ', [$startOfMonth, $endOfMonth])
            ->first();

        $stats = [
            'total_mes' => (int) ($statsRaw?->total_mes ?? 0),
            'total_falta' => (int) ($statsRaw?->total_falta ?? 0),
            'total_comportamento' => (int) ($statsRaw?->total_comportamento ?? 0),
            'total_desempenho' => (int) ($statsRaw?->total_desempenho ?? 0),
            'total_aqv' => (int) ($statsRaw?->total_aqv ?? 0),
            'total_pendente' => (int) ($statsRaw?->total_pendente ?? 0),
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

        AuditService::registrar(
            'criacao_fiap',
            'Ocorrencia',
            $ocorrencia->id,
            "Criação da ocorrência {$ocorrencia->numero_sequencial} (Tipo: {$ocorrencia->tipo})",
            null,
            $ocorrencia->toArray()
        );

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
        if ($user && $user->hasRole('aqv')) {
            return response()->json([
                'message' => 'O perfil AQV não possui permissão para editar os dados da FIAP.',
            ], 403);
        }

        if ($user && $user->hasRole('instrutor') && $ocorrencia->registrado_por !== $user->id) {
            return response()->json([
                'message' => 'Você só pode editar ocorrências que foram registradas por você.',
            ], 403);
        }

        if (in_array($ocorrencia->status, ['aguardando_assinatura', 'assinado'])) {
            return response()->json([
                'message' => 'Ocorrências que já estão aguardando assinatura ou foram assinadas não podem mais ser editadas.',
            ], 403);
        }

        $validated = $request->validated();

        // Se nenhum dado relevante tiver sido alterado, bloqueia a criação de versão fantasma
        if (! $this->ocorrenciaPossuiAlteracoes($ocorrencia, $validated)) {
            return response()->json([
                'message' => 'Nenhuma alteração foi realizada na ocorrência.',
                'sem_alteracoes' => true,
                'data' => $ocorrencia->load([
                    'aluno.turma.curso',
                    'registradoPor',
                    'unidades.unidadeCurricular',
                    'instrutores.user',
                    'edicoes.editadoPor',
                    'planosRecuperacao',
                ]),
            ]);
        }

        $dadosAntigos = $ocorrencia->toArray();
        $planoArquivado = false;

        $ocorrencia = DB::transaction(function () use ($validated, $ocorrencia, &$planoArquivado) {
            $novaVersao = $ocorrencia->versao + 1;

            // Registra a alteração na tabela de auditoria de edições
            OcorrenciaEdicao::create([
                'ocorrencia_id' => $ocorrencia->id,
                'editado_por' => Auth::id(),
                'versao_anterior' => $ocorrencia->versao,
                'versao_nova' => $novaVersao,
                'motivo' => $validated['motivo_edicao'] ?? 'Atualização dos dados da ocorrência.',
            ]);

            // Atualiza os dados da ocorrência mantendo a integridade do fluxo
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
            ]);

            // Processa as unidades curriculares da ocorrência (suporte a N UCs)
            $resUnidades = $this->processarUnidades($ocorrencia, $validated);
            $planoArquivado = $resUnidades['plano_arquivado'] ?? false;

            // Atualiza instrutores notificantes
            if (isset($validated['instrutor_ids'])) {
                $ocorrencia->instrutores()->sync($validated['instrutor_ids']);
            }

            return $ocorrencia->fresh();
        });

        AuditService::registrar(
            'edicao_fiap',
            'Ocorrencia',
            $ocorrencia->id,
            "Edição da ocorrência {$ocorrencia->numero_sequencial} (Versão {$ocorrencia->versao}) - Motivo: " . ($validated['motivo_edicao'] ?? 'Atualização dos dados.'),
            $dadosAntigos,
            $ocorrencia->toArray()
        );

        $msg = $planoArquivado
            ? 'Ocorrência atualizada com sucesso. O Plano de Recuperação vinculado foi movido para a lixeira pois as faltas estão dentro do limite permitido.'
            : 'Ocorrência atualizada com sucesso.';

        return response()->json([
            'message' => $msg,
            'plano_arquivado' => $planoArquivado,
            'data' => $ocorrencia->load([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'instrutores.user',
                'edicoes.editadoPor',
                'planosRecuperacao',
            ]),
        ]);
    }

    /**
     * Sincroniza e calcula os dados das Unidades Curriculares da ocorrência.
     */
    private function processarUnidades(Ocorrencia $ocorrencia, array $validated): array
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
            OcorrenciaUnidade::where('ocorrencia_id', $ocorrencia->id)->delete();
            return ['plano_arquivado' => false];
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

        // Gerenciamento automático do ciclo de vida dos Planos de Recuperação (Soft Delete / Restore)
        if ($ocorrencia->tipo === 'falta') {
            $ocorrencia->refresh();
            $excedeLimite = $ocorrencia->unidades->contains(function ($unidade) {
                if ($unidade->limite_faltas_aulas > 0) {
                    return $unidade->quantidade_faltas > $unidade->limite_faltas_aulas;
                }
                return $unidade->percentual_atingido > 100.0;
            });

            $planoArquivado = false;
            if (!$excedeLimite) {
                // Faltas dentro do limite (<= 100%): se existirem planos ativos vinculados, colocar em soft delete
                $planosAtivos = PlanoRecuperacao::where('ocorrencia_id', $ocorrencia->id)->get();
                if ($planosAtivos->isNotEmpty()) {
                    PlanoRecuperacao::where('ocorrencia_id', $ocorrencia->id)->delete();
                    $planoArquivado = true;
                }
            } else {
                // Faltas excedem o limite (> 100%): se existirem planos adormecidos (trashed) vinculados, restaurar
                $planosAdormecidos = PlanoRecuperacao::onlyTrashed()->where('ocorrencia_id', $ocorrencia->id)->get();
                foreach ($planosAdormecidos as $planoAdormecido) {
                    $planoAdormecido->restore();
                }
            }

            return ['plano_arquivado' => $planoArquivado];
        }

        return ['plano_arquivado' => false];
    }

    /**
     * Compara se os novos dados da ocorrência diferem do estado atual persistido.
     */
    private function ocorrenciaPossuiAlteracoes(Ocorrencia $ocorrencia, array $validated): bool
    {
        if ((int) $ocorrencia->aluno_id !== (int) $validated['aluno_id']) {
            return true;
        }

        if ($ocorrencia->tipo !== $validated['tipo']) {
            return true;
        }

        $dataAntiga = $ocorrencia->data_ocorrencia ? Carbon::parse($ocorrencia->data_ocorrencia)->format('Y-m-d') : null;
        $dataNova = Carbon::parse($validated['data_ocorrencia'])->format('Y-m-d');
        if ($dataAntiga !== $dataNova) {
            return true;
        }

        $camposTexto = [
            'relato_dificuldades',
            'recomendacoes_professor',
            'recomendacoes_gestao',
            'providencias_gestao',
            'outras_observacoes',
        ];

        foreach ($camposTexto as $campo) {
            $antigo = trim((string) ($ocorrencia->{$campo} ?? ''));
            $novo = trim((string) ($validated[$campo] ?? ''));
            if ($antigo !== $novo) {
                return true;
            }
        }

        // Unidades curriculares e faltas
        $unidadesValidadas = [];
        if (! empty($validated['unidades']) && is_array($validated['unidades'])) {
            $unidadesValidadas = $validated['unidades'];
        } elseif (! empty($validated['unidade_curricular_id'])) {
            $unidadesValidadas = [
                [
                    'unidade_curricular_id' => $validated['unidade_curricular_id'],
                    'quantidade_faltas' => (int) ($validated['quantidade_faltas'] ?? 0),
                ],
            ];
        }

        $unidadesAtuais = $ocorrencia->unidades()->orderBy('id')->get();
        if ($unidadesAtuais->count() !== count($unidadesValidadas)) {
            return true;
        }

        foreach ($unidadesValidadas as $idx => $item) {
            $atual = $unidadesAtuais->get($idx);
            if (! $atual) {
                return true;
            }
            if ((int) $atual->unidade_curricular_id !== (int) $item['unidade_curricular_id']) {
                return true;
            }
            if ((int) $atual->quantidade_faltas !== (int) ($item['quantidade_faltas'] ?? 0)) {
                return true;
            }
        }

        // Instrutores notificantes
        if (isset($validated['instrutor_ids'])) {
            $instrutoresAtuais = $ocorrencia->instrutores()->pluck('instrutores.id')->sort()->values()->toArray();
            $instrutoresNovos = collect($validated['instrutor_ids'])->map(fn($id) => (int) $id)->sort()->values()->toArray();
            if ($instrutoresAtuais !== $instrutoresNovos) {
                return true;
            }
        }

        return false;
    }

    /**
     * Remove o registro da ocorrência do sistema (Soft Delete).
     */
    public function destroy(Request $request, Ocorrencia $ocorrencia): JsonResponse
    {
        $user = $request->user();

        if ($ocorrencia->status === 'assinado' && (! $user || ! $user->hasRole('gestor'))) {
            return response()->json([
                'message' => 'Ocorrências com status Assinado só podem ser excluídas pela equipe de gestão.',
            ], 403);
        }

        if ($user && ! $user->hasRole('gestor') && $ocorrencia->registrado_por !== $user->id) {
            return response()->json([
                'message' => 'Você só pode excluir ocorrências que foram registradas por você.',
            ], 403);
        }

        $dadosExcluidos = $ocorrencia->toArray();
        $ocorrencia->delete();

        AuditService::registrar(
            'exclusao_fiap',
            'Ocorrencia',
            $ocorrencia->id,
            "Exclusão da ocorrência {$ocorrencia->numero_sequencial}",
            $dadosExcluidos,
            null
        );

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

        AuditService::registrar(
            'restauracao_fiap',
            'Ocorrencia',
            $ocorrencia->id,
            "Restauração da ocorrência {$ocorrencia->numero_sequencial}",
            null,
            $ocorrencia->toArray()
        );

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
     * Encaminha formalmente a ocorrência para a Equipe Escolar.
     */
    public function encaminharEquipeEscolar(Request $request, Ocorrencia $ocorrencia): JsonResponse
    {
        $user = $request->user();

        // Apenas GESTOR ou o PRÓPRIO criador da FIAP podem encaminhá-la para a Equipe Escolar
        if (! $user->hasRole('gestor') && $ocorrencia->registrado_por !== $user->id) {
            return response()->json([
                'message' => 'Apenas a gestão ou o próprio instrutor que criou a FIAP podem encaminhá-la para a Equipe Escolar.',
            ], 403);
        }

        // Apenas FIAPs de desempenho/aproveitamento exigem a elaboração prévia de um Plano antes do encaminhamento
        if (in_array($ocorrencia->tipo, ['desempenho', 'aproveitamento']) && $ocorrencia->has_plano_pendente) {
            return response()->json([
                'message' => 'Não é possível encaminhar para a Equipe Escolar pois esta FIAP de desempenho necessita da elaboração prévia de um Plano de Recuperação.',
            ], 422);
        }

        $ocorrencia->update([
            'status' => 'enviado_equipe_escolar',
        ]);

        EquipeEscolarRecebimento::updateOrCreate(
            ['ocorrencia_id' => $ocorrencia->id],
            [
                'enviado_em' => now(),
                'status_atendimento' => 'pendente',
            ]
        );

        // Notifica por e-mail os usuários da Equipe Escolar
        try {
            $equipeUsers = User::whereIn('role', ['equipe_escolar', 'aqv'])->get();
            foreach ($equipeUsers as $equipeUser) {
                $equipeUser->notify(new OcorrenciaEncaminhadaEquipeEscolarNotification($ocorrencia));
            }
        } catch (\Throwable $e) {
            Log::error('Erro ao notificar Equipe Escolar: ' . $e->getMessage());
        }

        AuditService::registrar(
            'encaminhamento_equipe_escolar',
            'Ocorrencia',
            $ocorrencia->id,
            "Encaminhamento da ocorrência {$ocorrencia->numero_sequencial} para a Equipe Escolar"
        );

        return response()->json([
            'message' => "Ocorrência {$ocorrencia->numero_sequencial} encaminhada para a Equipe Escolar com sucesso.",
            'data' => $ocorrencia->load(['aluno.turma.curso', 'aqvRecebimento']),
        ]);
    }

    /**
     * Alias para compatibilidade com rotas legadas.
     */
    public function encaminharAqv(Request $request, Ocorrencia $ocorrencia): JsonResponse
    {
        return $this->encaminharEquipeEscolar($request, $ocorrencia);
    }
}
