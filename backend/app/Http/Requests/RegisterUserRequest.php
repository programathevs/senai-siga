<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

class RegisterUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',

                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],

            'role' => [
                'required',
                new Enum(UserRole::class),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome é obrigatório.',
            'name.string' => 'O nome deve ser um texto.',
            'name.max' => 'O nome não pode ultrapassar 255 caracteres.',
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Informe um endereço de e-mail válido.',
            'email.unique' => 'Este e-mail já está cadastrado no sistema.',
            'password.required' => 'A senha é obrigatória.',
            'role.required' => 'O perfil é obrigatório.',
            'role.Illuminate\Validation\Rules\Enum' => 'O perfil informado é inválido. Valores aceitos: admin, instrutor, aqv.',
        ];
    }
}
