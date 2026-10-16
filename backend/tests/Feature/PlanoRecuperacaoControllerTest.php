<?php

namespace Tests\Feature;

use App\Models\Aluno;
use App\Models\Curso;
use App\Models\Ocorrencia;
use App\Models\PlanoRecuperacao;
use App\Models\UnidadeCurricular;
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

    public function test_instrutor_cannot_delete_completed_plano(): void
    {
        $data = $this->criarEstruturaBase();

        $plano = PlanoRecuperacao::create([
            'ocorrencia_id' => $data['ocorrencia']->id,
            'aluno_id' => $data['aluno']->id,
            'registrado_por' => $data['instrutor']->id,
            'tipo_programa' => 'recuperacao_paralela',
            'status_processo' => 'concluido',
        ]);

        $response = $this->actingAs($data['instrutor'])->deleteJson("/api/planos-recuperacao/{$plano->id}");

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Planos de Recuperação concluídos só podem ser excluídos pela equipe de gestão.');

        $this->assertNotSoftDeleted('planos_recuperacao', ['id' => $plano->id]);
    }

    public function test_gestor_can_delete_completed_plano(): void
    {
        $data = $this->criarEstruturaBase();
        $gestor = User::factory()->create(['role' => 'gestor']);

        $plano = PlanoRecuperacao::create([
            'ocorrencia_id' => $data['ocorrencia']->id,
            'aluno_id' => $data['aluno']->id,
            'registrado_por' => $data['instrutor']->id,
            'tipo_programa' => 'recuperacao_paralela',
            'status_processo' => 'concluido',
        ]);

        $response = $this->actingAs($gestor)->deleteJson("/api/planos-recuperacao/{$plano->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Plano de Recuperação removido com sucesso.');

        $this->assertSoftDeleted('planos_recuperacao', ['id' => $plano->id]);
    }

    public function test_instrutor_can_delete_own_draft_plano(): void
    {
        $data = $this->criarEstruturaBase();

        $plano = PlanoRecuperacao::create([
            'ocorrencia_id' => $data['ocorrencia']->id,
            'aluno_id' => $data['aluno']->id,
            'registrado_por' => $data['instrutor']->id,
            'tipo_programa' => 'recuperacao_paralela',
            'status_processo' => 'rascunho',
        ]);

        $response = $this->actingAs($data['instrutor'])->deleteJson("/api/planos-recuperacao/{$plano->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Plano de Recuperação removido com sucesso.');

        $this->assertSoftDeleted('planos_recuperacao', ['id' => $plano->id]);
    }

    public function test_instrutor_pode_criar_plano_com_multiplas_ucs(): void
    {
        $data = $this->criarEstruturaBase();
        $curso = Curso::factory()->create();

        $uc1 = UnidadeCurricular::create([
            'curso_id' => $curso->id,
            'nome' => 'Banco de Dados',
            'sigla' => 'BD',
            'carga_horaria' => 60,
        ]);

        $uc2 = UnidadeCurricular::create([
            'curso_id' => $curso->id,
            'nome' => 'Programação Orientada a Objetos',
            'sigla' => 'POO',
            'carga_horaria' => 80,
        ]);

        $payload = [
            'ocorrencia_id' => $data['ocorrencia']->id,
            'aluno_id' => $data['aluno']->id,
            'unidade_curricular_ids' => [$uc1->id, $uc2->id],
            'tipo_programa' => 'recuperacao_paralela',
            'ciclo_avaliacao' => '1º',
            'conteudo_programatico' => 'Recuperação de POO e BD',
        ];

        $response = $this->actingAs($data['instrutor'])
            ->postJson('/api/planos-recuperacao', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.unidades.0.id', $uc1->id)
            ->assertJsonPath('data.unidades.1.id', $uc2->id);

        $planoId = $response->json('data.id');

        $this->assertDatabaseHas('plano_recuperacao_unidades', [
            'plano_recuperacao_id' => $planoId,
            'unidade_curricular_id' => $uc1->id,
        ]);
        $this->assertDatabaseHas('plano_recuperacao_unidades', [
            'plano_recuperacao_id' => $planoId,
            'unidade_curricular_id' => $uc2->id,
        ]);
    }

    public function test_plano_herda_multiplas_ucs_da_ocorrencia_automaticamente(): void
    {
        $data = $this->criarEstruturaBase();
        $curso = Curso::factory()->create();

        $uc1 = UnidadeCurricular::create([
            'curso_id' => $curso->id,
            'nome' => 'Front-End',
            'sigla' => 'FE',
            'carga_horaria' => 80,
        ]);

        $uc2 = UnidadeCurricular::create([
            'curso_id' => $curso->id,
            'nome' => 'Back-End',
            'sigla' => 'BE',
            'carga_horaria' => 80,
        ]);

        // Associa as UCs à ocorrência
        $data['ocorrencia']->unidades()->createMany([
            [
                'unidade_curricular_id' => $uc1->id,
                'total_aulas_dadas' => 0,
                'quantidade_faltas' => 0,
                'limite_percentual' => 25.0,
                'limite_faltas_aulas' => 27,
                'percentual_atingido' => 0.0,
            ],
            [
                'unidade_curricular_id' => $uc2->id,
                'total_aulas_dadas' => 0,
                'quantidade_faltas' => 0,
                'limite_percentual' => 25.0,
                'limite_faltas_aulas' => 27,
                'percentual_atingido' => 0.0,
            ],
        ]);

        $payload = [
            'ocorrencia_id' => $data['ocorrencia']->id,
            'aluno_id' => $data['aluno']->id,
            'tipo_programa' => 'recuperacao_paralela',
            'ciclo_avaliacao' => '1º',
        ];

        $response = $this->actingAs($data['instrutor'])
            ->postJson('/api/planos-recuperacao', $payload);

        $response->assertCreated();
        $planoId = $response->json('data.id');

        $this->assertDatabaseHas('plano_recuperacao_unidades', [
            'plano_recuperacao_id' => $planoId,
            'unidade_curricular_id' => $uc1->id,
        ]);
        $this->assertDatabaseHas('plano_recuperacao_unidades', [
            'plano_recuperacao_id' => $planoId,
            'unidade_curricular_id' => $uc2->id,
        ]);
    }
}

