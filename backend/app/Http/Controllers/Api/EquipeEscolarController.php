<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EquipeEscolarAtendimentoRequest;
use App\Models\EquipeEscolarRecebimento;
use App\Models\Ocorrencia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Services\AuditService;

class EquipeEscolarController extends Controller
{
    /**
     * Lista todos os encaminhamentos para a Equipe Escolar com paginação e filtros corporativos.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ocorrencia::query()
            ->where('status', '!=', 'pendente')
            ->where(function ($q) {
                $q->where('status', 'enviado_aqv')
                    ->orWhere('status', 'enviado_equipe_escolar')
                    ->orWhereHas('aqvRecebimento');
            })
            ->with([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'aqvRecebimento.recebidoPor',
            ]);

        // Busca por estudante, Matrícula/RA ou número da FIAP
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('numero_sequencial', 'like', "%{$search}%")
                    ->orWhereHas('aluno', function ($aq) use ($search) {
                        $aq->where('nome', 'like', "%{$search}%")
                            ->orWhere('matricula', 'like', "%{$search}%")
                            ->orWhere('cpf', 'like', "%{$search}%");
                    });
            });
        }

        // Filtro por Turma
        if ($turmaId = $request->input('turma_id')) {
            $query->whereHas('aluno', function ($aq) use ($turmaId) {
                $aq->where('turma_id', $turmaId);
            });
        }

        // Filtro por Tipo de FIAP
        if ($tipo = $request->input('tipo')) {
            if ($tipo !== 'todos') {
                $query->where('tipo', $tipo);
            }
        }

        // Filtro por Status do Atendimento
        if ($status = $request->input('status')) {
            if ($status === 'pendente') {
                $query->where(function ($q) {
                    $q->whereHas('aqvRecebimento', function ($aq) {
                        $aq->where('status_atendimento', 'pendente')
                            ->orWhereNull('status_atendimento');
                    })->orWhere(function ($sq) {
                        $sq->whereIn('status', ['enviado_aqv', 'enviado_equipe_escolar'])
                            ->whereDoesntHave('aqvRecebimento');
                    });
                });
            } elseif ($status === 'em_atendimento') {
                $query->whereHas('aqvRecebimento', function ($aq) {
                    $aq->where('status_atendimento', 'em_atendimento');
                });
            } elseif ($status === 'concluido') {
                $query->where(function ($q) {
                    $q->where('status', 'assinado')
                        ->orWhereHas('aqvRecebimento', function ($aq) {
                            $aq->where('status_atendimento', 'concluido');
                        });
                });
            }
        }

        // Filtro por Período de Encaminhamento
        if ($dataInicio = $request->input('data_inicio')) {
            $query->whereDate('data_ocorrencia', '>=', $dataInicio);
        }
        if ($dataFim = $request->input('data_fim')) {
            $query->whereDate('data_ocorrencia', '<=', $dataFim);
        }

        $perPage = min((int) ($request->input('per_page', 10)), 100);
        $paginator = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'items' => $paginator->items(),
            'total' => $paginator->total(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
        ]);
    }

    /**
     * Retorna os 4 KPIs consolidados da fila de acolhimento da Equipe Escolar.
     */
    public function stats(): JsonResponse
    {
        $baseQuery = Ocorrencia::query()
            ->where('status', '!=', 'pendente')
            ->where(function ($q) {
                $q->whereIn('status', ['enviado_aqv', 'enviado_equipe_escolar', 'assinado'])
                    ->orWhereHas('aqvRecebimento');
            });

        $totalEncaminhados = (clone $baseQuery)->count();

        // Concluídos & Assinados
        $concluidos = (clone $baseQuery)
            ->where(function ($q) {
                $q->where('status', 'assinado')
                    ->orWhere(function ($sq) {
                        $sq->where('status', '!=', 'pendente')
                            ->whereHas('aqvRecebimento', function ($aq) {
                                $aq->where('status_atendimento', 'concluido');
                            });
                    });
            })
            ->count();

        // Em Acolhimento
        $emAtendimento = (clone $baseQuery)
            ->where('status', '!=', 'assinado')
            ->where('status', '!=', 'pendente')
            ->whereHas('aqvRecebimento', function ($aq) {
                $aq->where('status_atendimento', 'em_atendimento')
                    ->whereNull('confirmado_em');
            })
            ->count();

        // Aguardando Atendimento
        $aguardandoAtendimento = max(0, $totalEncaminhados - $emAtendimento - $concluidos);

        return response()->json([
            'total_encaminhados' => $totalEncaminhados,
            'aguardando_atendimento' => $aguardandoAtendimento,
            'em_atendimento' => $emAtendimento,
            'concluidos' => $concluidos,
        ]);
    }

