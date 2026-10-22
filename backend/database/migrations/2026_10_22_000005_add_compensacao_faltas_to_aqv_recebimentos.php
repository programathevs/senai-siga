<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aqv_recebimentos', function (Blueprint $table) {
            $table->enum('compensacao_faltas_autorizada', [
                'pendente',
                'nao_autorizado',
                'autorizado_atestado',
                'autorizado_excepcional'
            ])->default('pendente')->after('status_atendimento');

            $table->text('motivo_excepcionalidade')->nullable()->after('compensacao_faltas_autorizada');
            $table->foreignId('autorizado_por')->nullable()->after('motivo_excepcionalidade')->constrained('users')->nullOnDelete();
            $table->timestamp('autorizado_em')->nullable()->after('autorizado_por');
        });
    }

    public function down(): void
    {
        Schema::table('aqv_recebimentos', function (Blueprint $table) {
            $table->dropForeign(['autorizado_por']);
            $table->dropColumn([
                'compensacao_faltas_autorizada',
                'motivo_excepcionalidade',
                'autorizado_por',
                'autorizado_em',
            ]);
        });
    }
};
