<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Aluno extends Model
{
    use HasFactory;

    protected $table = 'alunos';

    protected $fillable = [
        'turma_id',
        'nome',
        'matricula',
        'cpf',
        'data_nascimento',
        'email',
        'telefone',
        'status',
    ];

    protected $casts = [
        'data_nascimento' => 'date',
    ];

    /**
     * Turma à qual o aluno está vinculado (opcional).
     */
    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class);
    }
}
