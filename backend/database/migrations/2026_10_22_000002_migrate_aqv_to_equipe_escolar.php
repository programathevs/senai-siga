<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            // 1. Amplia enum de role em users para permitir 'equipe_escolar' e manter retrocompatibilidade com 'aqv'
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('gestor', 'instrutor', 'equipe_escolar', 'aqv') NOT NULL");

            // Atualiza registros existentes de 'aqv' para 'equipe_escolar'
            DB::table('users')->where('role', 'aqv')->update(['role' => 'equipe_escolar']);
            DB::table('users')->where('email', 'aqv@senai.br')->update([
                'name' => 'Equipe Escolar SENAI',
            ]);

            // 2. Atualiza enum de status em ocorrencias mantendo suporte a enviado_aqv e aceitando enviado_equipe_escolar
            DB::statement("ALTER TABLE ocorrencias MODIFY COLUMN status ENUM('pendente', 'pdf_gerado', 'enviado_aqv', 'enviado_equipe_escolar', 'aguardando_assinatura', 'impresso', 'assinado') NOT NULL DEFAULT 'pendente'");

            DB::table('ocorrencias')->where('status', 'enviado_aqv')->update(['status' => 'enviado_equipe_escolar']);
        } else {
            DB::table('users')->where('role', 'aqv')->update(['role' => 'equipe_escolar']);
            DB::table('users')->where('email', 'aqv@senai.br')->update([
                'name' => 'Equipe Escolar SENAI',
            ]);
            DB::table('ocorrencias')->where('status', 'enviado_aqv')->update(['status' => 'enviado_equipe_escolar']);
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('gestor', 'instrutor', 'equipe_escolar', 'aqv') NOT NULL");
            DB::table('users')->where('role', 'equipe_escolar')->update(['role' => 'aqv']);
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('gestor', 'instrutor', 'aqv') NOT NULL");

            DB::statement("ALTER TABLE ocorrencias MODIFY COLUMN status ENUM('pendente', 'pdf_gerado', 'enviado_aqv', 'enviado_equipe_escolar', 'aguardando_assinatura', 'impresso', 'assinado') NOT NULL DEFAULT 'pendente'");
            DB::table('ocorrencias')->where('status', 'enviado_equipe_escolar')->update(['status' => 'enviado_aqv']);
            DB::statement("ALTER TABLE ocorrencias MODIFY COLUMN status ENUM('pendente', 'pdf_gerado', 'enviado_aqv', 'impresso', 'assinado') NOT NULL DEFAULT 'pendente'");
        } else {
            DB::table('users')->where('role', 'equipe_escolar')->update(['role' => 'aqv']);
            DB::table('ocorrencias')->where('status', 'enviado_equipe_escolar')->update(['status' => 'enviado_aqv']);
        }
    }
};
