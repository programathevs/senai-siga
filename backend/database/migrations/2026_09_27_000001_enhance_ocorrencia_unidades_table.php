<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ocorrencia_unidades', function (Blueprint $table) {
            $table->foreignId('unidade_curricular_id')
                ->nullable()
                ->after('ocorrencia_id')
                ->constrained('unidades_curriculares')
                ->restrictOnDelete();

            $table->unsignedInteger('total_aulas_dadas')
                ->nullable()
                ->after('unidade_curricular_id');

            $table->foreignId('turma_uc_id')
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('ocorrencia_unidades', function (Blueprint $table) {
            $table->dropForeign(['unidade_curricular_id']);
            $table->dropColumn(['unidade_curricular_id', 'total_aulas_dadas']);
        });
    }
};
