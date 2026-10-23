<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ocorrencia;
use App\Models\Turma;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RelatorioController extends Controller
{
    /**
     * Retorna a listagem analítica e detalhada de ocorrências para relatórios pedagógicos,
     * incluindo totais consolidados e suporte a paginação corporativa ou listagem integral.
     */
    public function ocorrencias(Request $request): JsonResponse
    {
        $user = $request->user();
        $turmaIds = [];
        $userId = $user?->id;

        if ($user && $user->hasRole('instrutor')) {
            $instrutor = $user->instrutor;
            $turmaIds = $instrutor ? $instrutor->turmas()->pluck('turmas.id')->toArray() : [];
        }

        $query = Ocorrencia::query()->with([
            'aluno.turma.curso',
            'unidades.unidadeCurricular',
            'registradoPorUser:id,name,email',
        ]);

        // Escopo do Docente
        if ($user && $user->hasRole('instrutor')) {
            $query->where(function ($q) use ($turmaIds, $userId) {
                $q->whereHas('aluno', function ($aq) use ($turmaIds) {
                    $aq->whereIn('turma_id', $turmaIds);
                })->orWhere('registrado_por', $userId);
            });
        }

        // Filtro de Busca
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
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
        if ($request->filled('turma_id')) {
            $turmaId = $request->input('turma_id');
            // Se instrutor tentar acessar turma fora do seu escopo, restringe
            if ($user && $user->hasRole('instrutor') && ! in_array($turmaId, $turmaIds)) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereHas('aluno', function ($aq) use ($turmaId) {
                    $aq->where('turma_id', $turmaId);
                });
            }
        }

        // Filtro por Curso
        if ($request->filled('curso_id')) {
            $cursoId = $request->input('curso_id');
            $query->whereHas('aluno.turma', function ($tq) use ($cursoId) {
                $tq->where('curso_id', $cursoId);
            });
        }

        // Filtros de Tipo e Status
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'enviado_equipe_escolar' || $status === 'enviado_aqv') {
                $query->whereIn('ocorrencias.status', ['enviado_equipe_escolar', 'enviado_aqv']);
            } else {
                $query->where('ocorrencias.status', $status);
            }
        }

        // Filtro por Intervalo de Datas
        if ($request->filled('data_inicio')) {
            $query->whereDate('data_ocorrencia', '>=', $request->input('data_inicio'));
        }

        if ($request->filled('data_fim')) {
            $query->whereDate('data_ocorrencia', '<=', $request->input('data_fim'));
        }

        // Filtro por Alunos Reincidentes (alunos com 2 ou mais ocorrências)
        if ($request->boolean('reincidentes')) {
            $alunoIdsReincidentes = Ocorrencia::query()
                ->select('aluno_id')
                ->groupBy('aluno_id')
                ->havingRaw('count(*) > 1')
                ->pluck('aluno_id');

            $query->whereIn('aluno_id', $alunoIdsReincidentes);
        }

        // Cálculo de totais consolidados para o relatório em query agregadora única
        $resumoRaw = (clone $query)->reorder()->selectRaw('
            COUNT(ocorrencias.id) as total_ocorrencias,
            COUNT(CASE WHEN ocorrencias.tipo = "falta" THEN 1 END) as total_faltas,
            COUNT(CASE WHEN ocorrencias.tipo = "comportamento" THEN 1 END) as total_comportamento,
            COUNT(CASE WHEN ocorrencias.tipo = "desempenho" THEN 1 END) as total_desempenho,
            COUNT(CASE WHEN ocorrencias.status IN ("enviado_equipe_escolar", "enviado_aqv") THEN 1 END) as total_equipe_escolar,
            COUNT(CASE WHEN ocorrencias.status IN ("assinado", "impresso") THEN 1 END) as total_resolvidas,
            COUNT(DISTINCT ocorrencias.aluno_id) as alunos_unicos
        ')->first();

        $resumo = [
            'total_ocorrencias' => (int) ($resumoRaw?->total_ocorrencias ?? 0),
            'total_faltas' => (int) ($resumoRaw?->total_faltas ?? 0),
            'total_comportamento' => (int) ($resumoRaw?->total_comportamento ?? 0),
            'total_desempenho' => (int) ($resumoRaw?->total_desempenho ?? 0),
            'total_equipe_escolar' => (int) ($resumoRaw?->total_equipe_escolar ?? 0),
            'total_aqv' => (int) ($resumoRaw?->total_equipe_escolar ?? 0),
            'total_resolvidas' => (int) ($resumoRaw?->total_resolvidas ?? 0),
            'alunos_unicos' => (int) ($resumoRaw?->alunos_unicos ?? 0),
        ];

        $query->orderBy('data_ocorrencia', 'desc')->orderBy('id', 'desc');

        if ($request->boolean('all')) {
            $itens = $query->get();
            return response()->json([
                'data' => $itens,
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => $itens->count(),
                    'total' => $itens->count(),
                    'from' => $itens->count() > 0 ? 1 : 0,
                    'to' => $itens->count(),
                    'all' => true,
                    'resumo' => $resumo,
                ],
            ]);
        }

        $perPage = (int) $request->input('per_page', 10);
        if (! in_array($perPage, [5, 10, 20, 30, 40, 50, 100])) {
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
                'resumo' => $resumo,
            ],
        ]);
    }

    /**
     * Retorna o resumo consolidado por turma no período indicado.
     */
    public function resumoTurmas(Request $request): JsonResponse
    {
        $user = $request->user();
        $turmaIds = [];

        if ($user && $user->hasRole('instrutor')) {
            $instrutor = $user->instrutor;
            $turmaIds = $instrutor ? $instrutor->turmas()->pluck('turmas.id')->toArray() : [];
        }

        $dataInicio = $request->input('data_inicio');
        $dataFim = $request->input('data_fim');

        $turmasQuery = Turma::query()->with('curso');
        if ($user && $user->hasRole('instrutor')) {
            $turmasQuery->whereIn('id', $turmaIds);
        }

        // Pré-agrega todas as métricas das turmas em uma única query com JOIN e GROUP BY
        $statsQuery = Ocorrencia::query()
            ->join('alunos', 'ocorrencias.aluno_id', '=', 'alunos.id')
            ->whereNotNull('alunos.turma_id');

        if ($user && $user->hasRole('instrutor')) {
            $statsQuery->whereIn('alunos.turma_id', $turmaIds);
        }

        if ($dataInicio) {
            $statsQuery->whereDate('ocorrencias.data_ocorrencia', '>=', $dataInicio);
        }
        if ($dataFim) {
            $statsQuery->whereDate('ocorrencias.data_ocorrencia', '<=', $dataFim);
        }

        $statsPorTurma = $statsQuery
            ->groupBy('alunos.turma_id')
            ->selectRaw('
                alunos.turma_id,
                COUNT(ocorrencias.id) as total_ocorrencias,
                COUNT(CASE WHEN ocorrencias.tipo = "falta" THEN 1 END) as total_faltas,
                COUNT(CASE WHEN ocorrencias.tipo = "comportamento" THEN 1 END) as total_comportamento,
                COUNT(CASE WHEN ocorrencias.tipo = "desempenho" THEN 1 END) as total_desempenho,
                COUNT(DISTINCT ocorrencias.aluno_id) as alunos_notificados
            ')
            ->get()
            ->keyBy('turma_id');

        $turmas = $turmasQuery->withCount(['alunos'])->get()->map(function ($turma) use ($statsPorTurma) {
            $stat = $statsPorTurma->get($turma->id);

            $total = (int) ($stat?->total_ocorrencias ?? 0);
            $faltas = (int) ($stat?->total_faltas ?? 0);
            $comportamento = (int) ($stat?->total_comportamento ?? 0);
            $desempenho = (int) ($stat?->total_desempenho ?? 0);
            $alunosNotificados = (int) ($stat?->alunos_notificados ?? 0);

            $taxaIncidencia = $turma->alunos_count > 0
                ? round(($alunosNotificados / $turma->alunos_count) * 100, 1)
                : 0;

            return [
                'id' => $turma->id,
                'nome' => $turma->nome,
                'turno' => $turma->turno,
                'ano_letivo' => $turma->ano_letivo,
                'semestre_atual' => $turma->semestre_atual,
                'curso' => $turma->curso ? $turma->curso->nome : 'N/A',
                'alunos_count' => $turma->alunos_count,
                'total_ocorrencias' => $total,
                'total_faltas' => $faltas,
                'total_comportamento' => $comportamento,
                'total_desempenho' => $desempenho,
                'alunos_notificados' => $alunosNotificados,
                'taxa_incidencia' => $taxaIncidencia,
            ];
        });

        return response()->json([
            'data' => $turmas,
        ]);
    }
}
