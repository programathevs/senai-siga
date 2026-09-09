<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plano_frequencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plano_id')->constrained('planos_recuperacao')->cascadeOnDelete();
            $table->date('data');
            $table->time('entrada')->nullable();
            $table->time('saida')->nullable();
            $table->unsignedInteger('aulas_compensadas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plano_frequencias');
    }
};
