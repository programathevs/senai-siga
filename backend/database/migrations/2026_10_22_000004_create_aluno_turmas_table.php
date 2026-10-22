<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('aluno_turmas')) {
            Schema::create('aluno_turmas', function (Blueprint $table) {
                $table->id();
                $table->foreignId('aluno_id')->constrained('alunos')->cascadeOnDelete();
                $table->foreignId('turma_id')->constrained('turmas')->cascadeOnDelete();
                $table->string('ra', 50)->nullable();
                $table->string('status', 20)->default('ativo');
                $table->timestamps();

                $table->unique(['aluno_id', 'turma_id']);
                $table->index(['turma_id', 'status']);
            });

            // Migra as associações já existentes da tabela alunos
            $alunosExistentes = DB::table('alunos')
                ->whereNotNull('turma_id')
                ->select('id', 'turma_id', 'matricula')
                ->get();

            foreach ($alunosExistentes as $aluno) {
                DB::table('aluno_turmas')->insertOrIgnore([
                    'aluno_id' => $aluno->id,
                    'turma_id' => $aluno->turma_id,
                    'ra' => $aluno->matricula,
                    'status' => 'ativo',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('aluno_turmas');
    }
};
