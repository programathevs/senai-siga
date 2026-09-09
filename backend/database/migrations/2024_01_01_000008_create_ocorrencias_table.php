<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ocorrencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aluno_id')->constrained('alunos')->restrictOnDelete();
            $table->foreignId('registrado_por')->constrained('users')->restrictOnDelete();
            $table->string('numero_sequencial')->unique();
            $table->enum('tipo', ['falta', 'comportamento', 'desempenho']);
            $table->text('relato_dificuldades')->nullable();
            $table->text('recomendacoes_professor')->nullable();
            $table->text('recomendacoes_gestao')->nullable();
            $table->text('providencias_gestao')->nullable();
            $table->text('outras_observacoes')->nullable();
            $table->date('data_ocorrencia');
            $table->enum('status', ['pendente', 'pdf_gerado', 'enviado_aqv', 'impresso', 'assinado'])
                ->default('pendente');
            $table->string('pdf_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ocorrencias');
    }
};
