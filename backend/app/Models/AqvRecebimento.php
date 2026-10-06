<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AqvRecebimento extends Model
{
    use HasFactory;

    protected $table = 'aqv_recebimentos';

    protected $fillable = [
        'ocorrencia_id',
        'recebido_por',
        'justificativa_aluno',
        'parecer_aqv',
        'data_atendimento',
        'enviado_em',
        'confirmado_em',
        'status_atendimento',
    ];

    protected $casts = [
        'enviado_em' => 'datetime',
        'confirmado_em' => 'datetime',
        'data_atendimento' => 'datetime',
    ];

    public function ocorrencia(): BelongsTo
    {
        return $this->belongsTo(Ocorrencia::class, 'ocorrencia_id');
    }

    public function recebidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recebido_por');
    }
}
