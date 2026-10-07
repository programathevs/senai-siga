<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Aluno;
use App\Models\AqvRecebimento;
use App\Models\Curso;
use App\Models\Ocorrencia;
use App\Models\Turma;
use App\Models\User;
use App\Notifications\OcorrenciaEncaminhadaAqvNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AqvControllerTest extends TestCase
{
    use RefreshDatabase;

    private function criarEstruturaBase(): array
    {
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);
        $aqv = User::factory()->create(['role' => UserRole::AQV]);
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

        AqvRecebimento::create([
            'ocorrencia_id' => $ocorrencia->id,
            'enviado_em' => now(),
            'status_atendimento' => 'pendente',
        ]);

        return compact('gestor', 'aqv', 'instrutor', 'aluno', 'turma', 'ocorrencia');
    }

    public function test_unauthenticated_user_cannot_access_aqv_endpoints(): void
    {
        $response = $this->getJson('/api/aqv/encaminhamentos');
        $response->assertStatus(401);
    }

    public function test_instrutor_cannot_access_aqv_endpoints(): void
    {
        $data = $this->criarEstruturaBase();

        $response = $this->actingAs($data['instrutor'])->getJson('/api/aqv/encaminhamentos');
        $response->assertStatus(403);
    }

    public function test_aqv_and_gestor_can_list_encaminhamentos(): void
    {
        $data = $this->criarEstruturaBase();

        // Usuário AQV
        $responseAqv = $this->actingAs($data['aqv'])->getJson('/api/aqv/encaminhamentos');
        $responseAqv->assertOk()
            ->assertJsonStructure([
                'items',
                'total',
                'current_page',
                'last_page',
                'per_page',
            ]);
        $this->assertEquals(1, $responseAqv->json('total'));

        // Usuário Gestor
        $responseGestor = $this->actingAs($data['gestor'])->getJson('/api/aqv/encaminhamentos');
        $responseGestor->assertOk();
    }

    public function test_aqv_can_view_stats(): void
    {
        $data = $this->criarEstruturaBase();

        $response = $this->actingAs($data['aqv'])->getJson('/api/aqv/stats');
        $response->assertOk()
            ->assertJsonStructure([
                'total_encaminhados',
                'aguardando_atendimento',
                'em_atendimento',
                'concluidos',
            ]);

        $this->assertEquals(1, $response->json('total_encaminhados'));
        $this->assertEquals(1, $response->json('aguardando_atendimento'));
        $this->assertEquals(0, $response->json('concluidos'));
    }

    public function test_aqv_can_register_atendimento(): void
    {
        $data = $this->criarEstruturaBase();

        $payload = [
            'justificativa_aluno' => 'O estudante informou que estava com atestado médico nos dias de ausência.',
            'parecer_aqv' => 'Orientado a apresentar a declaração original e acompanhar as aulas de reposição.',
            'confirmar_assinatura' => false,
        ];

        $response = $this->actingAs($data['aqv'])
            ->postJson("/api/aqv/encaminhamentos/{$data['ocorrencia']->id}/atendimento", $payload);

        $response->assertOk()
            ->assertJsonPath('data.aqv_recebimento.status_atendimento', 'em_atendimento')
            ->assertJsonPath('data.aqv_recebimento.justificativa_aluno', $payload['justificativa_aluno']);

        $this->assertDatabaseHas('aqv_recebimentos', [
            'ocorrencia_id' => $data['ocorrencia']->id,
            'status_atendimento' => 'em_atendimento',
            'recebido_por' => $data['aqv']->id,
        ]);

        $this->assertEquals('enviado_aqv', $data['ocorrencia']->fresh()->status);
    }

    public function test_aqv_can_register_atendimento_and_confirm_signature(): void
    {
        $data = $this->criarEstruturaBase();

        $payload = [
            'justificativa_aluno' => 'Aluno compareceu junto com a mãe e assinou o termo de ciência.',
            'parecer_aqv' => 'Acordo firmado de comparecimento diário.',
            'confirmar_assinatura' => true,
        ];

        $response = $this->actingAs($data['aqv'])
            ->postJson("/api/aqv/encaminhamentos/{$data['ocorrencia']->id}/atendimento", $payload);

        $response->assertOk()
            ->assertJsonPath('data.status', 'assinado')
            ->assertJsonPath('data.aqv_recebimento.status_atendimento', 'concluido');

        $this->assertEquals('assinado', $data['ocorrencia']->fresh()->status);
        $this->assertNotNull($data['ocorrencia']->fresh()->aqvRecebimento->confirmado_em);
    }

    public function test_aqv_can_quick_confirm_signature(): void
    {
        $data = $this->criarEstruturaBase();

        $response = $this->actingAs($data['aqv'])
            ->postJson("/api/aqv/encaminhamentos/{$data['ocorrencia']->id}/confirmar-assinatura");

        $response->assertOk()
            ->assertJsonPath('data.status', 'assinado');

        $this->assertEquals('assinado', $data['ocorrencia']->fresh()->status);
        $this->assertEquals('concluido', $data['ocorrencia']->fresh()->aqvRecebimento->status_atendimento);
        $this->assertNotNull($data['ocorrencia']->fresh()->aqvRecebimento->confirmado_em);
    }

    public function test_email_notification_is_sent_when_fiap_forwarded_to_aqv(): void
    {
        Notification::fake();

        $data = $this->criarEstruturaBase();

        // Criar uma nova ocorrência com status pendente
        $novaOcorrencia = Ocorrencia::create([
            'aluno_id' => $data['aluno']->id,
            'registrado_por' => $data['instrutor']->id,
            'numero_sequencial' => 'FIAP-2026-0002',
            'versao' => 1,
            'tipo' => 'comportamento',
            'data_ocorrencia' => now()->toDateString(),
            'status' => 'pendente',
        ]);

        $response = $this->actingAs($data['instrutor'])
            ->postJson("/api/ocorrencias/{$novaOcorrencia->id}/encaminhar-aqv");

        $response->assertOk();

        Notification::assertSentTo(
            $data['aqv'],
            OcorrenciaEncaminhadaAqvNotification::class,
            function ($notification) use ($novaOcorrencia) {
                return $notification->ocorrencia->id === $novaOcorrencia->id;
            }
        );
    }
}
