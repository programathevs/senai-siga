<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aqv_recebimentos', function (Blueprint $table) {
            $table->text('parecer_aqv')->nullable()->after('justificativa_aluno');
            $table->dateTime('data_atendimento')->nullable()->after('parecer_aqv');
            $table->enum('status_atendimento', ['pendente', 'em_atendimento', 'concluido'])
                ->default('pendente')
                ->after('confirmado_em');
        });
    }

    public function down(): void
    {
        Schema::table('aqv_recebimentos', function (Blueprint $table) {
            $table->dropColumn(['parecer_aqv', 'data_atendimento', 'status_atendimento']);
        });
    }
};
