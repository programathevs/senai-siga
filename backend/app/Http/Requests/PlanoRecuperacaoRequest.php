<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlanoRecuperacaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ocorrencia_id' => ['required', 'exists:ocorrencias,id'],
            'aluno_id' => ['required', 'exists:alunos,id'],
            'turma_uc_id' => ['nullable', 'exists:turma_uc,id'],
            'unidade_curricular_id' => ['nullable', 'exists:unidades_curriculares,id'],
            'tipo_programa' => ['required', 'in:recuperacao_paralela,compensacao_ausencia,recuperacao_final'],
            'ciclo_avaliacao' => ['nullable', 'string', 'max:10'],
            'conteudo_programatico' => ['nullable', 'string'],
            'propostas_trabalho' => ['nullable', 'array'],
            'periodo_previsto' => ['nullable', 'date'],
            'periodo_inicio' => ['nullable', 'date'],
            'periodo_fim' => ['nullable', 'date'],
            'visto_coordenacao' => ['nullable', 'date'],
            'visto_aluno' => ['nullable', 'date'],
            'visto_professor' => ['nullable', 'date'],
            'conceito' => ['nullable', 'in:aprovado,reprovado'],
            'status_processo' => ['nullable', 'in:rascunho,aguardando_visto,concluido'],
            'registro_desempenho' => ['nullable', 'string'],
            'frequencias' => ['nullable', 'array'],
            'frequencias.*.data' => ['required_with:frequencias', 'date'],
            'frequencias.*.entrada' => ['nullable', 'string'],
            'frequencias.*.saida' => ['nullable', 'string'],
            'frequencias.*.aulas_compensadas' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
