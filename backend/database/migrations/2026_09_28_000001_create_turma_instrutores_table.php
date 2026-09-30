<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('turma_instrutores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turma_id')->constrained('turmas')->cascadeOnDelete();
            $table->foreignId('instrutor_id')->constrained('instrutores')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['turma_id', 'instrutor_id'], 'turma_instrutor_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('turma_instrutores');
    }
};
