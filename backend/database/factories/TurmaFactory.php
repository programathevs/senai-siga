<?php

namespace Database\Factories;

use App\Models\Curso;
use App\Models\Turma;
use Illuminate\Database\Eloquent\Factories\Factory;

class TurmaFactory extends Factory
{
    protected $model = Turma::class;

    public function definition(): array
    {
        return [
            'curso_id' => Curso::factory(),
            'nome' => 'TURMA-' . $this->faker->unique()->numberBetween(100, 999),
            'turno' => $this->faker->randomElement(['Manhã', 'Tarde', 'Noite', 'Integral']),
            'ano_letivo' => '2025',
            'semestre_atual' => 1,
        ];
    }
}