    /**
     * Registra o atendimento pedagógico da Equipe Escolar e atualiza o acolhimento do estudante.
     */
    public function salvarAtendimento(EquipeEscolarAtendimentoRequest $request, Ocorrencia $ocorrencia): JsonResponse
    {
        $validated = $request->validated();
        $user = Auth::user();

        $confirmarAssinatura = ! empty($validated['confirmar_assinatura']);
        $statusAtendimento = $confirmarAssinatura ? 'concluido' : 'em_atendimento';
        $dataAtendimento = ! empty($validated['data_atendimento'])
            ? Carbon::parse($validated['data_atendimento'])
            : now();

        DB::transaction(function () use ($ocorrencia, $validated, $user, $confirmarAssinatura, $statusAtendimento, $dataAtendimento) {
            $dadosEquipe = [
                'recebido_por' => $user->id,
                'justificativa_aluno' => $validated['justificativa_aluno'],
                'parecer_aqv' => $validated['parecer_aqv'] ?? ($validated['parecer_equipe_escolar'] ?? null),
                'data_atendimento' => $dataAtendimento,
                'status_atendimento' => $statusAtendimento,
            ];

            if (isset($validated['compensacao_faltas_autorizada'])) {
                $dadosEquipe['compensacao_faltas_autorizada'] = $validated['compensacao_faltas_autorizada'];
                $dadosEquipe['motivo_excepcionalidade'] = $validated['motivo_excepcionalidade'] ?? null;
                $dadosEquipe['autorizado_por'] = $user->id;
                $dadosEquipe['autorizado_em'] = now();
            }

            if ($confirmarAssinatura) {
                $dadosEquipe['confirmado_em'] = now();
                $ocorrencia->update(['status' => 'assinado']);
            }

            EquipeEscolarRecebimento::updateOrCreate(
                ['ocorrencia_id' => $ocorrencia->id],
                $dadosEquipe
            );
        });

        AuditService::registrar(
            'atendimento_equipe_escolar',
            'Ocorrencia',
            $ocorrencia->id,
            "Registro de acolhimento pedagógico da ocorrência {$ocorrencia->numero_sequencial} pela Equipe Escolar" . ($confirmarAssinatura ? ' com confirmação de assinatura' : ''),
            null,
            [
                'status_atendimento' => $statusAtendimento,
                'data_atendimento' => $dataAtendimento->toDateTimeString(),
                'confirmar_assinatura' => $confirmarAssinatura,
                'compensacao_faltas_autorizada' => $validated['compensacao_faltas_autorizada'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Atendimento e acolhimento pedagógico registrados com sucesso.',
            'data' => $ocorrencia->fresh([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'aqvRecebimento.recebidoPor',
            ]),
        ]);
    }

    /**
     * Confirmação de colhimento da assinatura física da FIAP.
     * Exige que a justificativa do estudante e o parecer da Equipe Escolar estejam cadastrados.
     */
    public function confirmarAssinatura(Request $request, Ocorrencia $ocorrencia): JsonResponse
    {
        $user = Auth::user();

        $recebimento = $ocorrencia->aqvRecebimento()->first();
        $justificativa = trim($recebimento?->justificativa_aluno ?? '');
        $parecer = trim($recebimento?->parecer_aqv ?? '');

        if (! $recebimento || empty($justificativa) || empty($parecer)) {
            return response()->json([
                'message' => 'Para finalizar a FIAP, é obrigatório registrar previamente a Justificativa do Estudante e o Parecer da Equipe Escolar no acolhimento.',
            ], 422);
        }

        DB::transaction(function () use ($ocorrencia, $user, $recebimento) {
            $ocorrencia->update(['status' => 'assinado']);

            $recebimento->confirmado_em = now();
            $recebimento->status_atendimento = 'concluido';
            if (! $recebimento->recebido_por) {
                $recebimento->recebido_por = $user->id;
            }
            $recebimento->save();
        });

        AuditService::registrar(
            'assinatura_fiap',
            'Ocorrencia',
            $ocorrencia->id,
            "Confirmação de assinatura física da ocorrência {$ocorrencia->numero_sequencial}",
            null,
            ['status' => 'assinado', 'confirmado_em' => now()->toDateTimeString()]
        );

        return response()->json([
            'message' => "Assinatura da ocorrência {$ocorrencia->numero_sequencial} confirmada com sucesso.",
            'data' => $ocorrencia->fresh([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'aqvRecebimento.recebidoPor',
            ]),
        ]);
    }
}
