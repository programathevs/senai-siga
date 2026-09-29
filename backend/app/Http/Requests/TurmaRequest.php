<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TurmaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'curso_id' => ['required', 'exists:cursos,id'],
            'nome' => ['required', 'string', 'max:255'],
            'turno' => ['nullable', 'string', 'max:50'],
            'ano_letivo' => ['required', 'string', 'max:10'],
            'semestre_atual' => ['nullable', 'integer', 'min:1', 'max:10'],
            'instrutor_ids' => ['nullable', 'array'],
            'instrutor_ids.*' => ['exists:instrutores,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'curso_id.required' => 'O curso é obrigatório.',
            'curso_id.exists' => 'O curso selecionado é inválido.',
            'nome.required' => 'O nome ou código da turma é obrigatório.',
            'ano_letivo.required' => 'O ano letivo é obrigatório.',
            'semestre_atual.integer' => 'O semestre atual deve ser um número inteiro.',
        ];
    }
}
