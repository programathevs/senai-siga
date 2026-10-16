<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class CheckRoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['auth:sanctum', 'role:gestor'])->get('/test-gestor-only', function () {
            return response()->json(['message' => 'Gestor OK']);
        });

        Route::middleware(['auth:sanctum', 'role:instrutor,aqv'])->get('/test-staff-only', function () {
            return response()->json(['message' => 'Staff OK']);
        });
    }

    public function test_unauthenticated_user_cannot_access_protected_role_route(): void
    {
        $response = $this->getJson('/test-gestor-only');

        $response->assertStatus(401);
    }

    public function test_user_with_incorrect_role_receives_forbidden_403(): void
    {
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);

        $response = $this->actingAs($instrutor)->getJson('/test-gestor-only');

        $response->assertStatus(403)
            ->assertJson(['message' => 'Acesso negado: o seu perfil de usuário não possui permissão para executar esta ação.']);
    }

    public function test_user_with_allowed_role_can_access_route(): void
    {
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);

        $response = $this->actingAs($gestor)->getJson('/test-gestor-only');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Gestor OK']);
    }

    public function test_user_with_one_of_multiple_allowed_roles_can_access_route(): void
    {
        $aqv = User::factory()->create(['role' => UserRole::AQV]);

        $response = $this->actingAs($aqv)->getJson('/test-staff-only');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Staff OK']);
    }
}
