<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginAuthTest extends TestCase
{
    use DatabaseTransactions;

    public function test_user_can_get_csrf_cookie(): void
    {
        $response = $this->get('/sanctum/csrf-cookie');

        $response->assertStatus(204);
        $response->assertCookie('XSRF-TOKEN');
        $response->assertCookie('laravel-session');
    }

    public function test_user_can_login_with_stateful_session(): void
    {
        $user = User::factory()->create([
            'email' => 'test@senai.br',
            'password' => Hash::make('password123'),
            'role' => UserRole::ADMIN,
        ]);

        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
            'Accept' => 'application/json',
        ])->postJson('/api/login', [
            'email' => 'test@senai.br',
            'password' => 'password123',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.email', 'test@senai.br');
        $response->assertJsonPath('data.role', UserRole::ADMIN->value);
        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@senai.br',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
            'Accept' => 'application/json',
        ])->postJson('/api/login', [
            'email' => 'test@senai.br',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
        $this->assertGuest();
    }

    public function test_authenticated_user_can_access_me_and_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'test@senai.br',
            'password' => Hash::make('password123'),
        ]);

        // Access /api/me when authenticated via sanctum / session
        $response = $this->actingAs($user, 'web')
            ->withHeaders([
                'Origin' => 'http://localhost:5173',
                'Referer' => 'http://localhost:5173/',
                'Accept' => 'application/json',
            ])->getJson('/api/me');

        $response->assertOk();
        $response->assertJsonPath('data.email', 'test@senai.br');

        // Logout
        $logoutResponse = $this->actingAs($user, 'web')
            ->withHeaders([
                'Origin' => 'http://localhost:5173',
                'Referer' => 'http://localhost:5173/',
                'Accept' => 'application/json',
            ])->postJson('/api/logout');

        $logoutResponse->assertOk();
        $logoutResponse->assertJson(['message' => 'Logout realizado com sucesso.']);
        $this->assertGuest('web');
    }

    public function test_unauthenticated_user_cannot_access_me(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
            'Accept' => 'application/json',
        ])->getJson('/api/me');

        $response->assertStatus(401);
    }
}
