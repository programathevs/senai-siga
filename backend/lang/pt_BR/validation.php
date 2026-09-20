<?php

return [

    'required' => 'O campo :attribute é obrigatório.',

    'string' => 'O campo :attribute deve ser um texto.',

    'email' => 'O campo :attribute deve ser um endereço de e-mail válido.',

    'min' => [
        'string' => 'O campo :attribute deve conter pelo menos :min caracteres.',
    ],

    'max' => [
        'string' => 'O campo :attribute não pode ter mais de :max caracteres.',
    ],

    'unique' => 'O :attribute informado já está cadastrado.',

    'password' => [
        'letters' => 'O campo :attribute deve conter pelo menos uma letra.',
        'mixed' => 'O campo :attribute deve conter pelo menos uma letra maiúscula e uma minúscula.',
        'numbers' => 'O campo :attribute deve conter pelo menos um número.',
        'symbols' => 'O campo :attribute deve conter pelo menos um símbolo.',
        'uncompromised' => 'O :attribute informado apareceu em um vazamento de dados. Escolha outra senha.',
    ],

    'attributes' => [
        'name' => 'nome',
        'email' => 'e-mail',
        'password' => 'senha',
        'role' => 'perfil',
    ],

];
