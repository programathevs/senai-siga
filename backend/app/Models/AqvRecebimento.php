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
        'enviado_em',
        'confirmado_em',
    ];

    protected $casts = [
        'enviado_em' => 'datetime',
        'confirmado_em' => 'datetime',
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
