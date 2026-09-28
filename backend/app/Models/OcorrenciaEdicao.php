<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OcorrenciaEdicao extends Model
{
    use HasFactory;

    protected $table = 'ocorrencia_edicoes';

    protected $fillable = [
        'ocorrencia_id',
        'editado_por',
        'versao_anterior',
        'versao_nova',
        'motivo',
    ];

    protected $casts = [
        'versao_anterior' => 'integer',
        'versao_nova' => 'integer',
    ];

    public function ocorrencia(): BelongsTo
    {
        return $this->belongsTo(Ocorrencia::class, 'ocorrencia_id');
    }

    public function editadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'editado_por');
    }
}
