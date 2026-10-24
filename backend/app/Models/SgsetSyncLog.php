<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SgsetSyncLog extends Model
{
    use HasFactory;

    protected $table = 'sgset_sync_logs';

    protected $fillable = [
        'user_id',
        'tipo',
        'origem',
        'escola',
        'status',
        'detalhes',
    ];

    protected $casts = [
        'detalhes' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
