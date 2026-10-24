<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alunos', function (Blueprint $table) {
            $table->string('email_educacional')->nullable()->after('email');
            $table->string('rg', 30)->nullable()->after('cpf');
            $table->string('nome_pai')->nullable()->after('data_nascimento');
            $table->string('nome_mae')->nullable()->after('nome_pai');
        });
    }

    public function down(): void
    {
        Schema::table('alunos', function (Blueprint $table) {
            $table->dropColumn(['email_educacional', 'rg', 'nome_pai', 'nome_mae']);
        });
    }
};
