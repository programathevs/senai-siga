<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OcorrenciaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'aluno_id' => ['required', 'exists:alunos,id'],
            'tipo' => ['required', Rule::in(['falta', 'comportamento', 'desempenho'])],
            'data_ocorrencia' => ['required', 'date'],
            'unidade_curricular_id' => ['nullable', 'exists:unidades_curriculares,id'],
            'quantidade_faltas' => ['nullable', 'integer', 'min:0'],
            'instrutor_ids' => ['nullable', 'array'],
            'instrutor_ids.*' => ['exists:instrutores,id'],
            'relato_dificuldades' => ['nullable', 'string'],
            'recomendacoes_professor' => ['nullable', 'string'],
            'recomendacoes_gestao' => ['nullable', 'string'],
            'providencias_gestao' => ['nullable', 'string'],
            'outras_observacoes' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(['pendente', 'pdf_gerado', 'enviado_aqv', 'impresso', 'assinado'])],
            'motivo_edicao' => ['nullable', 'string', 'max:1000'],
            'unidades' => ['nullable', 'array'],
            'unidades.*.unidade_curricular_id' => ['required_with:unidades', 'exists:unidades_curriculares,id'],
            'unidades.*.quantidade_faltas' => ['nullable', 'integer', 'min:0'],
            'unidades.*.total_aulas_dadas' => ['nullable', 'integer', 'min:0'],
            'unidades.*.limite_percentual' => ['nullable', 'numeric', 'min:1', 'max:100'],
        ];

        // Se for tipo FALTA, exige dados das unidades curriculares ou formato legado
        if ($this->input('tipo') === 'falta') {
            if (! $this->has('unidades') || empty($this->input('unidades'))) {
                $rules['unidade_curricular_id'] = ['required', 'exists:unidades_curriculares,id'];
                $rules['quantidade_faltas'] = ['required', 'integer', 'min:1'];
            }
            $rules['total_aulas_dadas'] = ['nullable', 'integer', 'min:0'];
            $rules['limite_percentual'] = ['nullable', 'numeric', 'min:1', 'max:100'];
        }

        // Se for tipo DESEMPENHO ou COMPORTAMENTO, relato é obrigatório
        if ($this->input('tipo') === 'desempenho' || $this->input('tipo') === 'comportamento') {
            $rules['relato_dificuldades'] = ['required', 'string', 'min:5'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'aluno_id.required' => 'Selecione o estudante para o qual a FIAP está sendo gerada.',
            'aluno_id.exists' => 'O aluno selecionado não foi encontrado na base.',
            'tipo.required' => 'Informe a motivação da FIAP (Falta, Comportamento ou Desempenho).',
            'tipo.in' => 'O tipo informado deve ser Falta, Comportamento ou Desempenho.',
            'data_ocorrencia.required' => 'A data da ocorrência é obrigatória.',
            'unidade_curricular_id.required' => 'Para FIAPs de falta, selecione a Unidade Curricular correspondente.',
            'quantidade_faltas.required' => 'Informe o total de horas/aulas de faltas acumuladas.',
            'quantidade_faltas.min' => 'A quantidade de faltas deve ser de ao menos 1 aula.',
            'relato_dificuldades.required' => 'O relato circunstanciado dos fatos ou dificuldades pedagógicas é obrigatório.',
            'relato_dificuldades.min' => 'O relato deve conter pelo menos 5 caracteres.',
        ];
    }
}
