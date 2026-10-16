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
        $confirmarAssinatura = $this->boolean('confirmar_assinatura');

        return [
            'justificativa_aluno' => ['required', 'string', 'min:3'],
            'parecer_aqv' => [
                $confirmarAssinatura ? 'required' : 'nullable',
                'string',
                $confirmarAssinatura ? 'min:3' : 'nullable',
            ],
            'data_atendimento' => ['nullable', 'date'],
            'confirmar_assinatura' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'justificativa_aluno.required' => 'A justificativa do estudante é obrigatória.',
            'justificativa_aluno.min' => 'A justificativa deve conter pelo menos 3 caracteres.',
            'parecer_aqv.required' => 'O parecer da equipe de gestão/AQV é obrigatório para confirmar a assinatura e concluir a FIAP.',
            'parecer_aqv.min' => 'O parecer da equipe deve conter pelo menos 3 caracteres.',
            'data_atendimento.date' => 'A data de atendimento deve ser uma data válida.',
        ];
    }
}
