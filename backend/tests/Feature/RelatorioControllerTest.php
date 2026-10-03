<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Aluno;
use App\Models\Curso;
use App\Models\Instrutor;
use App\Models\Ocorrencia;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RelatorioControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_instrutor_can_generate_relatorio_scoped_to_his_turmas(): void
    {
        $instrutorUser = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $instrutorProfile = Instrutor::create(['user_id' => $instrutorUser->id]);

        $curso = Curso::factory()->create();
        $turma = Turma::factory()->create(['curso_id' => $curso->id]);
        $turma->instrutores()->attach($instrutorProfile->id);
        $aluno = Aluno::factory()->create(['turma_id' => $turma->id]);

        Ocorrencia::create([
            'aluno_id' => $aluno->id,
            'registrado_por' => $instrutorUser->id,
            'numero_sequencial' => 'FIAP-REL-001/2026',
            'versao' => 1,
            'tipo' => 'falta',
            'data_ocorrencia' => now()->toDateString(),
            'status' => 'pendente',
        ]);

        $response = $this->actingAs($instrutorUser)->getJson('/api/relatorios/ocorrencias');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure([
                'data',
                'meta' => [
                    'current_page',
                    'last_page',
                    'total',
                    'resumo' => [
                        'total_ocorrencias',
                        'total_faltas',
                        'total_comportamento',
                        'total_desempenho',
                        'total_aqv',
                        'total_resolvidas',
                        'alunos_unicos',
                    ],
                ],
            ])
            ->assertJsonPath('meta.resumo.total_ocorrencias', 1)
            ->assertJsonPath('meta.resumo.total_faltas', 1);
    }

    public function test_instrutor_cannot_see_occurrences_from_other_turmas_in_relatorio(): void
    {
        $instrutorUser = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        Instrutor::create(['user_id' => $instrutorUser->id]);

        $curso = Curso::factory()->create();
        $turmaOutra = Turma::factory()->create(['curso_id' => $curso->id]);
        $alunoOutro = Aluno::factory()->create(['turma_id' => $turmaOutra->id]);

        $outroUser = User::factory()->create(['role' => UserRole::ADMIN]);
        Ocorrencia::create([
            'aluno_id' => $alunoOutro->id,
            'registrado_por' => $outroUser->id,
            'numero_sequencial' => 'FIAP-OUTRO-001/2026',
            'versao' => 1,
            'tipo' => 'comportamento',
            'data_ocorrencia' => now()->toDateString(),
            'status' => 'enviado_aqv',
        ]);

        $response = $this->actingAs($instrutorUser)->getJson('/api/relatorios/ocorrencias');

        $response->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.resumo.total_ocorrencias', 0);
    }

    public function test_resumo_turmas_endpoint(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $curso = Curso::factory()->create();
        $turma = Turma::factory()->create(['curso_id' => $curso->id]);
        $aluno = Aluno::factory()->create(['turma_id' => $turma->id]);

        Ocorrencia::create([
            'aluno_id' => $aluno->id,
            'registrado_por' => $admin->id,
            'numero_sequencial' => 'FIAP-RESUMO-001/2026',
            'versao' => 1,
            'tipo' => 'desempenho',
            'data_ocorrencia' => now()->toDateString(),
            'status' => 'pendente',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/relatorios/resumo-turmas');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.total_ocorrencias', 1)
            ->assertJsonPath('data.0.total_desempenho', 1);
    }
}
