<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AqvAtendimentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'justificativa_aluno' => ['required', 'string', 'min:3'],
            'parecer_aqv' => ['nullable', 'string'],
            'data_atendimento' => ['nullable', 'date'],
            'confirmar_assinatura' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'justificativa_aluno.required' => 'A justificativa do estudante é obrigatória.',
            'justificativa_aluno.min' => 'A justificativa deve conter pelo menos 3 caracteres.',
            'data_atendimento.date' => 'A data de atendimento deve ser uma data válida.',
        ];
    }
}
