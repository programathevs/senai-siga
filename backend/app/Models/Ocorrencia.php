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
        'has_plano_pendente',
        'registrado_por_id',
    ];

    protected static function booted(): void
    {
        static::deleting(function (Ocorrencia $ocorrencia) {
            if ($ocorrencia->isForceDeleting()) {
                $ocorrencia->planosRecuperacao()->forceDelete();
            } else {
                $ocorrencia->planosRecuperacao()->delete();
            }
        });

        static::restoring(function (Ocorrencia $ocorrencia) {
            PlanoRecuperacao::onlyTrashed()->where('ocorrencia_id', $ocorrencia->id)->restore();
        });
    }

    public function getRegistradoPorIdAttribute(): int
    {
        return (int) ($this->attributes['registrado_por'] ?? 0);
    }

    public function getHasPlanoPendenteAttribute(): bool
    {
        if ($this->tipo !== 'desempenho' && $this->tipo !== 'aproveitamento' && $this->tipo !== 'falta') {
            return false;
        }

        $temPlano = $this->relationLoaded('planosRecuperacao')
            ? $this->planosRecuperacao->isNotEmpty()
            : $this->planosRecuperacao()->exists();

        if ($temPlano) {
            return false;
        }

        // Para ocorrências do tipo falta, só há plano pendente caso a Equipe Escolar
        // já tenha atendido o aluno e autorizado a compensação de faltas (com atestado ou excepcional)
        if ($this->tipo === 'falta') {
            $aqvRec = $this->relationLoaded('aqvRecebimento')
                ? $this->aqvRecebimento
                : $this->aqvRecebimento()->first();

            $autorizado = $aqvRec && in_array($aqvRec->compensacao_faltas_autorizada, ['autorizado_atestado', 'autorizado_excepcional']);

            return (bool) $autorizado;
        }

        return true;
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
     * Registro de recebimento e acolhimento pela Equipe Escolar.
     */
    public function aqvRecebimento(): HasOne
    {
        return $this->hasOne(EquipeEscolarRecebimento::class, 'ocorrencia_id');
    }

    public function equipeEscolarRecebimento(): HasOne
    {
        return $this->hasOne(EquipeEscolarRecebimento::class, 'ocorrencia_id');
    }

    /**
     * Planos de recuperação pedagógica decorrentes desta ocorrência.
     */
    public function planosRecuperacao(): HasMany
    {
        return $this->hasMany(PlanoRecuperacao::class, 'ocorrencia_id');
    }

    /**
     * Gera o próximo número sequencial anual no padrão institucional AAAA-XXXX (ex: 2026-0008).
     */
    public static function gerarProximoNumeroSequencial(): string
    {
        $anoAtual = Carbon::now()->year;
        $prefixo = "{$anoAtual}-";

        $ultimaOcorrencia = static::where(function ($q) use ($anoAtual) {
            $q->where('numero_sequencial', 'like', "{$anoAtual}-%")
              ->orWhere('numero_sequencial', 'like', "FIAP-{$anoAtual}-%");
        })
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
