<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Autenticação e autorização via middleware role:gestor
    }

    public function rules(): array
    {
        $targetUser = $this->route('usuario') ?? $this->route('user');
        $userId = null;
        if ($targetUser instanceof User) {
            $userId = $targetUser->id;
        } elseif (is_numeric($targetUser)) {
            $userId = (int) $targetUser;
        }

        return [
            'nome' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'role' => [
                'required',
                'string',
                Rule::in(['gestor', 'instrutor', 'aqv']),
            ],
            'telefone' => ['nullable', 'string', 'max:20'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'remover_foto' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required' => 'O nome completo do usuário é obrigatório.',
            'nome.max' => 'O nome deve ter no máximo 255 caracteres.',
            'email.required' => 'O e-mail institucional é obrigatório.',
            'email.email' => 'Por favor, informe um endereço de e-mail válido.',
            'email.unique' => 'Já existe um usuário cadastrado com este e-mail.',
            'role.required' => 'O perfil de acesso do usuário é obrigatório.',
            'role.in' => 'O perfil selecionado deve ser Gestor, Instrutor ou AQV.',
            'telefone.max' => 'O telefone deve ter no máximo 20 caracteres.',
            'foto.image' => 'O arquivo enviado deve ser uma imagem válida.',
            'foto.mimes' => 'A foto deve ser nos formatos JPEG, PNG, JPG ou WEBP.',
            'foto.max' => 'A foto não pode ultrapassar o tamanho de 2MB.',
        ];
    }
}
