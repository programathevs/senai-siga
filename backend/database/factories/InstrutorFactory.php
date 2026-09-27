<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Instrutor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class InstrutorFactory extends Factory
{
    protected $model = Instrutor::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->create(['role' => UserRole::INSTRUTOR]),
            'telefone' => '(11) 98765-4321',
        ];
    }
}
