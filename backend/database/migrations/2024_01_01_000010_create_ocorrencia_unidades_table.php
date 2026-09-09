<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ocorrencia_unidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ocorrencia_id')->constrained('ocorrencias')->cascadeOnDelete();
            $table->foreignId('turma_uc_id')->constrained('turma_uc')->restrictOnDelete();
            $table->unsignedInteger('quantidade_faltas');
            $table->decimal('limite_percentual', 5, 2)->default(25.00);
            $table->unsignedInteger('limite_faltas_aulas');
            $table->decimal('percentual_atingido', 6, 2);
            $table->timestamps();

            $table->unique(['ocorrencia_id', 'turma_uc_id'], 'ocorrencia_unidade_unica');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ocorrencia_unidades');
    }
};
