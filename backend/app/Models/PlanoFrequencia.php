<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanoFrequencia extends Model
{
    use HasFactory;

    protected $table = 'plano_frequencias';

    protected $fillable = [
        'plano_id',
        'data',
        'entrada',
        'saida',
        'aulas_compensadas',
    ];

    protected $casts = [
        'data' => 'date',
        'aulas_compensadas' => 'integer',
    ];

    public function plano(): BelongsTo
    {
        return $this->belongsTo(PlanoRecuperacao::class, 'plano_id');
    }
}
