<?php

namespace Database\Factories;

use App\Models\Aluno;
use App\Models\Turma;
use Illuminate\Database\Eloquent\Factories\Factory;

class AlunoFactory extends Factory
{
    protected $model = Aluno::class;

    public function definition(): array
    {
        return [
            'turma_id' => Turma::factory(),
            'nome' => $this->faker->name(),
            'matricula' => 'RA' . $this->faker->unique()->numberBetween(100000, 999999),
            'cpf' => $this->faker->unique()->numerify('###.###.###-##'),
            'data_nascimento' => '2006-05-15',
            'email' => $this->faker->unique()->safeEmail(),
            'telefone' => '(11) 98765-4321',
            'status' => 'ativo',
        ];
    }
}
