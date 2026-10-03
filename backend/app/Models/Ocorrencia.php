<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

class Ocorrencia extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ocorrencias';

    protected $fillable = [
        'aluno_id',
        'registrado_por',
        'numero_sequencial',
        'versao',
        'tipo',
        'relato_dificuldades',
        'recomendacoes_professor',
        'recomendacoes_gestao',
        'providencias_gestao',
        'outras_observacoes',
        'data_ocorrencia',
        'status',
        'pdf_path',
    ];

    protected $casts = [
        'aluno_id' => 'integer',
        'registrado_por' => 'integer',
        'data_ocorrencia' => 'date:Y-m-d',
        'versao' => 'integer',
    ];

    protected $appends = [
        'registrado_por_id',
    ];

    public function getRegistradoPorIdAttribute(): int
    {
        return (int) ($this->attributes['registrado_por'] ?? 0);
    }

    /**
     * Aluno associado à ocorrência / FIAP.
     */
    public function aluno(): BelongsTo
    {
        return $this->belongsTo(Aluno::class);
    }

    /**
     * Usuário (admin ou instrutor) que realizou o registro.
     */
    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function registradoPorUser(): BelongsTo
    {
        return $this->registradoPor();
    }

    /**
     * Unidades curriculares associadas à ocorrência (especialmente tipo falta/desempenho).
     */
    public function unidades(): HasMany
    {
        return $this->hasMany(OcorrenciaUnidade::class, 'ocorrencia_id');
    }

    /**
     * Instrutores envolvidos / notificantes da ocorrência.
     */
    public function instrutores(): BelongsToMany
    {
        return $this->belongsToMany(Instrutor::class, 'ocorrencia_instrutores', 'ocorrencia_id', 'instrutor_id')
            ->withTimestamps();
    }

    /**
     * Histórico de edições e justificativas de alteração desta ocorrência.
     */
    public function edicoes(): HasMany
    {
        return $this->hasMany(OcorrenciaEdicao::class, 'ocorrencia_id')->orderBy('versao_nova', 'desc');
    }

    /**
     * Registro de recebimento e acolhimento pelo setor AQV.
     */
    public function aqvRecebimento(): HasOne
    {
        return $this->hasOne(AqvRecebimento::class, 'ocorrencia_id');
    }

    /**
     * Planos de recuperação pedagógica decorrentes desta ocorrência.
     */
    public function planosRecuperacao(): HasMany
    {
        return $this->hasMany(PlanoRecuperacao::class, 'ocorrencia_id');
    }

    /**
     * Gera o próximo número sequencial anual no padrão institucional FIAP-AAAA-XXXX.
     */
    public static function gerarProximoNumeroSequencial(): string
    {
        $anoAtual = Carbon::now()->year;
        $prefixo = "FIAP-{$anoAtual}-";

        $ultimaOcorrencia = static::where('numero_sequencial', 'like', "{$prefixo}%")
            ->orderBy('id', 'desc')
            ->first();

        if (! $ultimaOcorrencia) {
            return "{$prefixo}0001";
        }

        // Extrai o número do final
        $partes = explode('-', $ultimaOcorrencia->numero_sequencial);
        $ultimoNumero = (int) end($partes);
        $proximoNumero = str_pad((string) ($ultimoNumero + 1), 4, '0', STR_PAD_LEFT);

        return "{$prefixo}{$proximoNumero}";
    }
}
