<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sgset_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('tipo', 30); // 'alunos', 'turmas', 'geral'
            $table->string('origem', 30)->default('sgset'); // 'sgset', 'arquivo'
            $table->string('escola', 20)->default('512');
            $table->string('status', 20)->default('sucesso'); // 'sucesso', 'erro'
            $table->json('detalhes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sgset_sync_logs');
    }
};
