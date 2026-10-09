<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditoriaLog extends Model
{
    use HasFactory;

    protected $table = 'auditoria_logs';

    protected $fillable = [
        'user_id',
        'acao',
        'entidade',
        'entidade_id',
        'descricao',
        'dados_anteriores',
        'dados_novos',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'dados_anteriores' => 'array',
        'dados_novos' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
