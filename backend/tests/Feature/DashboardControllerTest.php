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

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_dashboard_stats(): void
    {
        $response = $this->getJson('/api/dashboard/stats');
        $response->assertStatus(401);
    }

    public function test_admin_can_access_global_dashboard_stats(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $curso = Curso::factory()->create();
        $turma = Turma::factory()->create(['curso_id' => $curso->id]);
        $aluno = Aluno::factory()->create(['turma_id' => $turma->id]);

        Ocorrencia::create([
            'aluno_id' => $aluno->id,
            'registrado_por' => $admin->id,
            'numero_sequencial' => 'FIAP-001/2026',
            'versao' => 1,
            'tipo' => 'falta',
            'data_ocorrencia' => now()->toDateString(),
            'status' => 'pendente',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/dashboard/stats');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'periodo' => ['mes_atual', 'mes_nome'],
                    'kpis' => [
                        'total_mes',
                        'total_mes_anterior',
                        'diferenca_mes',
                        'pendentes',
                        'encaminhadas_aqv',
                        'resolvidas',
                        'alunos_em_alerta',
                    ],
                    'distribuicao_tipo' => ['falta', 'comportamento', 'desempenho'],
                    'distribuicao_status' => ['pendente', 'enviado_aqv', 'pdf_gerado', 'impresso', 'assinado'],
                    'ocorrencias_recentes',
                    'turmas_resumo',
                ],
            ])
            ->assertJsonPath('data.kpis.total_mes', 1)
            ->assertJsonPath('data.kpis.pendentes', 1);
    }

    public function test_instrutor_can_access_dashboard_stats_scoped_to_his_turmas(): void
    {
        $instrutorUser = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $instrutorProfile = Instrutor::create(['user_id' => $instrutorUser->id]);

        $curso = Curso::factory()->create();
        // Turma lecionada pelo instrutor
        $minhaTurma = Turma::factory()->create(['curso_id' => $curso->id]);
        $minhaTurma->instrutores()->attach($instrutorProfile->id);
        $alunoMinhaTurma = Aluno::factory()->create(['turma_id' => $minhaTurma->id]);

        // Turma de outro instrutor
        $outraTurma = Turma::factory()->create(['curso_id' => $curso->id]);
        $alunoOutraTurma = Aluno::factory()->create(['turma_id' => $outraTurma->id]);

        // Ocorrência na turma do instrutor
        Ocorrencia::create([
            'aluno_id' => $alunoMinhaTurma->id,
            'registrado_por' => $instrutorUser->id,
            'numero_sequencial' => 'FIAP-DOC-001/2026',
            'versao' => 1,
            'tipo' => 'falta',
            'data_ocorrencia' => now()->toDateString(),
            'status' => 'pendente',
        ]);

        // Ocorrência na outra turma
        $outroUser = User::factory()->create(['role' => UserRole::ADMIN]);
        Ocorrencia::create([
            'aluno_id' => $alunoOutraTurma->id,
            'registrado_por' => $outroUser->id,
            'numero_sequencial' => 'FIAP-OUTRA-001/2026',
            'versao' => 1,
            'tipo' => 'comportamento',
            'data_ocorrencia' => now()->toDateString(),
            'status' => 'enviado_aqv',
        ]);

        $response = $this->actingAs($instrutorUser)->getJson('/api/dashboard/stats');

        $response->assertOk()
            ->assertJsonPath('data.kpis.total_mes', 1)
            ->assertJsonPath('data.kpis.pendentes', 1)
            ->assertJsonPath('data.kpis.encaminhadas_aqv', 0)
            ->assertJsonCount(1, 'data.ocorrencias_recentes')
            ->assertJsonCount(1, 'data.turmas_resumo');
    }
}
