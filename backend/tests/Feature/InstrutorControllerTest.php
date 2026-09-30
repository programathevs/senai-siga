<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Instrutor;
use App\Models\User;
use App\Notifications\NovoInstrutorNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class InstrutorControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_instrutores(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $user1 = User::factory()->create(['name' => 'Carlos Silva', 'email' => 'carlos@senai.br', 'role' => UserRole::INSTRUTOR]);
        Instrutor::create(['user_id' => $user1->id, 'telefone' => '(11) 91111-1111']);

        $user2 = User::factory()->create(['name' => 'Ana Souza', 'email' => 'ana@senai.br', 'role' => UserRole::INSTRUTOR]);
        Instrutor::create(['user_id' => $user2->id, 'telefone' => '(11) 92222-2222']);

        $response = $this->actingAs($admin)->getJson('/api/instrutores');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_admin_can_search_instrutores(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $user1 = User::factory()->create(['name' => 'Carlos Silva', 'email' => 'carlos@senai.br', 'role' => UserRole::INSTRUTOR]);
        Instrutor::create(['user_id' => $user1->id, 'telefone' => '(11) 99999-1111']);

        $user2 = User::factory()->create(['name' => 'Beatriz Lima', 'email' => 'beatriz@senai.br', 'role' => UserRole::INSTRUTOR]);
        Instrutor::create(['user_id' => $user2->id, 'telefone' => '(11) 99999-2222']);

        $response = $this->actingAs($admin)->getJson('/api/instrutores?search=Carlos');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.user.name', 'Carlos Silva');
    }

    public function test_only_admin_can_create_a_new_instrutor(): void
    {
        Notification::fake();

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $payload = [
            'nome' => 'Professor Fulano',
            'email' => 'fulano@senai.br',
            'telefone' => '(11) 99999-8888',
        ];

        $response = $this->actingAs($admin)->postJson('/api/instrutores', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.user.name', 'Professor Fulano')
            ->assertJsonPath('data.telefone', '(11) 99999-8888');

        $this->assertDatabaseHas('users', [
            'name' => 'Professor Fulano',
            'email' => 'fulano@senai.br',
            'role' => 'instrutor',
            'deve_trocar_senha' => 1,
        ]);

        $this->assertDatabaseHas('instrutores', [
            'telefone' => '(11) 99999-8888',
        ]);

        $createdUser = User::where('email', 'fulano@senai.br')->first();
        $this->assertNotNull($createdUser);

        Notification::assertSentTo(
            $createdUser,
            NovoInstrutorNotification::class,
            function (NovoInstrutorNotification $notification) {
                return !empty($notification->temporaryPassword) &&
                       !empty($notification->verificationUrl) &&
                       str_contains($notification->verificationUrl, '/api/email/verify/');
            }
        );
    }

    public function test_non_admin_cannot_create_instrutores(): void
    {
        $instrutor = User::factory()->create(['role' => UserRole::INSTRUTOR]);

        $responsePost = $this->actingAs($instrutor)->postJson('/api/instrutores', [
            'nome' => 'Teste',
            'email' => 'teste@senai.br',
        ]);
        $responsePost->assertStatus(403);
    }

    public function test_admin_can_update_an_instrutor(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $user = User::factory()->create(['name' => 'Nome Antigo', 'email' => 'antigo@senai.br', 'role' => UserRole::INSTRUTOR]);
        $instrutor = Instrutor::create(['user_id' => $user->id, 'telefone' => '111']);

        $response = $this->actingAs($admin)->putJson("/api/instrutores/{$instrutor->id}", [
            'nome' => 'Nome Atualizado',
            'email' => 'antigo@senai.br',
            'telefone' => '222',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.user.name', 'Nome Atualizado')
            ->assertJsonPath('data.telefone', '222');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Nome Atualizado']);
        $this->assertDatabaseHas('instrutores', ['id' => $instrutor->id, 'telefone' => '222']);
    }

    public function test_admin_can_delete_an_instrutor(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $user = User::factory()->create(['name' => 'Para Deletar', 'email' => 'deletar@senai.br', 'role' => UserRole::INSTRUTOR]);
        $instrutor = Instrutor::create(['user_id' => $user->id]);

        $response = $this->actingAs($admin)->deleteJson("/api/instrutores/{$instrutor->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('instrutores', ['id' => $instrutor->id]);
    }
}
