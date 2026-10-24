<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Aluno;
use App\Models\Curso;
use App\Models\EquipeEscolarRecebimento;
use App\Models\Ocorrencia;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EquipeEscolarControllerTest extends TestCase
{
    use RefreshDatabase;

    private function criarEstruturaBase(): array
    {
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);
        $equipe = User::factory()->create(['role' => UserRole::EQUIPE_ESCOLAR]);
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);

        $curso = Curso::factory()->create();
        $turma = Turma::factory()->create(['curso_id' => $curso->id]);
        $aluno = Aluno::factory()->create(['turma_id' => $turma->id]);

        $ocorrencia = Ocorrencia::create([
            'aluno_id' => $aluno->id,
            'registrado_por' => $instrutor->id,
            'numero_sequencial' => 'FIAP-2026-0001',
            'versao' => 1,
            'tipo' => 'falta',
            'data_ocorrencia' => now()->toDateString(),
            'status' => 'enviado_aqv',
        ]);

        EquipeEscolarRecebimento::create([
            'ocorrencia_id' => $ocorrencia->id,
            'enviado_em' => now(),
            'status_atendimento' => 'pendente',
        ]);

        return compact('gestor', 'equipe', 'instrutor', 'aluno', 'turma', 'ocorrencia');
    }

    public function test_unauthenticated_user_cannot_access_equipe_escolar_endpoints(): void
    {
        $response = $this->getJson('/api/equipe-escolar/encaminhamentos');
        $response->assertStatus(401);
    }

    public function test_instrutor_cannot_access_equipe_escolar_endpoints(): void
    {
        $data = $this->criarEstruturaBase();

        $response = $this->actingAs($data['instrutor'])->getJson('/api/equipe-escolar/encaminhamentos');
        $response->assertStatus(403);
    }

    public function test_equipe_escolar_and_gestor_can_list_encaminhamentos(): void
    {
        $data = $this->criarEstruturaBase();

        $responseEquipe = $this->actingAs($data['equipe'])->getJson('/api/equipe-escolar/encaminhamentos');
        $responseEquipe->assertOk()
            ->assertJsonStructure([
                'items',
                'total',
                'current_page',
                'last_page',
                'per_page',
            ]);
        $this->assertEquals(1, $responseEquipe->json('total'));

        $responseGestor = $this->actingAs($data['gestor'])->getJson('/api/equipe-escolar/encaminhamentos');
        $responseGestor->assertOk();
        $this->assertEquals(1, $responseGestor->json('total'));
    }

    public function test_equipe_escolar_can_view_stats(): void
    {
        $data = $this->criarEstruturaBase();

        $response = $this->actingAs($data['equipe'])->getJson('/api/equipe-escolar/stats');
        $response->assertOk()
            ->assertJsonStructure([
                'total_encaminhados',
                'aguardando_atendimento',
                'em_atendimento',
                'concluidos',
            ]);

        $this->assertEquals(1, $response->json('total_encaminhados'));
        $this->assertEquals(1, $response->json('aguardando_atendimento'));
    }
}
