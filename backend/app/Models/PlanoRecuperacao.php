<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanoRecuperacao extends Model
{
    use HasFactory;

    protected $table = 'planos_recuperacao';

    protected $fillable = [
        'ocorrencia_id',
        'aluno_id',
        'turma_uc_id',
        'unidade_curricular_id',
        'registrado_por',
        'tipo_programa',
        'ciclo_avaliacao',
        'conteudo_programatico',
        'propostas_trabalho',
        'periodo_previsto',
        'periodo_inicio',
        'periodo_fim',
        'visto_coordenacao',
        'visto_aluno',
        'visto_professor',
        'conceito',
        'status_processo',
        'registro_desempenho',
    ];

    protected $casts = [
        'propostas_trabalho' => 'array',
        'periodo_previsto' => 'date',
        'periodo_inicio' => 'date',
        'periodo_fim' => 'date',
        'visto_coordenacao' => 'date',
        'visto_aluno' => 'date',
        'visto_professor' => 'date',
    ];

    public function ocorrencia(): BelongsTo
    {
        return $this->belongsTo(Ocorrencia::class, 'ocorrencia_id');
    }

    public function aluno(): BelongsTo
    {
        return $this->belongsTo(Aluno::class, 'aluno_id');
    }

    public function unidadeCurricular(): BelongsTo
    {
        return $this->belongsTo(UnidadeCurricular::class, 'unidade_curricular_id');
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function frequencias(): HasMany
    {
        return $this->hasMany(PlanoFrequencia::class, 'plano_id');
    }
}
