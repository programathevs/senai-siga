<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Atualiza todas as ocorrências existentes retirando o prefixo "FIAP-"
        DB::table('ocorrencias')
            ->where('numero_sequencial', 'like', 'FIAP-%')
            ->update([
                'numero_sequencial' => DB::raw("REPLACE(numero_sequencial, 'FIAP-', '')"),
            ]);

        // 2. Corrige descrições nos logs de auditoria
        DB::table('auditoria_logs')
            ->where('descricao', 'like', '%FIAP FIAP-%')
            ->update([
                'descricao' => DB::raw("REPLACE(descricao, 'FIAP FIAP-', 'FIAP ')"),
            ]);

        DB::table('auditoria_logs')
            ->where('descricao', 'like', '%FIAP-20%')
            ->update([
                'descricao' => DB::raw("REPLACE(descricao, 'FIAP-20', '20')"),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Não reversível automaticamente por ser padronização de nomenclatura
    }
};
