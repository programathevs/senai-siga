<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Aluno;
use App\Models\Curso;
use App\Models\Ocorrencia;
use App\Models\UnidadeCurricular;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OcorrenciaControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_instrutor_can_create_fiap_falta_with_multiple_ucs(): void
    {
        $instrutorUser = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $aluno = Aluno::factory()->create();
        $curso = Curso::factory()->create();

        $uc1 = UnidadeCurricular::create([
            'curso_id' => $curso->id,
            'nome' => 'Programação Back-End I',
            'sigla' => 'PBE1',
            'carga_horaria' => 80,
        ]);

        $uc2 = UnidadeCurricular::create([
            'curso_id' => $curso->id,
            'nome' => 'Banco de Dados',
            'sigla' => 'BCD',
            'carga_horaria' => 40,
        ]);

        $payload = [
            'aluno_id' => $aluno->id,
            'tipo' => 'falta',
            'data_ocorrencia' => '2026-10-02',
            'unidades' => [
                ['unidade_curricular_id' => $uc1->id, 'quantidade_faltas' => 5],
                ['unidade_curricular_id' => $uc2->id, 'quantidade_faltas' => 3],
            ],
            'relato_dificuldades' => 'O estudante faltou sucessivamente.',
        ];

        $response = $this->actingAs($instrutorUser)->postJson('/api/ocorrencias', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.tipo', 'falta');

        $this->assertDatabaseHas('ocorrencia_unidades', [
            'unidade_curricular_id' => $uc1->id,
            'quantidade_faltas' => 5,
        ]);

        $this->assertDatabaseHas('ocorrencia_unidades', [
            'unidade_curricular_id' => $uc2->id,
            'quantidade_faltas' => 3,
        ]);
    }

    public function test_instrutor_can_create_fiap_comportamento_with_optional_uc(): void
    {
        $instrutorUser = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $aluno = Aluno::factory()->create();
        $curso = Curso::factory()->create();

        $uc = UnidadeCurricular::create([
            'curso_id' => $curso->id,
            'nome' => 'Linguagem de Marcação',
            'sigla' => 'LIMA',
            'carga_horaria' => 40,
        ]);

        $payload = [
            'aluno_id' => $aluno->id,
            'tipo' => 'comportamento',
            'data_ocorrencia' => '2026-10-02',
            'unidades' => [
                ['unidade_curricular_id' => $uc->id, 'quantidade_faltas' => 0],
            ],
            'unidade_curricular_id' => $uc->id,
            'relato_dificuldades' => 'Uso indevido de celular em sala durante a aula de laboratório.',
        ];

        $response = $this->actingAs($instrutorUser)->postJson('/api/ocorrencias', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.tipo', 'comportamento');

        $this->assertDatabaseHas('ocorrencia_unidades', [
            'unidade_curricular_id' => $uc->id,
            'quantidade_faltas' => 0,
        ]);
    }

    public function test_instrutor_can_create_fiap_comportamento_without_uc(): void
    {
        $instrutorUser = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $aluno = Aluno::factory()->create();

        $payload = [
            'aluno_id' => $aluno->id,
            'tipo' => 'comportamento',
            'data_ocorrencia' => '2026-10-02',
            'relato_dificuldades' => 'Desrespeito às normas de convivência geral da escola SENAI.',
        ];

        $response = $this->actingAs($instrutorUser)->postJson('/api/ocorrencias', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.tipo', 'comportamento');
    }

    public function test_user_can_encaminhar_fiap_to_aqv(): void
    {
        $admin = User::factory()->create(['role' => UserRole::GESTOR]);
        $aluno = Aluno::factory()->create();

        $ocorrencia = Ocorrencia::create([
            'aluno_id' => $aluno->id,
            'registrado_por' => $admin->id,
            'numero_sequencial' => 'FIAP-2026-9999',
            'versao' => 1,
            'tipo' => 'falta',
            'data_ocorrencia' => '2026-10-02',
            'status' => 'pendente',
            'relato_dificuldades' => 'Relato de teste para AQV',
        ]);

        $response = $this->actingAs($admin)->postJson("/api/ocorrencias/{$ocorrencia->id}/encaminhar-aqv");

        $response->assertOk()
            ->assertJsonPath('data.status', 'enviado_aqv');

        $this->assertDatabaseHas('ocorrencias', [
            'id' => $ocorrencia->id,
            'status' => 'enviado_aqv',
        ]);
    }

    public function test_instrutor_cannot_delete_signed_fiap(): void
    {
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $aluno = Aluno::factory()->create();

        $ocorrencia = Ocorrencia::create([
            'aluno_id' => $aluno->id,
            'registrado_por' => $instrutor->id,
            'numero_sequencial' => 'FIAP-2026-0002',
            'versao' => 1,
            'tipo' => 'falta',
            'data_ocorrencia' => '2026-10-02',
            'status' => 'assinado',
            'relato_dificuldades' => 'FIAP já assinada',
        ]);

        $response = $this->actingAs($instrutor)->deleteJson("/api/ocorrencias/{$ocorrencia->id}");

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Ocorrências com status Assinado só podem ser excluídas pela equipe de gestão.');

        $this->assertNotSoftDeleted('ocorrencias', ['id' => $ocorrencia->id]);
    }

    public function test_gestor_can_delete_signed_fiap(): void
    {
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);
        $aluno = Aluno::factory()->create();

        $ocorrencia = Ocorrencia::create([
            'aluno_id' => $aluno->id,
            'registrado_por' => $instrutor->id,
            'numero_sequencial' => 'FIAP-2026-0003',
            'versao' => 1,
            'tipo' => 'falta',
            'data_ocorrencia' => '2026-10-02',
            'status' => 'assinado',
            'relato_dificuldades' => 'FIAP já assinada para exclusão por gestor',
        ]);

        $response = $this->actingAs($gestor)->deleteJson("/api/ocorrencias/{$ocorrencia->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Ocorrência removida com sucesso.');

        $this->assertSoftDeleted('ocorrencias', ['id' => $ocorrencia->id]);
    }

    public function test_instrutor_can_delete_own_pending_fiap(): void
    {
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);
        $aluno = Aluno::factory()->create();

        $ocorrencia = Ocorrencia::create([
            'aluno_id' => $aluno->id,
            'registrado_por' => $instrutor->id,
            'numero_sequencial' => 'FIAP-2026-0004',
            'versao' => 1,
            'tipo' => 'falta',
            'data_ocorrencia' => '2026-10-02',
            'status' => 'pendente',
            'relato_dificuldades' => 'FIAP pendente',
        ]);

        $response = $this->actingAs($instrutor)->deleteJson("/api/ocorrencias/{$ocorrencia->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Ocorrência removida com sucesso.');

        $this->assertSoftDeleted('ocorrencias', ['id' => $ocorrencia->id]);
    }
}

