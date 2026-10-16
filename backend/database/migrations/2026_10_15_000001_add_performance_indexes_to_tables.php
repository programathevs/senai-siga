<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ocorrencias', function (Blueprint $table) {
            $table->index(['data_ocorrencia', 'tipo', 'status'], 'idx_ocorrencias_filtro_kpi');
            $table->index(['registrado_por', 'deleted_at'], 'idx_ocorrencias_docente_deleted');
            $table->index(['aluno_id', 'status'], 'idx_ocorrencias_aluno_status');
        });

        Schema::table('ocorrencia_unidades', function (Blueprint $table) {
            $table->index(['ocorrencia_id', 'unidade_curricular_id'], 'idx_ou_ocorrencia_uc');
        });

        Schema::table('alunos', function (Blueprint $table) {
            $table->index(['turma_id', 'status'], 'idx_alunos_turma_status');
        });

        Schema::table('planos_recuperacao', function (Blueprint $table) {
            $table->index(['ocorrencia_id', 'deleted_at'], 'idx_prp_ocorrencia_deleted');
            $table->index(['aluno_id', 'status_processo'], 'idx_prp_aluno_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ocorrencias', function (Blueprint $table) {
            $table->dropIndex('idx_ocorrencias_filtro_kpi');
            $table->dropIndex('idx_ocorrencias_docente_deleted');
            $table->dropIndex('idx_ocorrencias_aluno_status');
        });

        Schema::table('ocorrencia_unidades', function (Blueprint $table) {
            $table->dropIndex('idx_ou_ocorrencia_uc');
        });

        Schema::table('alunos', function (Blueprint $table) {
            $table->dropIndex('idx_alunos_turma_status');
        });

        Schema::table('planos_recuperacao', function (Blueprint $table) {
            $table->dropIndex('idx_prp_ocorrencia_deleted');
            $table->dropIndex('idx_prp_aluno_status');
        });
    }
};
