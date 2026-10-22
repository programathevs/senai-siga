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
        Schema::table('alunos', function (Blueprint $table) {
            $table->index('turma_id', 'idx_alunos_turma_id');
        });

        Schema::table('ocorrencias', function (Blueprint $table) {
            $table->index('aluno_id', 'idx_ocorrencias_aluno_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('alunos', function (Blueprint $table) {
            $table->dropIndex('idx_alunos_turma_id');
        });

        Schema::table('ocorrencias', function (Blueprint $table) {
            $table->dropIndex('idx_ocorrencias_aluno_id');
        });
    }
};
