<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alunos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turma_id')->constrained('turmas')->restrictOnDelete();
            $table->string('nome');
            $table->string('matricula')->unique();
            $table->string('cpf')->nullable()->unique();
            $table->date('data_nascimento')->nullable();
            $table->string('email')->nullable();
            $table->string('telefone')->nullable();
            $table->enum('status', ['ativo', 'inativo', 'transferido'])->default('ativo');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alunos');
    }
};
