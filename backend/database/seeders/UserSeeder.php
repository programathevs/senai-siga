<?php

namespace Database\Seeders;

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
                'password' => Hash::make('password'),
                'role' => 'admin',
                'deve_trocar_senha' => false,
            ],
            [
                'name' => 'Instrutor SENAI',
                'email' => 'instrutor@senai.br',
                'password' => Hash::make('password'),
                'role' => 'instrutor',
                'deve_trocar_senha' => false,
            ],
            [
                'name' => 'Equipe AQV SENAI',
                'email' => 'aqv@senai.br',
                'password' => Hash::make('password'),
                'role' => 'aqv',
                'deve_trocar_senha' => false,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
