<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AqvAtendimentoRequest;
use App\Models\AqvRecebimento;
use App\Models\Ocorrencia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AqvController extends Controller
{
    /**
     * Lista todos os encaminhamentos para a equipe AQV com paginação e filtros corporativos.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ocorrencia::query()
            ->where(function ($q) {
                $q->where('status', 'enviado_aqv')
                    ->orWhereHas('aqvRecebimento');
            })
            ->with([
                'aluno.turma.curso',
                'registradoPor',
                'unidades.unidadeCurricular',
                'aqvRecebimento.recebidoPor',
            ]);

        // Busca por estudante, RA ou número da FIAP
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('numero_sequencial', 'like', "%{$search}%")
                    ->orWhereHas('aluno', function ($aq) use ($search) {
                        $aq->where('nome', 'like', "%{$search}%")
                            ->orWhere('ra', 'like', "%{$search}%");
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

        // Filtro por Status do Atendimento AQV
        if ($status = $request->input('status')) {
            if ($status === 'pendente') {
                $query->whereHas('aqvRecebimento', function ($aq) {
                    $aq->where('status_atendimento', 'pendente')
                        ->orWhereNull('status_atendimento');
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
     * Retorna os 4 KPIs consolidados da fila de acolhimento AQV.
     */
    public function stats(): JsonResponse
    {
        $baseQuery = Ocorrencia::query()
            ->where(function ($q) {
                $q->where('status', 'enviado_aqv')
                    ->orWhere('status', 'assinado')
                    ->orWhereHas('aqvRecebimento');
            });

        $totalEncaminhados = (clone $baseQuery)->count();

        // Concluídos & Assinados: Ocorrência que está assinada ou atendimento concluído (desde que não esteja pendente/reaberta)
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

        // Aguardando Atendimento: Todas as demais na fila que não estão concluídas nem em acolhimento
        $aguardandoAtendimento = max(0, $totalEncaminhados - $emAtendimento - $concluidos);

        return response()->json([
            'total_encaminhados' => $totalEncaminhados,
            'aguardando_atendimento' => $aguardandoAtendimento,
            'em_atendimento' => $emAtendimento,
            'concluidos' => $concluidos,
        ]);
    }

    /**
     * Registra o atendimento pedagógico da AQV e atualiza o acolhimento do estudante.
     */
    public function salvarAtendimento(AqvAtendimentoRequest $request, Ocorrencia $ocorrencia): JsonResponse
    {
        $validated = $request->validated();
        $user = Auth::user();

        $confirmarAssinatura = ! empty($validated['confirmar_assinatura']);
        $statusAtendimento = $confirmarAssinatura ? 'concluido' : 'em_atendimento';
        $dataAtendimento = ! empty($validated['data_atendimento'])
            ? Carbon::parse($validated['data_atendimento'])
            : now();

        DB::transaction(function () use ($ocorrencia, $validated, $user, $confirmarAssinatura, $statusAtendimento, $dataAtendimento) {
            $dadosAqv = [
                'recebido_por' => $user->id,
                'justificativa_aluno' => $validated['justificativa_aluno'],
                'parecer_aqv' => $validated['parecer_aqv'] ?? null,
                'data_atendimento' => $dataAtendimento,
                'status_atendimento' => $statusAtendimento,
            ];

            if ($confirmarAssinatura) {
                $dadosAqv['confirmado_em'] = now();
                $ocorrencia->update(['status' => 'assinado']);
            }

            AqvRecebimento::updateOrCreate(
                ['ocorrencia_id' => $ocorrencia->id],
                $dadosAqv
            );
        });

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
     * Confirmação rápida de colhimento da assinatura física da FIAP.
     */
    public function confirmarAssinatura(Request $request, Ocorrencia $ocorrencia): JsonResponse
    {
        $user = Auth::user();

        DB::transaction(function () use ($ocorrencia, $user) {
            $ocorrencia->update(['status' => 'assinado']);

            $aqvRecebimento = AqvRecebimento::firstOrNew(['ocorrencia_id' => $ocorrencia->id]);
            $aqvRecebimento->confirmado_em = now();
            $aqvRecebimento->status_atendimento = 'concluido';
            if (! $aqvRecebimento->recebido_por) {
                $aqvRecebimento->recebido_por = $user->id;
            }
            $aqvRecebimento->save();
        });

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
