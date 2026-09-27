<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Aluno;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlunoControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_list_alunos(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);

        Aluno::factory()->count(3)->create();

        $responseAdmin = $this->actingAs($admin)->getJson('/api/alunos');
        $responseAdmin->assertOk()->assertJsonCount(3, 'data');

        $responseInstrutor = $this->actingAs($instrutor)->getJson('/api/alunos');
        $responseInstrutor->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_admin_can_filter_alunos(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        Aluno::factory()->create(['nome' => 'Lucas Silva', 'matricula' => 'RA111222']);
        Aluno::factory()->create(['nome' => 'Beatriz Santos', 'matricula' => 'RA333444']);

        $responseSearch = $this->actingAs($admin)->getJson('/api/alunos?search=Lucas');
        $responseSearch->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nome', 'Lucas Silva');
    }

    public function test_only_admin_can_create_aluno(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $turma = Turma::factory()->create();

        $payload = [
            'turma_id' => $turma->id,
            'nome' => 'Novo Aluno SENAI',
            'matricula' => 'RA999888',
            'email' => 'aluno@aluno.senai.br',
            'telefone' => '(11) 97777-6666',
            'status' => 'ativo',
        ];

        $responseInstrutor = $this->actingAs($instrutor)->postJson('/api/alunos', $payload);
        $responseInstrutor->assertStatus(403);

        $responseAdmin = $this->actingAs($admin)->postJson('/api/alunos', $payload);
        $responseAdmin->assertStatus(201)
            ->assertJsonPath('data.nome', 'Novo Aluno SENAI');

        $this->assertDatabaseHas('alunos', ['matricula' => 'RA999888']);
    }

    public function test_admin_can_create_aluno_without_turma(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $payload = [
            'turma_id' => null,
            'nome' => 'Aluno Sem Turma',
            'matricula' => 'RA555666',
        ];

        $response = $this->actingAs($admin)->postJson('/api/alunos', $payload);
        $response->assertStatus(201)
            ->assertJsonPath('data.turma_id', null);

        $this->assertDatabaseHas('alunos', ['matricula' => 'RA555666', 'turma_id' => null]);
    }

    public function test_admin_can_update_aluno(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $aluno = Aluno::factory()->create(['nome' => 'Nome Antigo', 'matricula' => 'RA123456']);

        $response = $this->actingAs($admin)->putJson("/api/alunos/{$aluno->id}", [
            'nome' => 'Nome Atualizado',
            'matricula' => 'RA123456',
            'telefone' => '(11) 91111-2222',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.nome', 'Nome Atualizado');

        $this->assertDatabaseHas('alunos', ['id' => $aluno->id, 'nome' => 'Nome Atualizado']);
    }

    public function test_admin_can_delete_aluno(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $aluno = Aluno::factory()->create();

        $response = $this->actingAs($admin)->deleteJson("/api/alunos/{$aluno->id}");
        $response->assertOk();

        $this->assertDatabaseMissing('alunos', ['id' => $aluno->id]);
    }

    public function test_user_can_view_aluno_historico(): void
    {
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $aluno = Aluno::factory()->create(['nome' => 'Aluno Historico']);

        $response = $this->actingAs($instrutor)->getJson("/api/alunos/{$aluno->id}/historico");
        $response->assertOk()
            ->assertJsonPath('data.aluno.nome', 'Aluno Historico');
    }
}
