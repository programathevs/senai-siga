<?php

namespace Tests\Feature;

use App\Models\Aluno;
use App\Models\Curso;
use App\Models\Ocorrencia;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EquipeEscolarCompensacaoFaltasTest extends TestCase
{
    use RefreshDatabase;

    protected User $equipeUser;
    protected User $instrutor;
    protected Ocorrencia $ocorrenciaFalta;

    protected function setUp(): void
    {
        parent::setUp();

        $this->equipeUser = User::factory()->create([
            'role' => \App\Enums\UserRole::EQUIPE_ESCOLAR,
            'email' => 'equipe@senai.br',
        ]);

        $this->instrutor = User::factory()->create([
            'role' => \App\Enums\UserRole::INSTRUTOR,
            'email' => 'prof@senai.br',
        ]);

        $curso = Curso::create(['nome' => 'Técnico em Desenvolvimento', 'codigo' => 'DEV-01']);
        $turma = Turma::create([
            'nome' => 'Turma DEV 2026',
            'curso_id' => $curso->id,
            'ano_letivo' => 2026,
            'turno' => 'noite',
            'semestre_atual' => 1,
        ]);
        $aluno = Aluno::create([
            'nome' => 'Aluno Exemplo',
            'matricula' => '2026001',
            'turma_id' => $turma->id,
        ]);

        $this->ocorrenciaFalta = Ocorrencia::create([
            'numero_sequencial' => 'FIAP-2026-0001',
            'aluno_id' => $aluno->id,
            'tipo' => 'falta',
            'status' => 'enviado_aqv',
            'data_ocorrencia' => now()->toDateString(),
            'registrado_por' => $this->instrutor->id,
            'relato_dificuldades' => 'Excesso de ausências acima de 100%',
        ]);
    }

    public function test_equipe_escolar_pode_atender_com_atestado_autorizado(): void
    {
        $response = $this->actingAs($this->equipeUser)
            ->postJson("/api/equipe-escolar/encaminhamentos/{$this->ocorrenciaFalta->id}/atendimento", [
                'justificativa_aluno' => 'Aluno apresentou atestado médico comprovando internação.',
                'parecer_aqv' => 'Parecer favorável à compensação pedagógica de faltas.',
                'compensacao_faltas_autorizada' => 'autorizado_atestado',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('aqv_recebimentos', [
            'ocorrencia_id' => $this->ocorrenciaFalta->id,
            'compensacao_faltas_autorizada' => 'autorizado_atestado',
            'autorizado_por' => $this->equipeUser->id,
        ]);
    }

    public function test_equipe_escolar_autorizacao_excepcional_exige_motivo(): void
    {
        // Sem motivo -> erro de validação 422
        $response = $this->actingAs($this->equipeUser)
            ->postJson("/api/equipe-escolar/encaminhamentos/{$this->ocorrenciaFalta->id}/atendimento", [
                'justificativa_aluno' => 'Aluno perdeu transporte.',
                'parecer_aqv' => 'Acolhido pela gestão.',
                'compensacao_faltas_autorizada' => 'autorizado_excepcional',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['motivo_excepcionalidade']);

        // Com motivo -> sucesso 200
        $responseSucesso = $this->actingAs($this->equipeUser)
            ->postJson("/api/equipe-escolar/encaminhamentos/{$this->ocorrenciaFalta->id}/atendimento", [
                'justificativa_aluno' => 'Aluno perdeu transporte municipal.',
                'parecer_aqv' => 'Acolhido e autorizado excepcionalmente pela Direção.',
                'compensacao_faltas_autorizada' => 'autorizado_excepcional',
                'motivo_excepcionalidade' => 'Problema documentado de transporte na via pública.',
            ]);

        $responseSucesso->assertOk();
        $this->assertDatabaseHas('aqv_recebimentos', [
            'ocorrencia_id' => $this->ocorrenciaFalta->id,
            'compensacao_faltas_autorizada' => 'autorizado_excepcional',
            'motivo_excepcionalidade' => 'Problema documentado de transporte na via pública.',
        ]);
    }

    public function test_equipe_escolar_pode_negar_compensacao_sem_gerar_plano(): void
    {
        $response = $this->actingAs($this->equipeUser)
            ->postJson("/api/equipe-escolar/encaminhamentos/{$this->ocorrenciaFalta->id}/atendimento", [
                'justificativa_aluno' => 'Aluno faltou sem justificativa.',
                'parecer_aqv' => 'Faltas injustificadas. Não elegível para plano de recuperação de faltas.',
                'compensacao_faltas_autorizada' => 'nao_autorizado',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('aqv_recebimentos', [
            'ocorrencia_id' => $this->ocorrenciaFalta->id,
            'compensacao_faltas_autorizada' => 'nao_autorizado',
        ]);
    }
}
