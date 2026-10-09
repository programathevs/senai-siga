<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Aluno;
use App\Models\AqvRecebimento;
use App\Models\Curso;
use App\Models\Ocorrencia;
use App\Models\OcorrenciaUnidade;
use App\Models\PlanoRecuperacao;
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

        // 6. Métricas Executivas para Gestão (perfil Gestor)
        $metricasGestao = null;
        if ($user && $user->hasRole('gestor')) {
            $totalAlunosAtivos = Aluno::where('status', 'ativo')->count();
            $alunosSemTurma = Aluno::where('status', 'ativo')->whereNull('turma_id')->count();
            $totalTurmasAtivas = Turma::count();
            $totalCursos = Curso::count();
            $totalPlanosAtivos = PlanoRecuperacao::where('status_processo', '!=', 'concluido')->count();

            // Taxa de resolução no mês
            $resolvidasMes = (clone $baseQuery)->whereBetween('data_ocorrencia', [$startOfMonth, $endOfMonth])
                ->whereIn('status', ['assinado', 'impresso'])
                ->count();
            $taxaResolucao = $totalMes > 0 ? round(($resolvidasMes / $totalMes) * 100, 1) : 100.0;

            // Distribuição por Cursos
            $distribuicaoCursos = Curso::get()->map(function ($curso) {
                $count = Ocorrencia::whereHas('aluno.turma', function ($q) use ($curso) {
                    $q->where('curso_id', $curso->id);
                })->count();

                return [
                    'id' => $curso->id,
                    'nome' => $curso->nome,
                    'ocorrencias_count' => $count,
                ];
            });
            $totalOcorrenciasCursos = $distribuicaoCursos->sum('ocorrencias_count');
            $distribuicaoCursos = $distribuicaoCursos->map(function ($c) use ($totalOcorrenciasCursos) {
                $c['percentual'] = $totalOcorrenciasCursos > 0
                    ? round(($c['ocorrencias_count'] / $totalOcorrenciasCursos) * 100, 1)
                    : 0;
                return $c;
            })->values();

            // Top UCs Críticas (com maior número de ocorrências / faltas registradas)
            $topUcsCriticas = OcorrenciaUnidade::query()
                ->selectRaw('unidade_curricular_id, COUNT(DISTINCT ocorrencia_id) as total_ocorrencias, SUM(quantidade_faltas) as total_faltas')
                ->groupBy('unidade_curricular_id')
                ->with('unidadeCurricular:id,nome,sigla,curso_id')
                ->orderByDesc('total_ocorrencias')
                ->limit(5)
                ->get()
                ->filter(fn($item) => $item->unidadeCurricular !== null)
                ->map(function ($item) {
                    return [
                        'id' => $item->unidade_curricular_id,
                        'nome' => $item->unidadeCurricular->nome,
                        'sigla' => $item->unidadeCurricular->sigla ?? '',
                        'total_ocorrencias' => (int) $item->total_ocorrencias,
                        'total_faltas' => (int) $item->total_faltas,
                    ];
                })
                ->values();

            // Funil AQV
            $aqvTotal = Ocorrencia::where(function ($q) {
                $q->where('status', 'enviado_aqv')
                    ->orWhere('status', 'assinado')
                    ->orWhereHas('aqvRecebimento');
            })->count();

            $aqvEmAtendimento = AqvRecebimento::where('status_atendimento', 'em_atendimento')
                ->whereNull('confirmado_em')
                ->count();

            $aqvAssinados = Ocorrencia::where('status', 'assinado')
                ->orWhereHas('aqvRecebimento', fn($q) => $q->where('status_atendimento', 'concluido'))
                ->count();

            $aqvAguardando = max(0, $aqvTotal - $aqvEmAtendimento - $aqvAssinados);

            $funilAqv = [
                'total' => $aqvTotal,
                'aguardando' => $aqvAguardando,
                'em_atendimento' => $aqvEmAtendimento,
                'concluidos' => $aqvAssinados,
            ];

            $metricasGestao = [
                'total_alunos_ativos' => $totalAlunosAtivos,
                'alunos_sem_turma' => $alunosSemTurma,
                'total_turmas_ativas' => $totalTurmasAtivas,
                'total_cursos' => $totalCursos,
                'total_planos_ativos' => $totalPlanosAtivos,
                'taxa_resolucao' => $taxaResolucao,
                'distribuicao_cursos' => $distribuicaoCursos,
                'top_ucs_criticas' => $topUcsCriticas,
                'funil_aqv' => $funilAqv,
            ];
        }

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
                'metricas_gestao' => $metricasGestao,
            ],
        ]);
    }
}
