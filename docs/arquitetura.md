# Arquitetura do Sistema — senai_siga

Este documento descreve a estrutura técnica e organização do projeto **senai_siga**.

---

## 1. Visão Geral da Stack

O projeto está estruturado em formato **Monorepo** com duas aplicações principais:

```text
senai-siga/
├── backend/          # API RESTful desenvolvida em Laravel (PHP 8.3+)
├── frontend/         # SPA desenvolvida em React + TypeScript com Vite
├── docs/             # Documentação de arquitetura e regras de negócio
└── .github/          # Templates de PR e Issues
```

---

## 2. Backend (`backend/`)

- **Framework**: [Laravel](https://laravel.com/)
- **Autenticação**: Laravel Sanctum (emissão e controle de tokens de API / sessões autenticadas)
- **Banco de Dados**: MySQL
- **Funcionalidades Principais**:
  - Endpoints REST para autenticação e gestão de usuários/perfis.
  - CRUD e processamento de FIAPs (Fichas Individuais de Avaliação Periódica).
  - Cálculo de percentual de faltas por unidade curricular.
  - Geração de documento PDF da FIAP.
  - Disparo de e-mails automáticos para a equipe da AQV.
  - Gerenciamento de Planos de Recuperação vinculados à FIAP.

---

## 3. Frontend (`frontend/`)

- **Framework / Bundler**: [React](https://react.dev/) + [Vite](https://vite.dev/)
- **Linguagem**: TypeScript
- **Roteamento**: React Router
- **Estilização e Componentização**: Componentes funcionais tipados
- **Consumo de API**: Comunicação assíncrona via HTTP com cabeçalhos de autorização Bearer via Sanctum

---

## 4. Banco de Dados (MySQL)

O banco armazena as entidades centrais do sistema:
- Usuários e Perfis de Acesso (`Admin`, `Instrutor`, `AQV`).
- Unidades Curriculares, Alunos e Turmas.
- Registros de FIAP (tipo: Falta, Comportamento, Desempenho).
- Histórico de faltas e percentuais calculados.
- Registros de envio, justificativa do aluno e confirmação de assinatura.
- Planos de Recuperação associados.
