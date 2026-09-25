<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Curso extends Model
{
    use HasFactory;

    protected $table = 'cursos';

    protected $fillable = [
        'nome',
        'carga_horaria_total',
    ];

    protected $casts = [
        'carga_horaria_total' => 'integer',
    ];

    public function unidadesCurriculares()
    {
        return $this->hasMany(UnidadeCurricular::class, 'curso_id');
    }
}
