<?php

namespace App\Notifications;

use App\Models\Ocorrencia;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OcorrenciaEncaminhadaAqvNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Ocorrencia $ocorrencia
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $alunoNome = $this->ocorrencia->aluno?->nome ?? 'Estudante';
        $turmaNome = $this->ocorrencia->aluno?->turma?->nome ?? 'Não informada';
        $tipoNome = ucfirst($this->ocorrencia->tipo);
        $seq = $this->ocorrencia->numero_sequencial;
        $docenteNome = $this->ocorrencia->registradoPor?->name ?? 'Docente';
        $appUrl = env('FRONTEND_URL', 'http://localhost:5173');

        return (new MailMessage)
            ->subject("Novo Encaminhamento AQV — {$seq} ({$alunoNome})")
            ->greeting('Prezada Equipe AQV / Coordenação Pedagógica,')
            ->line('Uma nova ocorrência disciplinar/pedagógica foi formalmente encaminhada para atendimento e acolhimento no **SENAI SIGA**.')
            ->line("**Número FIAP:** {$seq}")
            ->line("**Estudante:** {$alunoNome}")
            ->line("**Turma:** {$turmaNome}")
            ->line("**Tipo da FIAP:** {$tipoNome}")
            ->line("**Encaminhado por:** {$docenteNome}")
            ->action('Acessar Fila AQV e Registrar Atendimento', "{$appUrl}/encaminhamentos-aqv")
            ->line('Por favor, providencie a convocação do estudante para acolhimento, colhimento de justificativa e assinaturas físicas.')
            ->salutation('SENAI SIGA — Sistema Integrado de Gestão da Aprendizagem');
    }
}
