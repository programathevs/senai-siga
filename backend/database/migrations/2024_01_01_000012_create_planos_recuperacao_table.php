<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('planos_recuperacao', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ocorrencia_id')->constrained('ocorrencias')->restrictOnDelete();
            $table->foreignId('aluno_id')->constrained('alunos')->restrictOnDelete();
            $table->foreignId('turma_uc_id')->nullable()->constrained('turma_uc')->nullOnDelete();
            $table->enum('tipo_programa', [
                'recuperacao_paralela',
                'compensacao_ausencia',
                'recuperacao_final',
            ]);
            $table->text('conteudo_programatico')->nullable();
            $table->json('propostas_trabalho')->nullable();
            $table->date('periodo_previsto')->nullable();
            $table->date('visto_coordenacao')->nullable();
            $table->date('visto_aluno')->nullable();
            $table->date('visto_professor')->nullable();
            $table->enum('conceito', ['aprovado', 'reprovado'])->nullable();
            $table->text('registro_desempenho')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('planos_recuperacao');
    }
};
