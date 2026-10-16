<?php

namespace App\Services;

use App\Models\AuditoriaLog;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    /**
     * Registra um evento de auditoria no sistema.
     *
     * @param string $acao Identificador da ação (ex: criacao_fiap, edicao_fiap, etc.)
     * @param string $entidade Nome do modelo ou entidade (ex: Ocorrencia, PlanoRecuperacao, User)
     * @param int|null $entidadeId ID do registro afetado
     * @param string $descricao Descrição amigável para exibição no painel de auditoria
     * @param array|null $dadosAnteriores Snapshot dos dados anteriores (em caso de edição/exclusão)
     * @param array|null $dadosNovos Snapshot dos novos dados
     * @param int|null $userId ID do usuário responsável (padrão: usuário autenticado)
     */
    public static function registrar(
        string $acao,
        string $entidade,
        ?int $entidadeId,
        string $descricao,
        ?array $dadosAnteriores = null,
        ?array $dadosNovos = null,
        ?int $userId = null
    ): ?AuditoriaLog {
        try {
            $user = Auth::user();
            $request = request();

            return AuditoriaLog::create([
                'user_id' => $userId ?? $user?->id,
                'acao' => $acao,
                'entidade' => $entidade,
                'entidade_id' => $entidadeId,
                'descricao' => $descricao,
                'dados_anteriores' => $dadosAnteriores,
                'dados_novos' => $dadosNovos,
                'ip_address' => $request ? $request->ip() : null,
                'user_agent' => $request ? substr((string) $request->userAgent(), 0, 255) : null,
            ]);
        } catch (\Throwable $e) {
            report($e);
            return null;
        }
    }
}
