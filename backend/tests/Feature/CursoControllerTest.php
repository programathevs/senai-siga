<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Curso;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CursoControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_list_cursos(): void
    {
        Curso::factory()->create(['nome' => 'Técnico em Desenvolvimento de Sistemas', 'carga_horaria_total' => 1200]);
        Curso::factory()->create(['nome' => 'Técnico em Eletrotécnica', 'carga_horaria_total' => 1000]);

        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);

        $response = $this->actingAs($instrutor)->getJson('/api/cursos');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_only_admin_can_create_a_new_curso(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $payload = [
            'nome' => 'Técnico em Mecatrônica',
            'carga_horaria_total' => 1400,
        ];

        $response = $this->actingAs($admin)->postJson('/api/cursos', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.nome', 'Técnico em Mecatrônica');

        $this->assertDatabaseHas('cursos', ['nome' => 'Técnico em Mecatrônica']);
    }

    public function test_non_admin_cannot_create_a_curso(): void
    {
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);

        $payload = [
            'nome' => 'Técnico em Mecânica',
            'carga_horaria_total' => 1200,
        ];

        $response = $this->actingAs($instrutor)->postJson('/api/cursos', $payload);

        $response->assertStatus(403);
    }

    public function test_admin_can_update_a_curso(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $curso = Curso::factory()->create(['nome' => 'Técnico Antigo', 'carga_horaria_total' => 800]);

        $response = $this->actingAs($admin)->putJson("/api/cursos/{$curso->id}", [
            'nome' => 'Técnico Atualizado',
            'carga_horaria_total' => 1000,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.nome', 'Técnico Atualizado');
    }

    public function test_admin_can_delete_a_curso(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $curso = Curso::factory()->create();

        $response = $this->actingAs($admin)->deleteJson("/api/cursos/{$curso->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('cursos', ['id' => $curso->id]);
    }
}
