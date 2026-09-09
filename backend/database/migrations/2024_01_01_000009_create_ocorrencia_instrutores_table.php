<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ocorrencia_instrutores', function (Blueprint $table) {
            $table->foreignId('ocorrencia_id')->constrained('ocorrencias')->cascadeOnDelete();
            $table->foreignId('instrutor_id')->constrained('instrutores')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['ocorrencia_id', 'instrutor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ocorrencia_instrutores');
    }
};
