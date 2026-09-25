<?php

namespace App\Models;


use App\Enums\UserRole;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'deve_trocar_senha',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];


     /**
     * Sobrescreve a notificação padrão de reset de senha para usar a nossa customizada.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token, $this->getEmailForPasswordReset()));
    }

    /**
     * Verifica se o usuário possui determinado papel (role) ou um dos papéis da lista.
     *
     * @param string|UserRole|array<string|UserRole> $roles
     */
    public function hasRole(string|UserRole|array $roles): bool
    {
        if (is_array($roles)) {
            return in_array(
                $this->role?->value ?? $this->role,
                array_map(fn($r) => $r instanceof UserRole ? $r->value : $r, $roles),
                true
            );
        }

        $roleValue = $roles instanceof UserRole ? $roles->value : $roles;
        return ($this->role?->value ?? $this->role) === $roleValue;
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(UserRole::ADMIN);
    }

    public function isInstrutor(): bool
    {
        return $this->hasRole(UserRole::INSTRUTOR);
    }

    public function isAQV(): bool
    {
        return $this->hasRole(UserRole::AQV);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'deve_trocar_senha' => 'boolean',
        ];
    }
}
