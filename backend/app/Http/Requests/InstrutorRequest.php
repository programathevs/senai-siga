<?php

namespace App\Http\Requests;

use App\Models\Instrutor;
use Illuminate\Foundation\Http\FormRequest;

class InstrutorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Autenticação e permissões validadas via middleware
    }

    public function rules(): array
    {
        $instrutor = $this->route('instrutor');
        $userId = null;
        if ($instrutor instanceof Instrutor) {
            $userId = $instrutor->user_id;
        } elseif (is_numeric($instrutor)) {
            $userId = Instrutor::find($instrutor)?->user_id;
        }

        return [
            'nome' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email,' . $userId,
            ],
            'telefone' => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required' => 'O nome do instrutor é obrigatório.',
            'nome.max' => 'O nome do instrutor deve ter no máximo 255 caracteres.',
            'email.required' => 'O e-mail do instrutor é obrigatório.',
            'email.email' => 'Por favor, informe um endereço de e-mail válido.',
            'email.unique' => 'Já existe um usuário cadastrado com este e-mail.',
            'telefone.max' => 'O telefone deve ter no máximo 20 caracteres.',
        ];
    }
}
