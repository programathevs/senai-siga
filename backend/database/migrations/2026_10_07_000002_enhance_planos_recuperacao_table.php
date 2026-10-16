<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('planos_recuperacao', function (Blueprint $table) {
            if (!Schema::hasColumn('planos_recuperacao', 'ciclo_avaliacao')) {
                $table->string('ciclo_avaliacao', 10)->default('1º')->after('tipo_programa');
            }
            if (!Schema::hasColumn('planos_recuperacao', 'unidade_curricular_id')) {
                $table->foreignId('unidade_curricular_id')->nullable()->after('turma_uc_id')->constrained('unidades_curriculares')->nullOnDelete();
            }
            if (!Schema::hasColumn('planos_recuperacao', 'status_processo')) {
                $table->enum('status_processo', ['rascunho', 'aguardando_visto', 'concluido'])->default('rascunho')->after('conceito');
            }
            if (!Schema::hasColumn('planos_recuperacao', 'periodo_inicio')) {
                $table->date('periodo_inicio')->nullable()->after('periodo_previsto');
            }
            if (!Schema::hasColumn('planos_recuperacao', 'periodo_fim')) {
                $table->date('periodo_fim')->nullable()->after('periodo_inicio');
            }
        });
    }

    public function down(): void
    {
        Schema::table('planos_recuperacao', function (Blueprint $table) {
            $table->dropColumn(['ciclo_avaliacao', 'status_processo', 'periodo_inicio', 'periodo_fim']);
            if (Schema::hasColumn('planos_recuperacao', 'unidade_curricular_id')) {
                $table->dropForeign(['unidade_curricular_id']);
                $table->dropColumn('unidade_curricular_id');
            }
        });
    }
};
