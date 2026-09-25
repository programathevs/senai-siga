<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CursoRequest;
use App\Models\Curso;
use App\Models\UnidadeCurricular;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CursoController extends Controller
{
    /**
     * Lista todos os cursos com suas Unidades Curriculares e busca opcional.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Curso::with('unidadesCurriculares');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('nome', 'like', "%{$search}%");
        }

        $cursos = $query->orderBy('nome', 'asc')->get();

        return response()->json([
            'data' => $cursos,
        ]);
    }

    /**
     * Cadastra um novo curso e suas Unidades Curriculares (opcional).
     */
    public function store(CursoRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $curso = DB::transaction(function () use ($validated) {
            $curso = Curso::create([
                'nome' => $validated['nome'],
                'carga_horaria_total' => $validated['carga_horaria_total'] ?? null,
            ]);

            if (! empty($validated['unidades_curriculares'])) {
                foreach ($validated['unidades_curriculares'] as $uc) {
                    $curso->unidadesCurriculares()->create([
                        'nome' => $uc['nome'],
                        'carga_horaria' => $uc['carga_horaria'] ?? 75,
                        'semestre_plano_3' => $uc['semestre_plano_3'] ?? null,
                        'semestre_plano_4' => $uc['semestre_plano_4'] ?? null,
                    ]);
                }
            }

            return $curso->load('unidadesCurriculares');
        });

        return response()->json([
            'message' => 'Curso cadastrado com sucesso.',
            'data' => $curso,
        ], 201);
    }

    /**
     * Exibe um curso específico com suas Unidades Curriculares.
     */
    public function show(Curso $curso): JsonResponse
    {
        return response()->json([
            'data' => $curso->load('unidadesCurriculares'),
        ]);
    }

    /**
     * Atualiza os dados de um curso existente e sincroniza suas UCs.
     */
    public function update(CursoRequest $request, Curso $curso): JsonResponse
    {
        $validated = $request->validated();

        $curso = DB::transaction(function () use ($curso, $validated) {
            $curso->update([
                'nome' => $validated['nome'],
                'carga_horaria_total' => $validated['carga_horaria_total'] ?? null,
            ]);

            if (isset($validated['unidades_curriculares'])) {
                // IDs enviadas no payload
                $keptIds = collect($validated['unidades_curriculares'])
                    ->pluck('id')
                    ->filter()
                    ->toArray();

                // Deleta UCs que não estão mais na lista enviada
                $curso->unidadesCurriculares()
                    ->whereNotIn('id', $keptIds)
                    ->delete();

                // Atualiza existentes ou cria novas UCs
                foreach ($validated['unidades_curriculares'] as $ucData) {
                    if (! empty($ucData['id'])) {
                        UnidadeCurricular::where('id', $ucData['id'])
                            ->where('curso_id', $curso->id)
                            ->update([
                                'nome' => $ucData['nome'],
                                'carga_horaria' => $ucData['carga_horaria'] ?? 75,
                                'semestre_plano_3' => $ucData['semestre_plano_3'] ?? null,
                                'semestre_plano_4' => $ucData['semestre_plano_4'] ?? null,
                            ]);
                    } else {
                        $curso->unidadesCurriculares()->create([
                            'nome' => $ucData['nome'],
                            'carga_horaria' => $ucData['carga_horaria'] ?? 75,
                            'semestre_plano_3' => $ucData['semestre_plano_3'] ?? null,
                            'semestre_plano_4' => $ucData['semestre_plano_4'] ?? null,
                        ]);
                    }
                }
            }

            return $curso->load('unidadesCurriculares');
        });

        return response()->json([
            'message' => 'Curso atualizado com sucesso.',
            'data' => $curso,
        ]);
    }

    /**
     * Remove um curso do banco de dados (cascade apaga UCs associadas).
     */
    public function destroy(Curso $curso): JsonResponse
    {
        $curso->delete();

        return response()->json([
            'message' => 'Curso removido com sucesso.',
        ]);
    }
}
