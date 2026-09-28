<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OcorrenciaUnidade extends Model
{
    use HasFactory;

    protected $table = 'ocorrencia_unidades';

    protected $fillable = [
        'ocorrencia_id',
        'unidade_curricular_id',
        'turma_uc_id',
        'total_aulas_dadas',
        'quantidade_faltas',
        'limite_percentual',
        'limite_faltas_aulas',
        'percentual_atingido',
    ];

    protected $casts = [
        'total_aulas_dadas' => 'integer',
        'quantidade_faltas' => 'integer',
        'limite_percentual' => 'float',
        'limite_faltas_aulas' => 'integer',
        'percentual_atingido' => 'float',
    ];

    public function ocorrencia(): BelongsTo
    {
        return $this->belongsTo(Ocorrencia::class, 'ocorrencia_id');
    }

    public function unidadeCurricular(): BelongsTo
    {
        return $this->belongsTo(UnidadeCurricular::class, 'unidade_curricular_id');
    }
}
