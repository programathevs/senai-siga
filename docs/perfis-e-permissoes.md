# Perfis de Acesso e Permissões — senai_siga

O sistema possui controle de acesso baseado em papéis (Role-Based Access Control) com três perfis principais:

---

## 1. Perfis de Usuário

| Perfil | Descrição |
| :--- | :--- |
| **Gestor** | Gestor e administrador geral da unidade escolar. Gerencia cadastros base, usuários e parâmetros da aplicação. |
| **Instrutor** | Docente responsável por turmas e unidades curriculares. Registra advertências e acompanha seus alunos. |
| **Equipe Escolar** | Equipe Escolar / Coordenação Pedagógica. Recebe notificações regimentais, acolhe alunos, emite pareceres, colhe assinaturas e gerencia justificativas. |

---

## 2. Matriz de Permissões

| Funcionalidade | Gestor | Instrutor | Equipe Escolar |
| :--- | :---: | :---: | :---: |
| Gerenciamento de Usuários e Permissões | ✅ | ❌ | ❌ |
| Registro de FIAP (Falta, Comportamento, Desempenho) | ✅ | ✅ | ❌ |
| Visualização de percentual automático de faltas | ✅ | ✅ | ✅ |
| Download / Visualização de PDF da FIAP | ✅ | ✅ | ✅ |
| Recebimento de alertas automáticos por e-mail | ❌ | ❌ | ✅ |
| Registro de justificativa do aluno | ✅ | ❌ | ✅ |
| Confirmação de entrega física e assinatura do documento | ✅ | ❌ | ✅ |
| Abertura e acompanhamento de Plano de Recuperação vinculado | ✅ | ✅ | ✅ |
