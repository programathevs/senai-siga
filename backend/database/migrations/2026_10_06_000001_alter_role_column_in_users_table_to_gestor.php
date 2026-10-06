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
            // 1. Amplia temporariamente o enum para permitir 'gestor'
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'gestor', 'instrutor', 'aqv') NOT NULL");

            // 2. Converte os registros existentes
            DB::table('users')->where('role', 'admin')->update(['role' => 'gestor']);
            DB::table('users')->where('email', 'admin@senai.br')->update([
                'email' => 'gestor@senai.br',
                'name' => 'Gestor SENAI',
            ]);

            // 3. Restringe o enum aos valores definitivos: gestor, instrutor, aqv
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('gestor', 'instrutor', 'aqv') NOT NULL");
        } else {
            // Drivers genéricos (SQLite, Postgres)
            DB::table('users')->where('role', 'admin')->update(['role' => 'gestor']);
            DB::table('users')->where('email', 'admin@senai.br')->update([
                'email' => 'gestor@senai.br',
                'name' => 'Gestor SENAI',
            ]);
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'gestor', 'instrutor', 'aqv') NOT NULL");

            DB::table('users')->where('role', 'gestor')->update(['role' => 'admin']);
            DB::table('users')->where('email', 'gestor@senai.br')->update([
                'email' => 'admin@senai.br',
                'name' => 'Administrador SENAI',
            ]);

            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'instrutor', 'aqv') NOT NULL");
        } else {
            DB::table('users')->where('role', 'gestor')->update(['role' => 'admin']);
            DB::table('users')->where('email', 'gestor@senai.br')->update([
                'email' => 'admin@senai.br',
                'name' => 'Administrador SENAI',
            ]);
        }
    }
};
