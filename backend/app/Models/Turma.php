<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Turma extends Model
{
    use HasFactory;

    protected $table = 'turmas';

    protected $fillable = [
        'curso_id',
        'nome',
        'turno',
        'ano_letivo',
        'semestre_atual',
    ];

    /**
     * Curso ao qual esta turma pertence.
     */
    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class);
    }

    /**
     * Alunos matriculados nesta turma.
     */
    public function alunos(): HasMany
    {
        return $this->hasMany(Aluno::class);
    }

    /**
     * Unidades curriculares vinculadas à turma com seus respectivos instrutores.
     */
    public function unidadesCurriculares(): BelongsToMany
    {
        return $this->belongsToMany(UnidadeCurricular::class, 'turma_uc')
            ->withPivot('instrutor_id', 'semestre', 'carga_horaria')
            ->withTimestamps();
    }
}
