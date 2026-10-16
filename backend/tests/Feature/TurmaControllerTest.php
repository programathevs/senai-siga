<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Aluno;
use App\Models\Curso;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TurmaControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_list_turmas(): void
    {
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $instrutorProfile = \App\Models\Instrutor::create(['user_id' => $instrutor->id]);
        $curso = Curso::factory()->create();
        $turmas = Turma::factory()->count(3)->create(['curso_id' => $curso->id]);
        foreach ($turmas as $t) {
            $t->instrutores()->attach($instrutorProfile->id);
        }

        $admin = User::factory()->create(['role' => UserRole::GESTOR]);
        $responseAdmin = $this->actingAs($admin)->getJson('/api/turmas');
        $responseAdmin->assertOk()->assertJsonCount(3, 'data');

        $responseInstrutor = $this->actingAs($instrutor)->getJson('/api/turmas');
        $responseInstrutor->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_admin_can_filter_turmas_by_search(): void
    {
        $admin = User::factory()->create(['role' => UserRole::GESTOR]);
        $curso = Curso::factory()->create(['nome' => 'Técnico em Redes']);

        Turma::factory()->create(['nome' => 'RED-1AM', 'curso_id' => $curso->id]);
        Turma::factory()->create(['nome' => 'MEC-1AM']);

        $response = $this->actingAs($admin)->getJson('/api/turmas?search=RED');
        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nome', 'RED-1AM');
    }

    public function test_only_admin_can_create_turma(): void
    {
        $admin = User::factory()->create(['role' => UserRole::GESTOR]);
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $curso = Curso::factory()->create();

        $payload = [
            'curso_id' => $curso->id,
            'nome' => 'DES-1AM',
            'turno' => 'Manhã',
            'ano_letivo' => '2025',
            'semestre_atual' => 1,
        ];

        $responseInstrutor = $this->actingAs($instrutor)->postJson('/api/turmas', $payload);
        $responseInstrutor->assertStatus(403);

        $responseAdmin = $this->actingAs($admin)->postJson('/api/turmas', $payload);
        $responseAdmin->assertStatus(201)
            ->assertJsonPath('data.nome', 'DES-1AM');

        $this->assertDatabaseHas('turmas', ['nome' => 'DES-1AM']);
    }

    public function test_admin_can_update_turma(): void
    {
        $admin = User::factory()->create(['role' => UserRole::GESTOR]);
        $turma = Turma::factory()->create(['nome' => 'NOME-ANTIGO']);

        $response = $this->actingAs($admin)->putJson("/api/turmas/{$turma->id}", [
            'curso_id' => $turma->curso_id,
            'nome' => 'NOME-NOVO',
            'ano_letivo' => '2025',
            'semestre_atual' => 2,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.nome', 'NOME-NOVO');

        $this->assertDatabaseHas('turmas', ['id' => $turma->id, 'nome' => 'NOME-NOVO']);
    }

    public function test_admin_can_delete_turma_and_alunos_are_disassociated(): void
    {
        $admin = User::factory()->create(['role' => UserRole::GESTOR]);
        $turma = Turma::factory()->create();
        $aluno = Aluno::factory()->create(['turma_id' => $turma->id]);

        $response = $this->actingAs($admin)->deleteJson("/api/turmas/{$turma->id}");
        $response->assertOk();

        $this->assertDatabaseMissing('turmas', ['id' => $turma->id]);
        $this->assertDatabaseHas('alunos', ['id' => $aluno->id, 'turma_id' => null]);
    }

    public function test_admin_can_enturmar_and_desenturmar_alunos(): void
    {
        $admin = User::factory()->create(['role' => UserRole::GESTOR]);
        $turma = Turma::factory()->create();
        $aluno1 = Aluno::factory()->create(['turma_id' => null]);
        $aluno2 = Aluno::factory()->create(['turma_id' => null]);

        // Enturmar alunos
        $responseEnturmar = $this->actingAs($admin)->postJson("/api/turmas/{$turma->id}/enturmar", [
            'aluno_ids' => [$aluno1->id, $aluno2->id],
        ]);
        $responseEnturmar->assertOk();

        $this->assertDatabaseHas('alunos', ['id' => $aluno1->id, 'turma_id' => $turma->id]);
        $this->assertDatabaseHas('alunos', ['id' => $aluno2->id, 'turma_id' => $turma->id]);

        // Desenturmar aluno1
        $responseDesenturmar = $this->actingAs($admin)->postJson("/api/turmas/{$turma->id}/desenturmar", [
            'aluno_id' => $aluno1->id,
        ]);
        $responseDesenturmar->assertOk();

        $this->assertDatabaseHas('alunos', ['id' => $aluno1->id, 'turma_id' => null]);
        $this->assertDatabaseHas('alunos', ['id' => $aluno2->id, 'turma_id' => $turma->id]);
    }
}
