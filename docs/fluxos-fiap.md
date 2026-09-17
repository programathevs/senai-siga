# Ciclo de Vida e Fluxos da FIAP

Este documento detalha o fluxo operacional da **FIAP (Ficha Individual de Avaliação Periódica)** e do **Plano de Recuperação** no **senai_siga**.

---

## 1. Tipos de FIAP

A FIAP pode ser registrada sob três motivações:
1. **Falta**: Vinculada a uma unidade curricular específica, com cálculo automático do percentual de faltas acumuladas em relação à carga horária total da unidade.
2. **Comportamento**: Registro de ocorrência disciplinar ou comportamental.
3. **Desempenho**: Registro de rendimento abaixo do esperado nas atividades.

---

## 2. Etapas do Fluxo Operacional

```text
[Instrutor] Registra FIAP
       │
       ▼
[Backend] Calcula percentual de faltas (se aplicável)
       │
       ▼
[Backend] Gera o documento em PDF
       │
       ▼
[Backend] Dispara e-mail automático para equipe da AQV
       │
       ▼
[AQV] Recebe e-mail, atende o aluno e registra a justificativa no sistema
       │
       ▼
[AQV] Confirma a entrega física e a assinatura do documento
       │
       ▼ (Se necessário)
[Instrutor / AQV] Abertura de Plano de Recuperação vinculado à FIAP
```

---

## 3. Detalhamento dos Passos

### 3.1. Registro pelo Instrutor
- O instrutor seleciona o aluno, unidade curricular e o tipo de FIAP (Falta, Comportamento ou Desempenho).
- Em caso de falta, o sistema calcula automaticamente a porcentagem acumulada com base nas aulas ministradas/previstas.

### 3.2. Geração de PDF e Notificação por E-mail
- O backend gera o arquivo PDF padronizado com os dados do registro.
- Um e-mail com a notificação da ocorrência e o link/anexo é enviado automaticamente para a equipe da AQV.

### 3.3. Acompanhamento pela AQV
- A equipe da AQV convoca o estudante.
- A justificativa apresentada pelo aluno é lançada no sistema.
- A AQV coleta a assinatura no documento físico e confirma o status de entrega e assinatura no sistema.

### 3.4. Plano de Recuperação
- Para FIAPs que demandam recuperação de conteúdo ou recuperação pedagógica, pode ser aberto um **Plano de Recuperação** formalmente atrelado àquela FIAP.
