<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Aluno;
use App\Models\Curso;
use App\Models\Ocorrencia;
use App\Models\Turma;
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

        $uc1 = UnidadeCurricular::factory()->create(['carga_horaria' => 80]);
        $uc2 = UnidadeCurricular::factory()->create(['carga_horaria' => 40]);

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
        $uc = UnidadeCurricular::factory()->create();

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
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $ocorrencia = Ocorrencia::factory()->create(['status' => 'pendente']);

        $response = $this->actingAs($admin)->postJson("/api/ocorrencias/{$ocorrencia->id}/encaminhar-aqv");

        $response->assertOk()
            ->assertJsonPath('data.status', 'enviado_aqv');

        $this->assertDatabaseHas('ocorrencias', [
            'id' => $ocorrencia->id,
            'status' => 'enviado_aqv',
        ]);
    }
}
