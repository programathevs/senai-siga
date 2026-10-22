<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EquipeEscolarAtendimentoRequest extends FormRequest
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
            'parecer_equipe_escolar' => ['nullable', 'string'],
            'data_atendimento' => ['nullable', 'date'],
            'confirmar_assinatura' => ['nullable', 'boolean'],
            'compensacao_faltas_autorizada' => ['nullable', 'string', 'in:pendente,nao_autorizado,autorizado_atestado,autorizado_excepcional'],
            'motivo_excepcionalidade' => ['nullable', 'string', 'required_if:compensacao_faltas_autorizada,autorizado_excepcional'],
        ];
    }

    public function messages(): array
    {
        return [
            'justificativa_aluno.required' => 'A justificativa do estudante é obrigatória.',
            'justificativa_aluno.min' => 'A justificativa deve conter pelo menos 3 caracteres.',
            'parecer_aqv.required' => 'O parecer da Equipe Escolar é obrigatório para confirmar a assinatura e concluir a FIAP.',
            'parecer_aqv.min' => 'O parecer da equipe deve conter pelo menos 3 caracteres.',
            'data_atendimento.date' => 'A data de atendimento deve ser uma data válida.',
            'motivo_excepcionalidade.required_if' => 'É obrigatório descrever a justificativa da liberação excepcional autorizada pela Direção/Gestão.',
        ];
    }
}
