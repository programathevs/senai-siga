<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NovoInstrutorNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $temporaryPassword,
        public string $verificationUrl
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Boas-vindas ao SENAI SIGA — Suas Credenciais de Acesso')
            ->greeting("Olá, {$notifiable->name}!")
            ->line('Você foi cadastrado como instrutor no **SENAI SIGA** (Sistema Integrado de Gestão da Aprendizagem).')
            ->line('Para acessar a plataforma, utilize as seguintes credenciais provisórias:')
            ->line("**E-mail:** {$notifiable->email}")
            ->line("**Senha Provisória:** `{$this->temporaryPassword}`")
            ->action('Confirmar E-mail e Acessar o Sistema', $this->verificationUrl)
            ->line('Ao acessar pela primeira vez, você será direcionado para criar sua nova senha pessoal e definitiva.')
            ->line('Este link de confirmação é válido por 7 dias.')
            ->salutation('Atenciosamente, Coordenação Pedagógica SENAI.');
    }
}
