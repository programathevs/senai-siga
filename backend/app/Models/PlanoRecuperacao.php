<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanoRecuperacao extends Model
{
    use HasFactory, SoftDeletes;

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
        'parecer_equipe_escolar',
        'analisado_por',
        'analisado_em',
    ];

    protected $casts = [
        'propostas_trabalho' => 'array',
        'periodo_previsto' => 'date',
        'periodo_inicio' => 'date',
        'periodo_fim' => 'date',
        'visto_coordenacao' => 'date',
        'visto_aluno' => 'date',
        'visto_professor' => 'date',
        'analisado_em' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::restoring(function (PlanoRecuperacao $plano) {
            if ($plano->ocorrencia_id) {
                Ocorrencia::onlyTrashed()->where('id', $plano->ocorrencia_id)->restore();
            }
        });
    }

    public function ocorrencia(): BelongsTo
    {
        return $this->belongsTo(Ocorrencia::class, 'ocorrencia_id')->withTrashed();
    }

    public function aluno(): BelongsTo
    {
        return $this->belongsTo(Aluno::class, 'aluno_id');
    }

    public function unidadeCurricular(): BelongsTo
    {
        return $this->belongsTo(UnidadeCurricular::class, 'unidade_curricular_id');
    }

    public function unidades(): BelongsToMany
    {
        return $this->belongsToMany(
            UnidadeCurricular::class,
            'plano_recuperacao_unidades',
            'plano_recuperacao_id',
            'unidade_curricular_id'
        )->withTimestamps();
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function frequencias(): HasMany
    {
        return $this->hasMany(PlanoFrequencia::class, 'plano_id');
    }

    public function analisadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'analisado_por');
    }
}
