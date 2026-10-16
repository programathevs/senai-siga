<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Instrutor extends Model
{
    use HasFactory;

    protected $table = 'instrutores';

    protected $fillable = [
        'user_id',
        'telefone',
    ];

    /**
     * Obtém o usuário associado a este instrutor.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Turmas associadas a este instrutor.
     */
    public function turmas(): BelongsToMany
    {
        return $this->belongsToMany(Turma::class, 'turma_instrutores')
            ->withTimestamps();
    }
}
