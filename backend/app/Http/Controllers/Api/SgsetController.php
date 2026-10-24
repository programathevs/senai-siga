<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SgsetSyncLog;
use App\Services\SgsetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SgsetController extends Controller
{
    protected SgsetService $sgsetService;

    public function __construct(SgsetService $sgsetService)
    {
        $this->sgsetService = $sgsetService;
    }

    /**
     * Retorna o status da última sincronização realizada.
     */
    public function status(): JsonResponse
    {
        $status = $this->sgsetService->obterStatusUltimaSync();

        return response()->json([
            'success' => true,
            'data' => $status,
        ]);
    }

    /**
     * Importação de Alunos a partir do SGSET direto ou de arquivo Excel.
     */
    public function importarAlunos(Request $request): JsonResponse
    {
        $request->validate([
            'origem' => 'required|in:sgset,arquivo',
            'enturmar_automaticamente' => 'sometimes|boolean',
            'arquivo' => 'required_if:origem,arquivo|file|mimes:xlsx,xls|max:20480', // até 20MB
            'escola' => 'nullable|integer',
        ]);

        $origem = $request->input('origem');
        $enturmar = $request->boolean('enturmar_automaticamente', true);
        $escola = (int)$request->input('escola', 512);

        try {
            if ($origem === 'sgset') {
                $binario = $this->sgsetService->baixarPlanilhaSgset($escola);
                $linhas = $this->sgsetService->lerPlanilhaXlsx($binario, true);
            } else {
                $arquivo = $request->file('arquivo');
                $linhas = $this->sgsetService->lerPlanilhaXlsx($arquivo->getRealPath(), false);
            }

            $resultado = $this->sgsetService->importarAlunos($linhas, $enturmar);

            SgsetSyncLog::create([
                'user_id' => $request->user()?->id,
                'tipo' => 'alunos',
                'origem' => $origem,
                'escola' => (string)$escola,
                'status' => 'sucesso',
                'detalhes' => $resultado,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Importação de alunos processada com sucesso.',
                'data' => $resultado,
            ]);
        } catch (\Throwable $e) {
            Log::error("[SgsetController@importarAlunos] Falha: " . $e->getMessage());

            SgsetSyncLog::create([
                'user_id' => $request->user()?->id,
                'tipo' => 'alunos',
                'origem' => $origem,
                'escola' => (string)$escola,
                'status' => 'erro',
                'detalhes' => ['erro' => $e->getMessage()],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao processar importação de alunos: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Importação de Turmas e Cursos a partir do SGSET direto ou de arquivo Excel.
     */
    public function importarTurmas(Request $request): JsonResponse
    {
        $request->validate([
            'origem' => 'required|in:sgset,arquivo',
            'arquivo' => 'required_if:origem,arquivo|file|mimes:xlsx,xls|max:20480',
            'escola' => 'nullable|integer',
        ]);

        $origem = $request->input('origem');
        $escola = (int)$request->input('escola', 512);

        try {
            if ($origem === 'sgset') {
                $binario = $this->sgsetService->baixarPlanilhaSgset($escola);
                $linhas = $this->sgsetService->lerPlanilhaXlsx($binario, true);
            } else {
                $arquivo = $request->file('arquivo');
                $linhas = $this->sgsetService->lerPlanilhaXlsx($arquivo->getRealPath(), false);
            }

            $resultado = $this->sgsetService->importarTurmas($linhas);

            SgsetSyncLog::create([
                'user_id' => $request->user()?->id,
                'tipo' => 'turmas',
                'origem' => $origem,
                'escola' => (string)$escola,
                'status' => 'sucesso',
                'detalhes' => $resultado,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Importação de turmas processada com sucesso.',
                'data' => $resultado,
            ]);
        } catch (\Throwable $e) {
            Log::error("[SgsetController@importarTurmas] Falha: " . $e->getMessage());

            SgsetSyncLog::create([
                'user_id' => $request->user()?->id,
                'tipo' => 'turmas',
                'origem' => $origem,
                'escola' => (string)$escola,
                'status' => 'erro',
                'detalhes' => ['erro' => $e->getMessage()],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao processar importação de turmas: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Sincronização geral de Alunos, Turmas e Cursos (chamada pelo Dashboard).
     */
    public function sincronizarGeral(Request $request): JsonResponse
    {
        $request->validate([
            'escola' => 'nullable|integer',
            'enturmar' => 'sometimes|boolean',
        ]);

        $escola = (int)$request->input('escola', 512);
        $enturmar = $request->boolean('enturmar', true);

        try {
            $resultado = $this->sgsetService->sincronizarGeral(
                $escola,
                $enturmar,
                $request->user()?->id
            );

            return response()->json([
                'success' => true,
                'message' => 'Sincronização geral com SGSET concluída com sucesso.',
                'data' => $resultado,
            ]);
        } catch (\Throwable $e) {
            Log::error("[SgsetController@sincronizarGeral] Falha: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erro durante a sincronização com o SGSET: ' . $e->getMessage(),
            ], 500);
        }
    }
}
