<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ocorrencia;
use App\Models\Turma;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Retorna estatísticas consolidadas, KPIs, distribuição e ocorrências recentes
     * de acordo com o escopo de visibilidade do usuário (Instrutor, Admin ou AQV).
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $turmaIds = [];
        $userId = $user?->id;

        // Escopo do Docente / Instrutor
        if ($user && $user->hasRole('instrutor')) {
            $instrutor = $user->instrutor;
            $turmaIds = $instrutor ? $instrutor->turmas()->pluck('turmas.id')->toArray() : [];
        }

        // Query base para ocorrências
        $baseQuery = Ocorrencia::query();
        if ($user && $user->hasRole('instrutor')) {
            $baseQuery->where(function ($q) use ($turmaIds, $userId) {
                $q->whereHas('aluno', function ($aq) use ($turmaIds) {
                    $aq->whereIn('turma_id', $turmaIds);
                })->orWhere('registrado_por', $userId);
            });
        }

        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        // 1. KPIs
        $totalMes = (clone $baseQuery)->whereBetween('data_ocorrencia', [$startOfMonth, $endOfMonth])->count();
        $totalMesAnterior = (clone $baseQuery)->whereBetween('data_ocorrencia', [$startOfLastMonth, $endOfLastMonth])->count();
        $diferencaMes = $totalMes - $totalMesAnterior;

        $pendentes = (clone $baseQuery)->where('status', 'pendente')->count();
        $encaminhadasAqv = (clone $baseQuery)->where('status', 'enviado_aqv')->count();
        $resolvidas = (clone $baseQuery)->whereIn('status', ['assinado', 'impresso'])->count();

        // Alunos em situação de alerta (reincidentes ou com faltas severas)
        $alunosEmAlerta = (clone $baseQuery)
            ->select('aluno_id')
            ->groupBy('aluno_id')
            ->havingRaw('count(*) > 1')
            ->get()
            ->count();

        // 2. Distribuição por tipo de ocorrência
        $distribuicaoTipo = [
            'falta' => (clone $baseQuery)->where('tipo', 'falta')->count(),
            'comportamento' => (clone $baseQuery)->where('tipo', 'comportamento')->count(),
            'desempenho' => (clone $baseQuery)->where('tipo', 'desempenho')->count(),
        ];

        // 3. Distribuição por status
        $distribuicaoStatus = [
            'pendente' => $pendentes,
            'enviado_aqv' => $encaminhadasAqv,
            'pdf_gerado' => (clone $baseQuery)->where('status', 'pdf_gerado')->count(),
            'impresso' => (clone $baseQuery)->where('status', 'impresso')->count(),
            'assinado' => (clone $baseQuery)->where('status', 'assinado')->count(),
        ];

        // 4. Ocorrências recentes
        $ocorrenciasRecentes = (clone $baseQuery)
            ->with([
                'aluno.turma.curso',
                'unidades.unidadeCurricular',
                'registradoPorUser:id,name,email',
            ])
            ->orderBy('data_ocorrencia', 'desc')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get();

        // 5. Resumo das Turmas
        $turmasQuery = Turma::query()->with('curso');
        if ($user && $user->hasRole('instrutor')) {
            $turmasQuery->whereIn('id', $turmaIds);
        }
        $turmasResumo = $turmasQuery
            ->withCount(['alunos'])
            ->get()
            ->map(function ($turma) use ($baseQuery) {
                $ocorrenciasCount = (clone $baseQuery)->whereHas('aluno', function ($q) use ($turma) {
                    $q->where('turma_id', $turma->id);
                })->count();

                return [
                    'id' => $turma->id,
                    'nome' => $turma->nome,
                    'turno' => $turma->turno,
                    'ano_letivo' => $turma->ano_letivo,
                    'semestre_atual' => $turma->semestre_atual,
                    'curso' => $turma->curso ? [
                        'id' => $turma->curso->id,
                        'nome' => $turma->curso->nome,
                    ] : null,
                    'alunos_count' => $turma->alunos_count,
                    'ocorrencias_count' => $ocorrenciasCount,
                ];
            });

        return response()->json([
            'data' => [
                'periodo' => [
                    'mes_atual' => $now->format('m/Y'),
                    'mes_nome' => $now->locale('pt_BR')->translatedFormat('F/Y'),
                ],
                'kpis' => [
                    'total_mes' => $totalMes,
                    'total_mes_anterior' => $totalMesAnterior,
                    'diferenca_mes' => $diferencaMes,
                    'pendentes' => $pendentes,
                    'encaminhadas_aqv' => $encaminhadasAqv,
                    'resolvidas' => $resolvidas,
                    'alunos_em_alerta' => $alunosEmAlerta,
                ],
                'distribuicao_tipo' => $distribuicaoTipo,
                'distribuicao_status' => $distribuicaoStatus,
                'ocorrencias_recentes' => $ocorrenciasRecentes,
                'turmas_resumo' => $turmasResumo,
            ],
        ]);
    }
}
