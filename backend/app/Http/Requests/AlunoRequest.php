<?php

namespace App\Http\Requests;

use App\Models\Aluno;
use Illuminate\Foundation\Http\FormRequest;

class AlunoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $aluno = $this->route('aluno');
        $alunoId = null;
        if ($aluno instanceof Aluno) {
            $alunoId = $aluno->id;
        } elseif (is_numeric($aluno)) {
            $alunoId = $aluno;
        }

        return [
            'turma_id' => ['nullable', 'exists:turmas,id'],
            'nome' => ['required', 'string', 'max:255'],
            'matricula' => [
                'required',
                'string',
                'max:50',
                'unique:alunos,matricula,' . $alunoId,
            ],
            'cpf' => [
                'nullable',
                'string',
                'max:20',
                'unique:alunos,cpf,' . $alunoId,
            ],
            'data_nascimento' => ['nullable', 'date'],
            'email' => ['nullable', 'email', 'max:255'],
            'telefone' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', 'in:ativo,inativo,transferido'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required' => 'O nome do aluno é obrigatório.',
            'matricula.required' => 'A matrícula / RA do aluno é obrigatória.',
            'matricula.unique' => 'Já existe um aluno cadastrado com esta matrícula.',
            'cpf.unique' => 'Já existe um aluno cadastrado com este CPF.',
            'email.email' => 'Informe um e-mail válido.',
            'turma_id.exists' => 'A turma selecionada é inválida.',
        ];
    }
}
