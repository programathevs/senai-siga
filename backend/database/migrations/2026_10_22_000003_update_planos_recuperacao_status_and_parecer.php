<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE planos_recuperacao MODIFY COLUMN status_processo ENUM('em_analise', 'aguardando_visto', 'concluido', 'recusado', 'rascunho') NOT NULL DEFAULT 'em_analise'");
            DB::table('planos_recuperacao')->where('status_processo', 'rascunho')->update(['status_processo' => 'em_analise']);
        } else {
            DB::table('planos_recuperacao')->where('status_processo', 'rascunho')->update(['status_processo' => 'em_analise']);
        }

        Schema::table('planos_recuperacao', function (Blueprint $table) {
            if (!Schema::hasColumn('planos_recuperacao', 'parecer_equipe_escolar')) {
                $table->text('parecer_equipe_escolar')->nullable()->after('status_processo');
            }
            if (!Schema::hasColumn('planos_recuperacao', 'analisado_por')) {
                $table->foreignId('analisado_por')->nullable()->after('parecer_equipe_escolar')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('planos_recuperacao', 'analisado_em')) {
                $table->dateTime('analisado_em')->nullable()->after('analisado_por');
            }
        });
    }

    public function down(): void
    {
        Schema::table('planos_recuperacao', function (Blueprint $table) {
            if (Schema::hasColumn('planos_recuperacao', 'analisado_por')) {
                $table->dropForeign(['analisado_por']);
                $table->dropColumn('analisado_por');
            }
            if (Schema::hasColumn('planos_recuperacao', 'parecer_equipe_escolar')) {
                $table->dropColumn('parecer_equipe_escolar');
            }
            if (Schema::hasColumn('planos_recuperacao', 'analisado_em')) {
                $table->dropColumn('analisado_em');
            }
        });

        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE planos_recuperacao MODIFY COLUMN status_processo ENUM('rascunho', 'aguardando_visto', 'concluido') NOT NULL DEFAULT 'rascunho'");
        }
    }
};
