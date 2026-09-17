# Guia de Contribuição — senai_siga

Obrigado pelo interesse em contribuir com o projeto interno **senai_siga**! Siga as diretrizes abaixo para manter a consistência e qualidade do código.

---

## 1. Fluxo de Trabalho (Branch & PR)

- **Branches principais**: `main` (ou `develop`, se configurada).
- **Commits diretos são bloqueados** na branch principal: todo código novo deve passar por **Pull Request (PR)**.
- Para trabalhar em uma tarefa:
  1. Atualize sua branch principal: `git checkout main && git pull`
  2. Crie uma branch descritiva a partir da `main`:
     - Nova funcionalidade: `feat/nome-da-funcionalidade`
     - Correção de bug: `fix/descricao-do-problema`
     - Ajuste de documentação: `docs/nome-do-documento`
  3. Realize os commits seguindo a convenção abaixo.
  4. Abra um Pull Request preenchendo o template padrão.

---

## 2. Padrão de Commits (Conventional Commits)

Utilizamos a especificação de [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/):

`<tipo>[escopo opcional]: <descrição curta e imperativa>`

### Tipos permitidos:
- `feat`: Adição de nova funcionalidade (ex: `feat(fiap): adiciona calculo automatico de faltas`)
- `fix`: Correção de bug (ex: `fix(auth): corrige validacao de token sanctum`)
- `docs`: Alterações apenas em documentação (ex: `docs: atualiza passos de instalacao`)
- `refactor`: Refatoração que não altera comportamento nem corrige bugs (ex: `refactor(pdf): otimiza geracao de pdf da fiap`)
- `style`: Formatação, ponto e vírgula, espaços (sem mudança de lógica)
- `test`: Adição ou ajuste de testes
- `chore`: Atualização de dependências, configs de build, etc.

---

## 3. Checklist Antes de Abrir o Pull Request

Antes de enviar seu PR:
1. **Frontend**:
   - Verifique erros de tipagem e linter:
     ```bash
     cd frontend
     npm run lint
     npm run build
     ```
2. **Backend**:
   - Garanta que novas migrações rodam sem erro:
     ```bash
     cd backend
     php artisan migrate:status
     ```
3. **Validação manual**:
   - Teste o fluxo modificado no navegador garantindo que os perfis de acesso (`Admin`, `Instrutor`, `AQV`) comportam-se como esperado.
