<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CursoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Autenticação e permissões são validadas via middleware
    }

    public function rules(): array
    {
        $curso = $this->route('curso');
        $cursoId = $curso instanceof \App\Models\Curso ? $curso->id : $curso;

        return [
            'nome' => [
                'required',
                'string',
                'max:255',
                'unique:cursos,nome,' . $cursoId,
            ],
            'carga_horaria_total' => [
                'nullable',
                'integer',
                'min:1',
                'max:10000',
            ],
            'unidades_curriculares' => ['nullable', 'array'],
            'unidades_curriculares.*.id' => ['nullable', 'integer', 'exists:unidades_curriculares,id'],
            'unidades_curriculares.*.nome' => ['required', 'string', 'max:255'],
            'unidades_curriculares.*.carga_horaria' => ['required', 'integer', 'min:1'],
            'unidades_curriculares.*.semestre_plano_3' => ['nullable', 'integer', 'min:1', 'max:3'],
            'unidades_curriculares.*.semestre_plano_4' => ['nullable', 'integer', 'min:1', 'max:4'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required' => 'O nome do curso é obrigatório.',
            'nome.max' => 'O nome do curso deve ter no máximo 255 caracteres.',
            'nome.unique' => 'Já existe um curso cadastrado com este nome.',
            'carga_horaria_total.integer' => 'A carga horária total deve ser um número inteiro.',
            'carga_horaria_total.min' => 'A carga horária mínima deve ser de 1 hora.',
            'carga_horaria_total.max' => 'A carga horária máxima permitida é de 10.000 horas.',
        ];
    }
}
