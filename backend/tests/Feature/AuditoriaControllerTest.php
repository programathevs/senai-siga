<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Aluno;
use App\Models\AuditoriaLog;
use App\Models\Curso;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditoriaControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_auditoria(): void
    {
        $response = $this->getJson('/api/auditoria');
        $response->assertStatus(401);

        $statsResponse = $this->getJson('/api/auditoria/stats');
        $statsResponse->assertStatus(401);
    }

    public function test_instrutor_cannot_access_auditoria(): void
    {
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);

        $response = $this->actingAs($instrutor)->getJson('/api/auditoria');
        $response->assertStatus(403);

        $statsResponse = $this->actingAs($instrutor)->getJson('/api/auditoria/stats');
        $statsResponse->assertStatus(403);
    }

    public function test_gestor_can_list_and_filter_auditoria_logs(): void
    {
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);

        AuditoriaLog::create([
            'user_id' => $gestor->id,
            'acao' => 'criacao_fiap',
            'entidade' => 'Ocorrencia',
            'entidade_id' => 10,
            'descricao' => 'Criação da FIAP FIAP-2026-0001',
            'ip_address' => '127.0.0.1',
        ]);

        AuditoriaLog::create([
            'user_id' => $gestor->id,
            'acao' => 'login',
            'entidade' => 'User',
            'entidade_id' => $gestor->id,
            'descricao' => 'Login do gestor',
            'ip_address' => '127.0.0.1',
        ]);

        // Listagem geral
        $response = $this->actingAs($gestor)->getJson('/api/auditoria');
        $response->assertOk()
            ->assertJsonStructure([
                'items' => [
                    '*' => [
                        'id',
                        'acao',
                        'entidade',
                        'descricao',
                        'ip_address',
                        'created_at',
                        'user' => ['id', 'name', 'email', 'role'],
                    ],
                ],
                'total',
                'current_page',
                'last_page',
                'per_page',
            ])
            ->assertJsonPath('total', 2);

        // Filtro por ação
        $filterResponse = $this->actingAs($gestor)->getJson('/api/auditoria?acao=criacao_fiap');
        $filterResponse->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('items.0.acao', 'criacao_fiap');
    }

    public function test_gestor_can_view_auditoria_stats(): void
    {
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);

        AuditoriaLog::create([
            'user_id' => $gestor->id,
            'acao' => 'edicao_fiap',
            'entidade' => 'Ocorrencia',
            'entidade_id' => 1,
            'descricao' => 'Edição de teste',
        ]);

        $response = $this->actingAs($gestor)->getJson('/api/auditoria/stats');

        $response->assertOk()
            ->assertJsonStructure([
                'total_logs',
                'logs_hoje',
                'edicoes_fiap',
                'atendimentos_aqv',
                'assinaturas_fiap',
                'planos_recuperacao',
            ])
            ->assertJsonPath('total_logs', 1)
            ->assertJsonPath('edicoes_fiap', 1);
    }

    public function test_creating_fiap_triggers_automatic_audit_log(): void
    {
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);
        $curso = Curso::factory()->create();
        $turma = Turma::factory()->create(['curso_id' => $curso->id]);
        $aluno = Aluno::factory()->create(['turma_id' => $turma->id]);

        $payload = [
            'aluno_id' => $aluno->id,
            'tipo' => 'comportamento',
            'data_ocorrencia' => now()->toDateString(),
            'relato_dificuldades' => 'Teste de auditoria',
        ];

        $response = $this->actingAs($gestor)->postJson('/api/ocorrencias', $payload);
        $response->assertCreated();

        $this->assertDatabaseHas('auditoria_logs', [
            'acao' => 'criacao_fiap',
            'entidade' => 'Ocorrencia',
            'user_id' => $gestor->id,
        ]);
    }
}
