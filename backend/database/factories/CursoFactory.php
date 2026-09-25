<?php

namespace Database\Factories;

use App\Models\Curso;
use Illuminate\Database\Eloquent\Factories\Factory;

class CursoFactory extends Factory
{
    protected $model = Curso::class;

    public function definition(): array
    {
        return [
            'nome' => 'Técnico em ' . fake()->unique()->word(),
            'carga_horaria_total' => fake()->numberBetween(800, 1600),
        ];
    }
}
