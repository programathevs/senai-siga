<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aqv_recebimentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ocorrencia_id')->constrained('ocorrencias')->cascadeOnDelete();
            $table->foreignId('recebido_por')->nullable()->constrained('users')->nullOnDelete();
            $table->text('justificativa_aluno')->nullable();
            $table->timestamp('enviado_em')->nullable();
            $table->timestamp('confirmado_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aqv_recebimentos');
    }
};
