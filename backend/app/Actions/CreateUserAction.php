<?php

namespace App\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateUserAction
{
    public function execute(array $data): User
    {
        return DB::transaction(function () use ($data) {
            // Como usamos o cast 'hashed' no model User,
            // a senha é criptografada automaticamente ao persistir.
            return User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role'],
            ]);
        });
    }
}
