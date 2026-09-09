<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('turma_uc', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turma_id')->constrained('turmas')->cascadeOnDelete();
            $table->foreignId('unidade_curricular_id')->constrained('unidades_curriculares')->restrictOnDelete();
            $table->foreignId('instrutor_id')->constrained('instrutores')->restrictOnDelete();
            $table->unsignedTinyInteger('semestre');
            $table->unsignedInteger('carga_horaria');
            $table->timestamps();

            $table->unique(['turma_id', 'unidade_curricular_id', 'semestre'], 'turma_uc_unica');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('turma_uc');
    }
};
