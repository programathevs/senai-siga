# Perfis de Acesso e Permissões — senai_siga

O sistema possui controle de acesso baseado em papéis (Role-Based Access Control) com três perfis principais:

---

## 1. Perfis de Usuário

| Perfil | Descrição |
| :--- | :--- |
| **Admin** | Administrador geral do sistema. Gerencia cadastros base, usuários e parâmetros da aplicação. |
| **Instrutor** | Docente responsável por turmas e unidades curriculares. Registra advertências e acompanha seus alunos. |
| **AQV** | Equipe de Apoio ao Quadro de Vida Escolar / Coordenação Pedagógica. Recebe notificações, atende alunos, colhe assinaturas e gerencia justificativas. |

---

## 2. Matriz de Permissões

| Funcionalidade | Admin | Instrutor | AQV |
| :--- | :---: | :---: | :---: |
| Gerenciamento de Usuários e Permissões | ✅ | ❌ | ❌ |
| Registro de FIAP (Falta, Comportamento, Desempenho) | ✅ | ✅ | ❌ |
| Visualização de percentual automático de faltas | ✅ | ✅ | ✅ |
| Download / Visualização de PDF da FIAP | ✅ | ✅ | ✅ |
| Recebimento de alertas automáticos por e-mail | ❌ | ❌ | ✅ |
| Registro de justificativa do aluno | ✅ | ❌ | ✅ |
| Confirmação de entrega física e assinatura do documento | ✅ | ❌ | ✅ |
| Abertura e acompanhamento de Plano de Recuperação vinculado | ✅ | ✅ | ✅ |
