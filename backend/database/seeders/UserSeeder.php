<?php

namespace Database\Seeders;

use App\Models\Instrutor;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Administrador SENAI',
                'email' => 'admin@senai.br',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'admin',
                'deve_trocar_senha' => false,
            ],
            [
                'name' => 'Instrutor SENAI',
                'email' => 'instrutor@senai.br',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'instrutor',
                'deve_trocar_senha' => false,
            ],
            [
                'name' => 'Equipe AQV SENAI',
                'email' => 'aqv@senai.br',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'aqv',
                'deve_trocar_senha' => false,
            ],
            // 8 Professores Oficiais
            [
                'name' => 'Florisvaldo Antonio Crepaldi Junior',
                'email' => 'florisvaldo.crepaldi@sp.senai.br',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'instrutor',
                'deve_trocar_senha' => false,
            ],
            [
                'name' => 'Izaias Maia Vieira',
                'email' => 'izaias.vieira@sp.senai.br',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'instrutor',
                'deve_trocar_senha' => false,
            ],
            [
                'name' => 'Jefferson Aparecido Savidotti dos Santos',
                'email' => 'jefferson.santos@sp.senai.br',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'instrutor',
                'deve_trocar_senha' => false,
            ],
            [
                'name' => 'Joao Flavio Diniz',
                'email' => 'joao.diniz@sp.senai.br',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'instrutor',
                'deve_trocar_senha' => false,
            ],
            [
                'name' => 'Matheus Luiz Oliveira de Camargo',
                'email' => 'matheus.decamargo@sp.senai.br',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'instrutor',
                'deve_trocar_senha' => false,
            ],
            [
                'name' => 'Maycon Espricio da Silva',
                'email' => 'maycon.silva@sp.senai.br',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'instrutor',
                'deve_trocar_senha' => false,
            ],
            [
                'name' => 'Nelcimar Henrique Teixeira Zanaqui',
                'email' => 'nelcimar.zanaqui@sp.senai.br',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'instrutor',
                'deve_trocar_senha' => false,
            ],
            [
                'name' => 'Ricardo Correa dos Santos',
                'email' => 'ricardo.santos@sp.senai.br',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'instrutor',
                'deve_trocar_senha' => false,
            ],
        ];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            // Garante que todo instrutor possua registro na tabela 'instrutores'
            if ($user->isInstrutor()) {
                Instrutor::firstOrCreate(
                    ['user_id' => $user->id],
                    ['telefone' => '(19) 3838-8000']
                );
            }
        }
    }
}
