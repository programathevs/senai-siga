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
        'foto',
        'status',
    ];

    protected $casts = [
        'data_nascimento' => 'date',
    ];

    protected $appends = [
        'is_maior_de_idade',
        'foto_url',
        'ra',
    ];

    public function getRaAttribute(): ?string
    {
        return $this->attributes['ra'] ?? $this->matricula;
    }

    public function getFotoUrlAttribute(): ?string
    {
        return $this->foto ? asset('storage/' . $this->foto) : null;
    }

    /**
     * Determina se o aluno tem 18 anos ou mais.
     */
    public function getIsMaiorDeIdadeAttribute(): bool
    {
        if (!$this->data_nascimento) {
            return false;
        }

        return $this->data_nascimento->age >= 18;
    }

    /**
     * Turma à qual o aluno está vinculado (opcional).
     */
    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class);
    }

    /**
     * Turmas vinculadas ao aluno com RAs específicos (suporte a múltiplas turmas).
     */
    public function turmas(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Turma::class, 'aluno_turmas')
            ->withPivot('ra', 'status')
            ->withTimestamps();
    }

    /**
     * Ocorrências / FIAPs registradas para o aluno.
     */
    public function ocorrencias(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Ocorrencia::class)->orderBy('data_ocorrencia', 'desc');
    }
}
