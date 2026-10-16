<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('plano_recuperacao_unidades')) {
            Schema::create('plano_recuperacao_unidades', function (Blueprint $table) {
                $table->id();
                $table->foreignId('plano_recuperacao_id')
                    ->constrained('planos_recuperacao')
                    ->cascadeOnDelete();
                $table->foreignId('unidade_curricular_id')
                    ->constrained('unidades_curriculares')
                    ->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['plano_recuperacao_id', 'unidade_curricular_id'], 'plano_uc_unique');
            });

            // Migra dados existentes de planos_recuperacao que já possuem unidade_curricular_id
            if (Schema::hasTable('planos_recuperacao') && Schema::hasColumn('planos_recuperacao', 'unidade_curricular_id')) {
                $planosExistentes = DB::table('planos_recuperacao')
                    ->whereNotNull('unidade_curricular_id')
                    ->select('id', 'unidade_curricular_id', 'created_at', 'updated_at')
                    ->get();

                foreach ($planosExistentes as $p) {
                    DB::table('plano_recuperacao_unidades')->insertOrIgnore([
                        'plano_recuperacao_id' => $p->id,
                        'unidade_curricular_id' => $p->unidade_curricular_id,
                        'created_at' => $p->created_at ?? now(),
                        'updated_at' => $p->updated_at ?? now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('plano_recuperacao_unidades');
    }
};
