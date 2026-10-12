<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use App\Notifications\NovoUsuarioNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class UsuarioControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_gestor_can_list_all_users_with_different_roles(): void
    {
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);

        User::factory()->create(['name' => 'Instrutor João', 'email' => 'joao@senai.br', 'role' => UserRole::INSTRUTOR]);
        User::factory()->create(['name' => 'Psicóloga Maria', 'email' => 'maria@senai.br', 'role' => UserRole::AQV]);
        User::factory()->create(['name' => 'Coordenador Carlos', 'email' => 'carlos@senai.br', 'role' => UserRole::GESTOR]);

        $response = $this->actingAs($gestor)->getJson('/api/usuarios');

        $response->assertStatus(200);
        // Total esperado: 4 (o gestor autenticado + os 3 criados)
        $this->assertEquals(4, count($response->json('data')));
    }

    public function test_gestor_can_filter_users_by_role(): void
    {
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);

        User::factory()->create(['name' => 'Instrutor 1', 'role' => UserRole::INSTRUTOR]);
        User::factory()->create(['name' => 'Instrutor 2', 'role' => UserRole::INSTRUTOR]);
        User::factory()->create(['name' => 'AQV Equipe', 'role' => UserRole::AQV]);

        $response = $this->actingAs($gestor)->getJson('/api/usuarios?role=instrutor');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_gestor_can_create_new_user_with_gestor_role(): void
    {
        Notification::fake();

        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);

        $payload = [
            'nome' => 'Novo Gestor Escolar',
            'email' => 'novo.gestor@senai.br',
            'role' => 'gestor',
            'telefone' => '(19) 98888-7777',
        ];

        $response = $this->actingAs($gestor)->postJson('/api/usuarios', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Novo Gestor Escolar')
            ->assertJsonPath('data.role', 'gestor')
            ->assertJsonPath('data.telefone', '(19) 98888-7777');

        $this->assertDatabaseHas('users', [
            'name' => 'Novo Gestor Escolar',
            'email' => 'novo.gestor@senai.br',
            'role' => 'gestor',
            'deve_trocar_senha' => 1,
        ]);

        $created = User::where('email', 'novo.gestor@senai.br')->first();
        $this->assertNotNull($created);

        Notification::assertSentTo(
            $created,
            NovoUsuarioNotification::class,
            function (NovoUsuarioNotification $notification) {
                return !empty($notification->temporaryPassword) &&
                       $notification->role === 'gestor';
            }
        );
    }

    public function test_gestor_can_create_new_user_with_aqv_role(): void
    {
        Notification::fake();

        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);

        $payload = [
            'nome' => 'Equipe AQV Acolhimento',
            'email' => 'aqv.acolhe@senai.br',
            'role' => 'aqv',
            'telefone' => '(19) 97777-6666',
        ];

        $response = $this->actingAs($gestor)->postJson('/api/usuarios', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.role', 'aqv');

        $this->assertDatabaseHas('users', [
            'name' => 'Equipe AQV Acolhimento',
            'role' => 'aqv',
        ]);
    }

    public function test_gestor_can_update_user_name_and_role(): void
    {
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);

        $targetUser = User::factory()->create([
            'name' => 'Instrutor Antigo',
            'email' => 'docente@senai.br',
            'role' => UserRole::INSTRUTOR,
        ]);

        $response = $this->actingAs($gestor)->putJson("/api/usuarios/{$targetUser->id}", [
            'nome' => 'Instrutor Promovido a AQV',
            'email' => 'docente@senai.br',
            'role' => 'aqv',
            'telefone' => '(19) 99999-0000',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Instrutor Promovido a AQV')
            ->assertJsonPath('data.role', 'aqv');

        $this->assertDatabaseHas('users', [
            'id' => $targetUser->id,
            'name' => 'Instrutor Promovido a AQV',
            'role' => 'aqv',
        ]);
    }

    public function test_gestor_cannot_delete_themselves(): void
    {
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);

        $response = $this->actingAs($gestor)->deleteJson("/api/usuarios/{$gestor->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Não é permitido excluir sua própria conta enquanto estiver conectado.');

        $this->assertDatabaseHas('users', ['id' => $gestor->id]);
    }

    public function test_gestor_can_delete_other_user(): void
    {
        $gestor = User::factory()->create(['role' => UserRole::GESTOR]);
        $targetUser = User::factory()->create(['role' => UserRole::INSTRUTOR]);

        $response = $this->actingAs($gestor)->deleteJson("/api/usuarios/{$targetUser->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $targetUser->id]);
    }
}
