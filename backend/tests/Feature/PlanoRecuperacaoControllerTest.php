<?php

namespace Tests\Feature;

use App\Models\Aluno;
use App\Models\Ocorrencia;
use App\Models\PlanoRecuperacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanoRecuperacaoControllerTest extends TestCase
{
    use RefreshDatabase;

    private function criarEstruturaBase(): array
    {
        $instrutor = User::factory()->create(['role' => 'instrutor']);
        $aluno = Aluno::factory()->create();
        $ocorrencia = Ocorrencia::create([
            'aluno_id' => $aluno->id,
            'registrado_por' => $instrutor->id,
            'numero_sequencial' => 'FIAP-2026-0001',
            'versao' => 1,
            'tipo' => 'desempenho',
            'data_ocorrencia' => now()->toDateString(),
            'status' => 'pendente',
        ]);

        return compact('instrutor', 'aluno', 'ocorrencia');
    }

    public function test_instrutor_pode_criar_plano_de_recuperacao(): void
    {
        $data = $this->criarEstruturaBase();

        $payload = [
            'ocorrencia_id' => $data['ocorrencia']->id,
            'aluno_id' => $data['aluno']->id,
            'tipo_programa' => 'recuperacao_paralela',
            'ciclo_avaliacao' => '1º',
            'conteudo_programatico' => 'Programação Back-End e APIs REST',
            'propostas_trabalho' => ['exercicios_reforco', 'monitoria'],
            'periodo_previsto' => now()->addDays(7)->toDateString(),
        ];

        $response = $this->actingAs($data['instrutor'])
            ->postJson('/api/planos-recuperacao', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.tipo_programa', 'recuperacao_paralela');

        $this->assertDatabaseHas('planos_recuperacao', [
            'ocorrencia_id' => $data['ocorrencia']->id,
            'aluno_id' => $data['aluno']->id,
            'tipo_programa' => 'recuperacao_paralela',
        ]);
    }

    public function test_pode_listar_planos_de_recuperacao(): void
    {
        $data = $this->criarEstruturaBase();

        PlanoRecuperacao::create([
            'ocorrencia_id' => $data['ocorrencia']->id,
            'aluno_id' => $data['aluno']->id,
            'registrado_por' => $data['instrutor']->id,
            'tipo_programa' => 'compensacao_ausencia',
            'ciclo_avaliacao' => '2º',
        ]);

        $response = $this->actingAs($data['instrutor'])
            ->getJson('/api/planos-recuperacao');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_fiap_reconhece_plano_pendente_e_vinculado(): void
    {
        $data = $this->criarEstruturaBase();

        // Antes de criar o plano, a FIAP de aproveitamento deve ter has_plano_pendente = true
        $this->assertTrue($data['ocorrencia']->has_plano_pendente);

        // Criar o plano
        PlanoRecuperacao::create([
            'ocorrencia_id' => $data['ocorrencia']->id,
            'aluno_id' => $data['aluno']->id,
            'registrado_por' => $data['instrutor']->id,
            'tipo_programa' => 'recuperacao_paralela',
        ]);

        // Agora a FIAP não deve mais ter plano pendente
        $this->assertFalse($data['ocorrencia']->fresh()->has_plano_pendente);
    }
}
