<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditoriaLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditoriaController extends Controller
{
    /**
     * Lista eventos de auditoria com paginação corporativa e filtros avançados.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditoriaLog::with('user:id,name,email,role');

        // Filtro por Ação
        if ($acao = $request->input('acao')) {
            if ($acao !== 'todas') {
                $query->where('acao', $acao);
            }
        }

        // Filtro por Entidade
        if ($entidade = $request->input('entidade')) {
            if ($entidade !== 'todas') {
                $query->where('entidade', $entidade);
            }
        }

        // Busca por descrição, nome de usuário ou e-mail
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('descricao', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Filtro por Período
        if ($dataInicio = $request->input('data_inicio')) {
            $query->whereDate('created_at', '>=', $dataInicio);
        }
        if ($dataFim = $request->input('data_fim')) {
            $query->whereDate('created_at', '<=', $dataFim);
        }

        $perPage = min((int) ($request->input('per_page', 15)), 100);
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
     * Retorna indicadores estatísticos consolidados dos logs de auditoria.
     */
    public function stats(): JsonResponse
    {
        $hoje = Carbon::today();

        $totalLogs = AuditoriaLog::count();
        $logsHoje = AuditoriaLog::whereDate('created_at', $hoje)->count();
        $edicoesFiap = AuditoriaLog::where('acao', 'edicao_fiap')->count();
        $atendimentosAqv = AuditoriaLog::where('acao', 'atendimento_aqv')->count();
        $assinaturasFiap = AuditoriaLog::where('acao', 'assinatura_fiap')->count();
        $planosCriados = AuditoriaLog::whereIn('acao', ['criacao_plano', 'atualizacao_plano'])->count();

        return response()->json([
            'total_logs' => $totalLogs,
            'logs_hoje' => $logsHoje,
            'edicoes_fiap' => $edicoesFiap,
            'atendimentos_aqv' => $atendimentosAqv,
            'assinaturas_fiap' => $assinaturasFiap,
            'planos_recuperacao' => $planosCriados,
        ]);
    }
}
