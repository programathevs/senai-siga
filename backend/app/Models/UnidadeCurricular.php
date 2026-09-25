<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UnidadeCurricular extends Model
{
    use HasFactory;

    protected $table = 'unidades_curriculares';

    protected $fillable = [
        'curso_id',
        'nome',
        'carga_horaria',
        'semestre_plano_3',
        'semestre_plano_4',
    ];

    protected $casts = [
        'carga_horaria' => 'integer',
        'semestre_plano_3' => 'integer',
        'semestre_plano_4' => 'integer',
    ];

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'curso_id');
    }
}
