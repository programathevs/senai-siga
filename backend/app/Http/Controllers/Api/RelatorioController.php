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
            $query->where('status', $request->input('status'));
        }

        // Filtro por Intervalo de Datas
        if ($request->filled('data_inicio')) {
            $query->whereDate('data_ocorrencia', '>=', $request->input('data_inicio'));
        }

        if ($request->filled('data_fim')) {
            $query->whereDate('data_ocorrencia', '<=', $request->input('data_fim'));
        }

        // Cálculo de totais consolidados para o relatório
        $resumoQuery = clone $query;
        $totalOcorrencias = (clone $resumoQuery)->count();
        $totalFaltas = (clone $resumoQuery)->where('tipo', 'falta')->count();
        $totalComportamento = (clone $resumoQuery)->where('tipo', 'comportamento')->count();
        $totalDesempenho = (clone $resumoQuery)->where('tipo', 'desempenho')->count();
        $totalAqv = (clone $resumoQuery)->where('status', 'enviado_aqv')->count();
        $totalResolvidas = (clone $resumoQuery)->whereIn('status', ['assinado', 'impresso'])->count();

        $alunosUnicos = (clone $resumoQuery)
            ->select('aluno_id')
            ->distinct()
            ->get()
            ->count();

        $resumo = [
            'total_ocorrencias' => $totalOcorrencias,
            'total_faltas' => $totalFaltas,
            'total_comportamento' => $totalComportamento,
            'total_desempenho' => $totalDesempenho,
            'total_aqv' => $totalAqv,
            'total_resolvidas' => $totalResolvidas,
            'alunos_unicos' => $alunosUnicos,
        ];

        $query->orderBy('data_ocorrencia', 'desc')->orderBy('id', 'desc');

        if ($request->boolean('all')) {
            $itens = $query->get();
            return response()->json([
                'data' => $itens,
                'meta' => [
                    'total' => $itens->count(),
                    'all' => true,
                    'resumo' => $resumo,
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

        $turmas = $turmasQuery->withCount(['alunos'])->get()->map(function ($turma) use ($dataInicio, $dataFim) {
            $ocQuery = Ocorrencia::query()->whereHas('aluno', function ($q) use ($turma) {
                $q->where('turma_id', $turma->id);
            });

            if ($dataInicio) {
                $ocQuery->whereDate('data_ocorrencia', '>=', $dataInicio);
            }
            if ($dataFim) {
                $ocQuery->whereDate('data_ocorrencia', '<=', $dataFim);
            }

            $total = (clone $ocQuery)->count();
            $faltas = (clone $ocQuery)->where('tipo', 'falta')->count();
            $comportamento = (clone $ocQuery)->where('tipo', 'comportamento')->count();
            $desempenho = (clone $ocQuery)->where('tipo', 'desempenho')->count();
            $alunosNotificados = (clone $ocQuery)->select('aluno_id')->distinct()->get()->count();

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
